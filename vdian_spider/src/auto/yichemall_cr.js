var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")
var seenreq = require("seenreq")
var logger = require("winston")

var _prgname = "yichemall";////////////////modify your project name
// var curDir = '/home/zero/';//for test

var env = process.env.NODE_ENV || "development";
logger.cli();
logger.add(logger.transports.File, {filename:"../../log/"+_prgname+".log", logstash:true, level:"info",handleExceptions:true });
if(env==="production"){
    logger.remove(logger.transports.Console);
}

var godotTransport = require("winston-godot")
var godot = require("godot")
var godotServer = require("../../config.json")[env].godotServer;
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


function ObjectClone(src, dst){
	if(!dst) dst = {};
	for(var key in src){
		dst[key] = src[key];
	}
	return dst;
}

function saveData(recstr, type) {
	var filename = that.resultDir+_prgname+"_"+type+"_"+that.resultFile;
	// logger.info("save:"+filename);
	// logger.info(recstr);
	fs.appendFileSync(filename, recstr);
}

function BdaSpider() {
	////////////modify for your path and filename
	this.resultDir = "../../result/auto/";
	this.resultFile = moment().format("YYYY-MM-DD")+".csv"
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
	this.pageflag = true;
}

BdaSpider.prototype.init = function() {
	logger.info("Initialization starts");
	////////argv use
	// this.keyword = process.argv.splice(2)[0];

	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	if(!fs.existsSync(this.resultDir+_prgname+"_car_"+this.resultFile)) {
		fs.writeFileSync(this.resultDir+_prgname+"_car_"+this.resultFile, 
			"\ufeffCarID,车系,车型,价格,商城价,厂商指导价,促销活动,城市\n");////////////modify for your title
	}
	if(!fs.existsSync(this.resultDir+_prgname+"_province_"+this.resultFile)) {
		fs.writeFileSync(this.resultDir+_prgname+"_province_"+this.resultFile, 
			"\ufeffCarID,车系,车型,省份\n");////////////modify for your title
	}
	logger.info("Initialization completes");
	return 0;
}

BdaSpider.prototype.run = function() {
	var url = "http://www.yichemall.com/car/list";
	this.addqueue([url], "LIST");
}

BdaSpider.prototype.callbackfunc = function(error, result, $, functype){
	switch(functype){
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

BdaSpider.prototype.processList = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		logger.info("Get page %s", result.options.uri);
		//model list
		var carslist = $("a.love");
		logger.info("model len: %d", carslist.length);
		var url = "http://www.yichemall.com/SingleProduct/GetProductList";
		for (var i = 0; i < carslist.length; i++) {
			var modelId = carslist.eq(i).attr("modelid");
			var modelname = dealstr(carslist.eq(i).attr("modelname"));
			// logger.info("modelId:"+modelId);
			this.crawler.queue({
				uri:url, method:'POST', priority:4, form:{modelId:modelId},  modelname:modelname, 
				callback:function(err, result, $){
					that.processPrdList(err, result, $);
				}
			});
			// break;
		};

		//page list
		if (this.pageflag) {
			var totalCount = $("#hidTotelCount").val();
			var pageSize = $("#hidpageSize").val();
			var maxPage = Math.ceil(totalCount/pageSize);
			logger.info("totalCount:%d, pageSize:%d, maxPage:%d",totalCount, pageSize, maxPage);
			var pagelist =[];
			for (var i = 2; i <= maxPage; i++) {
				var pageurl = "http://www.yichemall.com/car/list?&p="+i;
				pagelist.push(pageurl);
			};
			// logger.info(pagelist);
			this.addqueue(pagelist, "LIST");
			this.pageflag = false;
		};
		
	}catch(e){
		logger.error(e);
	}
}

BdaSpider.prototype.processPrdList = function(error, result, $) {
	if(error || !result) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		// logger.info(result.body);
		var modelname = result.options.modelname;
		logger.info("Get %s", modelname);	
		var prdlist = JSON.parse(result.body).Product;
		for (var i = 0; i < prdlist.length; i++) {
			var url = "http://www.yichemall.com/car/detail/c_"
				+ prdlist[i].CarId + "_" + encodeURIComponent(prdlist[i].CarName) + "/";
			// logger.info(url);
			this.addqueue([url], "ITEM", {CarId:prdlist[i].CarId, CarName:prdlist[i].CarName, modelname:modelname, priority:3});
			this.crawler.queue({
				uri:"http://www.yichemall.com/SingleProduct/GetProvinceByCarId", method:'POST', priority:3, 
				form:{carId:prdlist[i].CarId}, CarId:prdlist[i].CarId, CarName:prdlist[i].CarName, modelname:modelname,
				callback:function(err, result, $){
					that.processPrivince(err, result, $);
				}
			});
			// break;
		};
	}catch(e){
		logger.error(e);
	}
}

BdaSpider.prototype.processPrivince = function(error, result, $) {
	if(error || !result ) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		// logger.info(result.body);
		var provlist = JSON.parse(result.body).Provinces;
		var rec = "";
		for (var i = 0; i < provlist.length; i++) {
			rec = rec + "/" + provlist[i].ProvinceName;
		};
		rec = result.options.CarId+","+result.options.modelname+","
			+result.options.CarName+","+rec + "\n";
		saveData(rec, "province");
	}catch(e){
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

		var config = dealstr($("#ProductName").val());
		var sale = $("strong#jinrong0").text().trim();
		sale = sale && sale.replace(/\s*/g,'');
		var mallPrice = $("#MallPrice").text().trim();
		mallPrice = mallPrice && mallPrice.replace(/\s*/g,'');
		var factoryPrice = $("#FactoryPrice").text().trim();
		factoryPrice = factoryPrice && factoryPrice.replace(/\s*/g,'');
		var city = $("#currentCity").text().trim();
		var subtitle = $("#subtitle").text().trim();
		subtitle = subtitle && subtitle.replace(/\s/g,'');
		var rec = [result.options.CarId,result.options.modelname, config,
			dealEmpty(sale),dealEmpty(mallPrice),dealEmpty(factoryPrice),dealstr(subtitle),city].join(",")+"\n";
		// logger.info(rec);
		saveData(rec, "car");
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
