var fs = require('fs')
var logger = require('winston')
var seenreq = require("seenreq")
var moment = require("moment")
var Crawler = require('node-webcrawler')

var env = process.env.NODE_ENV || "development"

var godotTransport = require("winston-godot")
var godot = require("godot")
var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"athmdealer"});

logger.add(logger.transports.File, { filename: '../../log/athmdealer.log',logstash:true,handleExceptions:true });
if(env==="production"){
    logger.remove(logger.transports.Console);
}

var c = new Crawler({
    maxConnections:1,
    callback:function(err,result,$){
	that.processList(err,result,$);
    },
    logger:logger,
    forceUTF8:true,
    // debug:env === "development",
    onDrain:function(){
	logger.info("Job done.");
	logger.remove(godotTransport);
	client.close(); 
    },
    userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"
})

var Dealer = function(){
    this.resultDir = "../../result/auto/";
    this.dataDir = '../../appdata/';
    this.resultFile = "athmdealer_"+moment().format("YYYY-MM-DD")+".csv";
    this.done = {};
    this.seen = new seenreq();
}
//http://deal.autohome.com.cn/china/?k=2, 综合经销商

Dealer.prototype.init = function(){
    fs.writeFileSync(this.resultDir + this.resultFile,'\ufeff经销商名称,简称,主营品牌,区域,电话\n');
}

Dealer.prototype.start = function(){
    this.init();
    this.wgetList(["http://dealer.autohome.com.cn/china/"]);
}

Dealer.prototype.wgetList = function(urls){
    urls.filter(function(url){
	return !this.seen.exists(url);
    },this).forEach(function(url){
	c.queue(url);
	logger.info(url);
    });
}

Dealer.prototype.processList = function(err,result,$){
    if(err){
	logger.error(err);
    }else{
	if(!$){
	    logger.error('$ is empty.');
	}
	logger.info("Get %s", result.uri);
	var records = [];
	$("div.dealer-cont").each(function(){
	    var titleLink = $("h3.dealer-cont-title a",this).last();
	    var name = titleLink.text();
	    name = name && name.replace(/[,，]/g,"");
	    var brand = $(titleLink).attr("js-dbrand");
	    var sName = $(titleLink).attr("js-dname");
	    var city = $(titleLink).attr('js-darea');
	    var phone = $("span.dealer-api-phone",this).text()|| "无";
	    records.push([name,sName,brand,city,phone].join());
	});
	
	
	// logger.info(r);
	if (records.length>0) {
		var r = records.join('\n')+"\n";
		fs.appendFile(this.resultDir+this.resultFile,r,function(e){
		    if(e){
			logger.error(e);
		    }
		});
	};

	var pages = $("div.page a").not('.current').not('.page-disabled').map(function(){return 'http://dealer.autohome.com.cn'+$(this).attr('href');}).get();
	// process.nextTick(function(){
	//     that.wgetList(pages);
	// });
	this.wgetList(pages);
    }
}

var that = new Dealer();
that.start();
