var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")
var seenreq = require("seenreq")
var logger = require("winston")

var _prgname = "bitachedai_newcar";////////////////modify your project name
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
		// var nodotstr = str.replace(/;/g, ' ');
		var  nodotstr = str.replace(/[,，;；]/g, ' ');
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
	fs.appendFileSync(filename, recstr);
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
	this.sigt = moment().valueOf();
	this.pagesize = 50;
	this.seen = new seenreq();
	this.done = {};
}

BdaSpider.prototype.init = function() {
	logger.info("Initialization starts");
	////////argv use
	// this.keyword = process.argv.splice(2)[0];

	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	fs.writeFileSync(this.resultFile, "\ufeff品牌,车系,车型,提供方,产品名称,月供,首付,手续费,总成本,要求,申请人数,特点,省份,城市,URL\n");////////////modify for your title

	logger.info("Initialization completes");
	return 0;
}

BdaSpider.prototype.run = function() {
	// var urls = [];
	// for (var i = 1; i < 10; i++) {
	// 	var url = "http://api.chedai.bitauto.com/api/FinancialProduct/GetBudgetFinancialProducts?callback=jQuery111307485854072868728_"+moment().valueOf()
	// 		+"&downPaymentOption=2&monthPayOption=-1&sortName=MR&pageIndex="+i+"&pageSize=10&cityId=2102";
	// 	urls.push(url);
	// };
	
	var url = "http://chedai.bitauto.com/home/recommend";
	this.addqueue([url], "PROV");
}

BdaSpider.prototype.callbackfunc = function(error, result, $, functype){
	switch(functype){
		case 'PROV':
			that.processProvince(error, result, $);
			break;
		case 'CITY':
			that.processCity(error, result, $);
			break;
		case 'LIST':
			that.processList(error, result, $);
			break;
		default:
			break;
	}
}

BdaSpider.prototype.processProvince = function(error, result, $) {
	if(error || !result ||!$) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		var provlist = $(".byProvince dl.shen dd a");
		logger.info("province length : %d", provlist.length);
		for (var i = 0; i < provlist.length; i++) {
			var prov = provlist.eq(i);
			logger.info("id:%s, name:%s", prov.attr('data-id'), prov.text());
			var url = "http://api.chedai.bitauto.com/api/Common/GetCities?provinceId="+prov.attr('data-id')
				+"&callback=jQuery111308622975770508425_"+this.sigt;
			this.addqueue([url], "CITY", {province:dealstr(prov.text().trim())});
			// break;//test
		}
	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}

//{"ID":102,"ParentID":1,"Name":"安庆","Spell":"anqing","FullName":"安庆市","Level":2,"OrderNumber":2}
BdaSpider.prototype.addCity = function(cityinfo, province) {
	var url = "http://api.chedai.bitauto.com/api/FinancialProduct/GetBudgetFinancialProducts?callback=jQuery111307485854072868728_"
		+this.sigt+"&downPaymentOption=-1&monthPayOption=-1&sortName=MR&pageSize="+this.pagesize+"&cityId="+cityinfo.ID+"&pageIndex=1";
	// logger.info("car list url: " + url);
	this.addqueue([url], "LIST", {province:province, city:cityinfo.Name, paylevel:-1, priority:4});
	for (var i = 1; i <=7 ; i++) {
		url = "http://api.chedai.bitauto.com/api/FinancialProduct/GetBudgetFinancialProducts?callback=jQuery111307485854072868728_"
			+this.sigt+"&downPaymentOption="+i+"&monthPayOption=-1&sortName=MR&pageSize="+this.pagesize+"&cityId="+cityinfo.ID+"&pageIndex=1";
		// logger.info("car list url: " + url);
		this.addqueue([url], "LIST", {province:province, city:cityinfo.Name, paylevel:i, priority:4});
	}
}

BdaSpider.prototype.processCity = function(error, result, $) {
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
		var province = result.options.province;
		var data = resps.Data;
		logger.info("Got %d city %s", data.length, province);
		for (var i = 0; i < data.length; i++) {
			// var city = data[i];
			this.addCity(data[i], province);
			// break;//test
		};
	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}

BdaSpider.prototype.processList = function(error, result, $) {
	if(error || !result) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		var province = result.options.province;
		var city = result.options.city;
		var paylevel = result.options.paylevel;
		var resps = JSON.parse(result.body.match(/jQuery\d+_\d+\((.+)\)/)[1]);
		// logger.info(resps);		
		if (!resps.Result) {
			logger.error("Message: " + resps.Message);
			return ;
		}
		logger.info("Get Cars %d/%s %s %s %d", resps.Data.length, resps.RowCount, province, city, paylevel);

		var data = resps.Data;
		// var reclist = [];
		for (var i = 0; i < data.length; i++) {
			var car = data[i];
			var rec = [];
			rec.push(dealEmpty(dealstr(car.CarMasterBrandName)));
			rec.push(dealEmpty(dealstr(car.SerialName)));
			rec.push(dealEmpty(dealstr(car.CarName)));
			rec.push(dealEmpty(dealstr(car.CompanyName)));//提供方
			rec.push(dealEmpty(dealstr(car.PackageName)));//产品名称
			rec.push(dealEmpty(dealstr(car.MonthlyPaymentText)));//月供
			rec.push(dealEmpty(dealstr(car.DownPaymentText)));//首付
			rec.push(dealEmpty(dealstr(car.ServiceFeeText)));//手续费
			rec.push(dealEmpty(dealstr(car.TotalCostText)));//总成本			
			var reqm = '';
			car.Requirements.forEach(function(item,index){
				reqm = reqm +"/"+ item;
			});
			rec.push(dealEmpty(dealstr(reqm)));//要求
			rec.push(dealEmpty(dealstr(car.ApplyCount)));//申请人数
			var feature = '';
			car.PackageFeatureList.forEach(function(item,index){
				feature = feature +"/"+ item.Name;
			});
			// for (var j = 0; j < car.PackageFeatureList.length; j++) {
			// 	feature = feature + car.PackageFeatureList[j].Name;
			// };
			rec.push(dealEmpty(dealstr(feature)));//特点
			rec.push(dealEmpty(dealstr(province)));
			rec.push(dealEmpty(dealstr(city)));
			rec.push(result.uri);
			if (rec.length>0) {
				saveData(rec.join(','));
				saveData("\n");
			};
			var tmp = null;
			while(rec.length>0) 	{tmp = rec.pop();tmp =null;}
			rec = null;
		};
		logger.info("Save %d cars", resps.Data.length);
		//page
		var baseurl = result.uri.replace(/&pageIndex=\d+/,'');
		// logger.info("baseurl:"+baseurl);
		if (!this.done[baseurl]) {
			this.done[baseurl] = 1;
			var pagecount = Math.ceil(resps.RowCount/this.pagesize);
			logger.info("Add page: %d", pagecount);		
			var urls = [];
			for (var i = 2; i <= pagecount; i++) {
				var url = baseurl + "&pageIndex=" + i;
				// logger.info("page:"+url);
				urls.push(url);
			};
			this.addqueue(urls, "LIST", {province:province, city:city, paylevel:paylevel, priority:3});
		}
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
