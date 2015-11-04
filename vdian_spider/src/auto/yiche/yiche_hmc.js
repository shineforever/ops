var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")

var logger = require("winston")
var env = process.env.NODE_ENV || "development";
logger.cli();
if(env==="production"){
    logger.add(logger.transports.File, {filename:"../../../log/yiche_hmc.log", logstash:true, level:"info"});
    logger.remove(logger.transports.Console);
}

function buildRecord(carSeries) {
	var toWrite = [];
	carSeries.buyingNo = carSeries.buyingNo || "N/A";
	carSeries.avgSaving = carSeries.avgSaving || "N/A";
	carSeries.queryTime = carSeries.queryTime || "N/A";
	carSeries.sellerNo = carSeries.sellerNo || "N/A";
	carSeries.styles.forEach(function(style){
		toWrite.push([
			carSeries.city,carSeries.brand,carSeries.series,style.year,style.carname,
			style.engine,style.transmission,style.guidingPrice,carSeries.buyingNo,
			carSeries.avgSaving,carSeries.queryTime,carSeries.sellerNo,carSeries.deposit
		]);
	});
	return toWrite.join("\n")+"\n";
}

function Hmc() {
	this.resultDir = "../../../result/auto/";
	this.resultFile = util.format("yiche_hmc_%s.txt", moment().format("YYYY-MM-DD"));
	this.crawler = new Crawler({
		maxConnections:1,
		userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.101 Safari/537.36"
	});
	this.cityList = [];
}

Hmc.prototype.init = function() {
	logger.info("Initialization starts");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	if(!fs.existsSync(this.resultDir+this.resultFile)) {
		fs.appendFileSync(this.resultDir+this.resultFile, "\ufeff");
	}
	logger.info("Initialization completes");
}

Hmc.prototype.getCityList = function() {
	that.crawler.queue({
		uri:util.format("http://img.huimaiche.com/web/js/citylist.js?_=%s", new Date().getTime()),
		jQuery:false,
		callback:function(error, result) {
			if(error) {
				logger.error("Error getting city list. Job done.");
				return;
			}
			try {
				eval(result.body);
				cityList.forEach(function(city){
					that.cityList.push({
						name:city.n,
						host:city.d
					});
				});
			} catch(e) {
				logger.error("Error parsing city list. Job done.");
				return;
			}
			console.log(that.cityList);
			that.cityList = that.cityList.slice(1, that.cityList.length);
			that.cityList.forEach(function(city){
				that.queueCity(city);
			});
		}
	});
}

Hmc.prototype.queueCity = function(city) {
	that.crawler.queue({
		uri:util.format("http://%s/select", city.host),
		city:city,
		jQuery:false,
		callback:function(error, result) {
			var city = result.options.city;
			if(error) {
				logger.error("%s get brand error.", city.name);
				return;
			}
			var brandReg = /<a href="([^"]*)">\s+(.*?)<\/a>/g;
			var match;
			var brandRequests = [];
			while(match = brandReg.exec(result.body)) {
				brandRequests.push({
					uri:util.format("http://%s%s", city.host, match[1]),
					priority:3,
					city:city,
					brand:match[2],
					callback:that.processBrandListPage
				});
			}
			logger.info("%s got %s brands.", city.name, brandRequests.length);
			that.crawler.queue(brandRequests);
		}
	});
}

Hmc.prototype.processBrandListPage = function(error, result, $) {
	var city = result.options.city;
	var brand = result.options.brand;
	if(error || !$) {
		logger.error("%s-%s process brand error.");
		return;
	}
	var carRequests = [];
	$("#serialDiv li").each(function(){
		var href = $(this).find("a").attr("href");
		var carSeries = $(this).find("p.car-type").text().trim().replace(/,/g, ";");
		carRequests.push({
			uri:util.format("http://%s%s", city.host, href),
			priority:1,
			city:city,
			brand:brand,
			series:carSeries,
			callback:that.processCarDetail
		});
	});
	logger.info("%s-%s got %s series.", city.name, brand, carRequests.length);
	that.crawler.queue(carRequests);
}

Hmc.prototype.processCarDetail = function(error, result, $) {
	logger.info(result.uri);
	var city = result.options.city;
	var brand = result.options.brand;
	var series = result.options.series;
	if(error || !$) {
		logger.error("%s %s-%s get sku error.", city.name, brand, series);
		return;
	}
	var carsourceMatch = result.body.match(/carsource:JSON\.parse\('(.+)'\)/);
	if(!carsourceMatch) {
		logger.error("%s %s-%s no match for car source.", city.name, brand, series);
		return;
	}
	var carSeries = {
		city:city.name,
		brand:brand,
		series:series,
		styles:[]
	}
	var carsource = JSON.parse(carsourceMatch[1]);
	carsource.forEach(function(carYearInfo){
		var year = carYearInfo.CarYear;
		carYearInfo.Cars.forEach(function(car){
			var engine = util.format("%sL/%skW %s", car.Exhaust, car.EngineMaxPower, car.EngineAddPressType);
			car.Cars.forEach(function(c){
				var style = {
					year:year,
					engine:engine,
					carname:c.CarName.trim(),
					transmission:c.CarTransmissionType,
					guidingPrice:c.SalePrice
				}
				carSeries.styles.push(style);
			});
		});
	});
	$(".more-msg td").each(function(){
		var info = $(this).text().replace(/\s/g, "");
		if(info.indexOf("正在购买") != -1) {
			carSeries.buyingNo = info.replace(/正在购买/, "");
		} else if(info.indexOf("平均节省") !=-1) {
			carSeries.avgSaving = info.replace(/平均节省/, "");
		} else if(info.indexOf("获得底价") != -1) {
			carSeries.queryTime = info.replace(/获得底价/, "");
		} else if(info.indexOf("认证4S店") != -1) {
			carSeries.sellerNo = info.replace(/认证4S店/, "");
		}
	});
	carSeries.deposit = $("#payment").text().trim();
	if(carSeries.styles.length > 0) {
		fs.appendFileSync(that.resultDir+that.resultFile, buildRecord(carSeries));
	}
	logger.info("%s %s-%s got %s cars.", city.name, brand, series, carSeries.styles.length);
}

Hmc.prototype.run = function() {
	this.getCityList();
}

Hmc.prototype.start = function() {
	this.init();
	this.run();
}

var that = new Hmc();
that.start();
