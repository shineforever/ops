var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")
var seenreq = require("seenreq")
var logger = require("winston")

var _prgname = "bitachedai_number";////////////////modify your project name
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

function saveData(recstr, type) {
	var filename = that.resultFile+"_"+type+".csv";
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
	this.resultFile = this.resultDir+_prgname
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
}

BdaSpider.prototype.init = function() {
	logger.info("Initialization starts");

	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	if(!fs.existsSync(this.resultFile+"_newcar.csv")) {
		fs.writeFileSync(this.resultFile+"_newcar.csv", "\ufeff贷款总额,正在申请人数,日期\n");////////////modify for your title
	}
	if(!fs.existsSync(this.resultFile+"_mortgage.csv")) {
		fs.writeFileSync(this.resultFile+"_mortgage.csv", "\ufeff放款总计,正在申请人数,日期\n");////////////modify for your title
	}
	logger.info("Initialization completes");
	return 0;
}

BdaSpider.prototype.run = function() {
	//owner loan
	var url = "http://api.chedai.bitauto.com/api/Other/GetCarMortgageStatisticsInfo//?callback=jQuery111306007781366161229_"
			+moment().valueOf()+"&_="+moment().valueOf();
	this.crawler.queue({uri:url, callback:function(error, result, $){
		that.processMortgage(error, result, $);
	}});

	url = "http://api.chedai.bitauto.com/api/Other/GetNewCarLoanStatisticsInfo?callback=jQuery1113013381105568359952_"
			+moment().valueOf();
	this.crawler.queue({uri: url, callback:function(error, result, $){
		that.processNewcar(error, result, $);
	}});
}

BdaSpider.prototype.processNewcar = function(error, result, $) {
	if(error || !result) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		var resps = JSON.parse(result.body.match(/jQuery\d+_\d+\((.+)\)/)[1]);
		// logger.info(resps);
		if (!resps.Result) {
			logger.error("Message: " + resps.Message);
			return ;
		}
		logger.info("[新车贷款]贷款总额:%s,正在申请人数:%s", resps.Data.TotalLoans, resps.Data.ApplyingNum);
		var rec = dealEmpty(resps.Data.TotalLoans.replace(/,/g, '')) + "," + dealEmpty(resps.Data.ApplyingNum.replace(/,/g, '')) 
				+ "," + moment().format('YYYY-MM-DD') + "\n"; 
		saveData(rec, "newcar");

	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}

BdaSpider.prototype.processMortgage = function(error, result, $) {
	if(error || !result) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		var resps = JSON.parse(result.body.match(/jQuery\d+_\d+\((.+)\)/)[1]);
		// logger.info(resps);
		if (!resps.Result) {
			logger.error("Message: " + resps.Message);
			return ;
		}
		logger.info("[车主贷款]放款总额:%s,正在申请人数:%s", resps.Data.TotalLoans, resps.Data.ApplyingNum);
		var rec = dealEmpty(resps.Data.TotalLoans.replace(/,/g, '')) + "," + dealEmpty(resps.Data.ApplyingNum.replace(/,/g, '')) 
				+ "," + moment().format('YYYY-MM-DD') + "\n"; 
		saveData(rec, "mortgage");

	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}

BdaSpider.prototype.start = function() {
	if (this.init()) { return; };
	this.run();
}

var that = new BdaSpider();
that.start();
