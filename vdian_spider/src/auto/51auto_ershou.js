var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")
var seenreq = require("seenreq")
var logger = require("winston")

var _prgname = "51auto_ershou";////////////////modify your project name
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
		var nodotstr = str.replace(/[,，;；]/g, ' ');
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
	// logger.info("save record.");
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
		maxConnections:4,
		rateLimits:500,
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
}

BdaSpider.prototype.init = function() {
	logger.info("Initialization starts");
	////////argv use
	// this.keyword = process.argv.splice(2)[0];

	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	fs.writeFileSync(this.resultFile, "\ufeff标题,品牌,车系,车型,检测认证,价格,里程,上牌时间,城市,车源类型,店铺名称,店铺LEVEL,URL\n");////////////modify for your title

	logger.info("Initialization completes");
	return 0;
}

BdaSpider.prototype.run = function() {
	// this.addqueue(["http://www.51auto.com/quanguo/pabmdcigf?searchtype=searcarlist&status=3"], "LIST", {adtype:'', type:'全部车源'});
	this.addqueue(["http://www.51auto.com/quanguo/pabmdcig1f?searchtype=searcarlist&status=3"], "LIST", {adtype:'1', type:'商家车源'});
	this.addqueue(["http://www.51auto.com/quanguo/pabmdcig2f?searchtype=searcarlist&status=3"], "LIST", {adtype:'2', type:'品牌车源'});
	this.addqueue(["http://www.51auto.com/quanguo/pabmdcig0f?searchtype=searcarlist&status=3"], "LIST", {adtype:'0', type:'个人车源'});
}

BdaSpider.prototype.callbackfunc = function(error, result, $, functype){
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

BdaSpider.prototype.processList = function(error, result, $) {
	if(error || !$) {
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);

		//item info
		var carlist  = $(".view-grid-overflow a.car");
		var type = result.options.type;
		var adtype = result.options.adtype;
		logger.info("Get cars %d %s, %s", carlist.length, type, result.uri);

		for (var i = 0; i < carlist.length; i++) {
			var car = carlist.eq(i);
			// logger.info("name: %s, url: %s", car.attr('title'), car.attr('href'));
			var title = dealstr(car.find('li.title').text().trim());
			var brdinfo = title.split(' ');
			var brand = brdinfo[0];
			var model = brdinfo.length>1?brdinfo[1]:'N/A';
			var config = title.replace(brand, '').replace(model, '').trim();
			var price = dealstr(car.find("li.price div.price-main").text().trim());
			var carinfo = car.find('li.info span');
			var mileage = carinfo.length>0?dealstr(carinfo.eq(0).text().trim()):'N/A';
			var lcstime = carinfo.length>2?dealstr(carinfo.eq(2).text().trim()):'N/A';
			var city = dealstr(car.find('.font-color-red').text().trim());
			var checktip = car.find('span.btn.btn-small.btn-outline.tip').length>0?'是':'否';
			if (adtype=='1' || adtype=='2' ) {
				var recd = [title, brand, model, config, checktip, price, mileage, lcstime, city, type];
				// this.addqueue([car.attr('href')], "ITEM", {recd:recd, priority: 1});
				this.crawler.queue({uri:car.attr('href'), recd:recd, priority:1, 
					callback:function(error, result, $){
						that.processDetail(error, result, $);
					}
				});			
			} else{
				var recd = [title, brand, model, config, checktip, price, mileage, lcstime, city, type, 'N/A', 'N/A', car.attr('href')];
				saveData(recd.join(',')+'\n');
			};
			// break;//test
		}

		//pages
		var isdone = result.options.uri.match(/curentPage=\d+/);
		if ( !isdone || isdone.length==0 ) {
			var suffix = "&orderValue=&citystatues=&isNewsCar=0&isSaleCar=0&isQa=0&isCompensation=&isServenBack=&isAddTime=&isExis=&isPicture=&status=3&desc=1&showtype=grid&rbFamily=&rbMakecode=&keyword=&isgotopage=1";
			var pagelist = $("span.text-orange");
			if (pagelist && pagelist.length>0) {
				var pgtext = pagelist.text().trim();
				var pagecont = pgtext.split('-')[1];
				logger.info("pgtext:%s, pagecont: %s", pgtext, pagecont);
				var urls = [];
				var prefix = result.uri.replace(/\?.+/);
				for (var i = 2; i <= pagecont; i++) {
					urls.push(prefix + "?adType=" + adtype +"&curentPage="+i+suffix );
					// break;//test
				};
				// logger.info(urls);//test
				this.addqueue(urls, "LIST", {adtype:adtype, type:type, priority:3})
			}
		}
	}catch(e){
		logger.error("error: %s",result? result.uri: "N/A");
		logger.error(e);
	}
}

BdaSpider.prototype.processDetail = function(error, result, $) {
	if(error || !$) {
		if (result) {
			var rec = result.options.recd;
			rec.push('N/A', 'N/A', result.uri);
			saveData(rec.join(',')+'\n');
		}
		logger.error("Error opening or parsing %s", result?result.uri:"");
		return;
	}
	try{
		// if(curDir) fs.writeFile(curDir+"tmp/tmp.txt", result.body, null);
		var recd = result.options.recd;
		logger.info("Get shopInfo %s", recd[0]);
		var shopname = 'N/A', shoplevel = 'N/A';
		var shopinfo = $("div.car-market h1");
		if (shopinfo.length>0) {
			shopname = dealstr(shopinfo.eq(0).find('a').first().text());
			shoplevel = dealstr(shopinfo.eq(0).find('i.u01').attr('title'));
		}

		// logger.info("shopname: %s, shopinfo: %s", shopname, shoplevel);		
		recd.push(shopname);
		recd.push(shoplevel);
		recd.push(result.options.uri);

		saveData(recd.join(',')+'\n');
	}catch(e){
		if (result) {
			var rec = result.options.recd;
			rec.push('N/A', 'N/A', result.uri);
			saveData(rec.join(',')+'\n');
		}		
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
