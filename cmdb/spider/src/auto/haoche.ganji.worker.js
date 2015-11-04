var logger = require("winston")
var env = process.env.NODE_ENV || "development"
var Crawler = require("node-webcrawler")
var godotTransport = require("winston-godot")
var godot = require("godot")
var moment = require("moment")
var _ = require("lodash")

var _prgname  = "haocheganji";

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:_prgname});

logger.add(logger.transports.File, { filename: '../../log/'+_prgname+'.worker.log' ,logstash:true,level:"info",handleExceptions: true});
logger.cli();
if(env==="production"){
    logger.remove(logger.transports.Console);
}

var worker = require("../../dist/worker.js")
var debug = env === "development"

function parseArgv(job){
	var opt=null;
	try{
		opt=JSON.parse(job.payload.toString());
	}catch(err){
		logger.error(err);
		return;
	}
	return opt
}

function dealstr(str){
	if(typeof(str)=='string'){
		var nodotstr = str.replace(/;/g, ' ');
		nodotstr = str.replace(/,/g, ' ');
		return nodotstr.replace(/\s+/g, ' ');
	}
	else{
		return str;
	}
}

function processList(result,$){
	//get the possible seed 
	var tasks = [];
	var detailUrls = result.body.match(/\/\w+\/[\d\w]+\.htm/g) || []
		, pageUrls = result.body.match(/\/\w+\/buy\/o\d+\//g) || []
		, curPage = result.uri.match(/\/o(\d+)\//)
		, city = result.uri.match(/\/\w+\//);

	curPage = (curPage && curPage[1]) || 1;
	city = city && city[0];

	logger.info("city: %s, page: %s, cars: %d",city,curPage, detailUrls.length);

	detailUrls.forEach(function(detail){
		detail = "http://haoche.ganji.com"+detail;
		tasks.push({opt:detail, next:"wgetDetail"});
	});
	pageUrls.forEach(function(p){
		p = "http://haoche.ganji.com"+p;
		tasks.push({opt:p, next:"wgetList"});
	});
	return tasks;
}

function processDetail(result,$, job){

}

var app = {
    	//set the crawler options
	cl:{
		maxConnections:1,
		rateLimits:3300,
		userAgent:require("../../ua.json").userAgents,
		rotateUA:true,
		debug:false,
		userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"
	},
	name:_prgname,
	wget:function(job){//default the function for the seed
		var opt=null;
		var res = {
			"callback":null,
			"tasks":[],//{opt:opt, next:next},opt:Possible seed, next:the function of the opt
			"status":0
		};
		
		if(!(opt = parseArgv(job))){
			job.workComplete(JSON.stringify(res));
			return;
		}
		
		opt.callback = function(err,result,$){
			if(err){
				logger.error("worker callback err: %s", result?result.uri: "N/A");
				logger.error(err);
				job.workComplete(JSON.stringify(res));
				return;
			}

			if(!$){
				logger.error("$ is null or undefined: %s", result?result.uri: "N/A");
				job.workComplete(JSON.stringify(res));
				return;
			}

			//get the possible seed 
			var urls = $("div.c2city > ul > li > a").map(function(){
				return "http://haoche.ganji.com"+$(this).attr("href");
			}).get();

			if(!_.isArray(urls)){
				logger.warn("Get city error");
				return;
			}
			logger.info("city length: %d", urls.length);
			for (var i = 0; i < urls.length; i++) {
				logger.info(urls[i]);
				res.tasks.push({opt:urls[i], next:"wgetList"});
			};

			//deal page and item list
			var tks = processList(result, $);
			for (var i = 0; i < tks.length; i++) {
				res.tasks.push(tks[i]);
			};

			if(debug)   logger.info("tasks:",res.tasks.length);
			job.workComplete(JSON.stringify(res));
		};		
		this.crawler.queue(opt);
	},
	wgetList:function(job){//default the function for the seed
		var opt=null;
		var res = {
			"callback":null,
			"tasks":[],//{opt:opt, next:next},opt:Possible seed, next:the function of the opt
			"status":0
		};
		
		if(!(opt = parseArgv(job))){
			job.workComplete(JSON.stringify(res));
			return;
		}
		
		opt.callback = function(err,result,$){
			if(err){
				logger.error("worker callback err: %s", result?result.uri: "N/A");
				logger.error(err);
				job.workComplete(JSON.stringify(res));
				return;
			}

			if(!$){
				logger.error("$ is null or undefined: %s", result?result.uri: "N/A");
				job.workComplete(JSON.stringify(res));
				return;
			}
			logger.info("wgetList start: %s", result.uri);
			var tks = processList(result, $);
			for (var i = 0; i < tks.length; i++) {
				res.tasks.push(tks[i]);
			};
			
			if(debug)   logger.info("tasks:",res.tasks.length);
			job.workComplete(JSON.stringify(res));
		};		
		this.crawler.queue(opt);
	},
	wgetDetail:function(job){//default the function for the seed
		var opt=null;
		var res = {
			"callback":null,
			"tasks":[],//{opt:opt, next:next},opt:Possible seed, next:the function of the opt
			"status":0
		};
		
		if(!(opt = parseArgv(job))){
			job.workComplete(JSON.stringify(res));
			return;
		}
		
		opt.callback = function(err,result,$){
			if(err){
				logger.error("worker callback err: %s", result?result.uri: "N/A");
				logger.error(err);
				job.workComplete(JSON.stringify(res));
				return;
			}

			if(!$){
				logger.error("$ is null or undefined: %s", result?result.uri: "N/A");
				job.workComplete(JSON.stringify(res));
				return;
			}

			var no=$(".dt-titleinfo > span").eq(1).text().trim()
				, city = $("a.choose-city").text().trim()
				, name=$(".detect-right p").eq(0).text().trim()
				, tit = $(".dt-titbox > h1").text().replace(/[\n\r\t,]/g,'')
				, items = $(".assort > li > b")
				, time = items.eq(0).text().trim()
				, distance = items.eq(1).text().trim()
				, price = $(".pricebox span b").text().trim().replace("¥",'')
				, save = $(".pricebox span i").text().replace("万",'')
				, mktPrice = Number(price)+Number(save)
				, matches = $(".detecttitle").text().match(/\d{4}-\d{2}-\d{2}/)
				, checkDate = matches?matches[0]:"无";
    
			var rec = [city,tit,time,distance,price,mktPrice,no,name,checkDate,result.uri,moment().format("YYYY-MM-DD HH:mm:ss"),"\n"];
			
			job.sendWorkData(rec.join(','));

			if(debug)   logger.info("tasks:",res.tasks.length);
			job.workComplete(JSON.stringify(res));
		};		
		this.crawler.queue(opt);
	}
};

worker(app)
