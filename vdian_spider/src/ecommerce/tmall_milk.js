var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")
var seenreq = require("seenreq")
var logger = require("winston")
var env = process.env.NODE_ENV || "development";
logger.cli();
if(env==="production"){
    logger.add(logger.transports.File, {filename:"../../log/tmall_airconditioner.log", logstash:true, level:"info"});
    logger.remove(logger.transports.Console);
}

// title:title,
// itemId:itemId,
// shop:result.options.shop,
// price:result.options.price,
// cmts:result.options.cmts,
// url:result.uri,
// size:size,
// lct:lct,
// marketPrice:"N/A",
// promotionPrice:"N/A"
function buildAcRecord(detail) {
	var toWrite = [];
	toWrite.push(detail.title);
	toWrite.push(detail.itemId);
	toWrite.push(detail.shop);
	toWrite.push(detail.price);
	toWrite.push(dealEmpty(detail.promotionPrice));
	toWrite.push(dealEmpty(detail.marketPrice ));
	toWrite.push(dealEmpty(detail.cmts));
	toWrite.push(detail.size);
	toWrite.push(detail.lct);
	toWrite.push(detail.url);
	return toWrite.join(",")+"\n";
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

function Tmall() {
	this.resultDir = "../../result/milk/";
	this.keyword = process.argv.splice(2)[0];
	this.resultFile = moment().format("YYYY-MM-DD")+".csv"
	this.crawler = new Crawler({
		maxConnections:1,
		rateLimits:1000,
		userAgent:"Mozilla/5.0",
		forceUTF8:true,
		jar:true,
		onDrain:function(){logger.info("Job done.")},
		callback:function(err, results, $){ logger.error("callback err:%s.", result.uri) }
	});

	this.seen = new seenreq();
}

Tmall.prototype.init = function() {
	logger.info("Initialization starts");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	logger.info("Initialization completes");
}

Tmall.prototype.run = function() {
	var url = util.format("https://list.tmall.com/search_product.htm?cat=50099987&q=%s&sort=s&type=pc&style=g", encodeURIComponent('金典'));
	this.addqueue([url], 'LIST', {type:'金典'});
	
	url = util.format("https://list.tmall.com/search_product.htm?cat=55052003&q=%s&sort=s&type=pc&style=g", encodeURIComponent('特仑苏'));
	this.addqueue([url], 'LIST', {type:'特仑苏'});

	url = util.format("https://list.tmall.com/search_product.htm?cat=50099987&q=%s&sort=s&style=g", encodeURIComponent('光明优+'));
	this.addqueue([url], 'LIST', {type:'光明优+'});

	url = util.format("https://list.tmall.com/search_product.htm?cat=55052003&q=%s&type=p&sort=s&style=g", encodeURIComponent('圣牧牛奶'));
	this.addqueue([url], 'LIST', {type:'圣牧牛奶'});

	url = util.format("https://list.tmall.com/search_product.htm?cat=50099987&q=%s&sort=s&style=g", encodeURIComponent('现代牧业'));
	this.addqueue([url], 'LIST', {type:'现代牧业'});

	url = "https://list.tmall.com/search_product.htm?cat=53602006&aldid=159356&sort=s&type=pc&style=g";
	this.addqueue([url], 'LIST', {type:'进口'});

	url = "https://list.tmall.com/search_product.htm?cat=51256001&aldid=294137&prop=6932095:4097935";
	this.addqueue([url], 'LIST', {type:'婴儿1段'});

	url = "https://list.tmall.com/search_product.htm?cat=51256001&aldid=294137&prop=6932095:3311711";
	this.addqueue([url], 'LIST', {type:'婴儿2段'});

	url = "https://list.tmall.com/search_product.htm?cat=51256001&aldid=294137&prop=6932095:3311919";
	this.addqueue([url], 'LIST', {type:'婴儿3段'});

	url = "https://list.tmall.com/search_product.htm?cat=51256001&aldid=294137&prop=6932095:3970319";
	this.addqueue([url], 'LIST', {type:'婴儿4段'});
}

Tmall.prototype.callbackfunc = function(error, result, $, functype){
	switch(functype){
		case 'LIST':
			that.processList(error, result, $);
			break;
		case 'ITEM':
			that.processDetail(error, result, $);
			break;
		default:
			break;
	}
}

Tmall.prototype.addqueue = function(urls, functype, options){
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

Tmall.prototype.processList = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result.uri);
		return;
	}
	// fs.writeFile("/home/zero/tmp.html", result.body, null);
	// fs.writeFile("/home/zero/tmp.html", $('div#bd').text(), null);
	// return;
	var type = result.options.type;
	//item list
	var prdlist = $("a.productImg");	
	var pricelist = $('p.productPrice em');
	var shoplist = $("a.productShop-name");
	var cmtslist = $("p.productStatus span a")
	logger.info("prd len：%d, shop len: %d, cmts len: %d, price len: %d", prdlist.length, shoplist.length, cmtslist.length, pricelist.length);
	var urls=[];
	for (var i = prdlist.length - 1; i >= 0; i--) {
		var link = "http:"+prdlist.eq(i).attr('href');
		var shop = dealstr(shoplist.eq(i).text());
		var cmts = dealstr(cmtslist.eq(i).text());
		var price = dealstr(pricelist.eq(i).text());
		// logger.info("url:%s", link);
		// logger.info("shop: %s, cmts : %s, price: %s", shop, cmts, price);
		// link = "https://detail.tmall.com/item.htm?spm=a220m.1000858.1000725.91.NmL7Gq&id=14199325875&areaId=110000&sku=6932095:4097935&cat_id=51256001&rn=be87c0721fb5282c2e96e02009797d4e&standard=1&user_id=819554291&is_b=1";
		// link = "https://detail.tmall.hk/hk/item.htm?id=37055759077&skuId=4611686055483146981&areaId=110000&sku=6932095:4097935&cat_id=51256001&rn=472c3ebc01859aaae33abaa8931e8bea&standard=1&user_id=1879194783&is_b=1";
		this.addqueue([link], 'ITEM', {type:type, shop:shop, cmts:cmts, price: price, priority:3});
		// break;
	}
	
	//next page
	var nextlist = $("a.ui-page-next");
	if (nextlist.length>0) {
		var nextlink = "https://list.tmall.com/search_product.htm"+nextlist.attr('href');
		// logger.info("next page: %s", nextlink);
		this.addqueue([nextlink], 'LIST', {type:type});
	};
}

function jsonp128(cmtsobj){
	return cmtsobj.dsr.rateTotal;
}

Tmall.prototype.processDetail = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result.uri);
		return;
	}
	try {		
		fs.writeFile("/home/zero/tmp.html", result.body, null);
		var itemIds = result.uri.match(/(\&|\?)id=(\d+)/);
		var itemId = "N/A"
		if (itemIds && itemIds.length>2) {
			var itemId = itemIds[2];
		} 
		logger.info("process Item (%s) start.", itemId);

		var title = dealstr($(".tb-detail-hd h1").text().trim());
		// logger.info("title:%s, itemId:%s", title, itemId);
		
		// tm
		var tmlist = $("span.tm-count");
		if (tmlist) {
			var tm_count = dealstr(tmlist.text());
		}
		else {
			var tm_count = result.options.cmts;
		}
		// logger.info("cmts : %s", tm_count);

		var bodystr = result.body;
		bodystr = bodystr.replace(/(&amp;)+/g, ' ');
		bodystr = bodystr.replace(/(&nbsp;)+/g, ' ');
		var index = bodystr.indexOf('规格');
		var size = 'N/A';
		if (index!=-1) {
			size = htmlSpctoString(bodystr.substring(index, index+100));
			size = dealstr(size);
		};

		var lct = 'N/A';
		index = bodystr.indexOf('产地');
		if (index!=-1) {
			lct = htmlSpctoString(bodystr.substring(index, index+100));
			lct = dealstr(lct);
		};

		var detail = {
			title:title,
			itemId:itemId,
			shop:result.options.shop,
			price:result.options.price,
			cmts:tm_count,
			url:result.uri,
			size:size,
			lct:lct,
			marketPrice:"N/A",
			promotionPrice:"N/A"
		}
	} catch(e) {
		logger.error("Error getting basic info %s", result.uri);
		return;
	}
	logger.info("Item %s basic info got.", detail.itemId);

	//cmts
	// logger.info("cmts for single request: %s/%s", detail.cmts, dealEmpty(detail.cmts));
	if (dealEmpty(detail.cmts)=='N/A' || result.options.type.indexOf('婴儿')!=-1) {
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
			// fs.writeFile("/home/zero/tmp.dat", result.body, null);
			
			if(error) {
				logger.error(error);
				logger.error("Error getting price info %s", result?resutl.uri:"N/A");
				saveData(detail, result.options.type);
				return;
			}
			
			if(!result){
				logger.error("Error result obj.");
				return;
			}

			var detail = result.options.detail;
			try {				
				var priceInfo = JSON.parse(result.body).defaultModel.itemPriceResultDO.priceInfo.def;
				if(priceInfo.promotionList) {
					detail.marketPrice = priceInfo.price;
					detail.promotionPrice = priceInfo.promotionList[0].price;
				} else {
					detail.marketPrice = priceInfo.price;
					detail.promotionPrice = priceInfo.price;
				}
			} catch(e) {
				logger.error("Error parsing price info %s", result.uri);
				logger.error(e);
			}
			saveData(detail, result.options.type);
			// logger.info("Item %s got.", detail.itemId);
		}
	});
}

function saveData(detail, type) {
	logger.info("save data: %s", type);
	fs.appendFileSync(that.resultDir+type+"_"+that.resultFile, buildAcRecord(detail));
}

Tmall.prototype.start = function() {
	// logger.info(htmlSpctoString('&nbsp;&#33406;&#24681;&#25705;&#23572;&#65288;&#29233;&#23572;&#20848;&#65289;'));
	// return ;
	this.init();
	this.run();
}

var that = new Tmall();
that.start();
