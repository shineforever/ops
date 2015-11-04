var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')
var Crawler = require("node-webcrawler")

function Mogujie() {
	this.resultFile = '../../result/mogujie_salerecord.txt';
	this.idFile = '../../log/mogujieIds.txt';
	this.idToProcess = [];
	this.processedIds = {};
}

Mogujie.prototype.init = function() {
	this.idToProcess = fs.readFileSync(this.idFile).toString().split(',');
	if(fs.existsSync(this.resultFile)) {
		var lines = fs.readFileSync(this.resultFile).toString().split('\n');
		lines.forEach(function(line){
			var id = line.split('\t')[0];
			that.processedIds[id] = 0;
		});
	}
	this.idToProcess = this.idToProcess.filter(function(id){
		return that.processedIds[id] != 0;
	});
	console.log('total tasks: %s', this.idToProcess.length);
	this.crawler = new Crawler({
		maxConnections:40,
		userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"
    });
	this.run();
}

Mogujie.prototype.run = function() {
	for(var i = 0; i < 40; i++) {
		this.doNextId();
	}
}

Mogujie.prototype.doNextId = function() {
	if(that.idToProcess.length <= 0) {
		console.log('[job done]');
		return;
	}
	var detailId = that.idToProcess.shift();
	that.crawler.queue({
		'uri':'http://shop.mogujie.com/trade/item_detail/orderlist?itemId=' + detailId + '&page=1&isNewDetail=1',
		'callback':that.getFirstSaleRecord,
		'detailId':detailId
	});
	console.log('[Info] tasks left: %s', that.idToProcess.length);
}

Mogujie.prototype.getFirstSaleRecord = function(error, result, $) {
	var detailId = result.options.detailId;
	if(error) {
		console.log('[error] detailId = %s, error getting first page of orderlist', detailId);
		setTimeout(that.doNextId(), 0);
		return;
	}
	if(typeof result.body == 'string') {
		var obj = JSON.parse(result.body);
		var productSales = obj.result.count;
		var html = obj.result.html;
		var lastPage = that.getLastPage(html);
		if(lastPage == 1) {
			var date = that.getlastDate(html, detailId);
			fs.appendFileSync(that.resultFile, detailId + '\t' + productSales + '\t' + date + '\n');
			console.log('[done] detailId = %s', detailId);
			setTimeout(that.doNextId(), 0);
			return;
		}
		that.crawler.queue({
			'uri':'http://shop.mogujie.com/trade/item_detail/orderlist?itemId=' + detailId + '&page=' + lastPage,
			'callback':that.getFirstSaleDate,
			'detailId':detailId,
			'productSales':productSales
		});
	}
}

Mogujie.prototype.getFirstSaleDate = function(error, result, $) {
	var detailId = result.options.detailId;
	if(error) {
		console.log('[error] detailId = %s, error getting first sale record', detailId);
		setTimeout(that.doNextId(), 0);
		return;
	}
	if(typeof result.body == 'string') {
		var obj = JSON.parse(result.body);
		var html = obj.result.html;
		var date = that.getlastDate(html, detailId);
		var productSales = result.options.productSales;
		fs.appendFileSync(that.resultFile, detailId + '\t' + productSales + '\t' + date + '\n');
		console.log('[done] detailId = %s', detailId);
		setTimeout(that.doNextId(), 0);
		return;
	}
}

Mogujie.prototype.getlastDate = function(html, detailId) {
	try {
		var dates = html.match(/(\d){4}-(\d){2}-(\d){2} (\d){2}:(\d){2}:(\d){2}/g);
		if(!dates || dates.length < 1) {
			console.log('[no sale record] detailId = %s', detailId);
			return '0000-00-00 00:00:00';
		}
		return dates.pop();
	} catch(err) {
		console.log('[exception getting date] detailId = %s', detailId);
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

var that = new Mogujie();
that.init();