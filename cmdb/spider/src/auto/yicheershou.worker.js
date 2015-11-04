var logger = require("winston")
var env = process.env.NODE_ENV || "development"
var Crawler = require("node-webcrawler")
var godotTransport = require("winston-godot")
var godot = require("godot")
var moment = require("moment")

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"yicheershou"});

logger.add(logger.transports.File, { filename: '../../log/yicheershou.worker.log' ,logstash:true,level:"info",handleExceptions: true});
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

var app = {
    cl:{
	maxConnections:1,
	rateLimits:600,
	userAgent:require("../../ua.json").userAgents,
	rotateUA:true
    },
    name:'yicheershou',
    wget:function(job){
	var opt=null;
	var res = {
	    "callback":null,
	    "tasks":[],
	    "status":0
	};
	
	if(!(opt = parseArgv(job))){
		job.workComplete(JSON.stringify(res));
		return;
	}
	
	opt.callback = function(err,result,$){
	    if(err){
	    	logger.error("worker callback err");
		logger.error(err);
		job.workComplete(JSON.stringify(res));
		return;
	    }
	    
	    if(!$){
		logger.error("$ is null or undefined");
		job.workComplete(JSON.stringify(res));
		return;
	    }
	    
	    // tasks = $(".the_pages a").not(".linknow").map(function(){return {opt:$(this).attr("href")};}).get();
	    // logger.info(tasks);
	    // logger.info("tasks:",res.tasks.length);

	    //test
	    
	    if (result.uri=="http://www.taoche.com/buycar/pges2bxcdza/?onsale=1"
	    	||result.uri=="http://www.taoche.com/buycar/pges1bxcdza/?onsale=1") {
	    	logger.info("url: %s", result.uri);
	    	var pagelist = $(".the_pages a");
	    	// logger.info("pagelist: %d",pagelist.length);
	    	var pagecount = dealstr(pagelist.eq(pagelist.length-2).text());
	    	// logger.info("pagecount:%d", pagecount);
	    	for (var i = 2; i <= pagecount; i++) {
	    		var url = result.uri + "&page=" + i;
	    		// logger.info("page url : %s", url);
	    		res.tasks.push({opt:url});
	    	};
	    	logger.info("tasks:",res.tasks.length);
	    };
	    
	    var r = [];
	    var carlist = $("#logwtCarList li");
	    logger.info("car len: %d, page: %s", carlist.length, result?result.uri:"");
	    carlist.each(function(){
		var tit = $(".cary-infor h3 a",this).attr("title").trim().replace(/,/g,'')
		, uri = $(".cary-infor h3 a",this).attr("href").replace(/[\r\n]/g,'')
		, vals = tit && tit.split(" ")
		, model='',config='';
		
		if(vals){
		    if(vals.length>0){
			model = vals[0].replace(/\s/g,'');
		    }
		    if(vals.length>1){
			vals.shift();
			config = vals.join(" ").replace(/[\r\n\t]/g,'');
		    }
		}
		
		config = config && config.replace(/\t/g,'');
		var price = $(".soujxiug",this).last().text().trim()
		, uptime = $(".cary-infor > p.maijzs",this).last().text().replace(/\s/g,'')
		, v = uptime && uptime.split('|')
		, year = v && v[0] || "无"
		, km = v && v.length>1 && v[1].replace(/[\s,]/g,'') || "无"
		, personal = /pges1bxcdza/.test(result.uri)?"Y":"N"
		, city = v && v.length>2 && v[2] || "无";
		var curtime = moment().format("YYYY-MM-DD HH:mm:ss");
		
		r.push([uri,tit,model,config,price,km,year,personal,city, curtime].join());
	    });
	    logger.info("result len: %d, %d", r.length, (r.join("\n")+"\n").length);
	    
	    job.sendWorkData(r.join("\n")+"\n");
	    
	    if(debug)
		logger.info("tasks:",res.tasks.length);
	    job.workComplete(JSON.stringify(res));
	};
	
	this.crawler.queue(opt);
    }
};

worker(app)
