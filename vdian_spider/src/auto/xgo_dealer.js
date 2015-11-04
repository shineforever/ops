var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")
var seenreq = require("seenreq")
var logger = require("winston")

var _prgname = "xgo_dealer";
// var curDir = '/home/zero/';

var env = process.env.NODE_ENV || "development";
logger.cli();
logger.add(logger.transports.File, {filename:"../../log/"+_prgname+".log", logstash:true, level:"info",handleExceptions: true});
if(env==="production"){
    logger.remove(logger.transports.Console);
}

var godotTransport = require("winston-godot")
var godot = require("godot")
var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:_prgname});//service名称需要更改

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
	fs.appendFileSync(that.resultFile, recstr);
}

function BdaSpider() {
	this.resultDir = "../../result/auto/";
	this.resultFile = this.resultDir+_prgname+"_"+moment().format("YYYY-MM-DD")+".csv"
	this.crawler = new Crawler({
		maxConnections:1,
		rateLimits:1000,
		userAgent:"Mozilla/5.0",
		forceUTF8:true,
		incomingEncoding:'GB2312',
		jar:true,
		onDrain:function(){
			logger.info("Job done.");
			logger.remove(godotTransport);
			client.close();
		},
		callback:function(err, results, $){ logger.error("callback err:%s.", result.uri) }
	});

	this.seen = new seenreq();
	this.prvcPage = {};
}

BdaSpider.prototype.init = function() {
	logger.info("Initialization starts");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	fs.writeFileSync(this.resultFile, "\ufeff店铺属性,公司名称,所属地区,主营品牌,咨询电话,VIP信息,省份,URL\n");
	logger.info("Initialization completes");
	return 0;
}

BdaSpider.prototype.run = function() {
	var url = "http://dealer.xgo.com.cn/list_p1_t2.html";
	this.addqueue([url], "REGION");
}

BdaSpider.prototype.callbackfunc = function(error, result, $, functype){
	switch(functype){
		case 'REGION':
			that.processRegion(error, result, $);
			break;
		case 'LIST':
			that.processList(error, result, $);
			break;
		case 'ITEM':
			that.processDetail(error, result, $);
			break;
		default:
			break;
	}
}

BdaSpider.prototype.processRegion = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);

		var rglist = $("dd.ddbg a:not(.redc00)");
		// logger.info("rglist len:%d", rglist.length);

		for (var i = 0; i < rglist.length; i++) {
			var rglink = rglist.eq(i);
			var privpath = rglink.attr('href').replace(/_t1|_t2/, '');
			var url = "http://dealer.xgo.com.cn"+privpath;
			var province = dealstr(rglink.text());
			logger.info("%s, %s", url, province);
			// url="http://dealer.xgo.com.cn/list_p1_n99.html";
			this.addqueue([url], "LIST", {province:province});
			// break;//test
		};
	}catch(e){
		logger.error(e);
	}
}

BdaSpider.prototype.processList = function(error, result, $) {
	if(error || !$ || !result) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		var province = result.options.province;
		logger.info("Get %s page %s", province, result.uri);
		var dealerlist = $("span.titText");
		logger.info("dealer count:%d", dealerlist.length);
		for (var i = 0; i < dealerlist.length; i++) {
			var titlink = dealerlist.eq(i).find('a');
			var url = "http://dealer.xgo.com.cn" + titlink.attr("href");
			var name = dealstr(titlink.text());
			var prop = dealstr(dealerlist.eq(i).find("font").text());
			var vipflag = dealerlist.eq(i).find("i").length?"是":"否";
			// logger.info("%s, %s, %s, %s", url, name, prop, vipflag);
			// url = "http://dealer.xgo.com.cn/d_4645/";
			this.addqueue([url], "ITEM", {province:province, name:name, prop:prop, vipflag:vipflag, priority:3});
			// break;//test
		};

		//next page
		// var nextlist = $("a.next");
		// if (nextlist.length>0) {
		// 	var nexturl = "http://dealer.xgo.com.cn"+nextlist.eq(0).attr("href");
		// 	// logger.info("next page: %s", nexturl);
		// 	this.addqueue([nexturl], "LIST", {province:province, priority:4});
		// };

		if (!this.prvcPage[province]) {
			this.prvcPage[province] = 1;
			var pglist = $("#page_num a");
			if (pglist.length>1) {//http://dealer.xgo.com.cn/list_p15_n2.html
				var pgbase = result.uri.replace(/(_n\d+)?\.html/, "");
				var pagecount = dealstr(pglist.eq(pglist.length-2).text());
				logger.info("pagecount : %d", pagecount);
				var urls = [];
				for (var i = 2; i <= pagecount; i++) {
					var url = pgbase+"_n"+i+".html";
					// logger.info("page:"+url);
					urls.push(url);
				}
				this.addqueue(urls, "LIST", {province:province, priority:4});
			}
			else{
				logger.error("get page link error: %s", result.uri);
			}
		}
	}catch(e){
		logger.error(e);
	}
}

function getDealerProp(liprop){
	var spanlist = liprop.find('span');
	if (spanlist.length<2) {return "N/A";}
	var span = spanlist.eq(1).text();
}

BdaSpider.prototype.processDetail = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		logger.info("Get %s %s", result.options.province, result.options.name);
		var detail = [];
		detail.push(result.options.prop);
		detail.push(result.options.name); 
		
		var proplist = $(".dealer_con_nr li");
		// logger.info("proplist len: %d", proplist.length);

		var mbrand = "N/A";
		var region = "N/A";
		var phone = "N/A";
		for (var i = 0; i < proplist.length; i++) {
			var title = dealstr(proplist.eq(i).find("span").eq(0).text());
			// logger.info(title);
			switch(title){
				case '主营品牌：':
					mbrand = dealstr(proplist.eq(i).find("span").eq(1).find('a').text());
					break;
				case '所属地区：':
					region = dealstr(proplist.eq(i).find("span").eq(1).text());
					break;
				case '咨询电话：':
					phone = dealstr(proplist.eq(i).find("span").eq(1).find('p').text());
					break;
			}
		};
		// var addr = dealstr(proplist.eq(6).find("span").eq(1).text());
		// addr  = addr.replace(/\(.+\)/g, '');
		// logger.info("%s, %s, %s", mbrand, region, phone);

		detail.push(region);
		detail.push(mbrand);
		detail.push(phone);
		detail.push(result.options.vipflag);
		detail.push(result.options.province);
		detail.push(result.uri);

		saveData(detail.join(',')+"\n");
	}catch(e){
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
