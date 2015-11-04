var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var sys = require('sys')
var helper = require('../helpers/webhelper.js')

function MCtripFlight(){
    this.resultDir = "../result/";
    this.dataDir = "../appdata/";
    this.resultFile = "app_ctrip_flight.txt";
    this.doneFile = "app_ctrip_done_flight.txt";
    this.skipFile = "invalidFlights.txt";
    this.depdate = "2015/04/25";
    this.cityFile = "qunar_flight_hot_city.txt";

    this.citySkip = {};
    this.cities = [];
    this.doneFlights = {};
    this.todoFlights=[];

    this.ctripQuery = function(dcity,acity,pidx){
	this["tabtype"]= 1,
	this["ver"]= 0,
	this["tripType"]= 1,
	this["ticketIssueCty"]=dcity.code,
	this["flag"]=0,
	this["pageIdx"]= pidx,
	this["items"]= [{
	    "dCtyCode": dcity.code,
	    "dCtyId": dcity.id,
	    "dcityName": dcity.cname,
	    "dkey": 3,
	    "aCtyCode": acity.code,
	    "aCtyId": acity.id,
	    "acityName": acity.cname,
	    "akey": 2,
	    "date": that.depdate
	}],
	this["_items"]= [{
	    "dCtyCode": dcity.code,
	    "dCtyId": dcity.id,
	    "dcityName": dcity.cname,
	    "dkey": 3,
	    "aCtyCode": acity.code,
	    "aCtyId": acity.id,
	    "acityName": acity.cname,
	    "akey": 2,
	    "date": that.depdate
	}],
	this["class"]= 0,
	this["depart-sorttype"]="time",
	this["depart-orderby"]= "asc",
	this["arrive-sorttype"]="time",
	this["arrive-orderby"]="asc",
	this["calendarendtime"]= "2014/10/3000: 00: 00",
	this["__tripType"]=1,
	this["head"]={
	    "cid": "cd3b6d6c-3f75-1fef-0930-69061427de9f",
	    "ctok": "351858059049938",
	    "cver": "1.0",
	    "lang": "01",
	    "sid": "8888",
	    "syscode": "09",
	    "auth": ""
	}
    }
}

MCtripFlight.prototype.init = function(){
    this.cities = helper.get_cities(this.dataDir+this.cityFile);
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

MCtripFlight.prototype.start = function(){
    this.load();
    this.init();
    console.log("%d flights todo.",this.todoFlights.length);
    this.todoFlights.forEach(function(f,i,a){
	this.wgetList(f);
    },this);
//    this.wgetList(this.todoFlights[0]);
}

MCtripFlight.prototype.load = function(){
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

MCtripFlight.prototype.processList = function(flightsInfo,args){
    var flights = flightsInfo&&flightsInfo.count>0&&flightsInfo.items;
    if(!flights) {
	console.log("Failed: %s-%s:%d/%d",args[0].d.cname,args[0].a.cname,args[0].pageIdx,args[0].pageCount);
	return;
    }
    var sb = new helper.StringBuffer();
    for(var i=0;i<flights.length;i++){
	var f = flights[i];
	for(var j=0;j<f.cabins.length;j++){
	    sb.append(args[0].d.cname);
	    sb.append(',');
	    sb.append(args[0].a.cname);
	    sb.append(',');
	    sb.append(f.daname?f.daname:args[0].d.cname);
	    sb.append(',');
	    sb.append(f.aaname?f.aaname:args[0].a.cname);
	    sb.append(',');
	    sb.append(f.aname+' '+f.flightNo);
	    sb.append(',');
	    sb.append(f.planeType+' '+(f.ctinfo?f.ctinfo.ckind:''));
	    sb.append(',');
	    sb.append(f.dTime);
	    sb.append(',');
	    sb.append(f.aTime);
	    sb.append(',');
	    sb.append(f.cabins[j].discount);
	    sb.append(',');
	    sb.append(f.cabins[j].price);
	    sb.append(',');
	    sb.append(f.cabins[j].class);
	    sb.append(',');
	    sb.append(f.cabins[j].rebateAmt);
	    sb.append(',');
	    sb.append(f.cabins[j].qty);
	    sb.append(',');
	    sb.append(f.puncRate);
	    sb.append('\r\n');
	}
	var str = sb.toString();
	sb.clear();
	fs.appendFileSync(this.resultDir + this.resultFile,str);
    }
    fs.appendFileSync(this.resultDir + this.doneFile,args[0].d.cname+'-'+args[0].a.cname+'\r\n');
}

MCtripFlight.prototype.wgetList = function(f){
    console.log("GET %s-%s: %d/%d",f.d.cname,f.a.cname,f.pageIdx,f.pageCount);
    var query = new this.ctripQuery(f.d,f.a,f.pageIdx);
    var opt = new helper.basic_options("m.ctrip.com",'/restapi/Flight/Domestic/FlightList/Query',"POST",true,true);
    opt.agent=false;
    opt.headers['Content-Type']="application/json";
    console.log(JSON.stringify(query));
    helper.request_data(opt,query,function(data,args){
	that.processList(data,args);
    },f);
}


var instance = new MCtripFlight();
var that = instance;
instance.start();
