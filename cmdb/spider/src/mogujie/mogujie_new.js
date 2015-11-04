var fs = require('fs')
var cheerio = require('cheerio')
var Crawler = require("node-webcrawler")

function Mogujie() {
	// params defined for refactor
	this.pagelock = [];
	// params for refactor end here
	this.resultDir = '../../result/';
	this.resultFile = 'mogujie.txt';
	this.shopResultFile = 'mogujie_shop.txt';
    this.breakpointDir = '../../log/breakpoint/';
    this.breakpointFile = 'breakpoint.txt';
    this.processedIdFile = 'processedIds.txt';
    this.category_list = [
    	'clothing',
    	'shoes',
    	'bags',
    	'accessories',
    	'magic'
    ];
    this.category = {};
    this.nids = [];
    this.nid_cat_mapping = {};
    this.request_lock = [];
    this.nid_lock = [];
    this.page_lock = [];
    this.cur_category = 'clothing';
    this.cur_subcategoryNo = 0;
    this.cur_nidNo = 0;
    this.cur_pageNo = 1;
    this.category_flag = false;
    this.subcategory_flag = false;
    this.page_flag = false;
    this.nid_flag = false;
    this.processed_detail_id = {};
    this.system_date = new Date().toString();
}

Mogujie.prototype.init = function() {
	var arguments = process.argv.splice(2);	
	switch(arguments.length) {
		case 0:
			for(var i = 0; i < this.category_list.length; i++) {
				this.category[this.category_list[i]] = [];
			}
			break;
		case 1:
			this.category[this.category_list[arguments[0]-1]] = [];
			break;
		case 2:
			for(var i = arguments[0]-1; i < arguments[1]; i++) {
				this.category[this.category_list[i]] = [];
			}
			break;
		default:
			var warning = ('No more than two arguments can be accepted. Instructions are listed as below:\n' + 
				'category_list: [\'clothing\',\'shoes\',\'bags\',\'accessories\',\'magic\']\n' + 
				'If one argument is given, the corresponding category will be chosen and processed.\n' + 
				'e.g.\n' + '\t>>node mogujie.js 2\n' + 'shoes will be chosen and processed\n' + 
				'If two arguments are given, the corresponding range of categories will be chosen and processed.\n' + 
				'e.g.\n' + '\t>>node mogujie.js 2 4\n' + 'shoes, bags and accessories will be chosen and processed.\n')
			console.log(warning)
			break;
	}
	var breakpoint = fs.readFileSync(this.breakpointDir+this.breakpointFile).toString().split(',');
	if(breakpoint.length > 1) {
		this.cur_category = breakpoint[0];
		this.cur_subcategoryNo = breakpoint[1];
		this.cur_nidNo = breakpoint[2];
		this.cur_pageNo = breakpoint[3];
	}
	console.log('cur_category: %s, cur_subcategoryNo: %s, cur_nidNo: %s, cur_pageNo: %s', this.cur_category, this.cur_subcategoryNo, this.cur_nidNo, this.cur_pageNo);
	var processedIds = fs.readFileSync(this.breakpointDir+this.processedIdFile).toString().split(',');
	processedIds.pop();
	processedIds.forEach(function(element) {
		that.processed_detail_id[element] = 1;
	});
	this.crawler = new Crawler({
		maxConnections:20,
		jar:true,
		// rateLimits:1000,
		userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"
    });
	this.initCategoryInfo();
}

Mogujie.prototype.initCategoryInfo = function() {
	console.log('Initialization of category info starts');
	for(var property in this.category) {
		this.request_lock.push(0);
		this.getSubCategory(property);
	}
}

Mogujie.prototype.getSubCategory = function(property) {
	var url = 'http://www.mogujie.com/book/' + property;
	this.crawler.queue({
		'uri':url,
		'callback':that.getSubCategoryCallback,
		'property':property
	});
}

Mogujie.prototype.getSubCategoryCallback = function(error, result, $) {
	console.log('callback for ' + result.options.property);
	if(error) {
		console.log(result.uri);
		console.log(error);
		return;
	}
	var property = result.options.property;
	var type_section_list = property == 'magic' ? $('dl.fl') : $('.type_section');
	for(var i = 0; i < type_section_list.length; i++) {
		var subcategory = $('dt', type_section_list.eq(i)).text().replace(/[a-z]/gi, '');
		var nids = [];
		var nid_list = $('dd a', type_section_list.eq(i));
		for(var j = 0; j < nid_list.length; j++) {
			nids.push(nid_list.eq(j).attr('href').match(/\/(\d*)\?from/)[1]);
		}
		var o = {};
		o[subcategory]=nids;
		that.category[property].push(o);
	}
	that.request_lock.pop();
	if(that.request_lock.length == 0) {
		console.log(JSON.stringify(that.category));
		console.log('Initialization of category info completes');
		that.run();
		// that.concurrent_on_nid();
	}
}

Mogujie.prototype.run = function() {
	Object.keys(that.category).forEach(function(cat){
	    for(var i = 0; i < that.category[cat].length; i++) {
	        var subcat = Object.keys(that.category[cat][i])[0];
	        var nids = that.category[cat][i][subcat];
	        console.log('first level category: ' + cat + '\t' + 'second level category: ' + subcat + '\n' + 'nids: ' + nids);
	    }
	});
	that.processCategory(0);
}

Mogujie.prototype.processCategory = function(categoryNo) {
	if(categoryNo >= Object.keys(that.category).length) {
		console.log('end of processCategory');
		return;
	}
	if(Object.keys(that.category)[categoryNo] == that.cur_category) {
		that.category_flag = true;
	}
	if(!that.category_flag) {
		that.processCategory(categoryNo+1);
		return;
	}
	console.log('processing [category:%s]', Object.keys(that.category)[categoryNo]);
	that.processSubCategory(categoryNo, 0);
}

Mogujie.prototype.processSubCategory = function(categoryNo, subcategoryNo) {
	var cat = Object.keys(that.category)[categoryNo];
	if(subcategoryNo >= that.category[cat].length) {
		console.log('end of processSubCategory [category:%s]', cat);
		that.processCategory(categoryNo+1);
		return;
	}
	if(subcategoryNo == that.cur_subcategoryNo) {
		that.subcategory_flag = true;
	}
	if(!that.subcategory_flag) {
		that.processSubCategory(categoryNo, subcategoryNo+1);
		return;
	}
	var subcat = Object.keys(that.category[cat][subcategoryNo])[0];
	console.log('processing [category:%s,subcategory:%s]', cat, subcat);
	that.processNid(categoryNo, subcategoryNo, 0);
}

Mogujie.prototype.processNid = function(categoryNo, subcategoryNo, nidNo) {
	var cat = Object.keys(that.category)[categoryNo];
	var subcat = Object.keys(that.category[cat][subcategoryNo])[0];
	if(nidNo >= that.category[cat][subcategoryNo][subcat].length) {
		console.log('end of processNid [category:%s,subcategory:%s]', cat, subcat);
		that.processSubCategory(categoryNo, subcategoryNo+1);
		return;
	}
	if(nidNo == that.cur_nidNo) {
		that.nid_flag = true;
	}
	if(!that.nid_flag) {
		that.processNid(categoryNo, subcategoryNo, nidNo+1);
		return;
	}
	that.nid_lock = [];
	var nid = that.category[cat][subcategoryNo][subcat][nidNo];
	// if(nid != 18036 && nid != 17689) {
	// if(nid != 17777) {
	// 	console.log(nid);
	// 	that.processNid(categoryNo, subcategoryNo, nidNo+1);
	// 	return;
	// }
	console.log('processing [category:%s,subcategory:%s,nid:%s]', cat, subcat, nid);
	that.getPage(1, categoryNo, subcategoryNo, nidNo);
}

Mogujie.prototype.getPage = function(page, categoryNo, subcategoryNo, nidNo) {
	if(page > 100) {
		that.nid_lock = [];
		that.page_lock = [];
		that.processNid(categoryNo, subcategoryNo, nidNo+1);
		return;
	}
	if(page == that.cur_pageNo) {
		that.page_flag = true;
	}
	if(!that.page_flag) {
		that.getPage(page+1, categoryNo, subcategoryNo, nidNo);
		return;
	}
	var cat = Object.keys(that.category)[categoryNo];
	var breakpoint = '' + cat + ',' + subcategoryNo + ',' + nidNo + ',' + page;
	fs.writeFileSync(that.breakpointDir+that.breakpointFile, breakpoint);
	var subcat = Object.keys(that.category[cat][subcategoryNo])[0];
	var nid = that.category[cat][subcategoryNo][subcat][nidNo];
	console.log('processing [category:%s,subcategory:%s,nid:%s,page:%s]', cat, subcat, nid, page);
	that.nid_lock.push(0);
	that.crawler.queue({
		'uri':'http://www.mogujie.com/book/' + cat + '/' + nid + '/' + page,
		'callback':that.getPageCallback,
		'cat':cat,
		'subcat':subcat,
		'nid':nid,
		'page':page,
		'categoryNo':categoryNo,
		'subcategoryNo':subcategoryNo,
		'nidNo':nidNo
	});
}

Mogujie.prototype.getPageCallback = function(error, result, $) {
	console.log('callback for ' + result.uri);
	var categoryNo = result.options.categoryNo;
	var subcategoryNo = result.options.subcategoryNo;
	var nidNo = result.options.nidNo;
	if(error) {
		console.log(result.uri);
		console.log(error);
		that.nid_lock.pop();
		if(that.nid_lock.length == 0) {
			that.processNid(categoryNo, subcategoryNo, nidNo+1);
		}
		return;
	}	
	if(typeof result.body == 'string') {
		if(result.body.search(/MoGu\.APP\.firstData = null/) != -1) {
			console.log(result.uri)
			console.log('end of page: %s', result.options.page);
			that.nid_lock.pop();
			that.processNid(categoryNo, subcategoryNo, nidNo+1);
			return;
		}
		console.log(result.uri)
		fs.writeFileSync('../../result/funny.txt', result.body);
		var book = result.body.match(/",book:"(.*?)",/)[1];
		var location = result.options.cat;
		var subcat = result.options.subcat;
		var nid = result.options.nid;
		var page = result.options.page;
		that.page_lock = [];
		that.getSection(1, book, categoryNo, nidNo, page, subcategoryNo);
		return;
	}
}

Mogujie.prototype.getSection = function(section, book, categoryNo, nidNo, page, subcategoryNo) {
	var location = Object.keys(that.category)[categoryNo];
	var subcat = Object.keys(that.category[location][subcategoryNo])[0];
	var nid = that.category[location][subcategoryNo][subcat][nidNo];
	console.log('sending [nid: %s, page: %s, section: %s]', nid, page, section);
	// that.page_lock.push(0);
	that.crawler.queue({
		'uri':'http://www.mogujie.com/book/ajax?section=' + section + '&book=' + book + '&location=' + location,
		'callback':that.getSectionCallback,
		'cat':location,
		'nid':nid,
		'page':page,
		'section':section,
		'book':book,
		'subcat':subcat,
		'categoryNo':categoryNo,
		'subcategoryNo':subcategoryNo,
		'nidNo':nidNo
	});
}

Mogujie.prototype.getSectionCallback = function(error, result, $) {
	var nid = result.options.nid;
	var page = result.options.page;
	var section = result.options.section;
	var categoryNo = result.options.categoryNo;
	var subcategoryNo = result.options.subcategoryNo;
	var nidNo = result.options.nidNo;
	console.log('callback for [nid: %s,page: %s,section: %s]', nid, page, section);
	if(error) {
		console.log(result.uri);
		console.log(error);
		// that.page_lock.pop();
		// if(that.page_lock.length == 0) {
			that.getPage(page+1, categoryNo, subcategoryNo, nidNo);
		// }
		return;
	}
	if(typeof result.body == 'string') {
		var obj = JSON.parse(result.body);
		var cat = result.options.cat;
		var book = result.options.book;
		var subcat = result.options.subcat;
		var list = obj.result.list;
		if(list == null) {
			console.log('end of ajax for [cat=%s,nid=%s,page=%s]', cat, nid, page);
			that.getPage(page+1, categoryNo, subcategoryNo, nidNo);
			return;
		}
		list.forEach(function(detail) {
			var url = 'http://www.mogujie.com' + detail.link;
			that.processDetail(url, cat, subcat);
		});
		if(obj.result.isEnd) {
			console.log('end of ajax for [cat=%s,nid=%s,page=%s]', cat, nid, page);
			that.getPage(page+1, categoryNo, subcategoryNo, nidNo);
			return;
		}
		that.getSection(section+1, book, categoryNo, nidNo, page, subcategoryNo);
		return;
	}
}

Mogujie.prototype.processDetail = function(url, cat, subcat) {
	var detail_id = url.match(/detail\/(.*)\?/)[1];
	if(that.processed_detail_id[detail_id]) {
		console.log('already processed: [detail_id=%s]', detail_id);
		return;
	}
	that.crawler.queue({
		'uri':url,
		'callback':that.getDealAndShop,
		'detailId':detail_id,
		'cat':cat,
		'subcat':subcat
	});
}

Mogujie.prototype.getDealAndShop = function(error, result, $) {
	// console.log(result.uri);
	var detail_id = result.options.detailId;
	if(error) {
		console.log('error getting details for detail_id = ', detail_id);
		console.log(error);
		return;
	}
	if(typeof result.body == 'string') {
		var shopName_beforeTrim = $('.shop-name.fl span.name-wrap a').attr('title');
		if(shopName_beforeTrim == undefined) {
			return;
		}
		var shopName = shopName_beforeTrim.trim();
		var shopHref = $('.shop-name.fl span.name-wrap a').attr('href').trim();
		var shopArea = $('ol.li.li3 li').eq(0).contents().eq(1).text().trim();
		var shopGoodCount = $('ol.li.li3 li').eq(1).contents().eq(1).text().trim();
		var shopSalesVolumn = $('ol.li.li3 li').eq(2).contents().eq(1).text().trim();
		var shopCreateTime = $('ol.li.li3 li').eq(3).contents().eq(1).text().trim();
		var averageDeliveryTime = $('ol.li.li4 li').eq(1).contents().eq(1).text().trim() + $('ol.li.li4 li').eq(1).contents().eq(2).text().trim();
		var returnRate = $('ol.li.li4 li').eq(2).contents().eq(1).text().trim() + $('ol.li.li4 li').eq(2).contents().eq(2).text().trim();
		var shopDetail = shopName + '\t' + shopHref + '\t' + shopArea + '\t' + shopGoodCount + '\t' + shopSalesVolumn + '\t' + shopCreateTime + '\t' + averageDeliveryTime + '\t' + returnRate + '\t' + that.system_date + '\n';
		fs.appendFileSync(that.resultDir+that.shopResultFile, shopDetail);
		var productName = $('.goods-title').text().trim();
		var productPrice = $('.price-n').eq(0).text().trim();
		var productCat = result.options.cat;
		var productSubcat = result.options.subcat;
		var productDetail = detail_id + '\t' + shopName + '\t' + productCat + '\t' + productSubcat + '\t' + productName + '\t' + productPrice + '\t' + that.system_date + '\n';
		fs.appendFileSync(that.resultDir+that.resultFile, productDetail);
		console.log('[done] detailId = %s', detail_id);
		that.processed_detail_id[detail_id] = 0;
		// console.log('writing detail_id to file: ', detail_id);
		fs.appendFileSync(that.breakpointDir+that.processedIdFile, detail_id + ',');
		// that.crawler.queue({
		// 	'uri':'http://shop.mogujie.com/trade/item_detail/orderlist?itemId=' + detail_id + '&page=1&isNewDetail=1',
		// 	'callback':that.getDealFirstSaleRecord,
		// 	'detailId':detail_id,
		// 	'productCat':productCat,
		// 	'productSubcat':productSubcat,
		// 	'shopName':shopName,
		// 	'productName':productName,
		// 	'productPrice':productPrice
		// });
	}
}

Mogujie.prototype.getDealFirstSaleRecord = function(error, result, $) {
	var detail_id = result.options.detailId;
	var shopName = result.options.shopName;
	var productCat = result.options.productCat;
	var productSubcat = result.options.productSubcat;
	var productName = result.options.productName;
	var productPrice = result.options.productPrice;
	if(error) {
		console.log('error getting first sale record for detail_id = ', detail_id);
		console.log(error);
		var productSales = 'error';
		var firstPurchaseDate = '0000-00-00 00:00:00';
		var dealDetail = shopName + '\t' + productCat + '\t' + productSubcat + '\t' + productName + '\t' + productPrice + '\t' + productSales + '\t' + firstPurchaseDate + '\t' + that.system_date + '\n';
		fs.appendFileSync(that.resultDir+that.resultFile, dealDetail);
		that.processed_detail_id[detail_id] = 1;
		var ids = Object.keys(that.processed_detail_id).join();
		fs.writeFileSync(that.breakpointDir+that.processedIdFile, ids);
		return;
	}
	if(typeof result.body == 'string') {
		var obj = JSON.parse(result.body);
		var productSales = obj.result.count;
		var html = obj.result.html;
		var load = cheerio.load(html);
		var a = load('a');
		console.log(a.length-2);
		if(a.length < 2) {
			console.log('only one page of sales record for detail_id = ', detail_id);
			var firstPurchaseDate = '0000-00-00 00:00:00';
			var dealDetail = shopName + '\t' + productCat + '\t' + productSubcat + '\t' + productName + '\t' + productPrice + '\t' + productSales + '\t' + firstPurchaseDate + '\t' + that.system_date + '\n';
			fs.appendFileSync(that.resultDir+that.resultFile, dealDetail);
			that.processed_detail_id[detail_id] = 1;
			var ids = Object.keys(that.processed_detail_id).join();
			fs.writeFileSync(that.breakpointDir+that.processedIdFile, ids);
			return;
		}
		var lastPage = a.eq(a.length-2).text().trim();
		that.crawler.queue({
			'uri':'http://shop.mogujie.com/trade/item_detail/orderlist?itemId=' + detail_id + '&page=' + lastPage,
			'callback':that.getDealDetail,
			'detailId':detail_id,
			'productCat':productCat,
			'productSubcat':productSubcat,
			'shopName':shopName,
			'productName':productName,
			'productPrice':productPrice,
			'productSales':productSales
		});
	}
}

Mogujie.prototype.getDealDetail = function(error, result, $) {
	var detail_id = result.options.detailId;
	var shopName = result.options.shopName;
	var productCat = result.options.productCat;
	var productSubcat = result.options.productSubcat;
	var productName = result.options.productName;
	var productPrice = result.options.productPrice;
	var productSales = result.options.productSales;
	var firstPurchaseDate = '0000-00-00 00:00:00';
	if(error) {
		console.log('error getting first sale record for detail_id = ', detail_id);
		console.log(error);
		var dealDetail = shopName + '\t' + productCat + '\t' + productSubcat + '\t' + productName + '\t' + productPrice + '\t' + productSales + '\t' + firstPurchaseDate + '\t' + that.system_date + '\n';
		fs.appendFileSync(that.resultDir+that.resultFile, dealDetail);
		that.processed_detail_id[detail_id] = 1;
		var ids = Object.keys(that.processed_detail_id).join();
		fs.writeFileSync(that.breakpointDir+that.processedIdFile, ids);
		return;
	}
	if(typeof result.body == 'string') {
		console.log(result.uri);
		var obj = JSON.parse(result.body);
		var html = obj.result.html;
		var dates = html.match(/(\d){4}-(\d){2}-(\d){2} (\d){2}:(\d){2}:(\d){2}/g);
		if(!dates || dates.length < 1) {
			console.log('error getting first sale record for detail_id = ', detail_id);
			console.log('no date found');
			var dealDetail = shopName + '\t' + productCat + '\t' + productSubcat + '\t' + productName + '\t' + productPrice + '\t' + productSales + '\t' + firstPurchaseDate + '\t' + that.system_date + '\n';
			fs.appendFileSync(that.resultDir+that.resultFile, dealDetail);
			that.processed_detail_id[detail_id] = 1;
			var ids = Object.keys(that.processed_detail_id).join();
			fs.writeFileSync(that.breakpointDir+that.processedIdFile, ids);
			return;
		}
		firstPurchaseDate = dates.pop();
		var dealDetail = shopName + '\t' + productCat + '\t' + productSubcat + '\t' + productName + '\t' + productPrice + '\t' + productSales + '\t' + firstPurchaseDate + '\t' + that.system_date + '\n';
		fs.appendFileSync(that.resultDir+that.resultFile, dealDetail);
		that.processed_detail_id[detail_id] = 1;
	}
}


var that = new Mogujie();
that.init();