var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")
var seenreq = require("seenreq")
var logger = require("winston")

var _prgname = "nanjing_ershoufang";
// var curDir = '/home/zero/';

var env = process.env.NODE_ENV || "development";
logger.cli();
logger.add(logger.transports.File, {filename:"../../log/"+_prgname+".log", logstash:true, level:"info",handleExceptions: true});
if(env==="production"){
    logger.remove(logger.transports.Console);
}

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
		var nodotstr = str.replace(/;/g, ' ');
		nodotstr = str.replace(/,/g, ' ');
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
	if(dst){
		for(var key in src){
			dst[key] = src[key];
		}
	}
	else{ 	dst = {};   }

	return dst;
}

function BdaSpider() {
	this.resultDir = "../../result/ershoufang/";
	this.keyword = process.argv.splice(2)[0];
	this.curDate = moment().format("YYYY-MM-DD")
	this.yearFile = this.resultDir + _prgname + "_year.csv";
	this.monthFile = this.resultDir +  _prgname + "_month.csv";
	this.crawler = new Crawler({
		maxConnections:1,
		rateLimits:1000,
		userAgent:"Mozilla/5.0",
		forceUTF8:true,
		incomingEncoding:'GB2312',
		jar:true,
		onDrain:function(){logger.info("Job done.")},
		callback:function(err, results, $){ logger.error("callback err:%s.", result.uri) }
	});

	this.seen = new seenreq();
}

BdaSpider.prototype.init = function() {
	logger.info("Initialization starts");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	logger.info("Initialization completes");
	if(!fs.existsSync(this.yearFile)) {
		fs.writeFileSync(this.yearFile, "\ufeff经济公司,成交套数,抓取日期\n");
	}
	if(!fs.existsSync(this.monthFile)) {
		fs.writeFileSync(this.monthFile, "\ufeff经济公司,成交套数,抓取日期\n");
	}
	return 0;
}

BdaSpider.prototype.run = function() {
	var url = "http://www.njhouse.com.cn/2sfnew/2sfnew.php";
	this.addqueue([url], "DETAIL");
}

BdaSpider.prototype.callbackfunc = function(error, result, $, functype){
	switch(functype){
		case 'JPG':
			that.processJpg(error, result, $);
			break;
		case 'DETAIL':
			that.processDetail(error, result, $);
			break;
		default:
			break;
	}
}

BdaSpider.prototype.processJpg = function(error, result, $) {
	if(error || !result) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		logger.info(typeof(result.body));
		fs.writeFileSync(this.resultDir+_prgname+"_" + this.curDate + ".gif", result.body);
	}catch(e){
		logger.error(e);
	}
}

BdaSpider.prototype.processDetail = function(error, result, $) {
	if(error || !$ || !result ) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		//经济公司排名，按年
		var tdlist = $("tr.word-gray td");
		logger.info(tdlist.length);
		var reclist = [];
		for ( var i = 0; i < 5; i++) {
			logger.info("%s, %s", dealstr(tdlist.eq(i*2).text()), dealstr(tdlist.eq(i*2+1).text()));
			var rec = dealstr(tdlist.eq(i*2).text())+"," + dealstr(tdlist.eq(i*2+1).text()) + "," + this.curDate;
			reclist.push(rec);
		};
		fs.appendFileSync(this.yearFile, reclist.join('\n')+"\n");
		
		//经济公司排名，按月
		reclist = [];
		for ( var i=5; i < 10; i++) {
			logger.info("%s, %s", dealstr(tdlist.eq(i*2).text()), dealstr(tdlist.eq(i*2+1).text()));
			var rec = dealstr(tdlist.eq(i*2).text())+"," + dealstr(tdlist.eq(i*2+1).text()) + "," + this.curDate;
			reclist.push(rec);
		};
		fs.appendFileSync(this.monthFile, reclist.join('\n')+"\n");

		//上月成交情况
		var jpglist = result.body.match(/src=\"([^\"]*2sf_day[^\"]*)\"/);
		if (jpglist.length>1) {
			var jpgurl = "http://www.njhouse.com.cn"+jpglist[1];
			logger.info(jpgurl);
			this.crawler.queue({uri:jpgurl, encoding:null, callback:function(err, result, $){
				that.processJpg(err, result, $);
			}});
		};
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
