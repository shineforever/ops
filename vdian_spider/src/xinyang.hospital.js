var fs = require("fs"),
	util = require("util"),
	logger = require("winston"),
	seenreq = require("seenreq"),
	Crawler = require("node-webcrawler");

var seen = new seenreq();

var resultFile = "../result/xinyang.hospital.txt";

fs.writeFileSync(resultFile, "\ufeff医院名称,医院地址,医院类型,医生人数,医院历史,医院擅长领域,是否认证\n");

var c = new Crawler({
	maxConnections:1,
	userAgent:"Mozilla/5.0",
	callback:processDetail,
	onDrain:function(){logger.info("Job done.");}
});

function processDetail(error, result, $) {
	if(error || !$) {
		logger.error("Return error or cheerio error: ", result.uri);
		return;
	}
	// var city = result.options.city;
	var hospitalName = $(".name_box").children("a").attr("title");
	var hospitalVerified = $(".name_box").children("img").attr("src") ? "未认证" : "已认证";
	var hospitalType = "N/A", hospitalDoctor = "N/A", hospitalFoundDate = "N/A", hospitalExpertise = "N/A", hospitalAddress = "N/A";
	$(".bbox.bbox1 div.body").children("p").not(".content").each(function(){
		var title = $(this).find("span.t").text();
		switch(title) {
			case "医院类型：":
				hospitalType = $(this).find("span.c").text();break;
			case "医生人数：":
				hospitalDoctor = $(this).find("span.c").text();break;
			case "成立时间：":
				hospitalFoundDate = $(this).find("span.c").text();break;
			case "擅长项目：":
				var expertise = [];
				$(this).find("span.c a").each(function(){
					expertise.push($(this).text());
				});
				hospitalExpertise = expertise.join("/");
				break;
			default:
				break;
		}
	});
	$(".bbox.bbox2 div.body").children("p").each(function(){
		var title = $(this).find("span.t").text();
		switch(title) {
			case "地址：":
				hospitalAddress = $(this).find("span.c").text().replace(/,/g, "，");break;
			default:
				break;
		}
	});
	fs.appendFileSync(resultFile, [hospitalName,hospitalAddress,hospitalType,hospitalDoctor,hospitalFoundDate,hospitalExpertise,hospitalVerified].join()+"\n");
	// logger.info("Got %s-%s", hospitalName, city);
	logger.info("Got %s", hospitalName);
}

function processList(error, result, $) {
	if(error || !$) {
		logger.error("Return error or cheerio error: ", result.uri);
		return;
	}
	// var city = result.options.city;
	var count = 0;
	$(".filter_list.narrow_filter li").each(function(){
		var url = util.format("http://y.soyoung.com%s", $(this).children("a").attr("href"));
		if(!seen.exists(url)) {
			++count;
			c.queue({
				uri:url,
				callback:processDetail,
				priority:0
				// city:city
			});
		}
	});
	logger.info("Got %s hospitals on %s", count, result.uri);
	var urls = [];
	$(".pages a").each(function(){
		var url = util.format("http://y.soyoung.com%s", $(this).attr("href"));
		if(!seen.exists(url)) {
			c.queue({
				uri:url,
				callback:processList,
				priority:1
				// city:city
			});
			urls.push(url);
		}
	});
	if(urls.length) {
		// logger.info("%s got\n\t%s", city, urls.join("\n\t"));
		logger.info("Got\n\t%s", urls.join("\n\t"));
	}
}

function getCities(error, result, $) {
	if(error || !$) {
		logger.error("Error getting city info.\nJob done with error.");
		return;
	}
	$("#search_list li").each(function(){
		if($(this).find("span").text().indexOf("所在地区") == -1) return;
		$(this).find("div.c p a").each(function(){
			var href = $(this).attr("href");
			var city = $(this).text();
			if(!href || !city) return;
			var url = "http://y.soyoung.com" + href;
			if(!seen.exists(url)) {
				c.queue({
					uri:url,
					city:city,
					callback:processList
				});
			}
		})
	});
}

c.queue({
	uri:"http://y.soyoung.com/hospital/0_0_0_0_0_0_0_0_0_2",
	callback:processList
});
