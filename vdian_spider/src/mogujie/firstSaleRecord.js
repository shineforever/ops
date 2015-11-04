var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')
var Crawler = require("node-webcrawler")

function Mogujie() {
	this.resultFile = '../../result/mogujie_new.txt';
	this.shopResultFile = '../../result/mogujie_shop_new.txt';
	this.breakpointFile = '../../log/breakpoint/breakpoint_new.txt';
	this.processedIdFile = '../../log/breakpoint/processedIds_new.txt';
	this.request_lock = [];
	this.pagelock = [];
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
    this.processed_detail_id = {};
    this.system_date = new Date().toString();
    // to keep track of running state
    this.cur_nidNo = 0;
    this.cur_pageNo = 1;
    this.cur_section = 1;
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
	var breakpoint = fs.readFileSync(this.breakpointFile).toString().split(',');
	if(breakpoint.length > 1) {
		this.cur_nidNo = breakpoint[0];
		this.cur_pageNo = breakpoint[1];
		this.cur_section = breakpoint[2];
	}
	console.log('cur_category: %s, cur_subcategoryNo: %s, cur_nidNo: %s, cur_pageNo: %s', this.cur_category, this.cur_subcategoryNo, this.cur_nidNo, this.cur_pageNo);
	var processedIds = fs.readFileSync(this.processedIdFile).toString().split(',');
	processedIds.pop();
	processedIds.forEach(function(element) {
		that.processed_detail_id[element] = 1;
	});
	this.crawler = new Crawler({
		maxConnections:20,
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
		that.concurrent_on_nid();
	}
}

// concurrent on detail, others in serial mode
Mogujie.prototype.concurrent_on_nid = function() {
	Object.keys(that.category).forEach(function(cat){
	    for(var i = 0; i < that.category[cat].length; i++) {
	        var subcat = Object.keys(that.category[cat][i])[0];
	        that.category[cat][i][subcat].forEach(function(nid){
	        	that.nids.push(nid);
	        	that.nid_cat_mapping[nid] = [cat, subcat];
	        });
	    }
	});
	// console.log(this.nids);
	// console.log(this.nid_cat_mapping);
	this.run();
}

Mogujie.prototype.run = function() {
	that.doNid(8);
}

Mogujie.prototype.doNid = function(nidNo) {
	var nid = that.nids[nidNo];
	console.log('working on nid ', nid);
	that.doPage(nidNo, 1);
}

Mogujie.prototype.doPage = function(nidNo, page) {
	var nid = that.nids[nidNo];
	that.crawler.queue({
		'uri':'http://www.mogujie.com/book/' + that.nid_cat_mapping[nid][0] + '/' + nid + '/' + page,
		'callback':that.doPageCallback,
		'nidNo':nidNo,
		'page':page
	});
}

Mogujie.prototype.doPageCallback = function(error, result, $) {
	var nidNo = result.options.nidNo;
	var page = result.options.page;
	var nid = that.nids[nidNo];
	if(error) {
		console.log('error getting page callback for [nid=%s,page=%s]', nid, page);
		return;
	}
	if(typeof result.body == 'string') {
		if(result.body.search(/MoGu\.APP\.firstData = null/) != -1) {
			console.log('all pages done for [nid=%s]', nid);
			console.log('proceed to the next nid');
			that.doNid(nidNo+1);
			return;
		}
		var book = result.body.match(/",book:"(.*?)",/)[1];
		that.doSection(1, book, nidNo, page);
	}
}

Mogujie.prototype.doSection = function(section, book, nidNo, page) {
	fs.writeFileSync(that.breakpointFile, nidNo + ',' + page + ',' + section);
	var nid = that.nids[nidNo];
	that.crawler.queue({
		'uri':'http://www.mogujie.com/book/ajax?section=' + section + '&book=' + book + '&location=' + that.nid_cat_mapping[nid][0],
		'callback':that.doSectionCallback,
		'nidNo':nidNo,
		'page':page,
		'section':section,
		'book':book
	});
}

Mogujie.prototype.doSectionCallback = function(error, result, $) {
	var nidNo = result.options.nidNo;
	var nid = that.nids[nidNo];
	var page = result.options.page;
	var section = result.options.section;
	var book = result.options.book;
	if(error) {
		console.log('error getting section callback for [nid=%s,page=%s,section=%s]', nid, page, section);
		console.log('proceed to the next page');
		setTimeout(that.doPage(nidNo, page+1), 0);
		// that.doPage(nidNo, page+1);
		// return;
	}
	if(typeof result.body == 'string') {
		var obj = JSON.parse(result.body);
		var isEnd = false;
		if(obj.result.isEnd) {
			isEnd = true;
		}
		var list = obj.result.list;
		if(list.length == 0) {
			console.log('all sections done for [nid=%s,page=%s]', nid, page);
			console.log('proceed to the next page');
			setTimeout(that.doPage(nidNo, page+1), 0);
			// that.doPage(nidNo, page+1);
		}
		list.forEach(function(detail) {
			var url = 'http://www.mogujie.com' + detail.link;
			that.doProduct(url, section, book, nidNo, page, isEnd);
		});		
	}
}

Mogujie.prototype.doProduct = function(url, section, book, nidNo, page, isEnd) {
	that.pagelock.push(0);
	that.crawler.queue({
		'uri':url,
		'callback':that.doProductCallback,
		'nidNo':nidNo,
		'page':page,
		'section':section,
		'book':book,
		'isEnd':isEnd
	});
}

Mogujie.prototype.doProductCallback = function(error, result, $) {
	var isEnd = result.options.isEnd;
	var nidNo = result.options.nidNo;
	var nid = that.nids[nidNo];
	var page = result.options.page;
	var section = result.options.section;
	var book = result.options.book;
	if(error) {
		console.log('error getting product callback for [url=%s]', result.uri);
		that.pagelock.pop();
		if(that.pagelock.length == 0) {
			setTimeout(that.nextPageOrSection(isEnd, nidNo, page, section, book), 0);
			// that.nextPageOrSection(isEnd, nidNo, page, section, book);
		}
		return;
	}
	if(typeof result.body == 'string') {
		var detail_id = result.uri.match(/detail\/(.*)\?/)[1];
		var shopDetail = that.generateShopInfo($);
		var productDetail = that.generateProductInfo($, detail_id, nidNo);
		if(shopDetail == undefined || productDetail == undefined) {
			that.pagelock.pop();
			if(that.pagelock.length == 0) {
				setTimeout(that.nextPageOrSection(isEnd, nidNo, page, section, book), 0);
				// that.nextPageOrSection(isEnd, nidNo, page, section, book);
			}
			return;
		}
		that.crawler.queue({
			'uri':'http://shop.mogujie.com/trade/item_detail/orderlist?itemId=' + detail_id + '&page=1&isNewDetail=1',
			'callback':that.getDealFirstSaleRecord,
			'shopDetail':shopDetail,
			'productDetail':productDetail,
			'isEnd':isEnd,
			'nidNo':nidNo,
			'page':page,
			'section':section,
			'book':book,
			'detailId':detail_id
		});
	}
}

Mogujie.prototype.getDealFirstSaleRecord = function(error, result, $) {
	var isEnd = result.options.isEnd;
	var nidNo = result.options.nidNo;
	var nid = that.nids[nidNo];
	var page = result.options.page;
	var section = result.options.section;
	var book = result.options.book;
	var shopDetail = result.options.shopDetail;
	var productDetail = result.options.productDetail;
	var detail_id = result.options.detailId;
	if(error) {
		console.log('error getting first sale record for [url=%s]', result.uri);
		that.pagelock.pop();
		if(that.pagelock.length == 0) {
			setTimeout(that.nextPageOrSection(isEnd, nidNo, page, section, book), 0);
			// that.nextPageOrSection(isEnd, nidNo, page, section, book);
		}
		return;
	}
	if(typeof result.body == 'string') {
		var obj = JSON.parse(result.body);
		var productSales = obj.result.count;
		var lastPage = that.getLastPage(obj.result.html);
		productDetail = productDetail + productSales + '\t';
		that.crawler.queue({
			'uri':'http://shop.mogujie.com/trade/item_detail/orderlist?itemId=' + detail_id + '&page=' + lastPage,
			'callback':that.getFirstSaleDate,
			'shopDetail':shopDetail,
			'productDetail':productDetail,
			'isEnd':isEnd,
			'nidNo':nidNo,
			'page':page,
			'section':section,
			'book':book,
			'detailId':detail_id
		});
	}
}

Mogujie.prototype.getFirstSaleDate = function(error, result, $) {
	var isEnd = result.options.isEnd;
	var nidNo = result.options.nidNo;
	var nid = that.nids[nidNo];
	var page = result.options.page;
	var section = result.options.section;
	var book = result.options.book;
	var shopDetail = result.options.shopDetail;
	var productDetail = result.options.productDetail;
	var detail_id = result.options.detailId;
	if(error) {
		console.log('error getting first sale date for [url:%s]', result.uri);
		that.pagelock.pop();
		if(that.pagelock.length == 0) {
			setTimeout(that.nextPageOrSection(isEnd, nidNo, page, section, book), 0);
			// that.nextPageOrSection(isEnd, nidNo, page, section, book);
		}
		return;
	}
	if(typeof result.body == 'string') {
		var obj = JSON.parse(result.body);
		var html = obj.result.html;
		var date = that.getlastDate(html);
		productDetail = productDetail + date + '\t' + that.system_date + '\n';
		fs.appendFileSync(that.resultFile, productDetail);
		fs.appendFileSync(that.shopResultFile, shopDetail);
		console.log('[done] detailId = %s', detail_id);
		that.processed_detail_id[detail_id] = 0;
		fs.appendFileSync(that.processedIdFile, detail_id + ',');
		that.pagelock.pop();
		if(that.pagelock.length == 0) {
			setTimeout(that.nextPageOrSection(isEnd, nidNo, page, section, book), 0);
			// that.nextPageOrSection(isEnd, nidNo, page, section, book);
		}
	}
}

Mogujie.prototype.getlastDate = function(html) {
	try {
		var dates = html.match(/(\d){4}-(\d){2}-(\d){2} (\d){2}:(\d){2}:(\d){2}/g);
		if(!dates || dates.length < 1) {
			console.log('error getting last date: [no date found]');
			return '0000-00-00 00:00:00';
		}
		return dates.pop();
	} catch(err) {
		console.log('error getting last date: [exception]');
		return '0000-00-00 00:00:00';
	}
}

Mogujie.prototype.getLastPage = function(html) {
	try {
		var $ = cheerio.load(html);
		var links = $('div.pagination a');
		if(links.length < 2) {
			return 1;
		}
		return links.eq(links.length-2).text().trim();
	} catch(err) {
		console.log('error getting last page, return 1');
		return 1;
	}
}

Mogujie.prototype.generateProductInfo = function($, detail_id, nidNo) {
	try {
		var shopName = $('.shop-name.fl span.name-wrap a').attr('title');
		if(shopName == undefined) {
			shopName = 'blank';
		} else {
			shopName = shopName.trim();
		}
		var productName = $('.goods-title').text().trim();
		var productPrice = $('.price-n').eq(0).text().trim();
		var productCat = that.nid_cat_mapping[that.nids[nidNo]][0];
		var productSubcat = that.nid_cat_mapping[that.nids[nidNo]][1];
		var productDetail = detail_id + '\t' + shopName + '\t' + productCat + '\t' + productSubcat + '\t' + productName + '\t' + productPrice + '\t';
		return productDetail;
	} catch(err) {
		return undefined;
	}
}

Mogujie.prototype.generateShopInfo = function($) {
	try {
		var shopName = $('.shop-name.fl span.name-wrap a').attr('title').trim();
		var shopHref = $('.shop-name.fl span.name-wrap a').attr('href').trim();
		var shopArea = $('ol.li.li3 li').eq(0).contents().eq(1).text().trim();
		var shopGoodCount = $('ol.li.li3 li').eq(1).contents().eq(1).text().trim();
		var shopSalesVolumn = $('ol.li.li3 li').eq(2).contents().eq(1).text().trim();
		var shopCreateTime = $('ol.li.li3 li').eq(3).contents().eq(1).text().trim();
		var averageDeliveryTime = $('ol.li.li4 li').eq(1).contents().eq(1).text().trim() + $('ol.li.li4 li').eq(1).contents().eq(2).text().trim();
		var returnRate = $('ol.li.li4 li').eq(2).contents().eq(1).text().trim() + $('ol.li.li4 li').eq(2).contents().eq(2).text().trim();
		var shopDetail = shopName + '\t' + shopHref + '\t' + shopArea + '\t' + shopGoodCount + '\t' + shopSalesVolumn + '\t' + shopCreateTime + '\t' + averageDeliveryTime + '\t' + returnRate + '\t' + that.system_date + '\n';
		return shopDetail;
	} catch(err) {
		return undefined;
	}
}

Mogujie.prototype.nextPageOrSection = function(isEnd, nidNo, page, section, book) {
	if(isEnd) {
		console.log('all sections done for [nid=%s,page=%s]', this.nids[nidNo], page);
		console.log('proceed to the next page');
		setTimeout(that.doPage(nidNo, page+1), 0);
		// this.doPage(nidNo, page+1);
		// return;
	} else {
		console.log('all products done for [nid=%s,page=%s,section=%s]', this.nids[nidNo], page, section);
		console.log('proceed to the next section');
		setTimeout(that.doSection(section+1, book, nidNo, page), 0);
		// this.doSection(section+1, book, nidNo, page);
		// return;
	}
}

var that = new Mogujie();
that.init();