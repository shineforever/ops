var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")

var logger = require("winston")
var env = process.env.NODE_ENV || "development";
logger.cli();
if(env==="production"){
    logger.add(logger.transports.File, {filename:"../../log/tmall_airconditioner.log", logstash:true, level:"info"});
    logger.remove(logger.transports.Console);
}

function buildAcRecord(detail) {
	var toWrite = [];
	toWrite.push(detail.title);
	toWrite.push(detail.seller);
	toWrite.push(detail.brand);
	toWrite.push(detail.model);
	toWrite.push(detail.itemId);
	toWrite.push(detail.onlineDate);
	toWrite.push(detail.promotionPrice || "N/A");
	toWrite.push(detail.marketPrice || "N/A");
	toWrite.push(detail.commentcount || "N/A");
	toWrite.push(detail.type);
	toWrite.push(detail.conditioningType);
	toWrite.push(detail.power);
	return toWrite.join("\t")+"\n";
}

function buildFriRecord(detail) {
	var toWrite = [];
	toWrite.push(detail.title);
	toWrite.push(detail.seller);
	toWrite.push(detail.brand);
	toWrite.push(detail.model);
	toWrite.push(detail.itemId);
	toWrite.push(detail.onlineDate);
	toWrite.push(detail.promotionPrice || "N/A");
	toWrite.push(detail.marketPrice || "N/A");
	toWrite.push(detail.commentcount || "N/A");
	toWrite.push(detail.artificialType);
	toWrite.push(detail.functionSupported);
	toWrite.push(detail.refrigerationType);
	toWrite.push(detail.doorType);
	toWrite.push(detail.energy);
	toWrite.push(detail.capacity);
	return toWrite.join("\t")+"\n";
}

function buildWashRecord(detail) {
	var toWrite = [];
	toWrite.push(detail.title);
	toWrite.push(detail.seller);
	toWrite.push(detail.brand);
	toWrite.push(detail.model);
	toWrite.push(detail.itemId);
	toWrite.push(detail.onlineDate);
	toWrite.push(detail.promotionPrice || "N/A");
	toWrite.push(detail.marketPrice || "N/A");
	toWrite.push(detail.commentcount || "N/A");
	toWrite.push(detail.type);
	toWrite.push(detail.artificialType);
	toWrite.push(detail.automation);
	toWrite.push(detail.energy);
	toWrite.push(detail.capacity);
	return toWrite.join("\t")+"\n";
}

function Tmall() {
	this.resultDir = "../../result/whitegood/";
	this.keyword = process.argv.splice(2)[0];
	switch(this.keyword) {
		case "ac":
			this.keyword = "空调";this.processDetail = this.processAcDetail;break;
		case "fri":
			this.keyword = "冰箱";this.processDetail = this.processFriDetail;break;
		case "wash":
			this.keyword = "洗衣机";this.processDetail = this.processWashDetail;break;
		default:
			this.keyword = "冰箱";this.processDetail = this.processFriDetail;break;
	}
	this.resultFile = util.format("tmall_%s.txt", this.keyword);
	this.crawler = new Crawler({
		maxConnections:1,
		rateLimits:1000,
		userAgent:"Mozilla/5.0",
		forceUTF8:true,
		jar:true,
		onDrain:function(){logger.info("Job done.")},
		callback:this.processDetail
	});
}

Tmall.prototype.init = function() {
	logger.info("Initialization starts");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	logger.info("keyword: %s", this.keyword);
	logger.info("Initialization completes");
}

Tmall.prototype.run = function() {
	var url = util.format("http://list.tmall.com/search_product.htm?q=%s&type=p", encodeURIComponent(that.keyword));
	this.crawler.queue({
		uri:url,
		jQuery:false,
		callback:function(error, result) {
			var searchUrl = result.uri;
			if(error) {
				logger.error(error);
				return;
			}
			try {
				var pagecount = parseInt(result.body.match(/共(\d+)页/)[1]);
			} catch(e) {
				logger.error("Error getting page count.");
				return;
			}
			logger.info("%s total page: %s", that.keyword, pagecount);
			for(var page = 1; page <= pagecount; page++) {
				that.crawler.queue({
					uri:searchUrl+"&s="+((page-1)*60-1),
					page:page,
					priority:3,
					callback:function(error, result) {
						var page = result.options.page;
						if(error) {
							logger.error("Error opnening page %s", page);
							return;
						}
						var itemIdReg = /<a href="(.*?)" class="productImg"/g;
						var match;
						var count = 0;
						while(match = itemIdReg.exec(result.body)) {
							++count;
							that.crawler.queue({
								uri:"http:"+match[1],
								priority:2
							});
						}
						logger.info("Got %s items in page %s", count, page);
					}
				});
			}
		}
	});
}

Tmall.prototype.processAcDetail = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result.uri);
		return;
	}
	try {
		var itemId = result.uri.match(/(&amp;|\?)id=(\d+)&amp;/)[2];
		var title = $(".tb-detail-hd h1 a").text().trim();
		var seller = $("a.slogo-shopname strong").text().trim();
		var itemParam = $("table.tm-tableAttr tbody tr");
		var brand, model, type, conditioningType, power, onlineDate;
		var paramTitleCount = 6;
		for(var i = 0; i < itemParam.length; i++) {
			if(!paramTitleCount) {
				break;
			}
			switch(itemParam.eq(i).find("th").text().trim()) {
				case "空调品牌":
					brand = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "型号":
					model = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "空调类型":
					type = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "冷暖类型":
					conditioningType = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "空调功率":
					power = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "上市时间":
					onlineDate = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				default:
					break;
			}
			if(!model && itemParam.eq(i).find("th").text().trim().indexOf("空调型号") != -1) {
				model = itemParam.eq(i).find("td").text().trim();--paramTitleCount;
			}
		}
		brand = brand || "N/A";
		model = model || "N/A";
		type = type || "N/A";
		conditioningType = conditioningType || "N/A";
		power = power || "N/A";
		onlineDate = onlineDate || "N/A";
		var commentcount = $("span.tm-count").eq(0).text().trim();
		var detail = {
			title:title,
			seller:seller,
			itemId:itemId,
			onlineDate:onlineDate,
			brand:brand,
			model:model,
			type:type,
			conditioningType:conditioningType,
			power:power,
			commentcount:commentcount
		}
	} catch(e) {
		logger.error("Error getting basic info %s", result.uri);
		return;
	}
	logger.info("Item %s basic info got.", detail.itemId);
	try {
		var priceUrl = result.body.match(/var l,url='(.*)';/)[1];
	} catch(e) {
		logger.error("Error getting price info %s", result.uri);
		fs.appendFileSync(that.resultDir+that.resultFile, buildAcRecord(detail));
		return;
	}
	that.crawler.queue({
		uri:"http:"+priceUrl,
		headers:{Referer:"http://detail.tmall.com/item.htm"},
		jQuery:false,
		priority:1,
		detail:detail,
		callback:function(error, result) {
			var detail = result.options.detail;
			if(error) {
				logger.error("Error getting price info %s", result.uri);
				fs.appendFileSync(that.resultDir+that.resultFile, buildAcRecord(detail));
				return;
			}
			try {
				var priceInfo = JSON.parse(result.body).defaultModel.itemPriceResultDO.priceInfo;
				priceInfo = priceInfo[Object.keys(priceInfo)[0]];
				if(priceInfo.promotionList) {
					detail.marketPrice = priceInfo.price;
					detail.promotionPrice = priceInfo.promotionList[0].price;
				} else {
					detail.marketPrice = priceInfo.price;
					detail.promotionPrice = priceInfo.price;
				}
			} catch(e) {
				logger.error("Error parsing price info %s", result.uri);
				fs.appendFileSync(that.resultDir+that.resultFile, buildAcRecord(detail));
				return;
			}
			fs.appendFileSync(that.resultDir+that.resultFile, buildAcRecord(detail));
			logger.info("Item %s got.", detail.itemId);
		}
	});
}

Tmall.prototype.processFriDetail = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result.uri);
		return;
	}
	try {
		var itemId = result.uri.match(/(&amp;|\?)id=(\d+)&amp;/)[2];
		var title = $(".tb-detail-hd h1 a").text().trim();
		var seller = $("a.slogo-shopname strong").text().trim();
		var itemParam = $("table.tm-tableAttr tbody tr");
		var brand, model, artificialType, functionSupported, refrigerationType, doorType, energy, capacity, onlineDate;
		var paramTitleCount = 9;
		for(var i = 0; i < itemParam.length; i++) {
			if(!paramTitleCount) {
				break;
			}
			switch(itemParam.eq(i).find("th").text().trim()) {
				case "冰箱冰柜品牌":
					brand = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "型号":
					model = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "智能类型":
					type = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "冰箱冷柜机型":
					functionSupported = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "制冷方式":
					refrigerationType = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "箱门结构":
					doorType = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "能效等级":
					energy = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "最大容积":
					capacity = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "上市时间":
					onlineDate = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				default:
					break;
			}
			if(!model && itemParam.eq(i).find("th").text().trim().indexOf("冰箱型号") != -1) {
				model = itemParam.eq(i).find("td").text().trim();--paramTitleCount;
			}
		}
		brand = brand || "N/A";
		model = model || "N/A";
		artificialType = artificialType || "N/A";
		functionSupported = functionSupported || "N/A";
		refrigerationType = refrigerationType || "N/A";
		doorType = doorType || "N/A";
		energy = energy || "N/A";
		capacity = capacity || "N/A";
		onlineDate = onlineDate || "N/A";
		var commentcount = $("span.tm-count").eq(0).text().trim();
		var detail = {
			title:title,
			seller:seller,
			itemId:itemId,
			onlineDate:onlineDate,
			brand:brand,
			model:model,
			artificialType:artificialType,
			functionSupported:functionSupported,
			refrigerationType:refrigerationType,
			doorType:doorType,
			energy:energy,
			capacity:capacity,
			commentcount:commentcount
		}
	} catch(e) {
		logger.error("Error getting basic info %s", result.uri);
		return;
	}
	logger.info("Item %s basic info got.", detail.itemId);
	try {
		var priceUrl = result.body.match(/var l,url='(.*)';/)[1];
	} catch(e) {
		logger.error("Error getting price info %s", result.uri);
		fs.appendFileSync(that.resultDir+that.resultFile, buildFriRecord(detail));
		return;
	}
	that.crawler.queue({
		uri:"http:"+priceUrl,
		headers:{Referer:"http://detail.tmall.com/item.htm"},
		jQuery:false,
		priority:1,
		detail:detail,
		callback:function(error, result) {
			var detail = result.options.detail;
			if(error) {
				logger.error("Error getting price info %s", result.uri);
				fs.appendFileSync(that.resultDir+that.resultFile, buildFriRecord(detail));
				return;
			}
			try {
				var priceInfo = JSON.parse(result.body).defaultModel.itemPriceResultDO.priceInfo;
				priceInfo = priceInfo[Object.keys(priceInfo)[0]];
				if(priceInfo.promotionList) {
					detail.marketPrice = priceInfo.price;
					detail.promotionPrice = priceInfo.promotionList[0].price;
				} else {
					detail.marketPrice = priceInfo.price;
					detail.promotionPrice = priceInfo.price;
				}
			} catch(e) {
				logger.error("Error parsing price info %s", result.uri);
				fs.appendFileSync(that.resultDir+that.resultFile, buildFriRecord(detail));
				return;
			}
			fs.appendFileSync(that.resultDir+that.resultFile, buildFriRecord(detail));
			logger.info("Item %s got.", detail.itemId);
		}
	});
}

Tmall.prototype.processWashDetail = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result.uri);
		return;
	}
	try {
		var itemId = result.uri.match(/(&amp;|\?)id=(\d+)&amp;/)[2];
		var title = $(".tb-detail-hd h1 a").text().trim();
		var seller = $("a.slogo-shopname strong").text().trim();
		var itemParam = $("table.tm-tableAttr tbody tr");
		var brand, model, type, artificialType, automation, energy, capacity, onlineDate;
		var paramTitleCount = 8;
		for(var i = 0; i < itemParam.length; i++) {
			if(!paramTitleCount) {
				break;
			}
			switch(itemParam.eq(i).find("th").text().trim()) {
				case "洗衣机品牌":
					brand = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "型号":
					model = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "产品类型":
					type = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "智能类型":
					artificialType = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "使用方式":
					automation = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "能效等级":
					energy = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "洗涤公斤量":
					capacity = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				case "上市时间":
					onlineDate = itemParam.eq(i).find("td").text().trim();--paramTitleCount;break;
				default:
					break;
			}
			if(!model && itemParam.eq(i).find("th").text().trim().indexOf("洗衣机型号") != -1) {
				model = itemParam.eq(i).find("td").text().trim();--paramTitleCount;
			}
		}
		brand = brand || "N/A";
		model = model || "N/A";
		type = type || "N/A";
		artificialType = artificialType || "N/A";
		automation = automation || "N/A";
		energy = energy || "N/A";
		capacity = capacity || "N/A";
		onlineDate = onlineDate || "N/A";
		var commentcount = $("span.tm-count").eq(0).text().trim();
		var detail = {
			title:title,
			seller:seller,
			itemId:itemId,
			onlineDate:onlineDate,
			brand:brand,
			model:model,
			type:type,
			artificialType:artificialType,
			automation:automation,
			energy:energy,
			capacity:capacity,
			commentcount:commentcount
		}
	} catch(e) {
		logger.error("Error getting basic info %s", result.uri);
		return;
	}
	logger.info("Item %s basic info got.", detail.itemId);
	try {
		var priceUrl = result.body.match(/var l,url='(.*)';/)[1];
	} catch(e) {
		logger.error("Error getting price info %s", result.uri);
		fs.appendFileSync(that.resultDir+that.resultFile, buildWashRecord(detail));
		return;
	}
	that.crawler.queue({
		uri:"http:"+priceUrl,
		headers:{Referer:"http://detail.tmall.com/item.htm"},
		jQuery:false,
		priority:1,
		detail:detail,
		callback:function(error, result) {
			var detail = result.options.detail;
			if(error) {
				logger.error("Error getting price info %s", result.uri);
				fs.appendFileSync(that.resultDir+that.resultFile, buildWashRecord(detail));
				return;
			}
			try {
				var priceInfo = JSON.parse(result.body).defaultModel.itemPriceResultDO.priceInfo;
				priceInfo = priceInfo[Object.keys(priceInfo)[0]];
				if(priceInfo.promotionList) {
					detail.marketPrice = priceInfo.price;
					detail.promotionPrice = priceInfo.promotionList[0].price;
				} else {
					detail.marketPrice = priceInfo.price;
					detail.promotionPrice = priceInfo.price;
				}
			} catch(e) {
				logger.error("Error parsing price info %s", result.uri);
				fs.appendFileSync(that.resultDir+that.resultFile, buildWashRecord(detail));
				return;
			}
			fs.appendFileSync(that.resultDir+that.resultFile, buildWashRecord(detail));
			logger.info("Item %s got.", detail.itemId);
		}
	});
}

Tmall.prototype.start = function() {
	this.init();
	this.run();
}

var that = new Tmall();
that.start();
