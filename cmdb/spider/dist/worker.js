var winston = require("winston")
var env = process.env.NODE_ENV || "development"
var config = require('../config.json')[env]
var cnfCluster = config.gearman
delete cnfCluster.loadBalancing
var debug = env === 'development';
var gearman = require("gearman-node-bda")
var _ = require("lodash")
var Crawler = require('node-webcrawler')

var logClient = winston.loggers.get("Client")
var logWorker = winston.loggers.get("Worker")
var logServer = winston.loggers.get("JobServer")
var logJob = winston.loggers.get("Job")
var logLB = winston.loggers.get("LBStrategy")
var logProtocol = winston.loggers.get("protocol")

if(env === 'production'){
    logClient.remove(logClient.transports.console)
    logWorker.remove(logWorker.transports.console)
    logServer.remove(logServer.transports.console)
    logJob.remove(logJob.transports.console)
    logLB.remove(logLB.transports.console)
    logProtocol.remove(logProtocol.transports.console)
}else{
    logClient.transports.console.level = "info"
    logWorker.transports.console.level = "info"
    logServer.transports.console.level = "info"
    logJob.transports.console.level = "info"
    logLB.transports.console.level = "info"
    logProtocol.transports.console.level = "info"
}

logWorker.add(winston.transports.File, { filename: '../../log/gearman.worker.log',logstash:true,level:'info' });

function Worker(app){
    w = gearman.worker(cnfCluster);//register worker to master
    
    _.functions(app).forEach(function(fnKey){//bind functions
	w.addFunction(app.name+"_"+fnKey,function(){app[fnKey].apply(app,arguments)});
    });
    
    var defaultCrawlerOpt = {
	maxConnections:1,
	debug:env==='development',
	logger:logWorker
    };
    
    app.crawler = new Crawler(_.extend(defaultCrawlerOpt,app.cl));
}

module.exports = Worker
