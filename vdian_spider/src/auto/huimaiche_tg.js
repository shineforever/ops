var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")
var seenreq = require("seenreq")
var logger = require("winston")

var _prgname = "huimaiche_tg";
// var curDir = '/home/zero/';

var env = process.env.NODE_ENV || "development";

var godotTransport = require("winston-godot")
var godot = require("godot")
var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:_prgname});//service名称需要更改

logger.cli();
logger.add(logger.transports.File, {filename:"../../log/"+_prgname+".log", logstash:true, level:"info",handleExceptions:true});
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
		var nodotstr = str.replace(/[,，;；]/g, ' ');
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
	this.resultDir = "../../result/auto/";
	this.resultFile  = this.resultDir+ _prgname+"_" +moment().format("YYYY-MM-DD")+".csv";
	this.crawler = new Crawler({
		maxConnections:4,
		rateLimits:500,
		userAgent:"Mozilla/5.0",
		// forceUTF8:true,
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

			// rec.push(dealEmpty(dealer.Dealer.DealerShortName));
			// rec.push(dealEmpty(dealer.Dealer.DealerFullName));
			// rec.push(dealEmpty(dealer.Dealer.DealerSaleAddr));
			// rec.push(dealEmpty(dealer.Dealer.DealerSalePhone));
			// rec.push(dealEmpty(dealer.Score));
			// rec.push(dealEmpty(detail.brand));
			// rec.push(dealEmpty(detail.carname));
			// rec.push(dealEmpty(detail.city));
			// rec.push(dealEmpty(detail.ccode));
			// rec.push(dealEmpty(detail.CarID));	
BdaSpider.prototype.init = function() {
	logger.info("Initialization starts");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	// saveData("\ufeff标题,品牌,报名人数,到店时间,城市,车型\n","tg");
	fs.writeFileSync(this.resultFile, "\ufeff标题,品牌,报名人数,到店时间,城市,车型,URL\n");
	logger.info("Initialization completes");
	return 0;
}

BdaSpider.prototype.run = function() {
	var url = 'http://img.huimaiche.com/web/js/citylist.js?_='+moment().valueOf();
	// logger.info("city url: %s", url);
	this.addqueue([url], 'CITY');
}

BdaSpider.prototype.callbackfunc = function(error, result, $, functype){
	switch(functype){
		case 'CITY':
			that.processCity(error, result, $);
			break;
		case 'BRAND':
			that.processBrandList(error, result, $);
			break;
		case 'TG':
			that.processTuangou(error, result, $);
			break;
		case 'TGD':
			that.processTgDetail(error, result, $);
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

BdaSpider.prototype.processCity = function(error, result, $) {
	if(error || !result) {//return json str
		logger.error("Error opening or parsing %s", result.uri);
		return;
	}
	try{
		eval(result.body.trim()+";");//body: var cityList = [{i:'101',n:'合肥',co:'16',g:'华东',go:'3',d:'hefei.huimaiche.com'}];
		// logger.info(cityList);

		//tuangou
		for (var i = 0; i < cityList.length; i++) {
			var url = "http://"+cityList[i].d+"/tuangou";
			// logger.info("city url : %s", url);
			// url = "http://beijing.huimaiche.com/tuangou";
			this.addqueue([url], 'TG', {city: cityList[i].n, baseurl: "http://"+cityList[i].d, priority:3});

			// url = "http://img.huimaiche.com/web/js/"+cityList[i].i+".js?_=" + moment().valueOf();
			// // logger.info("city url : %s", url);
			// // logger.info("base url : %s", "http://"+cityList[i].d);
			// // url = "http://img.huimaiche.com/web/js/2201.js?_=" + moment().valueOf();
			// this.addqueue([url], 'BRAND', {city: cityList[i].n, ccode: cityList[i].i,  baseurl: "http://"+cityList[i].d, priority:4});
			// break;
		};
	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}

BdaSpider.prototype.processTuangou = function(error, result, $) {
	if(error || !$ || !result) {
		logger.error("processTuangou Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		var city = result.options.city;
		var baseurl = result.options.baseurl;
		// logger.info("Get city %s TuanGou", city);
		var urls = $("a.item.clearfix") ;
		
		// var markNumlist = $(".mark-txt em");
		// logger.info("mark num: %d",markNumlist.length);

		// var brandlist = $("p.lead");
		// logger.info("brandlist: %d",brandlist.length);
		logger.info("Get city %s TuanGou %d", city, urls.length);

		for (var i = 0; i < urls.length; i++) {
			var url = baseurl+ urls.eq(i).attr('href');
			var brdlist  = dealstr(urls.eq(i).find('p.lead').text().trim()).split('到店时间：');
			var title = dealEmpty(brdlist[0].trim());
			var count = dealEmpty(dealstr(urls.eq(i).find('.mark-txt em').text().trim()));
			// logger.info("url:%s, title:%s", url, title);
			this.addqueue([url], "TGD", {city:city, title:title, count:count, priority:1});
		};
	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}

BdaSpider.prototype.processTgDetail = function(error, result, $) {
	if(error || !$ || !result) {
		logger.error("processTgDetail Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		var city = result.options.city;
		var title = result.options.title;
		logger.info("Get %s %s", city, title);
		
		var mts = result.options.title.match(/】(.+)团购/);
		var brand = mts && mts.length>1?mts[1]:"N/A";

		
		var timelist = $(".tg-detail div");
		var time = "N/A";
		for (var i = 0; i < timelist.length; i++) {
			var timehead = timelist.eq(i).find('span');
			if (timehead.length>0 && dealstr(timehead.text())=='到店时间') {
				time = dealstr(timelist.eq(i).text().replace(/到店时间/, ''));
				break;
			};
		};
		var countlist = $(".txt-1 em");
		var count = countlist.length>0?dealEmpty(dealstr(countlist.text())):result.options.count;

		// logger.info("time:%s, count:%s", time, count);

		var modellist = $("#Serial a");
		var reclist  = [];
		for (var i = 0; i < modellist.length; i++) {
			var rec = [];
			rec.push(title);
			rec.push(brand);
			rec.push(count);
			rec.push(time);
			rec.push(city);
			rec.push(dealEmpty(dealstr(modellist.eq(i).text())));
			rec.push(result.uri);
			reclist.push(rec.join(','));
		};
		if (reclist.length>0) {
			var recstr = reclist.join('\n') + '\n';
			saveData(recstr, 'tg');			
		};		
	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}
BdaSpider.prototype.processBrandList = function(error, result, $) {
	if(error || !result) {
		logger.error("BrandList Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		var city = result.options.city;
		logger.info("Get city %s Dealer", city);
		eval(result.body+";");//var masterBrands = {A:{'audi':'奥迪'},B:{'bmw':'宝马','peugeot':'标致'}};
		// logger.info("masterBrands len: %d", Object.keys(masterBrands).length);
		var baseurl = result.options.baseurl;
		var ccode = result.options.ccode;
		for (var key in masterBrands) {
			for(var id in masterBrands[key]){
				var url = baseurl +"/"+ id;
				// logger.info(url);
				this.addqueue([url], 'LIST', {city: city, ccode: ccode, baseurl:baseurl, 
					brand:masterBrands[key][id], priority:3});
				// break;	
			}
			// break;
		};
		
	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}

BdaSpider.prototype.processList = function(error, result, $) {
	if(error || !$ || !result) {
		logger.error("List Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		
		var city = result.options.city,
			baseurl = result.options.baseurl,
			brand = result.options.brand,
			ccode = result.options.ccode;
		var carlist = $("a.pic");
		logger.info("Get, %s, %s, %d", city, brand, carlist.length);
		var urls = [];
		for (var i = 0; i < carlist.length; i++) {
			var url = baseurl + carlist.eq(i).attr('href');
			// logger.info("item list :"+url);
			urls.push(url);
			// break;
		};
		this.addqueue(urls, "ITEM", {city: city, ccode: ccode, baseurl:baseurl, brand:brand, priority:2})
	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}

BdaSpider.prototype.processDetail = function(error, result, $) {
	if(error || !result) {
		logger.error("Detail Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		var pcount = dealstr($(".more-msg b").first().text());
		 // logger.info("pcount : " + pcount);
		var jsoncartype = result.body.match(/carsource:JSON.parse\(\'(.+)\'\),/)[1];
		// logger.info(jsoncartype);
		var carsoure = JSON.parse(jsoncartype);
		// logger.info("carlist len: %d, %s",carsoure.length, result.uri);
		var url = result.options.baseurl + "/Ajax/dealerSelector.ashx";
		for (var i = 0; i < carsoure.length; i++) {
			var carsY = carsoure[i].Cars;
			for (var j = 0; j < carsY.length; j++) {
				var cars = carsY[j].Cars;
				for (var k = 0; k < cars.length; k++) {
					var car = cars[k];
					// logger.info(car.CarID);
					var detail = {
						city:result.options.city,
						ccode:result.options.ccode,
						brand:result.options.brand,
						pcount:pcount
					};
					detail.carname = car.CSName + " " + car.CarName;
					detail.CarID = car.CarID;
					this.crawler.queue({uri:url, method: 'POST', detail: detail,
						form:{ccode:detail.ccode, carid:car.CarID}, priority:1,
						callback:function(error, result, $){
							that.processShop(error, result, $);
						}
					});
				};
			};
		};
	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}

BdaSpider.prototype.processShop = function(error, result, $) {
	if(error || !result) {
		logger.error("Shop Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp"+result.options.detail.CarID+".txt", result.body, null);		
		var detail = result.options.detail;
		var dealerlist = JSON.parse(result.body);
		logger.info("Get %s Dealer %d", detail.carname, dealerlist.length);
		var recList = [];
		for (var i = 0; i < dealerlist.length; i++) {
			var dealer = dealerlist[i];
			var rec = [];
			rec.push(dealEmpty(dealstr(dealer.Dealer.DealerShortName)));
			rec.push(dealEmpty(dealstr(dealer.Dealer.DealerFullName)));
			rec.push(dealEmpty(dealstr(dealer.Dealer.DealerSaleAddr)));
			rec.push(dealEmpty(dealstr(dealer.Dealer.DealerSalePhone)));
			rec.push(dealEmpty(dealer.Score));
			rec.push(dealEmpty(dealstr(detail.brand)));
			rec.push(dealEmpty(dealstr(detail.carname)));
			rec.push(dealEmpty(detail.pcount));
			rec.push(dealerlist.length);
			rec.push(dealEmpty(detail.city));
			rec.push(dealEmpty(detail.ccode));
			rec.push(dealEmpty(detail.CarID));			
			rec.push(result.uri);
			recList.push(rec.join(','));
		};
		if(recList.length>0) saveData(recList.join('\n')+'\n', 'dealer');

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
