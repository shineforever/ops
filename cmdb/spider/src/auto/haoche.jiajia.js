var fs = require("fs"),
	util = require("util"),
	logger = require("winston"),
	seenreq = require("seenreq"),
	Crawler = require("node-webcrawler");

var env = process.env.NODE_ENV || "development";
logger.cli();
logger.add(logger.transports.File, {filename:"../../log/haoche.jiajia.log", logstash:true,handleExceptions: true});
if(env==="production"){
    logger.remove(logger.transports.Console);
}

var seen = new seenreq();

var resultFile = "../../result/haoche.jiajia.txt";

fs.writeFileSync(resultFile, "\ufeff城市,区,品牌,车型,上牌时间,行驶公里数,价格,检测时间,检测结果\n")

var c = new Crawler({
	maxConnections:1,
	userAgent:"Mozilla/5.0",
	forceUTF8:true,
	incomingEncoding:"gb2312",
	callback:processDetail,
	onDrain:function(){logger.info("Job done.");}
});

function processDetail(error, result, $) {
	if(error || !$) {
		logger.error("Return error or cheerio error: ", result.uri);
		return;
	}
	var brand = result.options.brand;
	var title = $(".car-info h2").text();
	var cityInfo = $("span.span-w320").attr("title");
	if(cityInfo){
		cityInfo = cityInfo.split("-");
	}
	var city = "N/A", district = "N/A";
	if(cityInfo.length == 2) {
		city = cityInfo[0];
		district = cityInfo[1];
	}
	var carStatusInfo = $(".h2-list div:last-child").text();
	var registerDate = "N/A", mileAge = "N/A";
	var dateMatch, mileMatch;
	if(dateMatch = carStatusInfo.match(/\d+年上牌（.*?）/)) {
		registerDate = dateMatch[0];
	}
	if(mileMatch = carStatusInfo.match(/行驶.*?公里/)) {
		mileAge = mileMatch[0];
	}
	var price = $("#carprice").text() || "N/A";
	var checkTime = "N/A", checkResult = "N/A";
	var checkInfo = $(".o-logo-tx div");
	if(checkInfo.length == 4) {
		checkTime = checkInfo.eq(2).contents().filter(function(){return this.nodeType == 3}).text();
		checkResult = checkInfo.eq(3).contents().filter(function(){return this.nodeType == 3}).text();
	}
	fs.appendFileSync(resultFile, [city,district,brand,title,registerDate,mileAge,price,checkTime,checkResult].join()+"\n");
	logger.info("Got %s", title);
}

function processList(error, result, $) {
	if(error || !$) {
		logger.error("Return error or cheerio error: ", result.uri);
		return;
	}
	var brand = result.options.brand;
	var count = 0;
	$(".act-piclist li").each(function(){
		var href = $(this).find("div.pic a").attr("href");
		if(!href) return;
		var url = util.format("http://hao.autohome.com.cn%s", href);
		if(!seen.exists(url)) {
			++count;
			c.queue({
				uri:url,
				brand:brand,
				priority:0
			});
		}
	});
	logger.info("Got %s cars on %s", count, result.uri);
	var urls = [];
	$(".page.page-center a").each(function(){
		var url = util.format("http://hao.autohome.com.cn%s", $(this).attr("href"));
		if(!seen.exists(url)) {
			c.queue({
				uri:url,
				brand:brand,
				callback:processList,
				priority:1
			});
			urls.push(url);
		}
	});
	if(urls.length) {
		logger.info("%s got\n\t%s", brand, urls.join("\n\t"));
	}
}

function getBrands(error, result) {
	if(error) {
		logger.error("Error getting brand info.\nJob done with error.");
		return;
	}
	try {
		var data = JSON.parse(result.body);
	} catch(e) {
		logger.error("Error parsing brand info.\nJob done with error.");
		return;
	}
	data.forEach(function(brandInfo){
		c.queue({
			uri:util.format("http://hao.autohome.com.cn%s", brandInfo.url),
			brand:brandInfo.name,
			callback:processList
		});
	});
}

c.queue({
	uri:"http://hao.autohome.com.cn/handler/CarList.ashx?action=brandlist&area=china&brand=&ls=&spec=0&minPrice=0&maxPrice=0&minRegisteAge=0&maxRegisteAge=0&MileageId=0&disp=0&stru=0&gb=0&color=0&source=0&listview=0&sell=0&newCar=0&credit=0&sort=0&ex=c0d0t0p0w0r0u0e0s0a1o0i0g0",
	jQuery:false,
	callback:getBrands
});
