var fs = require("fs"),
	util = require("util"),
	logger = require("winston"),
	seenreq = require("seenreq"),
	Crawler = require("node-webcrawler");

var seen = new seenreq();

var processList = function(error, result, $) {
	if(error | !$) {
		logger.error("Return error or cheerio error.");
		return;
	}
	var record = [];
	$("#txjDiv ul.alcomment").each(function(){
		record.push([
			$(this).find("li.alcw1 a").text().trim(),
			$(this).find("li.alcw2").text().trim().replace(/,/g, ""),
			$(this).find("li.alcw3").text().trim(),
			$(this).find("li.alcw4").not(".alcw41").text().replace(/\s/g, ""),
			$(this).find("li.alcw41").text().trim(),
			$(this).find("li.alcw5").text().trim()
		].join());
	});
	if(record.length) {
		fs.appendFileSync(resultFile, record.join("\n")+"\n");
	}
	logger.info("Got %s records on %s",record.length, result.uri);
	var urls = [];
	$(".pmcom a").each(function(){
		var href = $(this).attr("href");
		if(!href)
			return;
		var url = util.format("http://txdai.com%s", href);
		if(!seen.exists(url)) {
			urls.push(url);
		}
	});
	c.queue(urls);
	if(urls.length) {
		logger.info("Got the following urls:\n\t%s", urls.join("\n\t"));
	} else {
		logger.info("Got no urls.");
	}
}

var c = new Crawler({
	maxConnections:1,
	userAgent:"Mozilla/5.0",
	callback:processList,
	onDrain:function(){logger.info("Job done.");}
});

var resultFile = "../result/sofun_jinrong.txt";

fs.appendFileSync(resultFile, "\ufeff项目名称,项目总额,剩余投资期限,预期年化收益,进度,起投金额\n");

seen.exists("http://txdai.com/AnJuJinIndex.html");
c.queue("http://txdai.com/AnJuJinIndex.html");