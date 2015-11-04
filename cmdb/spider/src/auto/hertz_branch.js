var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")

var logger = require("winston")
var env = process.env.NODE_ENV || "development";
logger.cli();
if(env==="production"){
    logger.add(logger.transports.File, {filename:"../../log/hertz_branch.log", logstash:true, level:"info"});
    logger.remove(logger.transports.Console);
}

function buildRecord(branches) {
	var toWrite = [];
	branches.forEach(function(branch){
		toWrite.push([
			branch.province,
			branch.city,
			branch.district,
			branch.branchId,
			branch.branchName,
			branch.address || "N/A",
			branch.phone || "N/A",
			branch.isJmd,
			branch.is24
		].join(","))
	});
	return toWrite.join("\n")+"\n";
}

function Hertz() {
	this.resultDir = "../../result/auto/";
	this.resultFile = util.format("hertz_branch_%s.txt", moment().format("YYYY-MM-DD"));
	this.crawler = new Crawler({
		maxConnections:1,
		userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.101 Safari/537.36",
		jar:true
	});
	this.cityList = [];
}

Hertz.prototype.init = function() {
	logger.info("Initialization starts");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	if(!fs.existsSync(this.resultDir+this.resultFile)) {
		fs.appendFileSync(this.resultDir+this.resultFile, "\ufeff");
	}
	logger.info("Initialization completes");
}

Hertz.prototype.getCityList = function() {
	that.crawler.queue({
		uri:"http://service.zuche.com/city/getCountryDepJson.do",
		jQuery:false,
		callback:function(error, result) {
			if(error) {
				logger.error("Error getting city list. Job done.");
				return;
			}
			var cityInfo = JSON.parse(result.body);
			cityInfo.countryDeps.forEach(function(provinceInfo){
				var province = provinceInfo.provincename;
				provinceInfo.cityDeps.forEach(function(cityInfo){
					that.cityList.push({
						enName:cityInfo.cityenname.toLowerCase(),
						cnName:cityInfo.cityname,
						province:province,
					});
				});
			});
			cityInfo.municipalityDeps.forEach(function(municipality){
				var city = {
					enName:municipality.cityenname.toLowerCase(),
					cnName:municipality.cityname,
					province:municipality.cityname
				};
				that.cityList.push(city);
			});
			logger.info("Total city: %s", that.cityList.length);
			setTimeout(that.doCity, 0);
		}
	});
}

Hertz.prototype.doCity = function() {
	var city = that.cityList.shift();
	if(!city) {
		logger.info("Job done.");
		return;
	}
	that.crawler.queue({
		uri:util.format("http://%s.zuche.com/", city.enName),
		city:city,
		callback:function(error, result, $) {
			try {
				var city = result.options.city;
			} catch(e) {
				logger.error("Error");
				setTimeout(that.doCity, 0);
				return;
			}
			if(error || !$) {
				logger.error("%s %s get branch error.", city.province, city.cnName);
				setTimeout(that.doCity, 0);
				return;
			}
			var branches = [];
			$("ul.depUlClass li").each(function(){
				if($(this).find("dt").text() == "机场/火车站") {
					return;
				}
				var district = $(this).find("dt").text();
				var dd = $(this).find("dd");
				for(var i = 0; i < dd.length; i++) {
					var branchId = dd.eq(i).find("a").attr("href").match(/\d+/)[0];
					var branchName = dd.eq(i).find("a").text();
					var isJmd = dd.eq(i).find("img").length > 0 ? "是" : "否";
					var is24 = dd.eq(i).find("font").length > 0 ? "是" : "否";
					branches.push({
						province:city.province,
						city:city.cnName,
						district:district,
						branchId:branchId,
						branchName:branchName,
						isJmd:isJmd,
						is24:is24
					});
				}
			});
			logger.info("%s %s got %s branches, proceed to getting address and phone.", city.province, city.cnName, branches.length);
			setTimeout(function(){that.getBranchDetail(city, branches)}, 0);
		}
	});
}

Hertz.prototype.getBranchDetail = function(city, branches) {
	that.crawler.queue({
		uri:util.format("http://%s.zuche.com/city/getDepJson.do", city.enName),
		city:city,
		branches:branches,
		method:"POST",
		jQuery:false,
		callback:function(error, result) {
			var city = result.options.city;
			var branches = result.options.branches;
			if(error) {
				logger.error("%s %s error getting address and phone.", city.province, city.cnName);
				fs.appendFileSync(that.resultDir+that.resultFile, buildRecord(branches));
				setTimeout(that.doCity, 0);
				return;
			}
			try {
				var branchDetail = JSON.parse(result.body);
			} catch(e) {
				logger.error("%s %s error parsing address and phone.", city.province, city.cnName);
				fs.appendFileSync(that.resultDir+that.resultFile, buildRecord(branches));
				setTimeout(that.doCity, 0);
				return;
			}
			var branchMap = {};
			branchDetail.forEach(function(branch){
				branchMap[branch.xid] = {
					address:branch.address.replace(/,/g, ";"),
					phone:"400-616-6666"
				};
			});
			for(var i = 0; i < branches.length; i++) {
				branches[i].address = branchMap[branches[i].branchId].address;
				branches[i].phone = branchMap[branches[i].branchId].phone;
			}
			fs.appendFileSync(that.resultDir+that.resultFile, buildRecord(branches));
			logger.info("%s %s got %s branches.", city.province, city.cnName, branches.length);
			setTimeout(that.doCity, 0);
		}
	});
}

Hertz.prototype.run = function() {
	this.getCityList();
}

Hertz.prototype.start = function() {
	this.init();
	this.run();
}

var that = new Hertz();
that.start();