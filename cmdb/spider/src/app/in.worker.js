var fs = require('fs')
var Crawler = require('node-webcrawler')
var crypto = require("crypto")
var URL = require("url")
var util = require('util')
var logger = require("winston")
var env = process.env.NODE_ENV || "development";
var config = require('../../config.json')[env].gearman;
var debug = env === "development"

logger.add(logger.transports.File, { filename: '../../log/in.worker.log' ,logstash:true,level:'info'});
logger.cli();

if(env==="production"){
    logger.remove(logger.transports.Console);
}

//EF BB BF
var worker = require("../../dist/worker.js")

function INQuery(){
    this._token= 'e29624f317b77784bc0f6c906611cf34'
    this._ct = 1
    this._auth='da7946ef591401fd667396398c0ce222'
    this.wfmn = 'CCC'
    this._uiid= '059bac18b525dc33fd6a2b2cbf212356'
    this._version= '1.9.1'
    this._promotion_channel= 'itugo'
    this._net='WIFI'
    this._platform='Lenovo S810t'
    this._uuid= '5816a9afc1214a68'
    this._req_from= 'java'
    this.action_gps='116.460438,39.914056'
    this.wfm= '70:72:0d:c7:8f:c6'
    this._source='android'
}

function HomeQuery(opt){
    INQuery.call(this);
    this.page = opt.page||1;
}

function FansQuery(opt){
    INQuery.call(this);
    this.id = opt.id;
    this.page = opt.page||1;
}

function ProfileQuery(opt){
    INQuery.call(this);
    this.id = opt.id;
}

util.inherits(HomeQuery,INQuery);
util.inherits(FansQuery,INQuery);
util.inherits(ProfileQuery,INQuery);

function setSign(q){
    var content = Object.keys(q)
	.sort()
    //.filter(function(key){
    //    return ud.indexOf(this.prefix,key)===-1;
    //},this)
	.map(function(key){
	    return key+'='+encodeURIComponent(q[key]);
	})
	.join('&');
    //logger.info(q);
    //logger.info(content);
    var tstamp = parseInt(new Date().getTime()/1000);
    var hasher = crypto.createHash('md5');
    //tstamp = '1428406961';
    var sig = hasher.update(content+tstamp);
    var h =  sig.digest('hex').slice(0,16);
    //logger.info(h);
    q.sign = '1.0' + h + '8e37d70c8c6dcf3b' + tstamp;
    return q;
}

function parseArgv(job){
    var opt=null;
    try{
	opt=JSON.parse(job.payload.toString());
    }catch(err){
	logger.error(err);
	//job.workComplete(JSON.stringify({}));
	return;
    }
    // if(debug){
    // 	logger.info(opt);
    // }
    return opt
}

var app = {
    name:'in',
    cl:{
	maxConnections:4,
	jQuery:false,
	preRequest:function(options){
	    if(/myfans/.test(options.uri)){
		options.qs = setSign(new FansQuery({id:options.qs.id,page:options.qs.page}));
	    }else if(/profile/.test(options.uri)){
		options.qs = setSign(new ProfileQuery({id:options.qs.id}));
	    }
	}
    },
    wget:function(job){
	var opt,
	res = {
	    "callback":null,
	    "tasks":[],
	    "error":null,
	    "status":0
	};
	
	if(!(opt = parseArgv(job))){
	    job.workComplete(JSON.stringify(res));
	    return;
	}
	
	opt.callback = function(err,result){
	    if(err){
		logger.error(err);
		job.workComplete(JSON.stringify(res));
		return;
	    }
	    
	    var body = JSON.parse(result.body)
	    , data = body.data;
	    if(!body.succ){
		logger.error(data.msg);
		job.workComplete(JSON.stringify(res));
		return;
	    }
	    
	    res.tasks = data.map(function(item){
		return {
		    opt:{
			uri:"http://in.itugo.com/app/user/profile",
			qs:setSign(new ProfileQuery({id:item.id}))
		    },
		    next:"wgetProfile"
		}
	    })
	    
	    logger.info("tasks: %d",res.tasks.length);
	    job.workComplete(JSON.stringify(res));
	}
	this.crawler.queue(opt);
    },
    wgetFans:function(job){
	var opt=null;
	var res = {
	    "callback":null,
	    "tasks":[],
	    "error":null,
	    "status":0
	};
	
	if(!(opt = parseArgv(job))){
	    return;
	}
	
	opt.callback = function(err,result){
	    var body=null;
	    try{
		body = JSON.parse(result.body)
	    }catch(e){
		logger.error(e);
		job.workComplete(JSON.stringify(res));
		return;
	    }

	    var objUrl = URL.parse(result.uri,true)
	    , data = body.data
	    , rst = {};
	    
	    if(!body.succ){
		logger.error(data.msg);
		job.workComplete(JSON.stringify(res));
		return;
	    }

	    if(data.length==20){
		++objUrl.query.page;
		res.tasks.push({
		    opt:{
			uri:"http://in.itugo.com/app/user/myfans",
			qs:setSign(new FansQuery({id:objUrl.query.id,page:objUrl.query.page}))
		    },
		    next:"wgetFans"
		});
	    }
	    
	    res.tasks = res.tasks.concat(data.map(function(item){
		return {
		    opt:{
			uri:"http://in.itugo.com/app/user/profile",
			qs:setSign(new ProfileQuery({id:item.id}))
		    },
		    next:"wgetProfile"
		}
	    }));
	    
	    // rst.users = data.map(function(item){
	    // 	return keys.map(function(k){return item[k]});
	    // });
	    
	    // rst.follow = objUrl.query.uid;
	    //job.sendWorkData(JSON.stringify(rst));
	    job.workComplete(JSON.stringify(res));
	}
	this.crawler.queue(opt);
	logger.info("GET Fans %d",opt.qs.id);
    },
    wgetProfile:function(job){
	var opt=null;
	var res = {
	    "tasks":[],
	    "error":null,
	    "status":0
	};
	
	if(!(opt = parseArgv(job))){
	    return;
	}
	
	opt.callback = function(err,result){
	    if(err){
		logger.error(err);
		res.error = err;
		res.status = 1;
		job.workComplete(JSON.stringify(res));
		return;
	    }
	    
	    var body = null;
	    try{
		body = JSON.parse(result.body)
	    }catch(e){
		logger.error(e);
		job.workComplete(JSON.stringify(res));
		return;
	    }
	    
	    var data = body.data;
	    if(!body.succ){
		logger.error(data.msg);
		job.workComplete(JSON.stringify(res));
		return;
	    }
	    
	    res.tasks.push({
		opt:{
		    uri:"http://in.itugo.com/app/user/myfans",
		    qs:setSign(new FansQuery({id:data.id}))
		},
		next:"wgetFans"
	    });
	    
	    job.sendWorkData(JSON.stringify(data));
	    job.workComplete(JSON.stringify(res));
	}
	
	this.crawler.queue(opt);
	logger.info("GET Profile %d",opt.qs.id)
    }
};

worker(app)
