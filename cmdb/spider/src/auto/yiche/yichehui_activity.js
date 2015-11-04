var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")
var seenreq = require("seenreq")
var cheerio = require('cheerio')
var logger = require("winston")

var _prgname = "yichehui_activity";////////////////modify your project name
// var curDir = '/home/zero/';//for test

var env = process.env.NODE_ENV || "development";
logger.cli();
logger.add(logger.transports.File, {filename:"../../../log/"+_prgname+".log", logstash:true,handleExceptions: true});
if(env==="production"){
    logger.remove(logger.transports.Console);
}

var godotTransport = require("winston-godot")
var godot = require("godot")
var godotServer = require("../../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:_prgname});//service名称需要更改, 同时去服务器更改logServer配置文件

function dealEmpty(value){
	if(typeof(value)=='number'){
		return value;
	}
	else{
		return (value?value:"N/A");
	}
}

function dealstr(str){
	if(typeof(str)=='string'){
		var nodotstr = str.replace(/[;,]/g, ' ');
		// nodotstr = str.replace(/,/g, ' ');
		return nodotstr.replace(/\s+/g, ' ');
	}
	else{
		return str;
	}
}

function htmlSpctoString(htmlstr){
	while(1){
		var spchars = htmlstr.match(/&#(\d+);/);
		if (spchars && spchars.length>0) {
			var spc = spchars[1];
			var normal = String.fromCharCode(spc);
			htmlstr = htmlstr.replace(spchars[0], normal);
		} else{
			break;
		}
	}
	return htmlstr;
}


function ObjectClone(src, dst){
	if(!dst) dst = {};
	for(var key in src){
		dst[key] = src[key];
	}
	return dst;
}

function saveData(recstr, type) {
	var filename = that.resultFile;
	// logger.info(filename);
	// logger.info(recstr);
	fs.appendFile(filename, recstr,function(err){
		if (err) {
			logger.error("append file err");
			logger.error(err);
		}
	});
}

function BdaSpider() {
	////////////modify for your path and filename
	this.resultDir = "../../../result/auto/";
	this.resultFile = this.resultDir+_prgname+"_"+moment().format("YYYY-MM-DD")+".csv"
	this.crawler = new Crawler({
		maxConnections:1,
		rateLimits:1000,
		userAgent:"Mozilla/5.0",
		forceUTF8:true,
		jar:true,
		onDrain:function(){
			logger.info("Job done.");
			logger.remove(godotTransport);
			client.close();
		},
		callback:function(err, results, $){ logger.error("callback err:%s.", result.uri) }
	});

	this.seen = new seenreq();
}

BdaSpider.prototype.init = function() {
	logger.info("Initialization starts");
	////////argv use
	// this.keyword = process.argv.splice(2)[0];

	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	fs.writeFileSync(this.resultFile, "\ufeff品牌,标题,订金,价格,优惠信息,URL\n");////////////modify for your title
	
	logger.info("Initialization completes");
	return 0;
}

BdaSpider.prototype.run = function() {
	var url = "http://mai.bitauto.com/";
	this.addqueue([url], "LIST");
	//promotion
	url = "http://mai.bitauto.com/Ajax/Activity/ActivityHandler.ashx?ran=0.8267459975513232&action=GetActivityListForPage&acttype=1&sort=2&pSize=10&pPage=0&cityID=201";
	//hot
	var url1 = "http://mai.bitauto.com//Ajax/Activity/ActivityHandler.ashx?ran=0.9949786822669419&action=GetActivityListForPage&acttype=2&sort=2&pSize=10&pPage=0&cityID=201";
	this.addqueue([url, url1],"HOT");
}	

BdaSpider.prototype.callbackfunc = function(error, result, $, functype){
	switch(functype){
		case 'LIST':
			that.processList(error, result, $);
			break;
		case 'HOT':
			that.processHot(error, result, $);
			break;
		case 'ACT':
			that.processAct(error, result, $);
			break;
		case 'ITEM':
			that.processDetail(error, result, $);
			break;
		default:
			break;
	}
}

BdaSpider.prototype.processList = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		//hezuo: 77 & brandshop=>activiry, yuehui=>car
		var hzList = $("div.id_list.hezuo ul li");
		logger.info("Got hezuo %d", hzList.length);
		for (var i = 0; i < hzList.length; i++) {
			var litag = hzList.eq(i);
			var url = litag.find('a').attr('href');
			url = url.replace(/\?ref=.+/,'');
			if (litag.find('div.active_77').length>0) {//77car
				// logger.info("77");
				this.addqueue([url], "ITEM", {priority:3});
			} else{//brand
				// logger.info("brand");
				this.addqueue([url], "ACT", {priority:4});
			};
			// logger.info("url:"+url);
		};

		//new car
		var nclist = $(".id_list.ad_focus ul li");
		logger.info("Got new car  %d", nclist.length);
		for (var i = 0; i < nclist.length; i++) {
			var litag = nclist.eq(i);
			var url = litag.find('a').attr('href');
			url = url.replace(/\?ref=.+/,'');
			var price = dealstr(litag.find('span.col_btn').text());
			// logger.info("url:%s, price: %s", url, price);
			this.addqueue([url], "ITEM", {price:price, priority:3});
		};

	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}

BdaSpider.prototype.processHot = function(error, result) {
	if(error || !result) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		 var $ = cheerio.load(result.body);
		 var links = $("li > a");
		 logger.info("Got Hot %d", links.length);
		 var urls = [];
		 for (var i = 0; i < links.length; i++) {
		 	var url = links.eq(i).attr('href');
		 	// logger.info("url:"+url);
		 	urls.push(url);
		 }
		 this.addqueue(urls, "ACT", {priority:4});
	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}

// http://mai.bitauto.com/detail-45-112985.html
// http://www.bitauto.com/zhuanti/adtopic/besturnx80
BdaSpider.prototype.processAct = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		// logger.info("act: " + result.uri);
		var links = $("a");
		var urls = [];
		for (var i = 0; i < links.length; i++) {
			var link = links.eq(i).attr('href');;
			// logger.info("link:"+link);
			if (link && link.match(/(detail-\d+-\d+\.html)|(adtopic\/besturn)/)) {
				// logger.info("url:"+link.replace(/\?ref=.+/,''));
				urls.push(link.replace(/\?ref=.+/,''));
			} 
		}
		this.addqueue(urls, "ITEM", {priority:3});
	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}
BdaSpider.prototype.processDetail = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		logger.info("Get car " + result.uri);

		var price = result.options.price || 'N/A';

		var t1 = dealstr($(".PB_Name").text());
		var t2 = dealstr($(".fr.commodity-info h2").text());
		var title = t1||t2||'N/A';
		var promotion =  dealstr($(".clearfix.promotions-box").text());
		var dpt1 = dealstr($(".P_Deposit").text());
		var dpt2 = dealstr($(".clearfix.money-box dd > span").text());
		var deposit = dpt1||dpt2||'N/A';
		var locals = dealstr($(".bread-crumbs").text()).split('>');
		var brand = locals.length>2?dealstr(locals[1].trim()=='品牌旗舰店'?locals[2].trim():(locals[1]+" "+locals[2])):'N/A';
		logger.info("brand:%s, title:%s, promotion: %s, deposit:%s", brand, title, promotion, deposit);
		var rec = [brand, title, deposit, price, promotion, result.uri].join(',')+"\n";

		saveData(rec);

	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}

BdaSpider.prototype.addqueue = function(urls, functype, options){
	urls.filter(
		function(url){
			return !this.seen.exists(url);
		},this
	).forEach(
		function(url){
			var option = ObjectClone(options);
			option.uri = url;
			option.callback = function(error, result, $){
				that.callbackfunc(error, result, $, functype);
			}
			that.crawler.queue(option);
		}
	);
}

BdaSpider.prototype.start = function() {
	if (this.init()) { return; };
	this.run();
}

var that = new BdaSpider();
that.start();
