var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")

var logger = require("winston")
var env = process.env.NODE_ENV || "development";

var godotTransport = require("winston-godot")
var godot = require("godot")
var godotServer = require("../../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"yichetemai"});//service名称需要更改
logger.cli();
logger.add(logger.transports.File, {filename:"../../../log/yichetemai.log", logstash:true, level:"info",handleException:true});
if(env==="production"){
    logger.remove(logger.transports.Console);
}

function Car() {
	this.resultDir = "../../../result/auto/";
	this.resultFile = "yichetemai_" + moment().format("YYYY-MM-DD") + ".csv";
	this.crawler = new Crawler({
		maxConnections:10,
		userAgent:"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:35.0) Gecko/20100101 Firefox/35.0",
		onDrain:function(){
			--that.drainTimes;
			if(!that.drainTimes) {
				logger.info("Job done.");
				logger.remove(godotTransport);
				client.close();
			}
		}
	});
	this.queuedPids = 0;
	this.citylist = [];
	this.drainTimes = 2;
}

Car.prototype.init = function() {
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}

	fs.writeFile(that.resultDir+that.resultFile, "\ufeff省份,城市,品牌,车型,指导价,特卖价,经销商\n",function(e){if(e) logger.error(e);});
}

Car.prototype.run = function() {
	this.crawler.queue({
		uri:"http://temai.yiche.com/goodslist/",
		callback:function(error, result, $) {
			if(error || !$) {
			    logger.error("[ERROR] Error getting city info.\n[ERROR] Job done with error.");
				return;
			}
			$("#plistblock dd a").each(function(){
				if($(this).text().trim() == "海外") {
					return;
				}
				++that.queuedPids;
				that.crawler.queue({
					uri:util.format("http://temai.yiche.com/ajax/ajaxgetcity.ashx?pid=%s&r=%d", $(this).attr("pid"), Math.random()),
					province:$(this).text().trim(),
					jQuery:false,
					callback:function(error, result) {
						--that.queuedPids;
						if(error) {
							logger.error(error);
						} else {
							try {
								var province = result.options.province;
								var data = JSON.parse(result.body);
								data.forEach(function(city){
									that.citylist.push({
										url:"http://temai.yiche.com/goodslist/"+city.CityUrl,
										city:city.CityName,
										province:province
									});
								});
							} catch(e) {
								logger.error(e);
							}
						}
						if(that.queuedPids == 0) {
							logger.info("Total city: %s", that.citylist.length);
							setTimeout(that.doCity, 0);
						}
					}
				});
			});
		}
	});
}

Car.prototype.doCity = function() {
	that.citylist.forEach(function(city){
		that.crawler.queue({
			uri:city.url,
			city:city,
			priority:9,
			callback:function(error, result, $) {
				if(error) {
					logger.error(error);
					return;
				}
				var city = result.options.city;
				if(!$) {
					logger.error("%s cheerio load failed.", city.city);
					return;
				}
				var count = 0;
				$(".carpic_list_card li").each(function() {
					++count;
					that.crawler.queue({
						uri:$(this).children("a.pic").attr("href"),
						city:city,
						callback:that.processDetail
					});
				});
				logger.info("%s %d cars found.", city.city, count);
			}
		});
	});
}

Car.prototype.processDetail = function(error, result, $) {
	if(error) {
		logger.error(error);
		return;
	}
	if(!$) {
		logger.error("%s cheerio load failed.", result.uri);
		return;
	}
	var city = result.options.city;
	var carmodel = $("#h_csname").text().trim();
	var toWrite = [];
	$(".tm-4s").each(function(dealer) {
		var dealerName = $(this).find(".p-tit").text().trim();
		var styles = $(this).find("tr");
		for(var i = 1; i < styles.length; i++) {
			var dealerCarInfo = styles.eq(i).find("td");
			// province, city, car model, car style, instruction price, sale price, dealer
			toWrite.push([
					city.province,city.city,carmodel,dealerCarInfo.eq(0).text().trim(),
					dealerCarInfo.eq(2).text().trim(),dealerCarInfo.eq(4).text().trim(),
					dealerName
				].join(",")+"\n");
		}
	});
	fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join(""));
	logger.info("%s %s %s %s cars found.", city.province, city.city, carmodel || "某车型", toWrite.length);
}

Car.prototype.start = function() {
	this.init();
	this.run();
}

var that = new Car();
that.start();
