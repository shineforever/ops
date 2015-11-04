var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require("cheerio")
var entity = require('../models/entity.js')

function CtripFlight(){
    this.resultDir = "../result/";
    this.appDir = "../appdata/";
    this.resultFile = "pc_ctrip_flight.txt";
    this.cityFile = 'ctrip_flight_hot_city.txt';
    this.logFile = "pc_ctrip_flight_log.txt";
    this.doneFile = "pc_ctrip_done_flight.txt";
    this.departDate = '2015-05-03';
    this.skipFile = "invalidFlights.txt";
    this.citySkip = {};
}

CtripFlight.prototype.init=function(){
    this.cities = helper.get_cities(this.appDir+this.cityFile);
    this.doneCities = helper.syncDoneCities(this.resultDir+this.doneFile);

    if(fs.existsSync(this.appDir + this.skipFile)){
	fs.readFileSync(this.appDir + this.skipFile)
	    .toString()
	    .split('\n')
	    .reduce(function(pre,cur){
		if(cur){
		    cur = cur.replace('\r','');
		    pre[cur]=true;
		}
		return pre;
	    },this.citySkip);
    }
    this.todoFlights=[];
    for(var j=0;j<this.cities.length;j++){
	var dep = this.cities[j];
	for(var k=0;k<this.cities.length;k++){
            var arr = this.cities[k];
            if(k==j || this.doneCities[dep.cname+"-"+arr.cname] || this.citySkip[dep.cname+"-"+arr.cname]) continue;
	    this.todoFlights.push({dep:dep,arr:arr});
	}
    }
    console.log(this.todoFlights.length+" flights to do.");
}

CtripFlight.prototype.load=function(){
    
}

CtripFlight.prototype.start=function(){
    this.init();
    this.wgetFlights();
}
CtripFlight.prototype.wgetFlights=function(){
    if(this.todoFlights.length==0){
	console.log("All flights done!");
	return;
    }
    var cur = this.todoFlights.pop();
    var ctripQuery = {DCity1:cur.dep.code,ACity1:cur.arr.code,SearchType:"S",DDate1:this.departDate};

    var opt = new helper.basic_options('flights.ctrip.com','/domesticsearch/search/SearchFirstRouteFlights','GET',false,false,ctripQuery);
    opt.agent=false;
    console.log("GET "+cur.dep.cname+"-"+cur.arr.cname);
    helper.request_data(opt,null,function(data,args){
	that.processFlights(data,args);
    },cur);
}

CtripFlight.prototype.processFlights=function(data,args){
    var t = args[0].dep.cname+'-'+args[0].arr.cname;
    if(typeof data == 'string'){
	try{
	    data = JSON.parse(data);
	}catch(e){
	    console.log("Failed "+e.message);
	    this.todoFlights.unshift(args[0]);
	    setTimeout(function(){
		that.wgetFlights();
	    },(Math.random()*30+15)*1000);
	    return;
	}
    }
    
    if(data.Error){
	console.log("Error occured: ");
	console.log(data.Error);
	/*if(!this.retry) this.retry=1;
	else this.retry++;
	if(this.retry>=5){
	    console.log("Failed "+t);
	}
	if(this.retry)
	    console.log("Retry "+this.retry+": "+t);*/
	this.todoFlights.unshift(args[0]);
	setTimeout(function(){
	    that.wgetFlights();
	},(Math.random()*30+15)*1000);
	return;
    }
    
    for(var i = 0;i<data.fis.length;i++){
	var flight = data.fis[i];
	var fl = new entity.flight();
	fl.dname = args[0].dep.cname;
	fl.aname = args[0].arr.cname;
	fl.dTime = flight.dt;
	fl.aTime = flight.at;
	fl.flightNo=flight.fn;
	fl.planeType=flight.cf.c;
	fl.planeType=fl.planeType && fl.planeType.replace(/[,，]/,';');
	fl.puncRate=flight.pr+"%";
	fl.oilFee=flight.of;
	fl.tax = flight.tax;
	for(var j=0;j<flight.scs.length;j++){
	    var cb = flight.scs[j];
	    var cabin={};
	    cabin.lv = 'N';
	    cabin.hui = 'N';
	    cabin.tCount = cb.mq==0?"充足":cb.mq;
	    cabin.qian = cb.tgq.edn;//签转条件
	    cabin.qian = cabin.qian && cabin.qian.replace(/[,，]/g,';');
	    cabin.tui = cb.tgq.rfn;//退票条件
	    cabin.tui = cabin.tui && cabin.tui.replace(/[,，]/g,';');
	    cabin.gai = cb.tgq.rrn;//更改条件
	    cabin.gai = cabin.gai && cabin.gai.replace(/[,，]/g,';');
	    cabin.discount=cb.rt;
	    cabin.price=cb.p;
	    cabin.ctype=cb.c=="F"?"头等舱":cb.c=="Y"?"经济舱":cb.c=="C"?"公务舱":"";
	    cabin.fan = cb.ra;
	    cabin.isSpec=cb.inp?"Y":"N";//网络专享价
	    cabin.isAgent=cb.ia?"Y":"N";
	    for(var k=0;k<cb.ics.length;k++){
		switch(cb.ics[k].IconType){
		case "Package":
		    cabin.lv='Y';
		    break;
		case "StrategyInsurance":
		    cabin.hui='Y';
		    break;
		default:
		    break;
		}
	    }
	    fl.cabins.push(cabin);
	}
	fs.appendFile(this.resultDir+this.resultFile,fl.toString("ctrip_pc"),function(err){
	    if(err){
		console.log(err.message);
		return;
	    }
	});
    }

    fs.appendFileSync(this.resultDir+this.doneFile,t+'\n');
    console.log("DONE "+t+": "+data.fis.length);
    setTimeout(function(){
	that.wgetFlights();
    },(Math.random()*30+15)*1000);
}

var ct = new CtripFlight();
var that  = ct;
ct.start();
