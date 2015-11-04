var winston = require("winston")
var seenreq = require("seenreq")
var moment = require("moment")
var MongoClient = require('mongodb').MongoClient
var Emitter = require('events').EventEmitter
var merge = require("utils-merge")
var util = require("util")
var fs = require("fs")
var env = process.env.NODE_ENV || "development"
var cnfCluster = require('../config.json')[env].gearman
var debug = env === 'development';
var args = process.argv.slice(2);

var logClient = winston.loggers.get("Client")
var logWorker = winston.loggers.get("Worker")
var logServer = winston.loggers.get("JobServer")
var logJob = winston.loggers.get("Job")
var logLB = winston.loggers.get("LBStrategy")
var logProtocol = winston.loggers.get("protocol")
winston.cli();
if(env === 'production'){
    logClient.remove(logClient.transports.console)
    logWorker.remove(logWorker.transports.console)
    logServer.remove(logServer.transports.console)
    logJob.remove(logJob.transports.console)
    logLB.remove(logLB.transports.console)
    logProtocol.remove(logProtocol.transports.console)
    winston.remove(winston.transports.Console);
}else{
    logClient.transports.console.level = "info"
    logWorker.transports.console.level = "info"
    logServer.transports.console.level = "info"
    logJob.transports.console.level = "info"
    logLB.transports.console.level = "info"
    logProtocol.transports.console.level = "info"
}

logClient.add(winston.transports.File, { filename: '../../log/gearman.client.log',logstash:true,level:'info',handleExceptions: true });

var JOB_END = 'end'
, JOB_START = 'start'
, CLIENT_READY = 'ready';

/*
 * app must supply `name` and `seed` 
 * @name:       [String] set app name which also used as function prefix
 * @seed:       [Array|String|Object] start url(s) or options
 * @onData:     [Function] called while client receiving data
 * @onComplete: [Function] called while a job complete
 */

function Client(){
    this.serverTasks=[];
    this.dbTasks=[];
    this.db = null;
    this.seen = new seenreq();
    this.maxQueueSize = 100;
    this.gearmanClient = require("gearman-node-bda").client(cnfCluster);
    
    Emitter.call(this);
}

util.inherits(Client,Emitter);

Client.prototype._init = function (){
    var self = this;
    if(debug)
	logClient.info(this.name);

    this.gearmanClient.on("error",function(err){
	logClient.error(err);
    });
    
    this.gearmanClient.on("jobServerError",function(jobServerUid,code,msg){
	logClient.error(msg);
    });

    this.gearmanClient.on("socketError",function(jobServerUid,e){
	if(e)
	    logClient.error(e);
    });

    this.gearmanClient.on("socketDisconnect",function(jobServerUid,e){
	if(e)
	    logClient.error(e);
    });
    
    MongoClient.connect(require('../config.json')[env].mongodb,function(err,db){
	if(err) throw err;
	logClient.info("Connect to mongodb success.");
	db.collection(self.name).createIndex({_id:1});
	db.collection(self.name).createIndex({app:1,_id:1});
	self.db = db;
	self.emit(CLIENT_READY);
    });
    
    this.on(JOB_START,function(job){
	this.serverTasks.push(0);
    });
    
    this.on(JOB_END,function(){
	this.serverTasks.pop();
	this._dequeue(this._dehandler);
	if(debug)
	    logClient.info("there are %d jobs",this.serverTasks.length);
    });
    
    this.on(CLIENT_READY,function(){
	var startup = function(){
	    if(args[0] == 'db'){
		logClient.info("Start fetching job from database.");
		this._dequeue(this._dehandler);
	    }else{
		logClient.info("Start fetching job from seed.");
		this._go({opt:this.seed});
	    }
	}.bind(this);
	
	if(this.onInit){
	    this.onInit(startup);
	}else{
	    startup();
	}
    });
}

Client.prototype._enqueue = function (jobs){
    var self = this;
    var items = jobs
	.filter(function(j){return j.opt && !self.seen.exists(j.opt,{removeKeys:["sign"]});})
	.map(function(j){return {payload:JSON.stringify(j),app:self.name};});
    
    if(items.length===0)
	return;
    


    
    for (var i = 0; i < items.length/1000; i++) {
    	var count = items.length-1000*i;
    	count = count>1000?1000:count;
    	this.dbTasks.push(2);
    	this.db.collection(this.name).insertMany(items.slice(i*1000, i*1000+count),function(err,result){
		if(err) logClient.error(err);
		self.dbTasks.pop();
	});
    };

}

Client.prototype._dequeue = function (fn){
    this.db.collection(this.name).findAndModify({app:this.name},[['_id',1]],{remove:true},fn.bind(this));
}

Client.prototype._dehandler = function(err,result){
    if(err){
	logClient.error(err);
    }else{
	if(result.value && result.value.payload) {
	    this._go(JSON.parse(result.value.payload));
	    if(this.serverTasks.length<this.maxQueueSize){
		process.nextTick(function(){this._dequeue(this._dehandler)}.bind(this));
	    }
	}else if(this.serverTasks.length===0){
	    //need finalize resources.
	    if(this.dbTasks.length===0){
		this.db.close();
		this.gearmanClient.close();
		if(this.onEnd){
		    this.onEnd();
		}
		
		logClient.profile(this.name);
		logClient.info("=====All done=====");
	    }else{
		setTimeout(function(){this._dequeue(this._dehandler)}.bind(this),2000);
	    }
	}
    }
};

Client.prototype._go = function (job){
    var fn = job.fn || job.next || "wget"
    , argv = job.opt;

    if(argv instanceof Array){
	var url;
	while(url = argv.shift()){
	    this._go({next:fn,opt:{uri:url}});
	}
	return;
    }else if(typeof argv ==='string'){
	this._go({next:fn,opt:{uri:argv}});
	return;
    }
    
    var job = this.gearmanClient.submitJob(this.name+"_"+fn, JSON.stringify(argv),{background: false});
    this.emit(JOB_START,job);
    
    if(debug){
	logClient.debug("fn: %s, argv: %s",this.name+"_"+fn,JSON.stringify(argv));
    }
    
    var self = this;
    job.on('workData', function(data) {//all data end with \n?
	if(self.onData){
	    self.onData(data,function(){});
	}
	if(debug)
     	    logClient.debug('WORK_DATA >>> ' + data);
    });
    
    job.on("warning",function(data){
	logClient.warn(data);
    });
    
    job.on("failed",function(){
	logClient.warn("work failed")
	this.emit(JOB_END);
    });
    
    job.on("exception",function(emsg){
	logClient.error('job exception: %s',emsg);
	this.emit(JOB_END);
    });
    
    job.on("error",function(e){
	logClient.error('job error: %s',e);
	this.emit(JOB_END);
    });
    
    job.on('timeout',function(){
	logClient.warn("time out");
	this.emit(JOB_END);
    });
    
    job.on('complete', function() {
	var res=null;
	try{
	    res = JSON.parse(job.response.toString());
	}catch(e){
	    logClient.error(e);
	    return;
	}

	if(self.onComplete){
	    self.onComplete(res);
	}
	
	self._enqueue(res.tasks);
	process.nextTick(function(){self.emit(JOB_END);});
    });
}

function start(app){
    var instance = new Client();
    merge(instance,app);
    logClient.profile(instance.name);
    instance._init();
}

module.exports = start
