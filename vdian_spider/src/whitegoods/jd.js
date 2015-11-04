var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")

var logger = require("winston")
var env = process.env.NODE_ENV || "development";
logger.cli();
if(env==="production"){
    logger.add(logger.transports.File, {filename:"../../log/jd_airconditioner.log", logstash:true, level:"info"});
    logger.remove(logger.transports.Console);
}

function buildAcRecord(detail) {
	var toWrite = [];
	toWrite.push(detail.title);
	toWrite.push(detail.isByJD);
	toWrite.push(detail.seller);
	toWrite.push(detail.brand);
	toWrite.push(detail.model);
	toWrite.push(detail.series);
	toWrite.push(detail.itemId);
	toWrite.push(detail.onlineDate);
	toWrite.push(detail.price);
	toWrite.push(detail.commentcount);
	toWrite.push(detail.type);
	toWrite.push(detail.conditioningType);
	toWrite.push(detail.power);
	return toWrite.join("\t")+"\n";
}

function buildFriRecord(detail) {
	var toWrite = [];
	toWrite.push(detail.title);
	toWrite.push(detail.isByJD);
	toWrite.push(detail.seller);
	toWrite.push(detail.brand);
	toWrite.push(detail.model);
	toWrite.push(detail.itemId);
	toWrite.push(detail.onlineDate);
	toWrite.push(detail.price);
	toWrite.push(detail.commentcount);
	toWrite.push(detail.type);
	toWrite.push(detail.refrigerationType);
	toWrite.push(detail.frequency);
	toWrite.push(detail.capacity);
	toWrite.push(detail.energy);
	return toWrite.join("\t")+"\n";
}

function buildWashRecord(detail) {
	var toWrite = [];
	toWrite.push(detail.title);
	toWrite.push(detail.isByJD);
	toWrite.push(detail.seller);
	toWrite.push(detail.brand);
	toWrite.push(detail.series);
	toWrite.push(detail.model);
	toWrite.push(detail.itemId);
	toWrite.push(detail.onlineDate);
	toWrite.push(detail.price);
	toWrite.push(detail.commentcount);
	toWrite.push(detail.type);
	toWrite.push(detail.automation);
	toWrite.push(detail.energy);
	toWrite.push(detail.capacity);
	return toWrite.join("\t")+"\n";
}

function JD() {
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
	this.resultFile = util.format("jd_%s.txt", this.keyword);
	this.crawler = new Crawler({
		maxConnections:1,
		rateLimits:1000,
		userAgent:"Mozilla/5.0",
		forceUTF8:true,
		callback:this.processDetail
	});
}

JD.prototype.init = function() {
	logger.info("Initialization starts");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	logger.info("keyword: %s", this.keyword);
	logger.info("Initialization completes");
}

JD.prototype.run = function() {
	this.crawler.queue({
		uri:util.format("http://search.jd.com/Search?keyword=%s&enc=utf-8", encodeURIComponent(that.keyword)),
		jQuery:false,
		callback:function(error, result) {
			if(error) {
				logger.error("Error opening %s", result.uri);
				return;
			}
			try {
				var baseUrl = result.body.match(/SEARCH\.base_url = '(.*?)';/)[1];
				var ajaxPageCount = parseInt(result.body.match(/SEARCH\.init\(\d+,(\d+),\d+,.*?,\d+,\d+/)[1]);
			} catch(e) {
				logger.error("Fail to extract ajax urls.");
				return;
			}
			for(var page = 1; page <= ajaxPageCount; page++) {
				that.crawler.queue({
					uri:util.format("http://search.jd.com/s_new.php?%s&page=%d", baseUrl, page),
					jQuery:false,
					callback:function(error, result) {
						if(error) {
							logger.error("Error opening %s", result.uri);
							return;
						}
						var skuIdReg = /<li (sku|data-sku)="(\d+)"/g;
						var match;
						var count = 0;
						while(match = skuIdReg.exec(result.body)) {
							++count;
							that.crawler.queue({
								uri:util.format("http://item.jd.com/%s.html", match[2]),
								priority:2
							});
						}
						var page = result.uri.match(/page=(\d+)/)[1];
						logger.info("Got %s items in page %s", count, page);
					}
				});
			}
		}
	});
}

JD.prototype.processAcDetail = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result.uri);
		return;
	}
	try {
		var title = $("#name h1").text().replace(/\s/g, "");
		var seller = $(".seller-infor").find("a").text().replace(/\s/g, "");
		var isByJD = $(".seller-infor").find("em").length > 0 ? "京东自营" : "非京东自营";
		var itemId = result.uri.match(/\d+/)[0];
		var onlineDate;
		var itemIntro = $(".p-parameter-list li");
		for(var i = 0; i < itemIntro.length; i++) {
			if(itemIntro.eq(i).text().indexOf("上架时间：") == 0) {
				onlineDate = itemIntro.eq(i).text().replace(/上架时间：/, "");
				break;
			}
		}
		onlineDate = onlineDate || "N/A";
		var brand, series, model, type, conditioningType, power;
		var paramTitleCount = 6;
		var itemParam = $(".Ptable tr");
		for(var i = 0; i < itemParam.length; i++) {
			if(!paramTitleCount) {
				break;
			}
			var td = itemParam.eq(i).find("td");
			switch(td.eq(0).text().trim()) {
				case "品牌":
					brand = td.eq(1).text().trim();--paramTitleCount;break;
				case "系列":
					series = td.eq(1).text().trim();--paramTitleCount;break;
				case "型号":
					model = td.eq(1).text().trim();--paramTitleCount;break;
				case "类别":
					type = td.eq(1).text().trim();--paramTitleCount;break;
				case "制冷类型":
					conditioningType = td.eq(1).text().trim();--paramTitleCount;break;
				case "匹数":
					power = td.eq(1).text().trim();--paramTitleCount;break;
				default:
					break;
			}
		}
		brand = brand || "N/A";
		series = series || "N/A";
		model = model || "N/A";
		type = type || "N/A";
		conditioningType = conditioningType || "N/A";
		power = power || "N/A";
		var detail = {
			title:title,
			seller:seller,
			isByJD:isByJD,
			itemId:itemId,
			onlineDate:onlineDate,
			brand:brand,
			series:series,
			model:model,
			type:type,
			conditioningType:conditioningType,
			power:power
		}
	} catch(e) {
		logger.error("Error getting info %s", result.uri);
		return;
	}
	logger.info("Item %s basic info got.", itemId);
	that.crawler.queue({
		uri:util.format("http://p.3.cn/prices/get?skuid=J_%s&type=1&area=1_72_2799&callback=cnp", itemId),
		jQuery:false,
		detail:detail,
		priority:1,
		callback:function(error, result) {
			var detail = result.options.detail;
			if(error) {
				logger.error("Item %s get price error.", detail.itemId);
				return;
			}
			try {
				detail.price = JSON.parse(result.body.match(/cnp\(\[(.*?)]\)/)[1]).p;
			} catch(e) {
				logger.error("Item %s get price error.", detail.itemId);
				return;	
			}
			logger.info("Item %s price got.", itemId);
			that.crawler.queue({
				uri:util.format("http://club.jd.com/clubservice.aspx?method=GetCommentsCount&referenceIds=%s&callback=cnp&_=%s", detail.itemId, new Date().getTime()),
				headers:{Referer:util.format("http://item.jd.com/%s.html", detail.itemId)},
				detail:detail,
				jQuery:false,
				priority:0,
				callback:function(error, result) {
					var detail = result.options.detail;
					if(error) {
						logger.error("Item %s get commentcount error.", detail.itemId);
						return;
					}
					try {
						detail.commentcount = result.body.match(/"CommentCount":(\d*?),/)[1];
					} catch(e) {
						logger.error("Item %s get commentcount error.", detail.itemId);
						detail.commentcount = "N/A";
						logger.error(result.body)
					}
					fs.appendFileSync(that.resultDir+that.resultFile, buildAcRecord(detail));
					logger.info("Got %s", detail.itemId);
				}
			});
		}
	});
}

JD.prototype.processFriDetail = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result.uri);
		return;
	}
	try {
		var title = $("#name h1").text().replace(/\s/g, "");
		var seller = $(".seller-infor").find("a").text().replace(/\s/g, "");
		var isByJD = $(".seller-infor").find("em").length > 0 ? "京东自营" : "非京东自营";
		var itemId = result.uri.match(/\d+/)[0];
		var onlineDate;
		var itemIntro = $(".p-parameter-list li");
		for(var i = 0; i < itemIntro.length; i++) {
			if(itemIntro.eq(i).text().indexOf("上架时间：") == 0) {
				onlineDate = itemIntro.eq(i).text().replace(/上架时间：/, "");
				break;
			}
		}
		onlineDate = onlineDate || "N/A";
		var brand, model, type, refrigerationType, frequency, capacity, energy;
		var paramTitleCount = 7;
		var itemParam = $(".Ptable tr");
		for(var i = 0; i < itemParam.length; i++) {
			if(!paramTitleCount) {
				break;
			}
			var td = itemParam.eq(i).find("td");
			switch(td.eq(0).text().trim()) {
				case "品牌":
					brand = td.eq(1).text().trim();--paramTitleCount;break;
				case "型号":
					model = td.eq(1).text().trim();--paramTitleCount;break;
				case "类别":
					type = td.eq(1).text().trim();--paramTitleCount;break;
				case "制冷方式":
					refrigerationType = td.eq(1).text().trim();--paramTitleCount;break;
				case "定频/变频":
					frequency = td.eq(1).text().trim();--paramTitleCount;break;
				case "总容积(升)":
					capacity = td.eq(1).text().trim();--paramTitleCount;break;
				case "能效等级":
					energy = td.eq(1).text().trim();--paramTitleCount;break;
				default:
					break;
			}
		}
		brand = brand || "N/A";
		model = model || "N/A";
		type = type || "N/A";
		refrigerationType = refrigerationType || "N/A";
		frequency = frequency || "N/A";
		capacity = capacity || "N/A";
		energy = energy || "N/A";
		var detail = {
			title:title,
			seller:seller,
			isByJD:isByJD,
			itemId:itemId,
			onlineDate:onlineDate,
			brand:brand,
			model:model,
			type:type,
			refrigerationType:refrigerationType,
			frequency:frequency,
			capacity:capacity,
			energy:energy
		}
	} catch(e) {
		logger.error("Error getting info %s", result.uri);
		return;
	}
	logger.info("Item %s basic info got.", itemId);
	that.crawler.queue({
		uri:util.format("http://p.3.cn/prices/get?skuid=J_%s&type=1&area=1_72_2799&callback=cnp", itemId),
		jQuery:false,
		detail:detail,
		priority:1,
		callback:function(error, result) {
			var detail = result.options.detail;
			if(error) {
				logger.error("Item %s get price error.", detail.itemId);
				return;
			}
			try {
				detail.price = JSON.parse(result.body.match(/cnp\(\[(.*?)]\)/)[1]).p;
			} catch(e) {
				logger.error("Item %s get price error.", detail.itemId);
				return;	
			}
			logger.info("Item %s price got.", itemId);
			that.crawler.queue({
				uri:util.format("http://club.jd.com/clubservice.aspx?method=GetCommentsCount&referenceIds=%s&callback=cnp&_=%s", detail.itemId, new Date().getTime()),
				headers:{Referer:util.format("http://item.jd.com/%s.html", detail.itemId)},
				detail:detail,
				jQuery:false,
				priority:0,
				callback:function(error, result) {
					var detail = result.options.detail;
					if(error) {
						logger.error("Item %s get commentcount error.", detail.itemId);
						return;
					}
					try {
						detail.commentcount = result.body.match(/"CommentCount":(\d*?),/)[1];
					} catch(e) {
						logger.error("Item %s get commentcount error.", detail.itemId);
						detail.commentcount = "N/A";
						logger.error(result.body)
					}
					fs.appendFileSync(that.resultDir+that.resultFile, buildFriRecord(detail));
					logger.info("Got %s", detail.itemId);
				}
			});
		}
	});
}

JD.prototype.processWashDetail = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result.uri);
		return;
	}
	try {
		var title = $("#name h1").text().replace(/\s/g, "");
		var seller = $(".seller-infor").find("a").text().replace(/\s/g, "");
		var isByJD = $(".seller-infor").find("em").length > 0 ? "京东自营" : "非京东自营";
		var itemId = result.uri.match(/\d+/)[0];
		var onlineDate;
		var itemIntro = $(".p-parameter-list li");
		for(var i = 0; i < itemIntro.length; i++) {
			if(itemIntro.eq(i).text().indexOf("上架时间：") == 0) {
				onlineDate = itemIntro.eq(i).text().replace(/上架时间：/, "");
				break;
			}
		}
		onlineDate = onlineDate || "N/A";
		var brand, series, model, type, automation, energy, capacity;
		var paramTitleCount = 7;
		var itemParam = $(".Ptable tr");
		for(var i = 0; i < itemParam.length; i++) {
			if(!paramTitleCount) {
				break;
			}
			var td = itemParam.eq(i).find("td");
			switch(td.eq(0).text().trim()) {
				case "品牌":
					brand = td.eq(1).text().trim();--paramTitleCount;break;
				case "系列":
					series = td.eq(1).text().trim();--paramTitleCount;break;	
				case "型号":
					model = td.eq(1).text().trim();--paramTitleCount;break;
				case "类别":
					type = td.eq(1).text().trim();--paramTitleCount;break;
				case "自动化程度":
					automation = td.eq(1).text().trim();--paramTitleCount;break;
				case "节能等级":
					energy = td.eq(1).text().trim();--paramTitleCount;break;
				case "洗涤容量（kg）":
					capacity = td.eq(1).text().trim();--paramTitleCount;break;
				default:
					break;
			}
		}
		brand = brand || "N/A";
		series = series || "N/A";
		model = model || "N/A";
		type = type || "N/A";
		automation = automation || "N/A";
		energy = energy || "N/A";
		capacity = capacity || "N/A";
		var detail = {
			title:title,
			seller:seller,
			isByJD:isByJD,
			itemId:itemId,
			onlineDate:onlineDate,
			brand:brand,
			series:series,
			model:model,
			type:type,
			automation:automation,
			energy:energy,
			capacity:capacity
		}
	} catch(e) {
		logger.error("Error getting info %s", result.uri);
		return;
	}
	logger.info("Item %s basic info got.", itemId);
	that.crawler.queue({
		uri:util.format("http://p.3.cn/prices/get?skuid=J_%s&type=1&area=1_72_2799&callback=cnp", itemId),
		jQuery:false,
		detail:detail,
		priority:1,
		callback:function(error, result) {
			var detail = result.options.detail;
			if(error) {
				logger.error("Item %s get price error.", detail.itemId);
				return;
			}
			try {
				detail.price = JSON.parse(result.body.match(/cnp\(\[(.*?)]\)/)[1]).p;
			} catch(e) {
				logger.error("Item %s get price error.", detail.itemId);
				return;	
			}
			logger.info("Item %s price got.", itemId);
			that.crawler.queue({
				uri:util.format("http://club.jd.com/clubservice.aspx?method=GetCommentsCount&referenceIds=%s&callback=cnp&_=%s", detail.itemId, new Date().getTime()),
				headers:{Referer:util.format("http://item.jd.com/%s.html", detail.itemId)},
				detail:detail,
				jQuery:false,
				priority:0,
				callback:function(error, result) {
					var detail = result.options.detail;
					if(error) {
						logger.error("Item %s get commentcount error.", detail.itemId);
						return;
					}
					try {
						detail.commentcount = result.body.match(/"CommentCount":(\d*?),/)[1];
					} catch(e) {
						logger.error("Item %s get commentcount error.", detail.itemId);
						detail.commentcount = "N/A";
						logger.error(result.body)
					}
					fs.appendFileSync(that.resultDir+that.resultFile, buildWashRecord(detail));
					logger.info("Got %s", detail.itemId);
				}
			});
		}
	});
}

JD.prototype.start = function() {
	this.init();
	this.run();
}

var that = new JD();
that.start();
