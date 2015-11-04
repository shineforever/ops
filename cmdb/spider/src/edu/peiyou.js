var fs = require('fs')
var logger = require('winston')
var godotTransport = require("winston-godot")
var godot = require("godot")
var Crawler = require('node-webcrawler')
var cheerio = require('cheerio')
var moment = require('moment')
var URL = require('url')
var seenreq = require('seenreq')
var env = process.env.NODE_ENV || "development"

logger.add(logger.transports.File, { filename: '../../log/peiyou.log' ,logstash:true,level:'info',handleExceptions:true});
logger.cli();

if(env==="production"){
    logger.remove(logger.transports.Console);
}else{
    logger.transports.Console.level = 'verbose';
}

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"peiyou"});

function Worker() {
    this.resultDir = '../../result/edu/';
    this.today = moment().format("YYYY-MM-DD");
    this.resultFile = 'peiyou_'+moment().format("YYYY-MM-DD")+'.csv';
    this.tasks = [];
    this.seen = new seenreq();
    this.c = new Crawler({
	maxConnections:1,
	callback:this.processList.bind(this),
	debug:env!='production',
	onDrain:function(){
	    logger.info("===All done===");
	    logger.profile("peiyou");
	    client.close();
	}
    });
}

Worker.prototype.getCities = function(){
    var self = this;
    this.c.queue({
	uri:"http://sbj.speiyou.com/shouye/",
	callback:function(err,result,$){
	    if(err){
		logger.error(err);
	    }else{
		var cityUrls = $('#tb-site-list dl dd a').map(function(){
		    return {uri:$(this).attr("href")+'/search/',callback:self.wgetList.bind(self)};
		}).get();
		
		logger.info("%d cities.",cityUrls.length);
		self.c.queue(cityUrls);
	    }
    }});
}

Worker.prototype.init = function(){
    fs.writeFile(this.resultDir+this.resultFile,'\ufeff名称,URL,价格,标题,学科,年级,开课日期,上课时间,上课地点,类型,剩余,地区,时间\n',function(e){
	if(e){
	    logger.error(e);
	}
    });
}

Worker.prototype.start = function(){
    logger.profile("peiyou");
    this.init();
    this.getCities();
}

Worker.prototype.wgetList = function wgetList(err,result,$){
    if(err){
	logger.error(err);
	return;
    }
    
    var self = this;
    var urlObj = URL.parse(result.uri);
    var map2url = function(){
	return urlObj.protocol+"//"+urlObj.host+$(this).attr('href');
    };
    var duplicates = function(uri){
	return !self.seen.exists(uri);
    }
    
    var grads = $("#search-term dl").eq(0).find('a').map(map2url).get().filter(duplicates);
    
    this.c.queue(grads);
}

Worker.prototype.processList = function processList(err,result,$){
    if(err){
	logger.error(err);
	return;
    }
    
    if(!$){
	logger.error("$ is empty");
	return;
    }
    
    var self = this;
    var grade = $("#search-term > dl").eq(0).find("li.select").text().replace(/[\s,]/g,'');
    var city = $("#tb-site > span").text().replace(/[,\s]/g,'');
    
    $("section.s-main-box > div.s-r-list").each(function(){
	var teacher = $("div.s-r-list-photo p a",this)
	, tname = teacher.text().replace(/,/g,';')
	, turl = teacher.attr("href")
	, detail = $("div.s-r-list-detail div.s-r-list-info",this)
	, price = $("div.price span",detail).text()
	, tit = $("h3 > a",detail).attr('title')
	, major = $("p",detail).eq(0).find("span").eq(0).text()
	, dt = $("p",detail).eq(1).find("span")
	, start = dt.eq(0).text().replace(/开课日期：/,'')
	, time = dt.eq(1).text().replace(/[\s,]/g,'').replace(/上课时间：/,'')
	, addr = $("p",detail).eq(2).text().replace(/[\s,]/g,'').replace(/上课地点：/,'')
	, classType = tit && tit.slice(0,3).replace(/[\s,]/g,'')
	, left = $("div.s-r-list-detail .sk-bm-box p span",this).eq(0).text().replace(/[\s,]/g,';');
	
	tit = tit && tit.replace(/[\s,]/g,';');
	major = major && major.replace(/[\s,]/g,'').replace(/学科：/,'');
	
	var record = [tname,turl,price,tit,major,grade,start,time,addr,classType,left,city,that.today,"\n"].join();
	fs.appendFile(self.resultDir+self.resultFile,record,function(e){if(e) logger.error(e);});
    });
    
    logger.info("page %d of %s %s",$(".pagination > span").text(),city,grade);
    
    var urlObj = URL.parse(result.uri);
    var map2url = function(){
	return urlObj.protocol+"//"+urlObj.host+$(this).attr('href');
    }
    var duplicates = function(uri){
	return !self.seen.exists(uri);
    }
    
    var pages = $("div.pagination > a").map(map2url).get().filter(duplicates);
    this.c.queue(pages);
}

var that = new Worker();
that.start();
