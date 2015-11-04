var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../helpers/webhelper.js')
var entity = require('../models/entity.js')

function MQunarFlight(){
    this.resultDir = "../result/ota/";
    this.dataDir = "../appdata/";
    this.resultFile = "app_qunar_flight.txt";
    this.doneFile = "app_qunar_done_flight.txt";
    this.skipFile = "invalidFlights.txt";
    this.departDate = "20150807";
    this.cityFile = "qunar_flight_hot_city.txt";

    this.citySkip = {
	'太原-济南':true,
	'南昌-武汉':true,
	'南昌-长春':true,
	'武汉-南昌':true,
	'三亚-大连':true,
	'济南-太原':true,
	'济南-丽江':true,
	'长春-南昌':true,
	'长春-大连':true,
	'丽江-济南':true,
	'丽江-南宁':true
    };
    this.cities = [];
    this.doneFlights = {};
    this.todoFlights=[];

    this.qunarQuery = function(dname,aname,pidx){
	this.begin=dname//encodeURIComponent(dname);
	this.end=aname//encodeURIComponent(aname);
	this.date=that.departDate;
	this.time=0;
	this.v=2;
	this.f="index";
	this.bd_source='';
	this["page.currPageNo"]=pidx?pidx:1;
    }
}

MQunarFlight.prototype.init = function(){
    this.cities = fs.readFileSync(this.dataDir+this.cityFile).toString().split('\n').map(function(line){
	var vals=line.trim().split(" ");
	return {cname:vals[1]};
    });
    for(var i=0;i<this.cities.length;i++){
	for(var j=0;j<this.cities.length;j++){
	    if(i==j)
		continue;
	    var n = this.cities[i].cname+'-'+this.cities[j].cname;
	    if(!this.doneFlights[n] && !this.citySkip[n])
		this.todoFlights.push({
		    d:this.cities[i],
		    a:this.cities[j]
		});
	}
    }
}

MQunarFlight.prototype.start = function(){
    this.load();
    this.init();
    console.log("%d flights todo.",this.todoFlights.length);
    this.wgetList();
//    this.todoFlights.forEach(function(f,i,a){
//	this.wgetList(f);
//    },this);
//    this.wgetList(this.todoFlights[0]);
}

MQunarFlight.prototype.load=function(){
    if(fs.existsSync(this.resultDir+this.doneFile)){
	fs.readFileSync(this.resultDir+this.doneFile)
	    .toString()
	    .split('\r\n')
	    .reduce(function(pre,cur){
		if(cur)
		    pre[cur]=true;
		return pre;
	    },this.doneFlights);
    }
    if(fs.existsSync(this.dataDir+this.skipFile)){
	fs.readFileSync(this.dataDir+this.skipFile)
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
}
var sleepTime = 2400000;
var sleepCount = 0;
MQunarFlight.prototype.processList = function(data,args){
    //console.log(data);
    if(Buffer.byteLength(data)==1939){
	console.log("current ip has been forbidden.");
	//setTimeout(function(){
	//    that.wgetList(args[0]);
	//},sleepTime);
	//sleepCount++;
	//sleepTime*=sleepCount+1;
	return;
    }else{
	sleepTime = 2400000;
	sleepCount = 0;
    }
    var $ = cheerio.load(data);
    var records = [""];
    $("table.fl > tr").each(function(){
	var cols = $('td',this);
	var fcompany = cols.eq(1).contents().first().text();
	var flno = cols.eq(1).contents().eq(1).text();
	var pricePic = $("img",cols.eq(2)).attr('src');
	var discount = $("span.dc",cols.eq(2)).text();
	var times = cols.eq(2).contents().last().text().trim().split('-');
	var dtime = times[0];
	var atime = times[1];
	
	records.push([args[0].d.cname,args[0].a.cname,fcompany,flno,dtime,atime,pricePic].join());
    });
    var r  = records.join('\n');
    console.log(r);
    fs.appendFileSync(this.resultDir+this.resultFile,r);
    
    if(args[0].pageCount==undefined){
	var total = $("div.ct p:last-child").eq(0).text().match(/\d+/);
	var pageCount = Math.ceil(total/10);
	args[0].pageCount = pageCount;
    }
    if(args[0].pageIdx == undefined)
	args[0].pageIdx = 1;
    if(args[0].pageCount == args[0].pageIdx){
	fs.appendFileSync(this.resultDir+this.doneFile,args[0].d.cname+'-'+args[0].a.cname+'\r\n');
    }
    args[0].pageIdx++;
    //console.log(args[0]);
//    setTimeout(function(){
//	that.wgetList(args[0]);
//    },(Math.random()*3+20)*1000);
	that.wgetList(args[0]);
    // setTimeout(function(){that.wgetList(args[0]);}, (Math.random()*15+20)*1000);
/*    
    while(args[0].pageIdx<args[0].pageCount){
	args[0].pageIdx++;
	setTimeout(function(){
	    that.wgetList(args[0]);
	},2000);
    }
    */
}

MQunarFlight.prototype.wgetList = function(f){
    if(!f || f.pageIdx>f.pageCount){
	if(this.todoFlights.length==0) return;
	f = this.todoFlights.pop();
    }
    
    console.log("GET %s-%s: %d/%d",f.d.cname,f.a.cname,f.pageIdx,f.pageCount);
    var query = new this.qunarQuery(f.d.cname,f.a.cname,f.pageIdx);
    var opt = new helper.basic_options('m.qunar.com','/search.action','GET',true,false,query);
    opt.agent=false;
    opt.Referer = "http://m.qunar.com/";
    //console.log(JSON.stringify(opt));
    helper.request_data(opt,null,function(data,args){
	that.processList(data,args);
    },f);
}

var instance = new MQunarFlight();
var that = instance;
instance.start();
