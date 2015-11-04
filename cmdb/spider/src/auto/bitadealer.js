var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")
var seenreq = require("seenreq")
var logger = require("winston")

var _prgname = "bitadealer";////////////////modify your project name
// var curDir = '/home/zero/';//for test

var env = process.env.NODE_ENV || "development";
logger.cli();
logger.add(logger.transports.File, {filename:"../../log/"+_prgname+".log", logstash:true,handleExceptions: true});
if(env==="production"){
    logger.remove(logger.transports.Console);
}

var godotTransport = require("winston-godot")
var godot = require("godot")
var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:_prgname});//service名称需要更改, 同时去服务器更改logServer配置文件

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


function ObjectClone(src, dst){
	if(!dst) dst = {};
	for(var key in src){
		dst[key] = src[key];
	}
	return dst;
}

function saveData(recstr, type) {
	var filename = that.resultFile;
	fs.appendFile(filename, recstr,function(err){
		if (err) {
			logger.error("append file err");
			logger.error(err);
		}
	});
}

function BdaSpider() {
	////////////modify for your path and filename
	this.resultDir = "../../result/auto/";
	this.resultFile = this.resultDir+_prgname+"_"+moment().format("YYYY-MM-DD")+".csv"
	this.crawler = new Crawler({
		maxConnections:1,
		rateLimits:1000,
		userAgent:"Mozilla/5.0",
		forceUTF8:true,
		jar:true,
		onDrain:function(){
			logger.info("Job done.");
			logger.remove(godotTransport);
			client.close();
		},
		callback:function(err, results, $){ logger.error("callback err:%s.", result.uri) }
	});
	this.seen = new seenreq();
	this.mainBrand  = [];
}

BdaSpider.prototype.init = function() {
	logger.info("Initialization starts");
	////////argv use
	// this.keyword = process.argv.splice(2)[0];

	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	fs.writeFileSync(this.resultFile, "\ufeff品牌,名称,公司,主营品牌,城市,电话,电话认证,商家认证,店铺属性,URL\n");
	logger.info("Initialization completes");
	return 0;
}

BdaSpider.prototype.run = function() {
	//brand
	var url = "http://api.car.bitauto.com/CarInfo/getlefttreejson.ashx?tagtype=jingxiaoshang&pagetype=masterbrand&citycode=beijing%2F&cityid=201";
	this.crawler.queue({uri:url, callback:function(error, result, $){
		that.processMainBrand(error, result, $);
	}});
	//city
	url = "http://dealer.bitauto.com/beijing/audi/";
	this.crawler.queue({uri:url, callback:function(error, result, $){
		that.processProvince(error, result, $);
	}});
}

BdaSpider.prototype.callbackfunc = function(error, result, $, functype){
	switch(functype){
		case 'LIST':
			that.processList(error, result, $);
			break;
		default:
			break;
	}
}

function JsonpCallBack(lefttree){
	var brdlist = lefttree.brand;
	for(var key in brdlist){
		// logger.info(key);
		brdlist[key].forEach(function(item,index){
			that.mainBrand.push(item);
		});
	}
	logger.info("Got %d mainBrands", that.mainBrand.length);
}

BdaSpider.prototype.processMainBrand = function(error, result, $) {
	if(error || !result) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		eval(result.body);
	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}

BdaSpider.prototype.processProvince = function(error, result, $) {
	if(error || !result) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		var provlist = $("#d_pro dl dd a");
		logger.info("provlist:%d", provlist.length);
		if (this.mainBrand.length==0) {
			logger.error("Error no mainBrand.");
			return;
		};
		var prvpathlist = [];
		//<a href="/zhejiang/audi/?BizModes=2">浙江</a>
		for (var i = 0; i < provlist.length; i++) {
			var prov = provlist.eq(i);
			var province = dealstr(prov.text().trim());
			var provpath = prov.attr('href').split('/')[1];
			logger.info("name: %s, provpath: %s", province, provpath);
			prvpathlist.push(provpath);
			// break;//test
		}

		//?BizModes=2:1=>综合店, 2=>4S, 3=>特许店,.url.split('/')[2]
		var modename = {1:'综合店', 2:'4S', 3:'特许店'};

		for(var k = 0; k<this.mainBrand.length; k++){
			var brdname = this.mainBrand[k].name;
			var brdpath = this.mainBrand[k].url.split('/')[2];
			if (!brdpath || brdpath.length ==0) { continue;}
			for (var mode = 1; mode <= 3; mode++) {
				var urls = [];
				for (var i = 0; i < prvpathlist.length; i++) {
					urls.push("http://dealer.bitauto.com/"+prvpathlist[i]+"/"+brdpath+"/?BizModes="+mode);
				};
				// urls.push("http://dealer.bitauto.com/beijing/"+brdpath+"/?BizModes="+mode);//test
				logger.info("urls len: %d, mode: %d, brand: %s",urls.length, mode, brdname);
				this.addqueue(urls, "LIST", {mode:modename[mode], brdname:brdname});
				// logger.info(urls);//test
				// var url = "http://dealer.bitauto.com/zhejiang/audi/?BizModes=2";//test
				// this.addqueue([url], "LIST", {mode:modename[2], brdname:brdname});//test
				// break;//test
			}
			// break;//test
		}
	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}

BdaSpider.prototype.processList = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		var brdname = result.options.brdname;
		var mode = result.options.mode;
		logger.info("Get %s %s %s",brdname, mode, result.uri);

		//////shop detail
		var authShop = true;
		var idx = -1;
		var athshplist = $("ul.jxs-list li.no-car-list");
		for (var i = 0; i < athshplist.length; i++) {
			if(athshplist.eq(i).attr('style') == "display: block;"){
				authShop = false;
				idx=i;
				break;
			}
		}

		var records = [];
		var shoplist = $("ul.jxs-list li.clearfix");
		for (var i = 0; i < shoplist.length; i++) {
			var shop = shoplist.eq(i);
			var titletg = shop.find('div.intro-box .p-tit a');
			if (titletg.length==0) {continue;}
			var name = dealstr(titletg.text().trim());
			var compy = dealstr(titletg.attr('title').trim());
			var brand = dealstr(shop.find(".intro-box .p-intro .add-sty").first().text());
			var city = dealstr(shop.find(".infor-box .price-city").text().trim().split(/\s+/)[0]);
			var phone = dealstr(shop.find(".intro-box .p-intro span.phone-sty span.tel400").text());
			if(!phone){
				phone = dealstr(shop.find(".intro-box .p-intro span.phone-sty").contents().first().text().trim()||"无");
			}
			var auditPh = shop.find(".intro-box .p-intro span.phone-sty b.rz-phone").length;
			var shopAudit = (authShop || i<idx)?"Y":"N";
			records.push([brdname,name, compy, brand,city,phone,auditPh?"Y":"N",shopAudit,mode, result.uri].join(','));
		}

		if(records.length>0) saveData(records.join('\n')+'\n');

		//////pages
		var canpg = result.uri.match(/page=\d+/);
		if (!canpg || canpg.length==0) {
			// logger.info("uri:"+result.uri);
			var nextPage = $(".the_pages a").last();
			if(nextPage){
				var maxPage = Number(nextPage.prev().text().trim());
				// logger.info("Page count %d", maxPage);
				var urls = [];
				for (var i = 2; i <= maxPage; i++) {
					urls.push(result.uri+"&page="+i);
				}
				// logger.info("pageurl : "urls);
				this.addqueue(urls, "LIST", {mode:mode, brdname:brdname, priority:3});				
			}
		}
	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}

BdaSpider.prototype.addqueue = function(urls, functype, options){
	urls.filter(
		function(url){
			return !this.seen.exists(url);
		},this
	).forEach(
		function(url){
			var option = ObjectClone(options);
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
