var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")

var logger = require("winston")
var env = process.env.NODE_ENV || "development";
logger.cli();
if(env==="production"){
    logger.add(logger.transports.File, {filename:"../../log/gome_airconditioner.log", logstash:true, level:"info"});
    logger.remove(logger.transports.Console);
}

function buildRecord(detail) {
	var toWrite = [];
	toWrite.push(detail.title);
	toWrite.push(detail.seller);
	toWrite.push(detail.delivery);
	toWrite.push(detail.brand);
	toWrite.push(detail.series);
	toWrite.push(detail.model);
	toWrite.push(detail.itemId);
	toWrite.push(detail.onlineDate);
	toWrite.push(detail.price);
	toWrite.push(detail.marketPrice);
	toWrite.push(detail.commentcount);
	toWrite.push(detail.type);
	toWrite.push(detail.conditioningType);
	toWrite.push(detail.power);
	toWrite.push(detail.isHomeUse);
	toWrite.push(detail.frequencyType);
	toWrite.push(detail.energyConsumption);
	toWrite.push(detail.productId);
	toWrite.push(detail.skuId);
	return toWrite.join("\t")+"\n";
}

function Gome() {
	this.resultDir = "../../result/whitegood/";
	this.resultFile = "gome.txt";
	this.crawler = new Crawler({
		maxConnections:1,
		rateLimits:300,
		userAgent:"Mozilla/5.0",
		onDrain:function(){logger.info("Job done.");}
	});
	this.catId = "cat10000062";
}

Gome.prototype.run = function() {
	this.crawler.queue({
		uri:util.format("http://search.gome.com.cn/search?question=%s", encodeURIComponent(this.keyword)),
		jQuery:false,
		callback:function(error, result) {
			if(error) {
				logger.error(error);
				return;
			}
			try {
				var pagecount = parseInt(result.body.match(/id="hiddenTotalPage" value="(\d+)"/)[1]);
				that.catId = result.body.match(/var dsp_gome_catid = "(.*?)";/)[1];
			} catch(e) {
				logger.error("Fail to get page count.");
				return;
			}
			logger.info("%s total page: %s", that.keyword, pagecount);
			for(var page = 26; page <= pagecount; page++) {
				that.doAcPage(page);
			}
		}
	});
}

Gome.prototype.doAcPage = function(page) {
	that.crawler.queue({
		uri:"http://search.gome.com.cn/cloud/asynSearch?callback=callback_productlist",
		priority:3,
		jQuery:false,
		method:"POST",
		form:{
			module:"product",
			from:"search",
			page:page,
			paramJson:JSON.stringify({
				mobile:false,
				catId:"",
				catalog:"coo8Store",
				siteId:"coo8Store",
				shopId:"",
				regionId:"11011400",
				pageName:"search",
				et:"",
				XSearch:true,
				startDate:0,
				endDate:0,
				pageSize:48,
				state:4,
				weight:0,
				promoFlag:0,
				sale:0,
				instock:0,
				filterReqFacets:[],
				rewriteTag:false,
				userId:"",
				question:that.keyword,
				productTag:0,
				sorts:[],
				priceTag:0,
				fakeCatId:that.catId,
				cacheTime:61,
				parseTime:277
			})
		},
		page:page,
		callback:function(error, result) {
			var page = result.options.page;
			if(error) {
				logger.error("Error opening page %s", page);
				return;
			}
			try {
				var products = JSON.parse(result.body.match(/callback_productlist\((.*)\)/)[1]).products;
			} catch(e) {
				logger.error("Error parsing page %s", page);
				logger.error(e);
				return;
			}
			for(var i = 0; i < products.length; i++) {
				that.doAcDetail(products[i]);
			}
			logger.info("Got %s items in page %s", products.length, page);
		}
	});
}

Gome.prototype.doAcDetail = function(product) {
	that.crawler.queue({
		uri:util.format("http://item.gome.com.cn/%s-%s.html", product.pId, product.skuId),
		priority:0,
		callback:function(error, result, $) {
			if(error) {
				logger.error("Error opening %s", result.uri);
				return;
			}
			try {
				eval(result.body.match(/var prdInfo = \{([\s\S]*?)\};/)[0]);
				if(prdInfo.thirdCategoryName.slice(-2) != "空调") {
					logger.info("%s not a 空调", result.uri);
					return;
				}
				var detail = {
					productId:prdInfo.prdId,
					skuId:prdInfo.sku,
					itemId:prdInfo.skuNo,
					price:prdInfo.price,
					title:prdInfo.prdName,
					marketPrice:prdInfo.gomePrice,
					brand:prdInfo.breadName,
				}
				detail.seller = $(".storeName").attr("title") || "N/A";
				detail.delivery = $(".prdService").children().text() || "N/A";
				detail.commentcount = $("#pincnt").text() || "N/A";
				var itemParam = $("ul.specbox li");
				var model, series, onlineDate, type, conditioningType, power, isHomeUse, frequencyType, energyConsumption;
				var paramTitleCount = 9;
				for(var i = 0; i < itemParam.length; i++) {
					if(!paramTitleCount) {
						break;
					}
					var spans = itemParam.eq(i).find("span");
					if(spans.length != 2) {
						continue;
					}
					switch(spans.eq(0).text().trim()) {
						case "型号":
							model = spans.eq(1).text().trim();--paramTitleCount;break;
						case "系列名称":
							series = spans.eq(1).text().trim();--paramTitleCount;break;
						case "上市时间":
							onlineDate = spans.eq(1).text().trim();--paramTitleCount;break;
						case "空调类型":
							type = spans.eq(1).text().trim();--paramTitleCount;break;
						case "冷暖类型":
							conditioningType = spans.eq(1).text().trim();--paramTitleCount;break;
						case "匹数":
							power = spans.eq(1).text().trim();--paramTitleCount;break;
						case "家用/商用空调":
							isHomeUse = spans.eq(1).text().trim();--paramTitleCount;break;
						case "定/变频":
							frequencyType = spans.eq(1).text().trim();--paramTitleCount;break;
						case "能效等级":
							energyConsumption = spans.eq(1).text().trim();--paramTitleCount;break;
						default:
							break;
					}
				}
				detail.model = model || "N/A";
				detail.series = series || "N/A";
				detail.onlineDate = onlineDate || "N/A";
				detail.type = type || "N/A";
				detail.conditioningType = conditioningType || "N/A";
				detail.power = power || "N/A";
				detail.isHomeUse = isHomeUse || "N/A";
				detail.frequencyType = frequencyType || "N/A";
				detail.energyConsumption = energyConsumption || "N/A";
			} catch(e) {
				logger.error("Error parsing %s", result.uri);
				logger.error(e);
				return;
			}
			fs.appendFileSync(that.resultDir+that.resultFile, buildRecord(detail));
			logger.info("Got %s", detail.itemId);
		}

	});
}

Gome.prototype.init = function() {
	logger.info("Initialization starts");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	this.keyword = process.argv.splice(2)[0];
	switch(this.keyword) {
		case "ac":
			this.keyword = "空调";break;
		default:
			this.keyword = "空调";break;
	}
	logger.info("keyword: %s", this.keyword);
	logger.info("Initialization completes");
}
 
Gome.prototype.start = function() {
	this.init();
	this.run();
}

var that = new Gome();
that.start();