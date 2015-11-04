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

function dealEmpty(value){
	if(typeof(value)=='number'){
		return value;
	}
	else{
		return (value?value:"N/A");
	}
}
	
function dealstr(str){
	if(typeof(str)=='string'){
		var nodotstr = str.replace(/,/g, ' ');
		return nodotstr.replace(/\s+/g, ' ');
	}
	else{
		return str;
	}
}

function buildAcRecord(detail) {
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
	return toWrite.join(",")+"\n";
}

//itemid, title, price, mprice, brand, seller, service, commentcount
////model, autolevel, capacity, energyConsumption, prdattr
function buildWmRecord(detail){
    var toWrite = []; 
    toWrite.push(dealEmpty(detail.title));
    toWrite.push(dealEmpty(detail.seller));
    toWrite.push(dealEmpty(detail.delivery));
    toWrite.push(dealEmpty(detail.brand));
    toWrite.push(dealEmpty(detail.model));
    toWrite.push(dealEmpty(detail.itemId));
    toWrite.push(dealEmpty(detail.price));
    toWrite.push(dealEmpty(detail.marketPrice));
    toWrite.push(dealEmpty(detail.commentcount));
    toWrite.push(dealEmpty(detail.autolevel));
	toWrite.push(dealEmpty(detail.capacity));
	toWrite.push(dealEmpty(detail.prdattr));
	toWrite.push(dealEmpty(detail.energyConsumption));
	toWrite.push(detail.url);
	return toWrite.join(",")+"\n";
}

//itemid, title, price, mprice, brand, seller, service, commentcount
////model, type(产品规格), hometype, doortype, coldtype， coldmode, energyConsumption, freqtype, capacity, onli    nedate
function buildFriRecord(detail){
    var toWrite = []; 
    toWrite.push(dealEmpty(detail.title));
    toWrite.push(dealEmpty(detail.seller));
    toWrite.push(dealEmpty(detail.delivery));
    toWrite.push(dealEmpty(detail.brand));
    toWrite.push(dealEmpty(detail.model));
    toWrite.push(dealEmpty(detail.itemId));
    toWrite.push(dealEmpty(detail.onlineDate));
    toWrite.push(dealEmpty(detail.price));
    toWrite.push(dealEmpty(detail.marketPrice));
    toWrite.push(dealEmpty(detail.commentcount));
	toWrite.push(dealEmpty(detail.type));
	toWrite.push(dealEmpty(detail.hometype));
	toWrite.push(dealEmpty(detail.doortype));
	toWrite.push(dealEmpty(detail.coldtype));
	toWrite.push(dealEmpty(detail.coldmode));
	toWrite.push(dealEmpty(detail.freqType));
	toWrite.push(dealEmpty(detail.capacity));
	toWrite.push(dealEmpty(detail.energyConsumption));
	toWrite.push(detail.url);
    return toWrite.join(",")+"\n";
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
			for(var page = 1; page <= pagecount; page++) {
				that.doPage(page);
			}
		}
	});
}

Gome.prototype.doPage = function(page) {
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
				that.doDetail(products[i]);
			}
			logger.info("Got %s items in page %s", products.length, page);
		}
	});
}

function getAcDetail(detail, result, $){
	try {		
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
	return detail;
}

//model, type(产品规格), hometype, doortype, coldtype， coldmode, energyConsumption, freqtype, capacity, onlinedate
function getFriDetail(detail, result, $){
	var detail;
	try{
		var itemParam = $("ul.specbox li");
		var model, onlineDate, type, hometype, doortype, coldtype, coldmod, capacity, freqType, energyConsumption;
		var paramTitleCount = 10;
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
			case "上市时间":
				onlineDate = spans.eq(1).text().trim();--paramTitleCount;break;
			case "产品规格":
				type = spans.eq(1).text().trim();--paramTitleCount;break;
			case "适用家庭":
				hometype = spans.eq(1).text().trim();--paramTitleCount;break;
			case "开门方式":
				doortype = spans.eq(1).text().trim();--paramTitleCount;break;
			case "制冷类型":
				coldtype = spans.eq(1).text().trim();--paramTitleCount;break;
			case "制冷方式":
				coldmode = spans.eq(1).text().trim();--paramTitleCount;break;
			case "总容积":
				capacity = spans.eq(1).text().trim();--paramTitleCount;break;
			case "定频/变频":
				freqType = spans.eq(1).text().trim();--paramTitleCount;break;
			case "能效等级":
				energyConsumption = spans.eq(1).text().trim();--paramTitleCount;break;
			default:
				break;
			}
		}
		detail.model = dealstr(model);
		detail.onlineDate = dealstr(onlineDate);
		detail.type = dealstr(type);
		detail.hometype = dealstr(hometype);
		detail.doortype = dealstr(doortype);
		detail.coldtype = dealstr(coldtype);
		detail.coldmode = dealstr(coldmode);
		detail.capacity = dealstr(capacity);
		detail.freqType = dealstr(freqType);
		detail.energyConsumption = dealstr(energyConsumption);
	}
	catch(e){
		logger.error("Error parsing %s", result.uri);
		logger.error(e);
		return ;
	}
	return detail;
}

//model, autolevel, capacity, energyConsumption, prdattr, 
function getWmDetail(detail, result, $){
	try{
		var itemParam = $("ul.specbox li");
		var model, autolevel, prdattr, energyConsumption, capacity;
		var paramTitleCount = 5;
		for(var i = 0; i < itemParam.length; i++) {
			if(!paramTitleCount) {
				break;
			}
			var spans = itemParam.eq(i).find("span");
			if(spans.length != 2) {
				continue;
			}
			switch(spans.eq(0).text().trim()) {
			case "型号名称":
				model = spans.eq(1).text().trim();--paramTitleCount;break;
			case "自动化程度":
				autolevel = spans.eq(1).text().trim();--paramTitleCount;break;
			case "商品属性":
				prdattr = spans.eq(1).text().trim();--paramTitleCount;break;
			case "总容积":
				capacity = spans.eq(1).text().trim();--paramTitleCount;break;
			case "能效等级":
				energyConsumption = spans.eq(1).text().trim();--paramTitleCount;break;
			}
		}
		detail.model = dealstr(model);
		detail.autolevel = dealstr(autolevel);
		detail.prdattr = dealstr(prdattr);
		detail.capacity = dealstr(capacity);
		detail.energyConsumption = dealstr(energyConsumption);	
	}
	catch(e){
		logger.error("Error parsing %s", result.uri);
		logger.error(e);
		return ;
	}
	return detail;
}

function isOfferPrd(keyword, prdinfo){
	var len = 0;
	switch(keyword){
		case '空调':
			len = -2;
		case '洗衣机':
			len = -3;
			break;
		case '冰箱':
			len = -2;
			break;
		default:
			return false;
	}
	if(prdinfo.thirdCategoryName.slice(len) == keyword){
		return true;
	}
	else{
		return false;
	}
}

//itemid, title, price, mprice, brand, seller, service, commentcount
Gome.prototype.doDetail = function(product) {
	that.crawler.queue({
		uri:util.format("http://item.gome.com.cn/%s-%s.html", product.pId, product.skuId),
		priority:0,
		callback:function(error, result, $) {
			if(error) {
				logger.error("Error opening %s", result.uri);
				return;
			}
			var recstr;
			try{
				eval(result.body.match(/var prdInfo = \{([\s\S]*?)\};/)[0]);

				if(!isOfferPrd(that.keyword, prdInfo)) {
					logger.info("%s not a %s", result.uri, that.keyword);
					return;
				} 

				var detail ;
				
				var detail = {
					productId:prdInfo.prdId,
					skuId:prdInfo.sku,
					itemId:prdInfo.skuNo,
					price:prdInfo.price,
					title:prdInfo.prdName,
					marketPrice:prdInfo.gomePrice,
					brand:prdInfo.breadName,
					url:result.uri
				}
				detail.seller = dealstr($(".storeName").attr("title")) || "N/A";
				detail.delivery = dealstr($(".prdService").children().text()) || "N/A";
				detail.commentcount = dealstr($("#pincnt").text()) || "N/A";
			
		//		logger.info(detail);	

				switch(that.keyword){
					case '空调':
						detail = getAcDetail(detail, result, $);
						recstr = buildAcRecord(detail);
						break;
					case '冰箱':
						detail = getFriDetail(detail, result, $);
						recstr = buildFriRecord(detail);
						break;
					case '洗衣机':
						detail = getWmDetail(detail, result, $);
						recstr = buildWmRecord(detail);
						break;
					default:
						return;
				}
			}
			catch(e){
				logger.error("Error parsing %s", result.uri);
				logger.error(e);
				return ;
			}
			

			fs.appendFileSync(that.resultDir+that.resultFile, recstr);
			logger.info("Got %s", detail.itemId);
		}

	});
}

Gome.prototype.init = function() {
	this.keyword = process.argv.splice(2)[0];
	this.resultFile = "gome_"+this.keyword+"_"+moment().format("YYYY-MM-DD")+".txt";
	var logfile = "gome_"+this.keyword+".log";
	switch(this.keyword) {
		case "ac":
			this.keyword = "空调";break;
		case "wm":
			this.keyword="洗衣机";
			break;
		case "fri":
			this.keyword="冰箱";
			break;	
		default:
			//this.keyword = "空调";break;
			logger.info("node gome_s.js <ac|wm|fri>");
			return 1;
	}
	logger.info("Initialization starts");

	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	} 

	logger.add(logger.transports.File, {filename:"../../log/"+logfile, logstash:true, level:"info"});

	logger.info("resultfile name : %s", this.resultFile);
	logger.info("keyword: %s", this.keyword);
	logger.info("Initialization completes");
}
 
Gome.prototype.start = function() {
	if(this.init()){
		return;
	}
	this.run();
}

var that = new Gome();
that.start();
