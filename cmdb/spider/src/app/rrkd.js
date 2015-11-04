var helper = require('../../helpers/webhelper.js')
var fs = require('fs')
var url = require('url')
var qs = require('querystring')

function App(){
    this.resultDir = "../../result/";
    this.resultFile = "rrkd.x.txt";
    this.dataDir = "../../appdata/";
    this.cityFile = "rrkd.addr.txt";
    //this.datepointFile = "58daojia.datepoint.txt";
    this.today = new Date().toString();
    this.tasks = [];
    this.host = "interface.rrkd.cn";
    var arguments = process.argv.splice(2);
    this.startIdx = Number(arguments[0]);
    this.len = Number(arguments[1]);
}

App.prototype.init = function(){
    this.tasks = [];
    var addrpoints = fs.readFileSync(this.dataDir+this.cityFile).toString().split('\n').filter(function(line){return line.trim();});
    for(var j=0;j<addrpoints.length;j++){
	var vals = addrpoints[j].split('\t');
	this.tasks.push({seq:vals[0],city:vals[1],region:vals[2],direction:vals[3],name:vals[4],addr:vals[5],lng:vals[6],lat:vals[7]});
    }
    console.log("total tasks: %d",this.tasks.length);
    
    //前闭后开区间
    this.tasks = this.tasks.slice(this.startIdx,this.startIdx+this.len);
    
    console.log(this.tasks.length);
}

App.prototype.start = function(){
    this.init();
    this.wget();
}

App.prototype.wget = function(t){
    var path = "/RRKDInterface/Interface/fastInterface.php";
    if(!t){
	while(this.tasks.length>0 && !t){
	    t = this.tasks.shift();
	}
	if(this.tasks.lenght==0){
	    console.log("[INFO] done.");
	    return;
	}
	if(!t){
	    console.log("[INFO] done.");
	    setTimeout(function(){
		that.start();
	    },100);
	    return;
	}else{
	    t.page = 1;
	}
    }
    
    var q = {pagesize:10,pageindex:t.page,lon:t.lng,lat:t.lat,reqName:"nearbyList",city:t.city+"市",version:"1.5.8",pdatype:"2"};
    
    var opt = new helper.basic_options(this.host,path,'POST',false,false,q);
    
    opt.headers["USERNAME"]=18611745089;
    opt.headers["TOKEN"]="D8CA8F9A794B6651E1BC59F881B6A820";
    opt.headers["UDID"]=862108021735160;
    opt.headers["User-Agent"]="1.5.8/android/android4.2.1/720.0,1280.0/U707T";
    opt.headers["Content-Type"]="text/plain; charset=utf-8";
    
    console.log("[INFO] GET %s,%s,%s",t.city,t.region,t.direction);
    helper.request_data(opt,q,function(data,args,res){
	that.process(data,args,res);
    },t);
}
App.prototype.process = function(data,args,res){
    if(!data){
	console.log("[ERROR] data empty.");
	this.wget(args[0]);
	return;
    }
    if(typeof data == 'string'){
	try{
	    data = JSON.parse(data);
	}catch(e){
	    console.log(e.message);
	    this.wget();
	    return;
	}
    }
    var records = [""];
    console.log("[INFO] GOT %s",args[0].city);
    if(!data.success){
	console.log(data);
	setTimeout(function(){
	    that.wget();
	},3000);
	return;
    }
    var len = data.data.length;
    
    if(len>0){
	records = records.concat(data.data.map(function(i){
	    var r = [];
	    
	    r.push(i.addmoney);
	    r.push(i.buyaddress);
	    r.push(i.datatype);
	    r.push(i.goodsid);
	    r.push(i.goodsname);
	    r.push(i.goodsnum);
	    r.push(i.isactivity);
	    r.push(i.isclaimpickup);
	    r.push(i.isnight);
	    r.push(i.isrecomprod);
	    r.push(i.other);
	    r.push(i.receiveaddress);
	    r.push(i.receivedistance);
	    r.push(i.sendaddress);
	    r.push(i.senddistance);
	    r.push(i.showdate);
	    r.push(i.voicetime);
	    r.push(i.sendcounty);
	    r.push(i.sendbusiness);
	    
	    r.push(args[0].city);
	    r.push(args[0].region);
	    r.push(args[0].direction);
	    r.push(args[0].name);
	    r.push(args[0].addr);
	    r.push(new Date().toDatetime());
	    return r.join('\t');
	}));
	fs.appendFileSync(this.resultDir+this.resultFile,records.join("\n"));
	console.log("[INFO] saved to file.");
	if(data.pageindex<data.pagecount){
	    ++args[0].page;
	    setTimeout(function(){
		that.wget(args[0]);
	    },3000);
	}else{
	    setTimeout(function(){
		that.wget();
	    },3000);
	}
    }else{
	setTimeout(function(){
	    that.wget();
	},2000);
    }
}

var that = new App();
that.start();
