var logger = require("winston")
var godotTransport = require("winston-godot")
var godot = require("godot")
var moment = require('moment')
var URL = require("url")
var env = process.env.NODE_ENV || "development"

logger.add(logger.transports.File, { filename: '../../log/sf.worker.log' ,logstash:true,level:'info',handleExceptions:true});
logger.cli();

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"sf.worker"});

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
	job.reportException(err);
	return;
    }
    
    return opt;
}

var app = {
    name:'sofang',
    cl:{
	maxConnections:1,
	rateLimits:800,
	userAgent:require("../../ua.json").userAgents,
	forceUTF8:true,
	incomingEncoding:'gb2312',
	timeout:15000,
	retries:1,
	rotateUA:true
    },
    cityPriceStepMap : {
	"http://esf.fang.com/house/a21-d2100-j3100/":70,
	"http://esf.fang.com/house/a21-c2100-d2150-j3100/":25,
	"http://esf.fang.com/house/a21-c2150-d2200-j3100/":25,
	"http://esf.fang.com/house/a21-c2200-d2250-j3100/":25,
	"http://esf.fang.com/house/a21-c2250-d2300-j3100/":25,
	"http://esf.fang.com/house/a21-c2300-d2500-j3100/":50,
	"http://esf.sjz.fang.com/house/a21-c250-d280-j3100/":15,
	"http://esf.dl.fang.com/house/a21-c250-d280-j3100/":15,
	"http://esf.dl.fang.com/house/a21-d250-j3100/":40,
	"http://esf.sy.fang.com/house/a21-d250-j3100/":40,
	"http://esf.changchun.fang.com/house/a21-c250-d280-j3100/":15,
	"http://esf.changchun.fang.com/house/a21-d250-j3100/":20,
	"http://esf.suzhou.fang.com/house/a21-c250-d280-j3100/":15,
	"http://esf.sz.fang.com/house/a21-d2100-j3100/":50,
	"http://esf.sh.fang.com/house/a21-c2300-d2500-j3100/":75,
	"http://esf.sh.fang.com/house/a21-c2200-d2300-j3100/":25,
	"http://esf.sh.fang.com/house/a21-c2150-d2200-j3100/":25,
	"http://esf.sh.fang.com/house/a21-c2100-d2150-j3100/":25,
	"http://esf.tj.fang.com/house/a21-c280-d2100-j3100/":10,
	"http://esf.tj.fang.com/house/a21-c260-d280-j3100/":10,
	"http://esf.tj.fang.com/house/a21-c240-d260-j3100/":10,
	"http://esf.jn.fang.com/house/a21-c250-d280-j3100/":15,
	"http://esf.cd.fang.com/house/a21-c2100-d2150-j3100/":25,
	"http://esf.cd.fang.com/house/a21-c280-d2100-j3100/":10,
	"http://esf.cd.fang.com/house/a21-c250-d280-j3100/":8,
	"http://esf.cd.fang.com/house/a21-c230-d250-j3100/":7,
	"http://esf.cq.fang.com/house/a21-c280-d2100-j3100/":10,
	"http://esf.cq.fang.com/house/a21-c250-d280-j3100/":5,
	"http://esf.cq.fang.com/house/a21-c230-d250-j3100/":4,
	"http://esf.xian.fang.com/house/a21-c250-d280-j3100/":15,
	"http://esf.wuhan.fang.com/house/a21-c250-d280-j3100/":15
    },
    wgetList:function(job){
	var opt=null
	, res = {
	    "tasks":[],
	};
	
	if(!(opt = parseArgv(job))){
	    return;
	}
	
	opt.callback = function(err,result,$){
	    if(err){
		logger.error(err);
		//job.reportError(err);
		job.workComplete(JSON.stringify(res));
		return;
	    }
	    
	    if(!$){
		logger.error("$ is null or undefined");
		//job.reportError("$ is null or undefined");
		job.workComplete(JSON.stringify(res));
		return;
	    }
	    
	    var host = URL.parse(result.uri).host;
	    res.tasks = res.tasks.concat($(".houseList > dl p.title a").map(function(){
		return {opt:"http://"+host+$(this).attr("href"),next:"wgetDetail"};
	    }).get());
	    
	    res.tasks = res.tasks.concat($(".fanye > a").not('.pageNow').map(function(){
		var path = $(this).attr('href');
		if(path.search('j3100')===-1){
		    path = path.slice(0,path.length-1)+'-j3100/';
		}
		return {opt:"http://"+host+path,next:'wgetList'};
	    }).get());
	    
	    if(debug)
		logger.info("next jobs: %d",res.tasks.length);
	    
	    job.workComplete(JSON.stringify(res));
	};
	
	this.crawler.queue(opt);
    },
    wget:function(job){
	var opt=null
	, res = {
	    "tasks":[],
	};
	
	if(!(opt = parseArgv(job))){
	    return;
	}
	
	opt.callback = function(err,result,$){
	    if(err){
		logger.error(err);
		//job.reportError(err);
		job.workComplete(JSON.stringify(res));
		return;
	    }
	    
	    if(!$){
		logger.error("$ is null or undefined");
		//job.reportError("$ is null or undefined");
		job.workComplete(JSON.stringify(res));
		return;
	    }
	    
	    var publishDate = result.options.publish;
	    var path = '/house/a21-j3100/';
	    var nextFunc = 'wgetPrice';
	    
	    if(publishDate){
		path = path.replace(/\/$/,'') + '-w3'+publishDate+'/';
		nextFunc = 'wgetList';
	    }
	    
	    res.tasks = $('#c01 a.red').map(function(){
		return {opt:$(this).attr('href')+path,next:nextFunc};
	    }).get();
	    
	    if(debug)
		logger.info("next jobs: %d",res.tasks.length);
	    
	    job.workComplete(JSON.stringify(res));
	};
	
	this.crawler.queue(opt);
    },
    wgetPrice:function(job){
	var opt=null
	, res = {
	    "tasks":[],
	}
	, self = this;
	
	if(!(opt = parseArgv(job))){
	    return;
	}
	
	opt.callback = function(err,result,$){
	    if(err){
		logger.error(err);
		//job.reportError(err);
		job.workComplete(JSON.stringify(res));
		return;
	    }
	    
	    if(!$){
		logger.error("$ is null or undefined");
		//job.reportError("$ is null or undefined");
		job.workComplete(JSON.stringify(res));
		return;
	    }
	    
	    var domain = result.uri.match(/.*?(?=\/house)/)
	    , urlListByPrice = []
	    , alist = $("#list_39 p.floatl a");
	    
	    var getUrlByPrice = function(url) {
		var result = [];
		if(!self.cityPriceStepMap[url]) {
		    result.push(url);
		    return result;
		}
		
		var step = self.cityPriceStepMap[url];
		var domain = url.match(/.*?(?=\/house)/);
		var lowprice = url.match(/-c2(\d+)-/);
		var highprice = url.match(/-d2(\d+)-/)[1];
		lowprice = lowprice ? parseInt(lowprice[1]) : 0;
		var low = lowprice, high;
		while(low < highprice) {
		    high = low + step > highprice ? highprice : low + step;
		    result.push(domain+"/house/a21-c2"+low+"-d2"+high+"-j3100-i31/");
		    low = high;
		}
		return result;
	    };
	    
	    for(var i = 0; i < alist.length; i++) {
    		if(alist.eq(i).text() != "不限") {
    		    res.tasks = res.tasks.concat(
			getUrlByPrice(domain + alist.eq(i).attr("href")).map(function(uri){return {
			    opt:uri,
			    next:'wgetList'
			};})
		    );
    		}
	    }
	    
	    if(debug)
		logger.info("next jobs: %d",res.tasks.length);
	    
	    job.workComplete(JSON.stringify(res));
	}
	
	this.crawler.queue(opt);
    },
    wgetDetail:function(job){
	var opt=null
	, res = {
	    "tasks":[],
	};
	
	if(!(opt = parseArgv(job))){
	    return;
	}
	
	opt.callback = function(err,result,$){
	    if(err){
		logger.error(err);
		//job.reportError(err);
		job.workComplete(JSON.stringify(res));
		return;
	    }
	    
	    if(!$){
		logger.error("$ is null or undefined, %s",result.uri);
		//job.reportError("$ is null or undefined");
		job.workComplete(JSON.stringify(res));
		return;
	    }
	    
	    var imgQuantity = $("#thumbnail ul > li").length
	    , tit = $("h1").text().trim()
	    , txt = $("div.title").text().replace(/\s/g,'')
	    , matches = txt && txt.match(/房源编号：(\d+)/)
	    , no = matches && matches[1];
	    
	    tit = tit && tit.replace(/[\s"“]/g,'').replace(/,/g,';');
	    if(!tit || !no){
		if(result.body.search("此房源已售出!")>-1){
		    logger.warn("此房源已售出!");
		}else{
		    logger.error("empty: %s",result.uri);
		}
		job.workComplete(JSON.stringify(res));
		return;
	    }
	    
	    txt = $("div.title p > span").last().text();
	    
	    var pubtime = txt && txt.replace(/发布时间：/,'').replace(/\s/g,'')
	    , city = $(".s2 .s4Box a").text().trim()
	    , addr = result.uri
	    , agent = $(".card dl dt strong a").text().trim()
	    , agentid = $(".card dl dt strong a").attr("href")
	    , bread = $(".bread").text().replace(/[\s,]/g,'').replace(/二手房/g,'')
	    , createdAt = moment().format("YYYY-MM-DD HH:mm:ss")
	    , tag = false;
	    
	    city = city || bread.split(">")[1];
	    agent = agent && agent.replace(/,/g,';');
	    var personal = !agent;
	    var agents = [""];
	    if(!personal){
		agents.push([no,agentid,agent,"N/A",city,pubtime,addr,1,createdAt].join());
	    }
	    
	    $(".list").each(function(){
		var a = $("dl dd a",this);
		var c = $("dl dd.mt5 p",this).eq(1).text().trim() || "N/A";
		var t = $("div.txt p",this).last().text().trim().replace(/ 更新/,'').trim();
		
		if(a.attr("href") && t)
		    agents.push([no,a.attr("href"),a.text().trim(),c,city,t,addr,2,createdAt].join());
	    });
	    
	    //other contacts
	    $("#ulmain li div.mt5.txt").each(function(){
		var agentUrl = $("p a",this).attr("href")
		, name = $("p a",this).text().trim()
		, c = $("p",this).eq(1).text().trim() || "N/A";
		
		agents.push([no,agentUrl, name, c,city,"N/A",addr,3,createdAt].join());
	    });
	    
	    if($(".adBox div.free h3").text().trim()==="佣金0.5%"){
		tag = true;
	    }
	    
	    var rstHouses = [tit,no,bread,pubtime,personal?"Y":"N",city,addr,imgQuantity,tag?"Y":"N",createdAt].join() + '\n'
	    , rstAgents = agents.join("\n") + '\n'
	    
	    logger.info("%s, agents: %d",bread,agents.length-1);
	    
	    job.sendWorkData(rstHouses+'\r\n'+rstAgents);
	    job.workComplete(JSON.stringify(res));
	}
	this.crawler.queue(opt);
    }
};

worker(app)
