var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")
var seenreq = require("seenreq")
var logger = require("winston")

var env = process.env.NODE_ENV || "development";
logger.cli();
logger.add(logger.transports.File, {filename:"../../log/tmall_hoods.log", logstash:true, level:"info"});
if(env==="production"){
    logger.remove(logger.transports.Console);
}

// var curDir = '/home/zero/';
var godotTransport = require("winston-godot")
var godot = require("godot")
var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"tmall_hoods"});//service名称需要更改 


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
		var nodotstr = str.replace(/;/g, ' ');
		nodotstr = str.replace(/,/g, ' ');
		return nodotstr.replace(/\s+/g, ' ');
	}
	else{
		return str;
	}
}

function htmlSpctoString(htmlstr){
	while(1){
		var spchars = htmlstr.match(/&#(\d+);/);
		if (spchars && spchars.length>0) {
			var spc = spchars[1];
			var normal = String.fromCharCode(spc);
			htmlstr = htmlstr.replace(spchars[0], normal);
		} else{
			break;
		}
	}
	return htmlstr;
}


function BdaSpider() {
	this.resultDir = "../../result/hoods/";
	this.keyword = process.argv.splice(2)[0];
	this.resultFile = moment().format("YYYY-MM-DD")+".csv"
	this.crawler = new Crawler({
		maxConnections:1,
		rateLimits:1000,
		userAgent:"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:35.0) Gecko/20100101 Firefox/35.0",
		forceUTF8:true,
		jar:true,
		onDrain:function(){logger.info("Job done.");logger.remove(godotTransport);client.close();},
		callback:function(err, results, $){ logger.error("callback err:%s.", result.uri) }
	});
	this.itemIdlist={};
	this.seen = new seenreq();
}

BdaSpider.prototype.init = function() {
	logger.info("Initialization starts");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	fs.writeFileSync(this.resultDir + this.resultFile,'\ufeff标题,品牌,产品ID,店铺,搜索页价格,月成交量,促销价,市场价,评论数,优惠信息,分类,库存,skuid,url\n');
	logger.info("Initialization completes");
	return 0;
}

BdaSpider.prototype.run = function() {
	var url = 'https://list.tmall.com/search_product.htm?sort=s&style=g&active=1&cat=50924003&brand=30837%2C30652%2C30835%2C30834%2C80946&search_condition=23';
	this.addqueue([url], 'LIST', {type:'烟灶消套装'});
	url = 'https://list.tmall.com/search_product.htm?sort=s&style=g&active=1&cat=50938001&brand=30652%2C80946%2C30837%2C30834%2C30835&search_condition=23';
	this.addqueue([url], 'LIST', {type:'消毒柜'});
	url = 'https://list.tmall.com/search_product.htm?sort=s&style=g&active=1&cat=50924004&brand=30652%2C30837%2C30834%2C30835%2C80946&search_condition=23';
	this.addqueue([url], 'LIST', {type:'油烟机'});
	url = 'https://list.tmall.com/search_product.htm?sort=s&style=g&active=1&cat=50936001&brand=30652%2C30835%2C30834%2C30837%2C80946&search_condition=23';
	this.addqueue([url], 'LIST', {type:'燃气灶'});
}

BdaSpider.prototype.callbackfunc = function(error, result, $, functype){
	switch(functype){
		case 'LIST':
			that.processList(error, result, $);
			break;
		case 'ITEM':
			that.processDetail(error, result, $);
			break;
		case 'MORE':
			that.processMoreShop(error, result, $);
			break;
		default:
			break;
	}
}

function checkItemId(urlstr){
	var itemIds = urlstr.match(/(\&|\?)id=(\d+)/);
	if (itemIds && itemIds.length>2) {
		if (!that.itemIdlist[itemIds[2]]) {
			that.itemIdlist[itemIds[2]] = 1;
			return true;
		}
	} 
	return false;
}

BdaSpider.prototype.processList = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result ? result.uri : '');
		return;
	}
	// fs.writeFile(curDir+"tmp/tmp.html", result.body, null);
	// return;
	var type = result.options.type;
	//item list
	var prdlist = $("a.productImg");	
	var pricelist = $('p.productPrice em');
	var shoplist = $("a.productShop-name");
	// var cmtslist = $("p.productStatus span a")
	var orderslist = $("p.productStatus span em")
	var moreDiv = $("div.productShop");
	logger.info("prd len：%d, shop len: %d, price len: %d, orderslist: %d", 
		prdlist.length, shoplist.length, pricelist.length, orderslist.length);
	var urls=[];
	for (var i = 0; i<prdlist.length; i++) {
		// if (moreDiv.eq(i).find('a').length>1) { continue; }
		var link = "http:"+prdlist.eq(i).attr('href');
		var shop = dealstr(shoplist.eq(i).text());
		// var cmts = dealstr(cmtslist.eq(i).text());
		var price = dealstr(pricelist.eq(i).text());
		var orders = dealstr(orderslist.eq(i).text());
		// logger.info("shop: " + shop);
		if (shop.indexOf('旗舰店')!=-1 && checkItemId(link) ) {
			// logger.info("url:%s", link);
			// logger.info("shop: %s, cmts : %s, price: %s, orders: %s", shop, cmts, price, orders);
			// link = 'https://detail.tmall.com/item.htm?id=9957814545&skuId=31502607950&areaId=110000&cat_id=50924003&rn=e7372e1468403854ccfafff013b5e06b&user_id=690422023&is_b=1';
			this.addqueue([link], 'ITEM', {type:type, shop:shop, price: price, orders:orders, priority:3});
			// break;
		}
	}

	//more shop
	var morelinks=$("a.productShop-num");
	logger.info("morelinks len：%d", morelinks.length);
	for (var i = 0; i < morelinks.length; i++) {
		var link = "http:"+morelinks.eq(i).attr('href');
		// logger.info("more url:%s", link);
		this.addqueue([link], 'MORE', {type:type, priority:4});
		// break;
	};

	//next page
	var nextlist = $("a.ui-page-next");
	if (nextlist.length>0) {
		var nextlink = "https://list.tmall.com/search_product.htm"+nextlist.attr('href');
		logger.info("next page: %s", nextlink);
		this.addqueue([nextlink], 'LIST', {type:type});
	}
}

BdaSpider.prototype.processMoreShop = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result.uri);
		return;
	}
	// fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);

	try{
		var type = result.options.type;
		//item list
		var prdlist = $("a.productImg");	
		var pricelist = $('p.proSell-price');
		var shoplist = $("p.proInfo-seller a");
		var orderslist = $("div.productComment p")
		// var cmtslist = $("div.productComment a")
		logger.info("more prd len：%d, shop len: %d, price len: %d, orderslist len:%d", prdlist.length, shoplist.length, pricelist.length, orderslist.length);
		for (var i = 0; i < prdlist.length; i++) {
			var link = "http:"+prdlist.eq(i).attr('href');
			var shop = dealstr(shoplist.eq(i).text());
			// var cmts = dealstr(cmtslist.eq(i).text());
			var price = dealstr(pricelist.eq(i).text());
			var orders = dealstr(orderslist.eq(i).text());
			orders = orders.split(':').length>1?orders.split(':')[1]:orders;
			if (shop.indexOf('旗舰店')!=-1  && checkItemId(link) ) { 
				// logger.info("url:%s", link);
				// logger.info("shop: %s, cmts : %s, price: %s, orders: %s", shop, cmts, price, orders);
				// link = 'https://detail.tmall.com/item.htm?id=9957814545&skuId=31502607950&areaId=110000&cat_id=50924003&rn=e7372e1468403854ccfafff013b5e06b&user_id=690422023&is_b=1';
				this.addqueue([link], 'ITEM', {type:type, shop:shop, price: price, orders:orders, priority:3});
				// break;
			}
		}

		//next page
		var nextlist = $("a.ui-page-next");
		if (nextlist.length>0) {
			var nextlink = "https://list.tmall.com/spu_detail.htm"+nextlist.attr('href');
			logger.info("more next page: %s", nextlink);
			this.addqueue([nextlink], 'MORE', {type:type, priority:4});
		}
	}
	catch(e){
		logger.error("Error getting more shop %s", result.uri);
		return;
	}
}

function getBrand(title){
	if (typeof(title)=='string') {
		var brand = title.match(/方太|美的|老板|华帝|西门子/);
		if (brand && brand.length>0) {  return brand[0];  }
	} 
	return 'N/A';
}

BdaSpider.prototype.processDetail = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		var itemIds = result.uri.match(/(\&|\?)id=(\d+)/);
		var itemId = "N/A"
		if (itemIds && itemIds.length>2) {
			itemId = itemIds[2];
		} 
		logger.info("process Item (%s) start.", itemId);

		var title = dealstr($(".tb-detail-hd h1").text().trim());
		// logger.info("title:%s, itemId:%s", title, itemId);
		 
		var brand = getBrand(title);

		var discount = dealstr($("div.tb-detail-hd p").text());
		// logger.info("discount:%s ", dealstr(discount));
		
		// tm
		var tmlist = $("span.tm-count");
		if (tmlist && tmlist.length>0) {
			var tm_count = dealstr(tmlist.text());
		}
		else {
			var tm_count = 'N/A';
		}

		//
		var skuarr = [];
		try{
			var clsifyobj = JSON.parse(result.body.match(/\{\"api\":[^\)]+\}/)[0]);
			// logger.info("clsifyobj skuList len : %d", clsifyobj.valItemInfo.skuList.length);
			var skulist = clsifyobj.valItemInfo.skuList;
			var skuMap = clsifyobj.valItemInfo.skuMap;			
			for (var i = 0; i < skulist.length; i++) {
				var skuitem = {};
				skuitem.names = skulist[i].names;
				skuitem.stock = skuMap[';'+skulist[i].pvs+';'].stock;
				skuitem.skuId = skulist[i].skuId;
				skuarr.push(skuitem);
			};
		}
		catch(e){
			// fs.writeFile(curDir+"tmp/classification_" + detail.itemId + ".dat", result.body, null);
			logger.error("Error pasre classification: %s", itemId);
			logger.error(e);
		}

		var detail = {
			title:title,
			brand:brand,
			itemId:itemId,
			shop:result.options.shop,
			price:result.options.price,
			orders:result.options.orders,
			cmts:tm_count,
			discount:discount,
			skuarr:skuarr,
			url:result.uri,
			marketPrice:"N/A",
			promotionPrice:"N/A"
		}
	}
	catch(e){
		logger.error("Error getting basic info %s", result.uri);
		return;
	}
	//cmts
	// logger.info("cmts for single request: %s/%s", detail.cmts, dealEmpty(detail.cmts));
	if (dealEmpty(detail.cmts)=='N/A' ) {
		// logger.info("get cmts from single request.");
		that.crawler.queue({
			uri:"http://dsr-rate.tmall.com/list_dsr_info.htm?itemId="+detail.itemId,
			headers:{Referer:result.uri},
			jQuery:false,
			priority:1,
			detail:detail,
			callback:function(error, result) {
				// logger.info("cmts url: %s", result.uri);
				if (error) {
					logger.error("get cmts err:%s", result.options.detail.itemId);
				};
				try{
					// var cmts = eval(result.body);
					var cmtobj=JSON.parse(result.body.match(/jsonp\d+\((.+)\)/)[1]);
					// logger.info("cmts for single request: %d", cmtobj.dsr.rateTotal);
					result.options.detail.cmts =cmtobj.dsr.rateTotal;
				}catch(e){
					// fs.writeFile(curDir+"tmp/cmts_" + detail.itemId + ".dat", result.body, null);
					logger.error("parse cmts err:%s.", result.options.detail.itemId);
					logger.error(e);
				}
			}
		});
	};

	try {
		var priceUrl = result.body.match(/var l,url='(.*)';/)[1];
	} catch(e) {
		logger.error("Error getting price url %s", result.uri);
		// saveData(detail, result.options.type);
		var priceUrl="//detail.tmall.com/item.htm";
		// return;
	}
	that.crawler.queue({
		uri:"http:"+priceUrl,
		headers:{Referer:"http://detail.tmall.com/item.htm"},
		jQuery:false,
		priority:2,
		detail:detail,
		type:result.options.type,
		callback:function(error, result) {
			// logger.info("item price start.");			
			if(error) {
				logger.error(error);
				logger.error("Error getting price info %s", result?resutl.uri:"N/A");
				if (result) {saveData(result.options.detail, result.options.type);}				
				return;
			}
			
			if(!result){
				logger.error("Error result obj.");
				return;
			}

			var detail = result.options.detail;
			// fs.writeFile(curDir+"tmp/price_" + detail.itemId + ".dat", result.body, null);
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
				// fs.writeFile(curDir+"tmp/price_" + detail.itemId + ".dat", result.body, null);
				logger.error("Error parsing price info %s", result.uri);
				logger.error(e);
			}
			saveData(detail, result.options.type);
			// logger.info(detail);
			// logger.info("Item %s got.", detail.itemId);
		}
	});
}

// var detail = {
// 	title:title,
// 	itemId:itemId,
// 	shop:result.options.shop,
// 	price:result.options.price,
// 	cmts:tm_count,
// 	discount:discount,
// 	skuarr:skuarr,
// 	url:result.uri,
// 	marketPrice:"N/A",
// 	promotionPrice:"N/A"
// }
function buildRecord(detail, skuitem) {
	var toWrite = [];
	toWrite.push(detail.title);
	toWrite.push(detail.brand);
	toWrite.push(detail.itemId);
	toWrite.push(detail.shop);
	toWrite.push(detail.price);
	toWrite.push(detail.orders);
	toWrite.push(dealEmpty(detail.promotionPrice));
	toWrite.push(dealEmpty(detail.marketPrice ));
	toWrite.push(dealEmpty(detail.cmts));
	toWrite.push(dealEmpty(detail.discount));
	toWrite.push(skuitem.names);
	toWrite.push(skuitem.stock);
	toWrite.push(skuitem.skuId);
	toWrite.push(detail.url);
	return toWrite.join(",")+"\n";
}

function saveData(detail, type) {
	logger.info("Save Item %s.", detail.itemId);
	var skuarr = detail.skuarr;
	if (!skuarr || skuarr.length==0) {
		var skuitem = {};
		var skuarr = [];
		skuitem.names = 'N/A';
		skuitem.stock = 'N/A';
		skuitem.skuId = 'N/A';
		skuarr.push(skuitem);
	}

	var reclist = "";
	for (var i = 0; i < skuarr.length; i++) {
		reclist = reclist + buildRecord(detail, skuarr[i]);
	};
	// logger.info(reclist);
	fs.appendFileSync(that.resultDir+type+"_"+that.resultFile, reclist);
}

BdaSpider.prototype.addqueue = function(urls, functype, options){
	urls.filter(
		function(url){
			return !this.seen.exists(url);
		},this
	).forEach(
		function(url){
			var option = options||{};
			option.uri = url;
			option.callback = function(error, result, $){
				that.callbackfunc(error, result, $, functype);
			}
			that.crawler.queue(option);
		}
	);
}

BdaSpider.prototype.start = function() {
	if (this.init()) { return; };
	this.run();
}

var that = new BdaSpider();
that.start();
