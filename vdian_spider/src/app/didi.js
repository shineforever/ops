var fs = require('fs')
var crypto = require("crypto")
var ud = require('underscore')
var godotTransport = require("winston-godot")
var godot = require("godot")
var Crawler = require("node-webcrawler")
var qs = require("querystring")
var logger = require("winston")
var moment = require("moment")
var env = process.env.NODE_ENV || "development";
logger.add(logger.transports.File, { filename: '../../log/didi.log',logstash:true,handleExceptions:true });
if(env==="production"){
    logger.remove(logger.transports.Console);
}
var debug = env==='development'
var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"didi"});

function didi(){
    this.prefix=["__x_","android_id","pixels","cpu","networkType","uuid"];
    this.token = "didiwuxiankejiyouxian2013";
    this.resultDir = "../../result/app/";
    this.appDir = "../../appdata/";
    this.pointFile = "didipoints.txt";
    this.today = moment().format("YYYY-MM-DD");
    this.resultFile = "didi_"+this.today+".txt";
}

didi.prototype.init = function(){
    this.crawler = new Crawler({
	maxConnections:1,
	rateLimits:200,
	jQuery:false,
	onDrain:function(){
	    logger.info("===All done===");
	    client.close();
	},
	callback:function(error,result){
	    if(error){
		logger.error(error);
		return;
	    }
	    var obj=null;
	    if(typeof result.body=="string"){
		obj = JSON.parse(result.body);
	    }else{
		obj = result.body;
	    }
	    if(obj.errno===0){
		var now = moment().format("YYYY-MM-DD HH:mm:ss");
		if(debug)
		    logger.info("Got %d drivers",obj.drivers);
		var rst = obj.drivers.map(function(item){
		    return Object.keys(item).map(function(k){
			return item[k];
		    }).join("\t")+"\t"+now+"\t"+result.options.city;
		}).join("\n");
		
		fs.appendFile(that.resultDir+that.resultFile,rst,function(e){
		    if(e){
			logger.error(e);
		    }
		});
		fs.appendFile(that.resultDir+that.resultFile,"\n",function(e){
		    if(e){
			logger.error(e);
		    }
		});
	    }
	},
	userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"
    });
}

didi.prototype.start = function(){
    this.init();
    //this.nearbydrivers("116.695924","39.52415");
    var arguments = process.argv.splice(2);
    var start = Number(arguments[0]) || 0;
    var len = Number(arguments[1]) || 1000;
    var d = 2.828427124;
    
    this.points = [];
    fs.readFileSync(this.appDir+this.pointFile).toString().split("\n").slice(start,start+len).forEach(function(line){
	line = line && line.replace(/\r/g,'');
	if(!line) return;
	
	var vals = line.split("\t");
	var o = {c:vals[0],lefttop:vals[1].split(","),rightbottom:rightbottom=vals[2].split(","),xd:(+vals[5]),yd:(+vals[6])};
	this.points.push(o);
    },this);
    
    this.points.forEach(function(t){
	var lngstep = (t.rightbottom[1]-t.lefttop[1])/(t.xd/d),
	latstep = (t.lefttop[0]-t.rightbottom[0])/(t.yd/d),
	stlng = +t.lefttop[1],
	endlng = +t.rightbottom[1],
	stlat = +t.rightbottom[0],
	endlat = +t.lefttop[0];
	
	//logger.info("lngstep: %s, latstep: %s",lngstep,latstep);
	
	for(var i=stlng;i<endlng;i+=lngstep){
	    for(var j=stlat;j<endlat;j+=latstep){
		//logger.info("%s,%s",i,j);
		this.nearbydrivers(i,j,t.c);
	    }
	}	
    },this);
    
    //lefttop=116.1781410895,40.1148140709
    //righttop=116.7335826020,40.1148140709
    //leftbottom=116.1781410895,39.6466907558
    //rightbottom=116.7335826020,39.6466907558
    //this.nearbydrivers("116.1781410895","39.9326301112");//北京市石景山区
    //this.nearbydrivers("116.4186744384","39.6466907558");//北京市大兴区
    //this.nearbydrivers("116.4122417183","40.1148140709");//北京市昌平区立汤路
    //this.nearbydrivers("116.7335826020","39.8036688307");//北京市通州区京哈高速公路
    //this.nearbydrivers("","");//
}

didi.prototype.buildparams = function(lng,lat,c){
    var params = {};
    params["datatype"]= "1";
    params["vcode"]="80";
    params["android_id"]= "99ab3f322d636e6d";
    params["userlng"]= lng;
    params["lng"]= lng;
    params["userlat"]= lat;
    params["lat"]=lat;
    params["pixels"]= "480*800";
    params["cpu"]= "Processor%09%3A+ARMv7+Processor+rev+0+%28v7l%29";
    params["networkType"]= "3G";
    params["imei"]="000000000000000";
    params["os"]="4.2.2";
    params["accuracy"]= "20.0";
    params["uuid"]= "C6B120291FE6FC50721DE1A4E1DD0A44";
    params["dviceid"]= "8848f3d6217005eba6fafed1637c34b7";
    params["model"]= "sdk";
    params["appversion"]= "3.5.2";
    params["channel"]= "211";
    
    params["sig"]= this.generatesignature(params);
    
    return params;
}

didi.prototype.nearbydrivers = function(lng,lat,c){
    var params = this.buildparams(lng,lat);
    //logger.info(params.sig);
    //logger.info(qs.stringify(params));
    var uri = "http://api.diditaxi.com.cn/api/v2/p_nearbydrivers?"+qs.stringify(params);
    //logger.info(uri);
    this.crawler.queue({
	uri:uri,
	city:c
    });
    //var opt = new helper.basic_options("api.diditaxi.com.cn","/api/v2/p_nearbydrivers","GET",false,false,params);
    //helper.request_data(opt,null,function(data,args,res){
//	logger.info(data);
//    });
}

didi.prototype.generatesignature = function(params){
    params['maptype']="soso";
    var content = Object.keys(params)
	.sort()
	.filter(function(key){
	    return ud.indexOf(this.prefix,key)===-1;
	},this)
	.map(function(key){
	    return key+params[key];
	})
	.reduce(function(pre,cur){
	    return pre+cur;
	},this.token);
    //didiwuxiankejiyouxian2013accuracy20.0appversion3.5.2channel211datatype1dviceid8848f3d6217005eba6fafed1637c34b7imei000000000000000lat39.42415lng116.695924maptypesosomodelsdkos4.2.2userlat39.42415userlng116.695924vcode80
    //didiwuxiankejiyouxian2013accuracy20.0appversion3.5.2channel211datatype1dviceid8848f3d6217005eba6fafed1637c34b7imei000000000000000lat39.52415lng116.690001maptypesosomodelsdkos4.2.2userlat39.52415userlng116.695924vcode80
    //logger.info(content);
    this.sha = crypto.createHash('sha1');
    var sig = this.sha.update(content);
    delete params["maptype"];
    return sig.digest('hex');
}
var that = new didi();
that.start();
