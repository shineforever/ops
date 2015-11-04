var logger = require("winston")
var godotTransport = require("winston-godot")
var godot = require("godot")
var worker = require("../../dist/worker.js")
var env = process.env.NODE_ENV || "development"
var Crawler = require("node-webcrawler")

logger.add(logger.transports.File, { filename: '../../log/iwjw.worker.log',logstash:true,level:'info',handleExceptions:true});
if(env==="production"){
    logger.remove(logger.transports.Console);
}

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"iwjw.worker"});

var debug = env === "development"

function parseArgv(job){
    var opt=null;
    try{
	opt=JSON.parse(job.payload.toString());
    }catch(err){
	logger.error(err);
	job.workComplete(JSON.stringify({error:err,status:1}));
	return;
    }
    
    return opt;
}

var app = {
    name:'iwjw',
    cl:{
	maxConnections:1,
	userAgent:require("../../ua.json").userAgents,
	rotateUA:true
    },
    wget:function(job){
	var opt=null
	, res = {
	    "tasks":[],
	    "error":null,
	    "status":0
	};
	
	if(!(opt = parseArgv(job))){
	    return;
	}
	
	opt.callback = function(err,result,$){
	    if(err){
		logger.error(err);
		res.error = err;
		res.status = 1;
		job.workComplete(JSON.stringify(res));
	    }
	    
	    if(!$){
		logger.error("$ is null or undefined");
		res.error = "$ is null or undefined";
		res.status = 1;
		job.workComplete(JSON.stringify(res));
	    }
	    
	    res.tasks = res.tasks.concat($(".List ol li > a").map(function(){
		return {opt:$(this).attr("href"),next:'wgetDetail'};
	    }).get());
	    res.tasks = res.tasks.concat($("p.Page > a").map(function(){
		return {opt:$(this).attr('href')};
	    }).get());
	    
	    if(debug)
		logger.info("next jobs: %d",res.tasks.length);
	    
	    job.workComplete(JSON.stringify(res));
	};
	
	this.crawler.queue(opt);
    },
    
    wgetDetail:function(job){
	var opt=null
	, res = {
	    "tasks":[],
	    "error":null,
	    "status":0
	};
	
	if(!(opt = parseArgv(job))){
	    return;
	}
	
	opt.callback = function(err,result,$){
	    var tit = $(".titles p.h3").attr("title").trim()
	    , area = $(".titles p.area").text().trim()
	    , video = $(".sm > ul > li > i.videoBtn").length
	    , pics = $(".sm > ul > li").length-video
	    , matches = result.body.match(/provinceid:\s*\"(\d+)/)
	    , city = matches && matches[1]
	    , r = [result.uri,city,area,tit,pics,video].join();
	    
	    job.sendWorkData(r+"\n");
	    job.workComplete(JSON.stringify(res));
	}
	this.crawler.queue(opt);
    }
};

worker(app)
