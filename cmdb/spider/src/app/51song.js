var fs = require("fs")
var util = require("util")
var moment = require("moment")
var crypto = require("crypto")
var Crawler = require("node-webcrawler")

var logger = require("winston")
var env = process.env.NODE_ENV || "development";
logger.cli();
if(env==="development"){
    logger.add(logger.transports.File, {filename:"../../log/51song.log", logstash:true, level:"info"});
    logger.remove(logger.transports.Console);
}

function Song() {
	this.resultDir = "../../result/app/";
	this.resultFile = util.format("51song_%s.txt", moment().format("YYYY-MM-DD"));
	this.crawler = new Crawler({
		maxConnections:5,
		userAgent:"Dalvik/1.6.0 (Linux; U; Android 4.4.4; N5209 Build/KTU84P)",
		jQuery:false
	});
	this.points = [];
	this.token;
	this.todoPoints;
	this.done = {};
	this.endTime = moment().hours(23).minutes(50).seconds(0).valueOf();
}

Song.prototype.init = function() {
	logger.info("Initialization starts");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	fs.readFileSync("../../58daojia.txt").toString().split("\n").forEach(function(line){
		var split = line.split("\t");
		if(split.length != 8 || (split[0] != "Shanghai" && split[0] != "Beijing")) {
			return;
		}
		this.points.push({city:split[0],lat:split[4], lng:split[3]});
	}, this);
	if(fs.existsSync(this.resultDir+this.resultFile)) {
		fs.readFileSync(this.resultDir+this.resultFile).toString().split("\n").forEach(function(line){
			var split = line.split("\t");
			if(split.length != 15) {
				logger.info(line)
				return;
			}
			this.done[split[0]] = true;
		}, this);
	}
	logger.info("Initialization completes");
	logger.info(this.points.length);
	logger.info(util.format("Done deals: %s", Object.keys(this.done).length));
}

Song.prototype.run = function() {
	this.login();
}

Song.prototype.login = function() {
	if(new Date().getTime() >= that.endTime) {
		logger.info("Time up. Job done.");
		return;
	}
	var request = {
		app_id:0,
		mobile:17600833609,
		nonce:Math.floor(Math.random()*100000),
		password:666666,
		timestamp:new Date().getTime()
	};
	request.signature = encrypt(request);
	that.crawler.queue({
		uri:"http://api.51diansong.com/api/v1/couriers/login",
		method:"POST",
		form:request,
		callback:function(error, result) {
			logger.info(result.uri);
			if(error) {
				logger.error("Login failed. Job done.");
				return;
			}
			try {
				var data = JSON.parse(result.body);
			} catch(e) {
				logger.error("Parse login info failed. Job done.");
				return;
			}
			that.token = data.result.token;
			logger.info(that.token);
			that.todoPoints = that.points.slice(0, that.points.length);
			logger.info("to do points: %s", that.todoPoints.length);
			setTimeout(that.doPoint, 0)
		}
	});
}

// Song.prototype.uploadLocation = function() {
// 	var request = {
// 		app_id:0,
// 		nonce:getRandom(500000000, 2000000000),
// 		timestamp:new Date().getTime(),
// 		token:that.token,
// 		user_lat:30.79276972578684,//39.919544,
// 		user_lng:121.18550403486421//116.467271
// 	}
// 	that.crawler.queue({
// 		uri:"http://api.51diansong.com/api/v1/couriers/14771/location?signature="+encrypt(request),
// 		method:"POST",
// 		form:request,
// 		callback:function(error, result) {
// 			logger.info(result.body);
// 			setTimeout(that.doPoint, 0)
// 		}
// 	});
// }

Song.prototype.doPoint = function() {
	var point = that.todoPoints.shift();
	if(!point) {
		logger.info("Job done.");
		setTimeout(that.login, 10*1000);
		return;
	}
	var request = {
		app_id:0,
		nonce:getRandom(500000000, 2000000000),
		timestamp:new Date().getTime(),
		token:that.token,
		user_lat:point.lat,//39.919544,
		user_lng:point.lng//116.467271
	}
	request.signature = encrypt(request);
	that.crawler.queue({
		uri:"http://api.51diansong.com/api/v1/couriers/orders?"+buildRequest(request),
		city:point.city,
		callback:function(error, result) {
			var city = result.options.city;
			try {
				var data = JSON.parse(result.body);
			} catch(e) {
				logger.error(e);
				setTimeout(that.doPoint, 500);
				return;
			}
			if(data.message == "token不正确") {
				logger.error("Login needed.");
				setTimeout(that.login, 10000);
				return;
			}
			var toWrite = [];
			data.result.forEach(function(record){
				if(that.done[record.id]) {
					return;
				} else {
					that.done[record.id] = true;
				}
				toWrite.push([
						record.id,record.store_id,record.store_name.replace(/\s/g, ""),record.store_address.replace(/\s/g, ""),
						record.amount,record.is_pay,record.recipient_address.replace(/\s/g, ""),record.distance,
						record.delivery_distance,record.publish_at,moment().format("YYYY-MM-DD HH:mm:ss"),record.delivery_freight,
						record.gratuity_freight,record.subsidy_freight,city
					].join("\t"));
			})
			if(toWrite.length) {
				fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join("\n")+"\n");
			}
			logger.info("Got %s records.", toWrite.length);
			setTimeout(that.doPoint, 0);
		}
	});
}

Song.prototype.start = function() {
	this.init();
	this.run();
}

function buildRequest(request) {
	var result = [];
	Object.keys(request).forEach(function(key){
		result.push(key+"="+encodeURIComponent(request[key]));
	});
	return result.join("&");
}

function encrypt(request) {
	var array = [];
	Object.keys(request).forEach(function(key){
		array.push(key+"="+request[key]);
	});
	array.sort();
	var message = array.join("&");
	logger.info(message);
	var hmac = crypto.createHmac("sha1", "psmtoiyrpyqofhfo8atdofdby4eqc02p");
	hmac.update(message);
	return hmac.digest("hex");
}

function getRandom(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

var that = new Song();
that.start();