var fs = require("fs")
var Crawler = require("node-webcrawler")

if(!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) { 
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

Date.prototype.toString = function() {
    var year = this.getFullYear();
    var month = this.getMonth() + 1;
    var day = this.getDate();
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    return year + "-" + month + "-" + day;
}

function Fang() {
	this.resultDir = "../result/angejia/";
	this.resultFile = "ershou_sh_" + new Date().toString() + ".txt";
	this.crawler = new Crawler({
		maxConnections:5,
		userAgent:"Mozilla/5.0",
		jQuery:false,
		callback:function(error, result, $) {
			var estateId = result.options.estateId;
			if(error || !$) {
				console.log("[ERROR] Error opening estate ", estateId);
				setTimeout(that.doDetail, 0);
				return;
			}
			try {
				var url = result.uri;
				var title = $("h2.title .name").text() + " " + $("h2.title .rooms").text().trim();
				var path = $(".crumbs").text().replace(/\s/g, "");
				var consultantName = $(".broker-name").text();
				var consultantContact = $(".tel-num").text();
				var pics = $("img[u=image]").length;
				var ackdata = $(".sell-data li");
				var publishTime, approvalTime, surveyTime;
				switch (ackdata.length) {
					case 1:
						publishTime = ackdata.eq(0).text().replace(/\s/g, " ");
						approvalTime = "无数据";
						surveyTime = "无数据";
						break;
					case 2:
						publishTime = ackdata.eq(0).text().replace(/\s/g, " ");
						approvalTime = ackdata.eq(1).text().replace(/\s/g, " ");
						surveyTime = "无数据";
						break;
					case 3:
						publishTime = ackdata.eq(0).text().replace(/\s/g, " ");
						approvalTime = ackdata.eq(1).text().replace(/\s/g, " ");
						surveyTime = ackdata.eq(2).text().replace(/\s/g, " ");
						break;
					default:
						publishTime = "无数据";
						approvalTime = "无数据";
						surveyTime = "无数据";
				}
				fs.appendFileSync(that.resultDir+that.resultFile, [
						url,estateId,title,path,consultantName,
						consultantContact,pics,publishTime,
						approvalTime,surveyTime
					].join("\t")+"\n");
			} catch(e) {
				console.log("[ERROR] Error parsing estate ", estateId);
			}
			setTimeout(that.doDetail, 0);
		}
	});
	this.estateIds = [];
	this.pageLock = 5;
	this.detailLock = 5;
}

Fang.prototype.init = function() {
	console.log("[INFO] Initialization starts.");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	fs.appendFileSync(this.resultDir+this.resultFile, [
			"URL","房源编号","标题","路径","咨询顾问姓名",
			"咨询顾问电话","图片数量","发房时间","审核时间","实勘时间"
		].join("\t")+"\n");
	console.log("[INFO] Initialization completes.");
}

Fang.prototype.doPage = function(page) {
	that.crawler.queue({
		uri:"http://sale.sh.angejia.com/?page=" + page,
		page:page,
		callback:function(error, result) {
			var page = result.options.page;
			if(error) {
				console.log("[ERROR] Error opening ", result.uri);
				setTimeout(that.doPage(page+5));
				return;
			}
			var regex = /<a target="_blank" href="http:\/\/sale.sh.angejia.com\/(\d+).html" class="clearfix">/g;
			var estateIdMatch;
			var count = 0;
			while(estateIdMatch = regex.exec(result.body)) {
				that.estateIds.push(estateIdMatch[1]);
				++count;
			}
			if(count == 0) {
				--that.pageLock;
				if(that.pageLock == 0) {
					console.log("[INFO] All pages done.\n[INFO] Total tasks: ", that.estateIds.length);
					setTimeout(function(){
						for(var i = 0; i < 5; i++) {
							that.doDetail();
						}
					}, 0);
				}
				return;
			}
			console.log("[INFO] Page {0} {1} estates found.".format(page, count));
			setTimeout(that.doPage(page+5));
		}
	});
}

Fang.prototype.doDetail = function() {
	var estateId = that.estateIds.shift();
	if(!estateId) {
		--that.detailLock;
		if(that.detailLock == 0) {
			console.log("[INFO] Job done.");
		}
		return;
	}
	console.log("[INFO] tasks left: ", that.estateIds.length);
	that.crawler.queue({
		uri:"http://sale.sh.angejia.com/{0}.html".format(estateId),
		estateId:estateId,
		jQuery:true
	});
}

Fang.prototype.run = function() {
	for(var page = 1; page <= 5; page++) {
		that.doPage(page);
	}
}

Fang.prototype.start = function() {
	this.init();
	this.run();
}

var that = new Fang();
that.start();