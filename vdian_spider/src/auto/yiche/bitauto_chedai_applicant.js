var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")
var seenreq = require("seenreq")
var logger = require("winston")

var _prgname = "bitachedai_applicant";////////////////modify your project name
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
	this.resultFile = this.resultDir+_prgname;
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
	this.IdList = {};
}

BdaSpider.prototype.init = function() {
	logger.info("Initialization starts");
	////////argv use
	// this.keyword = process.argv.splice(2)[0];

	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	if(!fs.existsSync(this.resultFile+"_info.csv")) {
		fs.writeFileSync(this.resultFile+"_info.csv", "\ufeffID,LoanUserID,姓名,电话,汽车名称,上牌时间,里程数,有无抵押,C2B预估车价,预估车价(B2C),C2C预估车价,贷款额度,贷款周期,申请时间\n");////////////modify for your title
	}
	if(fs.existsSync(this.resultFile+"_id.csv")) {
		fs.readFileSync(this.resultFile+"_id.csv").toString().split('\n').forEach(function(item,index){
			that.IdList[item]=1;
		});
	}
	logger.info("Initialization completes");
	return 0;
}

BdaSpider.prototype.run = function() {
	var url = "http://api.chedai.bitauto.com/api/Mortgage/GetTopRows?rowsCount=2000&callback=jQuery111306007781366161229_"
			+moment().valueOf()+"&_="+moment().valueOf();
	this.crawler.queue({uri:url, 
		callback:function(error, result, $){
			that.processList(error, result, $);
		}
	});
}

BdaSpider.prototype.processList = function(error, result, $) {
	if(error || !result) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		var resps = JSON.parse(result.body.match(/jQuery111306007781366161229_\d+\((.+)\)/)[1]);
		// logger.info(resps);
		if (!resps.Result) {
			logger.error("Message: " + resps.Message);
			return ;
		}

		var data = resps.Data;
		var reclist = [];
		var idlist = [];
		for (var i = 0; i < data.length; i++) {
			var applicant = data[i];
			if (this.IdList[applicant.ID+"_"+applicant.LoanUserID]) {	continue;  }
			var rec = [];
			rec.push(applicant.ID);
			rec.push(applicant.LoanUserID);
			rec.push(applicant.Name);
			rec.push(applicant.Mobile);
			rec.push(dealstr(applicant.CarName));
			rec.push(applicant.LicenseYear+'年'+applicant.LicenseMonth+'月');
			rec.push(applicant.Mileage);
			rec.push(applicant.HasMortgage?'有':'无');
			rec.push(dealEmpty(applicant.C2BCarValuation));
			rec.push(dealEmpty(applicant.B2CCarValuation));
			rec.push(dealEmpty(applicant.C2CCarValuation));
			rec.push(applicant.LoanAmount);
			rec.push(applicant.LoanPeriod);
			rec.push(applicant.CreateTime);
			reclist.push(rec.join(','));

			idlist.push(applicant.ID+"_"+applicant.LoanUserID);
			this.IdList[applicant.ID+"_"+applicant.LoanUserID]=1;
		};
		logger.info("Get %d applicants", reclist.length);
		if (reclist.length>0) saveData(reclist.join('\n')+'\n', 'info');
		if (idlist.length>0) saveData(idlist.join('\n')+'\n', 'id');
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
