var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")

var logger = require("winston")
var env = process.env.NODE_ENV || "development";
logger.cli();
if(env==="production"){
    logger.add(logger.transports.File, {filename:"../log/youxinb2b.log", logstash:true, level:"info"});
    logger.remove(logger.transports.Console);
}

function Youxin() {
	var argument = process.argv.splice(2)[0];
	this.stop = argument ? moment(process.argv.splice(2)[0], "YYYY-MM").format("YY年MM月") : moment().subtract(2, "M").format("YY年MM月");console.log(this.stop)
	this.benchYear = parseInt(this.stop.match(/(\d+)年(\d+)月/)[1]);
	this.benchMonth = parseInt(this.stop.match(/(\d+)年(\d+)月/)[2]);
	this.resultDir = "../../result/auto/";
	this.resultFile = util.format("youxinb2b_%s.txt", this.stop);
	this.contextFile = util.format("youxinb2b_context_%s.txt", this.stop);
	this.crawler = new Crawler({
		maxConnections:1,
		userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.101 Safari/537.36",
		reteLimits:1000,
		jar:true
	});
	this.brands = [];
	this.curBrand = "1000000005";
	this.curPage = 1;
	this.brandLock = true;
	this.pageLock = true;
	this.cookie = ".ASPXAUTH=9640F8C8A7EB205E415B47FF4531FD3AB66AF6A8DB101E64EB26577FD8A04BBC3826A908F9872BD8541FAC98EF645876E0361259CC838B8E371B09A770DB604E;";
}

Youxin.prototype.init = function() {
	logger.info("Initialization starts");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	if(!fs.existsSync(this.resultDir+this.resultFile)) {
		fs.appendFileSync(this.resultDir+this.resultFile, "\ufeff");
	}
	if(fs.existsSync(this.resultDir+this.contextFile)) {
		var context = fs.readFileSync(this.resultDir+this.contextFile).toString().replace(/\s/g, "").split(",");
		if(context.length != 2) {
			logger.error("Illegal context file.");
		} else {
			this.curBrand = context[0];
			this.curPage = parseInt(context[1]);
			this.brandLock = false;	
			this.pageLock = false;
			logger.info("Current BrandID: %s, Current Page: %s", this.curBrand, this.curPage);
		}
	}
	logger.info("Initialization completes");
}

Youxin.prototype.getBrands = function() {
	this.crawler.queue({
		uri:"http://i.youxinpai.com/AjaxObjectPage/SellCarTypePageTrade.ashx?carAreaID=40",
		callback:function(error, result, $) {
			if(error || !$) {
				logger.error("Error getting brands. Job done.");
				return;
			}
			var brands = $("#brand_info a");
			logger.info(util.format("Brands found: %s.", brands.length));
			brands.each(function(){
				try {
					that.brands.push({name:$(this).text().trim(),id:$(this).attr("id").match(/\d+/)[0]});
				} catch(e) {
					logger.error("Illegal id format: %s", $(this).text());
				}
			});
			that.getBrandSales();
		}
	});
}

Youxin.prototype.getBrandSales = function() {
	var brand = that.brands.shift();
	if(!brand) {
		logger.info("Job done.");
		return;
	}
	if(brand.id  == that.curBrand) {
		that.brandLock = true;
	}
	if(!that.brandLock) {
		logger.error("Brand %s already processed.", brand.name);
		setTimeout(that.getBrandSales, 0);
		return;
	}
	that.crawler.queue({
		uri:util.format("http://i.youxinpai.com/TradeManage/tradelist.aspx?masterBrand=%s", brand.id),
		headers:{
			Referer:"http://i.youxinpai.com/TradeManage/tradelist.aspx",
			Cookie:that.cookie
		},
		brand:brand,
		callback:function(error, result, $) {
			if(error || !$) {
				logger.error("Error opeing %s", result.uri);
				return;
			}
			var brand = result.options.brand;
			if(that.pageLock) {
				var toWrite = [];
				var shouldStop = false;
				var count = 0;
				$("#tbody_data tr").each(function(){
					++count;
					var td = $(this).find("td");
					if(td.length != 9) {
						logger.warn("%s-%s data structure error.", result.uri, td.eq(2).attr("title").trim());
						return;
					}
					if(that.due(td.eq(0).text().trim())) {
						shouldStop = true;
						return;
					}
					toWrite.push([
							td.eq(0).text().trim(), // deal time
							td.eq(1).text().trim(), // area
							brand.name,				// brand
							td.eq(2).attr("title").trim().replace(/,/g, ";"), // name
							td.eq(3).text().trim(), // color
							td.eq(4).text().trim(), // price
							td.eq(5).text().trim(), // register date
							td.eq(6).text().trim(), // mileage
							td.eq(7).text().trim(), // transmission
							td.eq(8).text().trim() // usage
						].join(","));
				});
				if(count == 0) {
					setTimeout(that.getBrandSales, 0);
					logger.info("Brand %s done.", brand.name);
					return;
				}
				if(toWrite.length > 0) {
					fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join("\n")+"\n");
				} else if(shouldStop){
					logger.info("Brand %s done.", brand.name);
					setTimeout(that.getBrandSales, 0);
					return;
				} else {
					logger.error("Login needed.");
					return;
				}
				logger.info("%s got %s records in page 1.", brand.name, toWrite.length);
				fs.writeFileSync(that.resultDir+that.contextFile, brand.id+","+1);
			}
			var pager = $("#ctl00_ContentPlaceHolder_Body_ccPager span");
			if(pager.length < 3) {
				logger.error("%s bad pager.", result.uri);
				console.log(result.body)
				return;
			}
			var pagecount = parseInt(pager.eq(pager.length-1-2).text().trim());
			logger.info("%s page count: %s", brand.name, pagecount);
			if(pagecount <= 1) {
				setTimeout(that.getBrandSales, 0);
				logger.info("Brand %s done.", brand.name);
				return;
			}
			that.doPage(brand, 2, pagecount);
		}
	});
}

Youxin.prototype.doPage = function(brand, page, maxpage) {
	if(page > maxpage) {
		logger.info("Brand %s done.", brand.name);
		setTimeout(that.getBrandSales, 0);
		return;
	}
	if(page >= that.curPage) {
		that.pageLock = true;
	}
	if(!that.pageLock) {
		logger.error("Brand %s Page %s already processed.", brand.name, page);
		setTimeout(function(){that.doPage(brand, ++page, maxpage)}, 0);
		return;
	}
	that.crawler.queue({
		uri:util.format("http://i.youxinpai.com/TradeManage/tradelist.aspx?masterBrand=%s&page=%s", brand.id, page),
		headers:{
			Referer:"http://i.youxinpai.com/TradeManage/tradelist.aspx",
			Cookie:that.cookie
		},
		priority:0,
		brand:brand,
		callback:function(error, result, $) {
			if(error || !$) {
				logger.error("Error opeing %s", result.uri);
				return;
			}
			var brand = result.options.brand;
			var toWrite = [];
			var shouldStop = false;
			$("#tbody_data tr").each(function(){
				var td = $(this).find("td");
				if(td.length != 9) {
					logger.warn("%s-%s data structure error.", result.uri, td.eq(2).attr("title").trim());
					return;
				}
				if(that.due(td.eq(0).text().trim())) {
					shouldStop = true;
					return;
				}
				toWrite.push([
						td.eq(0).text().trim(), // deal time
						td.eq(1).text().trim(), // area
						brand.name,				// brand
						td.eq(2).attr("title").trim().replace(/,/g, ";"), // name
						td.eq(3).text().trim(), // color
						td.eq(4).text().trim(), // price
						td.eq(5).text().trim(), // register date
						td.eq(6).text().trim(), // mileage
						td.eq(7).text().trim(), // transmission
						td.eq(8).text().trim() // usage
					].join(","));
			});
			if(toWrite.length > 0) {
				fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join("\n")+"\n");
			} else if(shouldStop){
				logger.info("Brand %s done.", brand.name);
				setTimeout(that.getBrandSales, 0);
				return;
			} else {
				logger.error("Login needed.");
				return;
			}
			logger.info("%s got %s records in page %s.", brand.name, toWrite.length, page);
			fs.writeFileSync(that.resultDir+that.contextFile, brand.id+","+page);
			if(!shouldStop) {
				setTimeout(function(){that.doPage(brand, ++page, maxpage)}, 0);
			} else {
				setTimeout(that.getBrandSales, 0);
			}
		}
	});
}

Youxin.prototype.due = function(date) {
	if(date == that.stop) {
		return true;
	}
	var match = date.match(/(\d+)年(\d+)月/);
	if(!match) {
		return true;
	}
	var year = parseInt(match[1]);
	if(year < that.benchYear) {
		return true;
	}
	var month = parseInt(match[2]);
	if(month < that.benchMonth) {
		return true;
	}
	return false;
}

Youxin.prototype.run = function() {
	this.getBrands();
}

Youxin.prototype.start = function() {
	this.init();
	this.run();
}

var that = new Youxin();
that.start();