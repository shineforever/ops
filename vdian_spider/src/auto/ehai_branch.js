var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")

var logger = require("winston")
var env = process.env.NODE_ENV || "development";
logger.cli();
if(env==="production"){
    logger.add(logger.transports.File, {filename:"../../log/ehai_branch.log", logstash:true, level:"info"});
    logger.remove(logger.transports.Console);
}

function toUnicode(theString) {
  var unicodeString = '';
  for (var i=0; i < theString.length; i++) {
    var theUnicode = theString.charCodeAt(i).toString(16).toUpperCase();
    while (theUnicode.length < 4) {
      theUnicode = '0' + theUnicode;
    }
    theUnicode = '\\u' + theUnicode;
    unicodeString += theUnicode;
  }
  return unicodeString;
}

function buildRecord(branches) {
	var toWrite = [];
	branches.forEach(function(branch){
		toWrite.push([
			branch.city,
			branch.district,
			branch.branchId,
			branch.branchName,
			branch.address || "N/A",
			branch.phone || "N/A",
			branch.locationType,
			branch.is24,
			branch.isAirport,
			branch.isStation
		].join(","))
	});
	return toWrite.join("\n")+"\n";
}

function Ehai() {
	this.resultDir = "../../result/auto/";
	this.resultFile = util.format("ehai_branch_%s.txt", moment().format("YYYY-MM-DD"));
	this.crawler = new Crawler({
		maxConnections:1,
		userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.101 Safari/537.36",
		forceUTF8:true,
		rateLimits:1000
	});
	this.cityList = [];
}

Ehai.prototype.init = function() {
	logger.info("Initialization starts");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	if(!fs.existsSync(this.resultDir+this.resultFile)) {
		fs.appendFileSync(this.resultDir+this.resultFile, "\ufeff");
	}
	logger.info("Initialization completes");
}

Ehai.prototype.getCityList = function() {
	this.crawler.queue({
		uri:"http://www.1hai.cn/storeguide.aspx?from=nav",
		callback:function(error, result, $) {
			if(error || !$) {
				logger.error("Error getting city list. Job done.");
				return;
			}
			var li = $(".tabHF-content.list-city li");
			for(var i = 1; i < li.length; i++) {
				li.eq(i).find("span").each(function(){
					that.cityList.push($(this).attr("rel"));
				});
			}
			logger.info("Total city: %s", that.cityList.length);
			that.cityList.forEach(function(city){
				that.crawler.queue({
					uri:util.format("http://www.1hai.cn/storeguide.aspx?city=%s", toUnicode(city).replace(/\\/g, "%")),
					method:"POST",
					headers:{Referer:"http://www.1hai.cn/storeguide.aspx?from=nav"},
					jQuery:false,
					prority:5,
					city:city,
					callback:function(error, result) {
						var city = result.options.city;
						if(error) {
							logger.error(error);
							return;
						}
						try {
							var data = JSON.parse(result.body);
							data.districts.forEach(function(district){
								if(district == "机场/车站") {
									return;
								}
								that.crawler.queue({
									uri:util.format("http://www.1hai.cn/storeguide.aspx?dist=%s&city=%s", toUnicode(district).replace(/\\/g, "%"), toUnicode(city).replace(/\\/g, "%")),
									method:"POST",
									headers:{Referer:"http://www.1hai.cn/storeguide.aspx?from=nav"},
									jQuery:false,
									prority:0,
									city:city,
									district:district,
									callback:that.processBranch
								});
							});
							logger.info("%s districts got.", city);
						} catch(e) {
							logger.error("%s parse district error.", city);
						}
					}
				});
			});
		}
	});
}

Ehai.prototype.processBranch = function(error, result) {
	var city = result.options.city;
	var district = result.options.district;
	if(error) {
		logger.error("%s-%s error getting branches.", city, district);
		return;
	}
	try {
		var data = JSON.parse(result.body);
		var branches = [];
		data.stores.forEach(function(store){
			var locationType = "N/A";
			switch(store.LocationType) {
				case 1:
					locationType = "店";break;
				case 2:
					locationType = "送车点";break;
				default:
					break;
			}
			var isAirport, isStation;
			switch(store.DisplayType) {
				case 0:
					isAirport = "否";isStation = "否";break;
				case 1:
					isAirport = "是";isStation = "否";break;
				case 3:
					isAirport = "否";isStation = "是";break;
				default:
					isAirport = "N/A";isStation = "N/A";break;
			}
			branches.push({
				city:city,
				district:district,
				branchId:store.Id,
				branchName:store.StoreName.replace(/,/g, ";"),
				phone:store.Phone,
				address:store.Address.replace(/,/g, ";"),
				locationType:locationType,
				is24:store.IsAllDay ? "是" : "否",
				isAirport:isAirport,
				isStation:isStation
			});
		});
		fs.appendFileSync(that.resultDir+that.resultFile, buildRecord(branches));
		logger.info("%s-%s got %s branches.", city, district, data.stores.length);
	} catch(e) {
		logger.error("%s-%s error parsing branches.", city, district);
		console.log(result.body);
	}
}

Ehai.prototype.run = function() {
	this.getCityList();
}

Ehai.prototype.start = function() {
	this.init();
	this.run();
}

var that = new Ehai();
that.start();
