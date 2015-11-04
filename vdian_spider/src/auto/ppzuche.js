var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")

if(!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) { 
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

Date.prototype.toString = function() {
    var year = this.getFullYear();
    var month = this.getMonth() + 1;
    var day = this.getDate();
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    return year + "-" + month + "-" + day;
}

Date.prototype.addDays = function(daysToAdd) {
    var day = this.getDate();
    this.setDate(day + daysToAdd);
    return this;
}

function CarRental() {
	var daysToAdd = parseInt(process.argv.splice(2)[0]);
	this.resultDir = "../../result/auto/";
	this.resultFile = "ppzuche_" + moment().format("YYYY-MM-DD") + ".txt";
	this.start_date = moment().add(daysToAdd, "days").format("YYYY-MM-DD");
	this.end_date = moment().add(daysToAdd+1, "days").format("YYYY-MM-DD");
	this.crawler = new Crawler({
		maxConnections:20,
		userAgent:"Mozilla/4.0"
	});
	this.cityList = ["http://bj.ppzuche.com/"];
	this.pageUrls = [];
	this.cars = [];
	this.listLock = 0;
	this.pageLock = 20;
	this.carLock = 20;
}

CarRental.prototype.init = function() {
	console.log("[INFO] initialization starts.");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	fs.appendFileSync(this.resultDir+this.resultFile, [
			"CarId","City","CarBrand","CarModel","CarPurchaseYear","CarNum",
			"Address","PricePerDay","PricePerHour","PricePerWeek",
			"Transmission","CarDelivery","Audio","CarAge",
			"GPS","EngineDisplacement","MileAge","Seats",
			"AcceptRate","DealCount","ResponseTime","FirstCommentDate"
		].join("\t")+"\n");
	console.log("[INFO] initialization completes.");
}

CarRental.prototype.run = function() {
	this.crawler.queue({
		uri:"http://bj.ppzuche.com/",
		jQuery:false,
		self:this,
		callback:function(error, result) {
			var self = result.options.self;
			if(error) {
				console.log("[ERROR] Error getting city info.\n[ERROR] Job done with error.");
				return;
			}
			var regexp = /<span class="city_item" data-code="(\w+)">/g;
			var match;
			while(match = regexp.exec(result.body)) {
				self.cityList.push("http://" + match[1] + ".ppzuche.com/");
			}
			if(self.cityList.length == 0) {
				console.log("[ERROR] No city found.\n[ERROR] Job done with error.");
				return;
			}
			console.log(self.cityList);
			for(var i = 0; i < self.cityList.length; i++) {
				++self.listLock;
				var city = self.cityList[i].match(/http:\/\/(\w+)\.ppzuche\.com\//)[1];
				self.crawler.queue({
					uri:self.cityList[i] + util.format("ajax-find-car?date_start=%s&begin=10%3A00&date_end=%s&end=10%3A00&start_price=0&end_price=9999&keyword=&lng=&lat=&make=&module=&cap=0&gps=0&audio_input=0&seats=0&transmission=&class=&sort=all&car_id=0&page=%s&datatype=list&location_type=&location=&zip=&all_wheel_drive=0&convertible=0&carclass=0&has_filter=false", that.start_date, that.end_date, 1),
					jQuery:false,
					headers:{Cookie:"icc_user_city="+city},
					cityUrl:self.cityList[i],
					self:self,
					callback:function(error, result) {
						var self = result.options.self;
						var cityUrl = result.options.cityUrl;
						--self.listLock;
						if(error) {
							console.log("[ERROR] Error getting car list for ", result.uri);
							if(self.listLock == 0) {
								setTimeout(self.doPage, 0);
							}
							return;
						}
						var match = result.body.match(/"pager":\{"total":(\d+),"page":".*?","pagesize":(\d+)\}/);
						if(!match) {
							console.log("[ERROR] Error getting page count for ", result.uri);
							if(self.listLock == 0) {
								setTimeout(self.doPage, 0);
							}
							return;	
						}
						var pagesize = match[2];
						var total = match[1];
						var pagecount = Math.ceil(total/pagesize);
						console.log("[INFO] {0} page count: {1}".format(cityUrl, pagecount));
						for(var i = 1; i <= pagecount; i++) {
							self.pageUrls.push(cityUrl+util.format("ajax-find-car?date_start=%s&begin=10%3A00&date_end=%s&end=10%3A00&start_price=0&end_price=9999&keyword=&lng=&lat=&make=&module=&cap=0&gps=0&audio_input=0&seats=0&transmission=&class=&sort=all&car_id=0&page=%s&datatype=list&location_type=&location=&zip=&all_wheel_drive=0&convertible=0&carclass=0&has_filter=false", that.start_date, that.end_date, i));
						}
						if(self.listLock == 0) {
							console.log("[INFO] total page tasks: ", self.pageUrls.length);
							setTimeout(function(){
								for(var i = 0; i < 20; i++) {
									self.doPage();
								}
							}, 0);
						}
					}
				});
			}
		}
	});
}

CarRental.prototype.doPage = function() {
	var pageUrl = that.pageUrls.pop();
	if(!pageUrl) {
		--that.pageLock;
		if(that.pageLock == 0) {
			console.log("[INFO] Get car url done.\n[INFO] Proceed to process car detail.");
			setTimeout(function(){
				for(var i = 0; i < 20; i++) {
					that.doCar();
				}
			}, 0);
		}
		return;
	}
	var city = pageUrl.match(/http:\/\/(\w+)\.ppzuche\.com\//)[1];
	that.crawler.queue({
		uri:pageUrl,
		jQuery:false,
		headers:{Cookie:"icc_user_city="+city},
		callback:function(error, result) {
			var match = result.uri.match(/http:\/\/(\w+)\.ppzuche\.com\//);
			var domain = match[0];
			var city = match[1];
			if(error) {
				console.log("[ERROR] Error getting car list: ", result.uri);
				setTimeout(that.doPage, 0);
				return;
			}
			var data;
			try {
				data = JSON.parse(result.body).data.cars.list;
				if(!data) {
					throw "empty data";
				}
			} catch(e) {
				console.log("[ERROR] Error parsing car list: ", result.uri);
				setTimeout(that.doPage, 0);
				return;
			}
			for(var i = 0; i < data.length; i++) {
				var o = data[i];
				var car = {};
				car.domain = domain;
				car.city = city;
				car.id = o.id;
				car.brand = o.make;
				car.model = o.module;
				car.year = o.year;
				car.price_daily = o.price_daily;
				car.price_hourly = o.price_hourly;
				car.price_weekly = o.price_weekly;
				car.confirmed_rate = o.confirmed_rate;
				that.cars.push(car);
			}
			setTimeout(that.doPage, 0);
			console.log("[INFO] page task left: ", that.pageUrls.length);
		}
	});
}

CarRental.prototype.doCar = function() {
	var car = that.cars.pop();
	if(!car) {
		--that.carLock;
		if(that.carLock == 0) {
			console.log("[INFO] Job done.");
		}
		return;
	}
	that.crawler.queue({
		uri:car.domain + car.id + "?carID={0}&date_start={1}&date_end={2}&begin=10%3A00&end=10%3A00".format(car.id, that.start_date, that.end_date),
		jQuery:false,
		car:car,
		callback:function(error, result) {
			var car = result.options.car;
			if(error) {
				console.log("[ERROR] Error getting car info: {0} {1}".format(car.domain, car.id));
				setTimeout(that.doCar, 0);
				return;
			}
			var dealCountMatch = result.body.match(/<span class="d">(\d+)单<\/span>/);
			var responseTimeMatch = result.body.match(/<span class="d">(\d+)分钟<\/span>/);
			var addressMatch = result.body.match(/<div class="map-address" title="(.*?)">/);
			var carNumMatch = result.body.match(/<span class="carid">\((.*)\)<\/span>/);
			var regexp = /<li class="conf-item" title='(.*?)'>/g;
			var carConfigMatch;
			var carConfig = [];
			while(carConfigMatch = regexp.exec(result.body)) {
				carConfig.push(carConfigMatch[1]);
			}
			if(!dealCountMatch || !responseTimeMatch || !addressMatch || !carNumMatch || carConfig.length != 8) {
				console.log("[ERROR] Error parsing car info: {0} {1}".format(car.domain, car.id));
				setTimeout(that.doCar, 0);
				return;
			}
			car.dealCount = dealCountMatch[1];
			car.responseTime = responseTimeMatch[1];
			car.address = addressMatch[1];
			car.carNum = carNumMatch[1];
			car.transmission = carConfig[0];
			car.delivery = carConfig[1];
			car.audio = carConfig[2];
			car.carAge = carConfig[3];
			car.gps = carConfig[4];
			car.engine = carConfig[5];
			car.mileAge = carConfig[6];
			car.seats = carConfig[7];
			var commentMatch = result.body.match(/"reviews":(.*)\}/);
			if(!commentMatch) {
				car.firstCommentDate = "暂无评论";
			} else {
				var comment = JSON.parse(commentMatch[1]);
				if(!comment || comment.length == 0 ) {
					car.firstCommentDate = "暂无评论";
				} else {
					car.firstCommentDate = comment[comment.length-1].date_created;
				}
			}
			fs.appendFileSync(that.resultDir+that.resultFile, CarRental.prototype.buildResult(car));
			setTimeout(that.doCar, 0);
			console.log("[INFO] car task left: ", that.cars.length);
		}
	});
}

CarRental.prototype.buildResult = function(car) {
	var list = [];
	list.push(car.id);
	list.push(car.city);
	list.push(car.brand);
	list.push(car.model);
	list.push(car.year);
	list.push(car.carNum);
	list.push(car.address);
	list.push(car.price_daily);
	list.push(car.price_hourly);
	list.push(car.price_weekly);
	list.push(car.transmission);
	list.push(car.delivery);
	list.push(car.audio);
	list.push(car.carAge);
	list.push(car.gps);
	list.push(car.engine);
	list.push(car.mileAge);
	list.push(car.seats);
	list.push(car.confirmed_rate);
	list.push(car.dealCount);
	list.push(car.responseTime);
	list.push(car.firstCommentDate);
	return list.join("\t") + "\n";
}

CarRental.prototype.start = function() {
	this.init();
	this.run();
}

var that = new CarRental();
that.start();
