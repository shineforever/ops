var fs = require('fs')
var Crawler = require('node-webcrawler')
var seenreq = require("seenreq")
var moment = require("moment")
var _ = require("lodash")

var logger = require("winston")
var godotTransport = require("winston-godot")
var godot = require("godot")
var env = process.env.NODE_ENV || "development"

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"haoche.ganji"});

var debug = env ==='development'
    
logger.add(logger.transports.File, { filename: '../../log/haoche.ganji.log' ,logstash:true,handleExceptions: true });
if(env==='production'){
    logger.remove(logger.transports.Console);
}

var resultFile = "../../result/auto/haoche.ganji_"+moment().format("YYYY-MM-DD")+".csv";
fs.writeFile(resultFile,'\ufeff城市,标题,上牌时间,里程,价格,市场价,车牌,检测师姓名,检查时间,Url,抓取时间\n',function(e){
    if(e)
	logger.error(e);
});

var seen = new seenreq();
var c = new Crawler({
    maxConnections:1,
    rateLimits:3300,
    callback:processDetail,
    logger:logger,
    debug:env === "development",
    onDrain:function(){
	logger.info("===All done.===");
	client.close();
    },
    userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"
});

if(fs.existsSync(resultFile)){
    fs.readFileSync(resultFile).toString().split("\n").forEach(function(line){
	var vals = line.split(",");
	var url = vals&&vals.length>8 && vals[8];
	url && seen.exists(url);
    });
}

function filterCity(err,result,$){
    if(err){
	logger.error(err);
	return;
    }
    
    if(!$){
	logger.error("$ is null or undefined");
	return;
    }
    
    if(debug){
	logger.info($("title").text());
    }
    
    var urls = $("div.c2city > ul > li > a").map(function(){
	return "http://haoche.ganji.com"+$(this).attr("href");
    }).get();
    
    logger.info("%d cities", urls.length);
    if(!_.isArray(urls)){
	logger.warn("Get city error");
	return;
    }
    
    urls && urls.forEach(function(url){
	if(!seen.exists(url))
	    c.queue({uri:url,callback:processList,jQuery:false});
    });
}

function processList(error,result){
    if(error){
	logger.error(error);
	return;
    }
    
    var detailUrls = result.body.match(/\/\w+\/[\d\w]+\.htm/g) || []
    , pageUrls = result.body.match(/\/\w+\/buy\/o\d+\//g) || []
    , curPage = result.uri.match(/\/o(\d+)\//)
    , city = result.uri.match(/\/\w+\//);
    
    curPage = (curPage && curPage[1]) || 1;
    city = city && city[0];
    
    logger.info("city: %s, page: %s",city,curPage);

    detailUrls.forEach(function(detail){
	detail = "http://haoche.ganji.com"+detail;
	!seen.exists(detail) && c.queue(detail);
    });
    pageUrls.forEach(function(p){
	p = "http://haoche.ganji.com"+p;
	!seen.exists(p) && c.queue({uri:p,callback:processList,jQuery:false});
    });
}

function processDetail(err,result,$){
    if(err){
	logger.error(err);
	return;
    }
    
    if(!$){
	logger.error("$ is null or undefined");
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
    
    var r = [city,tit,time,distance,price,mktPrice,no,name,checkDate,result.uri,moment().format("YYYY-MM-DD HH:mm:ss"),"\n"];
    
    logger.info("%s, %s, %s",city,no,name,time);
    
    fs.appendFile(resultFile,r.join(),function(e){
	if(e){
	    logger.error(e);
	}
    });
}

c.queue({
    uri:"http://haoche.ganji.com/bj/buy",
    callback:filterCity
});
