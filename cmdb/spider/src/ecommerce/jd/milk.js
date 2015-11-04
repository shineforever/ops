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

var domesticBrand = {
	"蒙牛":true,
	"伊利":true,
	"光明":true,
	"三元":true,
	"圣牧":true,
	"现代牧业":true
}

function JD() {
	this.resultDir = "../../../result/ecommerce/jd/";
	var arguments = process.argv.splice(2);
	switch(arguments[0]) {
		case "1":
			this.category = "中国牛奶";this.categoryUrl = "http://list.jd.com/list.html?cat=1320%2C1585%2C9434";break;
		case "2":
			this.category = "进口牛奶";this.categoryUrl = "http://list.jd.com/list.html?cat=1320%2C5019%2C12215";break;
		case "3":
			this.category = "婴儿奶粉";this.categoryUrl = "http://list.jd.com/list.html?cat=1319,1523,7052";break;
		default:
			this.category = "中国牛奶";this.categoryUrl = "http://list.jd.com/list.html?cat=1320%2C1585%2C9434";break;
	}
	this.resultFile = util.format("milk_%s.txt", this.category);
	this.crawler = new Crawler({
		maxConnections:1,
		rateLimits:1000,
		userAgent:"Mozilla/5.0",
		forceUTF8:true,
		callback:this.processDetail
	});
	this.category;
	this.categoryUrl;
}

JD.prototype.init = function() {
	logger.info("Initialization starts");
	if(!fs.existsSync("../../../result/ecommerce")) {
		fs.mkdirSync("../../../result/ecommerce");
	}
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	logger.info("Category: %s", this.category);
	logger.info("Initialization completes");
}

JD.prototype.run = function() {
	this.queueList();
}

JD.prototype.queueList = function() {
	that.crawler.queue({
		uri:that.categoryUrl,
		callback:function(error, result, $) {
			if(error || !$) {
				logger.error("Error getting list.\nJob done.");
				return;
			}
			var pagecountDom = $("span.p-skip em b");
			if(pagecountDom.length == 0) {
				logger.error("Error getting page count.\nJob done.");
				return;
			}
			var pagecount = parseInt(pagecountDom.text().trim());
			logger.info("Total page: %s", pagecount);
			var baseUrl = result.uri;
			for(var page = 1; page <= pagecount; page++) {
				that.crawler.queue({
					uri:baseUrl+"&page="+page,
					callback:function(error, result, $) {
						if(error || !$) {
							logger.error("Error opening %s", result.uri);
							return;
						}
						var count = 0;
						$("li.gl-item").each(function(){
							++count;
							var skuId = $(this).children("div").attr("data-sku");
							that.crawler.queue({
								uri:util.format("http://item.jd.com/%s.html", skuId),
								priority:2
							});
						});
						var page = result.uri.match(/page=(\d+)/)[1];
						logger.info("Got %s items in page %s", count, page);
					}
				});
			}
		}
	});
}

JD.prototype.processDetail = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening %s", result.uri);
		return;
	}
	try {
		var itemId = result.uri.match(/\d+/)[0];
	} catch(e) {
		logger.error("%s bad url", result.uri);
		return;
	}
	var detail = undefined;
	switch(that.category) {
		case "中国牛奶":
			detail = that.getDomesticMilkDetail(itemId, $);break;
		case "进口牛奶":
			detail = that.getImportMilkDetail(itemId, $);break;
		case "婴儿奶粉":
			detail = that.getPowderedMilkDetail(itemId, $);break;
	}
	if(!detail) {
		logger.error("Item %s fail to get basic info.", itemId);
		return;
	}
	logger.info("Item %s basic info got.", itemId);
	if(that.category == "中国牛奶") {
		if(!domesticBrand[detail.brand]) {
			logger.warn("Item %s not the brand we want.", detail.itemId);
			return;
		}
		if(detail.brand != "圣牧" && detail.brand != "现代牧业" && !detail.title.match(/特仑苏|金典|优\+|极致/)) {
			detail.isWanted = "否";
		}
	}
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
					fs.appendFileSync(that.resultDir+that.resultFile, that.buildRecord(detail));
					logger.info("Got %s", detail.itemId);
				}
			});
		}
	});
}

JD.prototype.getDomesticMilkDetail = function(itemId, $) {
	try {
		var title = $("#name h1").text().replace(/\s/g, "");
		var pathDom = $(".breadcrumb a");
		var brand = "N/A";
		if(pathDom.length > 3) {
			brand = pathDom.eq(-2).text().trim();
		} else {
			brand = title.split(" ")[0];
			logger.warn("%s brand not found in path.", itemId);
		}
		var seller = $(".seller-infor").find("a").text().replace(/\s/g, "");
		var isByJD = $(".seller-infor").find("em").length > 0 ? "京东自营" : "非京东自营";

		var placeOfProduction = "N/A";
		var netContents = "N/A";
		var type = "N/A";

		var paramTitleCount = 3;
		var itemParam = $(".Ptable tr");
		for(var i = 0; i < itemParam.length; i++) {
			if(!paramTitleCount) {
				break;
			}
			var td = itemParam.eq(i).find("td");
			if(td.length != 2) {
				continue;
			}
			switch(td.eq(0).text().trim()) {
				case "净含量":
					netContents = td.eq(1).text().trim();--paramTitleCount;break;
				case "原产地":
					placeOfProduction = td.eq(1).text().trim();--paramTitleCount;break;
				case "类别":
					type = td.eq(1).text().trim();--paramTitleCount;break;
				default:
					break;
			}
		}

		var contents = "N/A";
		var itemIntro = $(".p-parameter-list li");
		for(var i = 0; i < itemIntro.length; i++) {
			if(itemIntro.eq(i).text().indexOf("规格参数：") == 0) {
				contents = itemIntro.eq(i).text().replace(/规格参数：/, "");
				break;
			}
		}

		var liters = "N/A";
		var mayContainLiter = contents + title;
		var contentMatch = mayContainLiter.match(/(\d+)(ml|L|g)?\*(\d+)(ml|L|g)?/i);
		if(contentMatch) {
			liters = parseInt(contentMatch[1])*parseInt(contentMatch[3]);
			liters = liters < 100 ? liters*1000 : liters;
			liters = liters + "ml";
		}

		var detail = {
			brand:brand,
			title:title,
			seller:seller,
			isByJD:isByJD,
			itemId:itemId,
			type:type,
			placeOfProduction:placeOfProduction,
			netContents:netContents,
			contents:contents,
			liters:liters,
			isWanted:"是"
		}
		return detail;
	} catch(e) {
		logger.error(e);
		return undefined;
	}
}

JD.prototype.getImportMilkDetail = function(itemId, $) {
	try {
		var title = $("#name h1").text().replace(/\s/g, "");
		var pathDom = $(".breadcrumb a");
		var brand = "N/A";
		if(pathDom.length > 3) {
			brand = pathDom.eq(-2).text().trim();
		} else {
			brand = title.split(" ")[0];
			logger.warn("%s brand not found in path.", itemId);
		}
		var seller = $(".seller-infor").find("a").text().replace(/\s/g, "");
		var isByJD = $(".seller-infor").find("em").length > 0 ? "京东自营" : "非京东自营";

		var placeOfProduction = "N/A";
		var netContents = "N/A";
		var type = "N/A";

		var paramTitleCount = 3;
		var itemParam = $(".Ptable tr");
		for(var i = 0; i < itemParam.length; i++) {
			if(!paramTitleCount) {
				break;
			}
			var td = itemParam.eq(i).find("td");
			if(td.length != 2) {
				continue;
			}
			switch(td.eq(0).text().trim()) {
				case "净含量":
					netContents = td.eq(1).text().trim();--paramTitleCount;break;
				case "原产地":
					placeOfProduction = td.eq(1).text().trim();--paramTitleCount;break;
				case "产地":
					placeOfProduction = td.eq(1).text().trim();--paramTitleCount;break;
				case "类别":
					type = td.eq(1).text().trim();--paramTitleCount;break;
				default:
					break;
			}
		}

		var contents = "N/A";
		var itemIntro = $(".p-parameter-list li");
		for(var i = 0; i < itemIntro.length; i++) {
			if(itemIntro.eq(i).text().indexOf("规格参数：") == 0) {
				contents = itemIntro.eq(i).text().replace(/规格参数：/, "");
				if(placeOfProduction != "N/A") {
					break;
				}
			}
			if(placeOfProduction == "N/A" && itemIntro.eq(i).text().indexOf("商品产地：") == 0) {
				placeOfProduction = itemIntro.eq(i).text().replace(/商品产地：/, "");
			}
		}

		var liters = "N/A";
		var mayContainLiter = contents + title;
		var contentMatch = mayContainLiter.match(/(\d+)(ml|L|g)?\*(\d+)(ml|L|g)?/i);
		if(contentMatch) {
			liters = parseInt(contentMatch[1])*parseInt(contentMatch[3]);
			liters = liters < 100 ? liters*1000 : liters;
			liters = liters + "ml";
		}

		var detail = {
			brand:brand,
			title:title,
			seller:seller,
			isByJD:isByJD,
			itemId:itemId,
			type:type,
			placeOfProduction:placeOfProduction,
			netContents:netContents,
			contents:contents,
			liters:liters
		}
		return detail;
	} catch(e) {
		logger.error(e);
		return undefined;
	}
}

JD.prototype.getPowderedMilkDetail = function(itemId, $) {
	try {
		var title = $("#name h1").text().replace(/\s/g, "");
		var pathDom = $(".breadcrumb a");
		var brand = "N/A";
		if(pathDom.length > 3) {
			brand = pathDom.eq(-2).text().trim();
		} else {
			brand = title.split(" ")[0];
			logger.warn("%s brand not found in path.", itemId);
		}
		var seller = $(".seller-infor").find("a").text().replace(/\s/g, "");
		var isByJD = $(".seller-infor").find("em").length > 0 ? "京东自营" : "非京东自营";

		var placeOfProduction = "N/A";
		var type = "N/A";
		var packing = "N/A"

		var itemIntro = $(".p-parameter-list li");
		for(var i = 0; i < itemIntro.length; i++) {// 商品产地  分类  包装
			if(itemIntro.eq(i).text().indexOf("商品产地：") == 0) {
				placeOfProduction = itemIntro.eq(i).text().replace(/商品产地：/, "");
			} else if(itemIntro.eq(i).text().indexOf("分类：") == 0) {
				type = itemIntro.eq(i).text().replace(/分类：/, "");
			} else if(itemIntro.eq(i).text().indexOf("包装：") == 0) {
				packing = itemIntro.eq(i).text().replace(/包装：/, "");
			}
		}

		var netContents = "N/A";
		var contentMatch = title.match(/(\d+)(g|克)\*(\d+)/i);
		if(contentMatch) {
			netContents = parseInt(contentMatch[1])*parseInt(contentMatch[3]);
			netContents = netContents + "g";
		} else {
			var weightMatch = title.match(/(\d+)(g|克)/i);
			if(weightMatch) {
				netContents = weightMatch[1] + "g";
			}
		}

		var detail = {
			brand:brand,
			title:title,
			seller:seller,
			isByJD:isByJD,
			itemId:itemId,
			type:type,
			placeOfProduction:placeOfProduction,
			packing:packing,
			netContents:netContents
		}
		return detail;
	} catch(e) {
		logger.error(e);
		return undefined;
	}
}

JD.prototype.buildRecord = function(detail) {
	var toWrite = [];
	toWrite.push(detail.brand);
	toWrite.push(detail.title);
	toWrite.push(detail.seller);
	toWrite.push(detail.isByJD);
	toWrite.push(detail.itemId);
	toWrite.push(detail.type);
	toWrite.push(detail.placeOfProduction);
	toWrite.push(detail.netContents);
	if(that.category != "婴儿奶粉") {
		toWrite.push(detail.contents);
		toWrite.push(detail.liters);
	}
	if(that.category == "婴儿奶粉") {
		toWrite.push(detail.packing);
	}
	toWrite.push(detail.price);
	toWrite.push(detail.commentcount);
	if(detail.isWanted) {
		toWrite.push(detail.isWanted);
	}
	return toWrite.join("\t")+"\n";
}

JD.prototype.start = function() {
	this.init();
	this.run();
}

var that = new JD();
that.start();