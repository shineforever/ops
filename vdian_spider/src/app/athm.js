var fs = require('fs')
var Crawler = require("node-webcrawler")

if(!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  };
}

function Athm() {
	this.resultFile = '../../result/athm.txt';
	this.contextFile = '../../log/breakpoint/athm_processedIds.txt';
	this.today = new Date().toString();
	this.brandids = [];
	this.seriesids = [];
	this.brands = {};
	this.series = {};
	this.lock = [];
	this.processedIds = {};
	this.crawler = new Crawler({
		maxConnections:20,
		userAgent:"Android 2.3 autohome 3.9.0 Android"
    });
}

Athm.prototype.init = function() {
	var ids = fs.readFileSync(this.contextFile).toString().split(',');
	ids.pop();
	ids.forEach(function(id){
		that.processedIds[id] = 0;
	});
	console.log('[INFO] {0} series already been processed'.format(ids.length));
}

Athm.prototype.run = function() {
	this.init();
	console.log('[INFO] initialization of brands starts');
	this.crawler.queue({
		uri:'http://baojia.qichecdn.com/priceapi3.9.0/services/cars/brands?ts=0&app=a2&platform=pm1&version=3.9.0',
		callback:function(error, result, $) {
			if(error) {
				console.log('[ERROR] error getting brand info');
				console.log(error);
				return;
			}
			if(typeof result.body == 'string') {
				try {
					var resp = JSON.parse(result.body);
				} catch(e) {
					console.log('[ERROR] error parsing brand info');
					return;
				}
				resp.result.brandlist.forEach(function(brandByLetter) {
					brandByLetter.list.forEach(function(brand) {
						that.brands[brand.brandid] = brand.name;
						that.brandids.push(brand.brandid);
					});
				});
				console.log('[INFO] initialization of brands done');
				console.log(that.brandids.length);
				console.log('[INFO] initialization of series starts');
				for(var i = 0; i < 20; i++) {
					that.getSeriesOfNextBrand();
				}
			}
		}
	});
}

Athm.prototype.getSeriesOfNextBrand = function() {
	if(this.brandids.length <= 0) {
		if(this.lock.length == 19) {
			console.log('[INFO] scan of brands done');
		}
		return;
	}
	var brandid = that.brandids.shift();
	this.lock.push(0);
	this.crawler.queue({
		uri:'http://baojia.qichecdn.com/priceapi3.9.0/services/seriesprice/get?brandid={0}&salestate=1'.format(brandid),
		callback:function(error, result, $) {
			var brandid = result.options.brandid;
			if(error) {
				console.log('[ERROR] error getting series info for brandid=', brandid);
				this.lock.pop();
				return;
			}
			if(typeof result.body == 'string') {
				try {
					var resp = JSON.parse(result.body);
				} catch(e) {
					console.log('[ERROR] error parsing series info for brandid=', brandid);
					return;
				}
				var count = 0;
				resp.result.fctlist.forEach(function(fct){
					fct.serieslist.forEach(function(series){
						that.series[series.id] = [series.name, brandid, that.brands[brandid]];
						that.seriesids.push(series.id);
						count = count + 1;
					})
				});
				console.log('[INFO] {0} series resolved for brandid={1}'.format(count, brandid));
				that.getSeriesOfNextBrand();
				that.lock.pop();
				if(that.lock.length == 0) {
					console.log('[INFO] initialization of series done');
					console.log(Object.keys(that.series).length);
					setTimeout(that.getSales(), 0);
					return;
				}
			}
		},
		brandid:brandid
	});
}

Athm.prototype.getSales = function() {
	for(var i = 0; i < 20; i++) {
		this.getSalesOfNextSeries();
	}
}

Athm.prototype.getSalesOfNextSeries = function() {
	if(this.seriesids.length <= 0) {
		console.log('[INFO] Job done!');
		return;
	}
	var seriesId = this.seriesids.shift();
	if(this.processedIds[seriesId] == 0) {
		console.log('[INFO] seriesId={0} already processed'.format(seriesId));
		this.getSalesOfNextSeries();
		return;
	}
	this.crawler.queue({
		uri:'http://baojia.qichecdn.com/priceapi3.9.0/services/speccompare/get?type=2&specids={0}'.format(seriesId),
		callback:function(error, result, $) {
			var seriesId = result.options.seriesId;
			if(error) {
				console.log('[ERROR] error getting sales info for seriesId=', seriesId);
				that.getSalesOfNextSeries();
				return;
			}
			if(typeof result.body == 'string') {
				try {
					var resp = JSON.parse(result.body);
				} catch(e) {
					console.log('[ERROR] error parsing series info for seriesId=', seriesId);
					that.getSalesOfNextSeries();
					return;
				}
				if(resp.result.orderitems.length <= 0) {
					console.log('[WARN] no sales record found for seriesId=', seriesId);
					fs.appendFileSync(that.resultFile, that.series[seriesId][2] + '\t' + that.series[seriesId][0] + '\t' + 'N/A\tN/A\t0\n');
					fs.appendFileSync(that.contextFile, seriesId + ',');
					that.getSalesOfNextSeries();
					return;
				}
				var carModelMap = {};
				resp.result.specitems[0].modelexcessids.forEach(function(carModel){
					carModelMap[carModel.id] = carModel.value;
				});
				var dealer = resp.result.orderitems[0].items[0].name;
				var record = '';
				resp.result.orderitems[0].items[0].modelexcessids.forEach(function(sales){
					record = record + that.series[seriesId][2] + '\t' + that.series[seriesId][0] + '\t' + carModelMap[sales.id] + '\t' + dealer + '\t' + sales.value + '\n';
				});
				fs.appendFileSync(that.resultFile, record);
				fs.appendFileSync(that.contextFile, seriesId + ',');
				console.log('[INFO] seriesId={0} done!'.format(seriesId));
				that.getSalesOfNextSeries();
			}
		},
		seriesId:seriesId
	});
}

var that = new Athm();
that.run();