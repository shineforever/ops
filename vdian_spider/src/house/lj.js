var fs = require("fs")
var util = require("util")
var godotTransport = require("winston-godot")
var godot = require("godot")
var moment = require("moment")
var Crawler = require("node-webcrawler")

var logger = require("winston")
var env = process.env.NODE_ENV || "development";
logger.cli();
if(env==="production"){
    logger.add(logger.transports.File, {filename:"../../log/lianjia.log", logstash:true, level:"info"});
    logger.remove(logger.transports.Console);
}

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"lianjia"});

function Lianjia() {
	this.resultDir = "../../result/";
	this.resultFile = "lianjia_ershou_" + moment().format("YYYY-MM-DD") + ".csv";
	this.crawler = new Crawler({
		maxConnections:10,
		userAgent:"Mozilla/5.0",
		jQuery:false,
		onDrain:function() {
			logger.info("Job done.");
		},
		callback:function(error, result) {
			var detail = result.options.detail;
			if(error) {
				logger.error("Error opening %s", result.uri);
				return;
			}
			var communityMatch = result.body.match(/<a class="zone-name laisuzhou" href=".*?">(.*?)<\/a>/);
			if(!communityMatch) {
				communityMatch = result.body.match(/<dt>小区：<\/dt><dd>(.*?)<span/);
			}
			var structureMatch = result.body.match(/<dt>户型：<\/dt><dd>(.*?)<\/dd>/);
			var areaMatch = result.body.match(/<i>\/ (.*?)<\/i>/);
			var orientationMatch = result.body.match(/<dt>朝向：<\/dt><dd>(.*?)<\/dd>/);
			var priceMatch = result.body.match(/<strong class="ft-num">(.*?)<\/strong>/);
			var downpaymentMatch = result.body.match(/<dt>首付：<\/dt><dd class="short">(.*?)<\/dd>/);
			var monthlypaymentMatch = result.body.match(/<dt>月供：<\/dt><dd class="short">(.*?)<\/dd>/);
			var dealcountMatch = result.body.match(/小区成交记录<\/span><span class="num">(.*?)<\/span>/);
			var commentcountMatch = result.body.match(/经纪人房评<\/span><span class="num">(.*?)<\/span>/);
			var checkcountMatch = result.body.match(/客户看房数<\/span><span class="num">(.*?)<\/span>/);
			var pathMatch = result.body.match(/<div class="fl l-txt">(.*?)<\/div>/);
			if(!commentcountMatch || !structureMatch || !areaMatch || !orientationMatch || !priceMatch ||
				!downpaymentMatch || !monthlypaymentMatch || !commentcountMatch ||
				!checkcountMatch || !pathMatch) {
				logger.error("Error parsing ", result.uri);
				return;
			}
			detail.community = communityMatch[1] || "";
			detail.structure = structureMatch[1] || "";
			detail.area = areaMatch[1].replace(/[\s,]/g,'');
			detail.orientation = orientationMatch[1] || "";
			detail.price = priceMatch[1];
			detail.downpayment = downpaymentMatch[1];
			detail.monthlypayment = monthlypaymentMatch[1];
			detail.dealcount = dealcountMatch ? dealcountMatch[1] : "N/A";
			detail.commentcount = commentcountMatch[1];
			detail.checkcount = checkcountMatch[1];
			detail.path = Lianjia.prototype.getPath(pathMatch[1]);
			fs.appendFileSync(that.resultDir+that.resultFile, Lianjia.prototype.buildRecord(detail));
			logger.info("Got %s", detail.no);
		}
	});
	this.cityList = [
		"http://bj.lianjia.com/ershoufang",
		"http://sh.lianjia.com/ershoufang",
		"http://cd.lianjia.com/ershoufang",
		"http://nj.lianjia.com/ershoufang",
		"http://hz.lianjia.com/ershoufang",
		"http://tj.lianjia.com/ershoufang",
		"http://su.lianjia.com/ershoufang",
		"http://dl.lianjia.com/ershoufang",
		"http://qd.lianjia.com/ershoufang",
		"http://xm.lianjia.com/ershoufang",
		"http://wh.lianjia.com/ershoufang",
		"http://sz.lianjia.com/ershoufang"//,
		// "http://cq.lianjia.com/ershoufang",
		// "http://cs.lianjia.com/ershoufang",
		// "http://xa.lianjia.com/ershoufang"
	]
}

Lianjia.prototype.init = function() {
	logger.info("Initialization starts");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	fs.writeFile(this.resultDir+this.resultFile,"\ufeff房源编号,URL,房源标题,图片数,小区,户型,面积,朝向,价格,首付,月付,小区成交量,经纪人房评,客户看房数,区域\n",function(e){if(e) logger.error(e);});
	var arguments = process.argv.splice(2);
	var start = arguments[0]-1 || 0;
	var end = arguments[1] || this.cityList.length;
	this.cityList = this.cityList.slice(start, end);
	//logger.info(this.cityList);
	logger.info("Initialization completes");
}

Lianjia.prototype.run = function() {
	this.cityList.forEach(function(city){
		this.crawler.queue({
			uri:city,
			priority:5,
			callback:function(error, result) {
				if(error) {
					logger.error("Error opening %s", result.uri);
					return;
				}
				var match = result.body.match(/"totalPage":(\d+)/);
				if(!match) {
					logger.error("No page count found for %s", result.uri);
					return;
				}
				var pageCount = parseInt(match[1]);
				logger.info("%s total page: %s", result.uri, pageCount);
				for(var page = 1; page <= pageCount; page++) {
					that.crawler.queue({
						uri:result.uri+util.format("/pg%s/", page),
						jQuery:true,
						priority:3,
						callback:function(error, result, $) {
							if(error || !$) {
								logger.error("Error opening %s", result.uri);
								return;
							}
							var list;
							try {
								list = $("#house-lst li");
							} catch(e) {
								logger.error("Error parsing %s", result.uri);
								return;
							}
							logger.info("Got %d records in %s", list.length, result.uri);
							var city = result.uri.match(/http:\/\/.*?\/ershoufang/)[0];
							//logger.info(that.crawler.queueItemSize);
							for(var i = 0; i < list.length; i++) {
								var detail = {};
								detail.no = list.eq(i).attr("data-id");
								detail.url = city+util.format("/%s.shtml", detail.no);
								detail.title = list.eq(i).find("h2").text().replace(/[\s,"']/g, "");
								detail.imgcount = list.eq(i).find("em.num").text().trim()||0;
								that.crawler.queue({
									url:detail.url,
									detail:detail,
									priority:0
								});
							}
						}
					});
				}
			}
		});
	}, this);
}

Lianjia.prototype.getPath = function(pathHtml) {
	var list = [];
	var regexp = /<a.*?>(.*?)<\/a>/g;
	var match;
	while(match = regexp.exec(pathHtml)) {
		list.push(match[1]);
	}
	return list.join(">").replace(/[\s,"']/g,'').replace(/二手房/g,'');
}

Lianjia.prototype.buildRecord = function(detail) {
	var list = [];
	list.push(detail.no);
	list.push(detail.url);
	list.push(detail.title);
	list.push(detail.imgcount);
	list.push(detail.community.replace(/[\s,]/g,''));
	list.push(detail.structure.replace(/[\s,]/g,''));
	list.push(detail.area.replace(/[\s,]/g,''));
	list.push(detail.orientation.replace(/[\s,]/g,''));
	list.push(detail.price);
	list.push(detail.downpayment);
	list.push(detail.monthlypayment);
	list.push(detail.dealcount);
	list.push(detail.commentcount);
	list.push(detail.checkcount);
	list.push(detail.path);
	return list.join() + "\n";
}

Lianjia.prototype.start = function() {
	this.init();
	this.run();
}

var that = new Lianjia();
that.start();
