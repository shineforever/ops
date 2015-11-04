var fs = require("fs")
var Crawler = require("node-webcrawler")
// var heapdump = require("heapdump")

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

function calculateTimeConsumed(start, end) {
	var seconds = Math.floor((end - start)/1000);
	var hour = Math.floor(seconds/3600);
	var minute = Math.floor(seconds/60) % 60;
	var second = seconds % 60;
	return hour + "h" + minute + "m" + second + "s";
}

// setInterval(function () {
//     if (typeof gc === 'function') {
//         gc();
//     }
//     applog.debug('Memory Usage', process.memoryUsage());
// }, 60000);

function Sofun() {
	this.resultFile = "../result/sofang/xinfang_" + new Date().toString() + ".txt";
	this.programmeStartTime = new Date().getTime();
	this.done = {};
	this.cityList = [];
	this.listUrls = [];
	this.estateList = [];
	this.listLock = [];
	this.crawler = new Crawler({
	    maxConnections:20
	    ,userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"
	    ,forceUTF8:true
	    ,incomingEncoding:"GBK"
	    // ,debug:true
	});
}

Sofun.prototype.init = function() {
	if(fs.existsSync(this.resultFile)) {
		fs.readFileSync(this.resultFile).toString().split("\n").forEach(function(line){
			if(line) {
				var vals = line.split("\t");
				if(vals && vals.length == 16) {
					that.done[vals[0]] = true;
				}
			}
		});
		console.log("[INFO] done: ", Object.keys(this.done).length);
	}
}

Sofun.prototype.start = function() {
	// this.init();
	// that.listUrls = fs.readFileSync("../result/sofang/xinfang_2015-05-07.txt").toString().split("\n");
	// for(var i = 0; i < 20; i++) {
	// 	that.getDetailUrls();
	// }
	this.init();
	this.getCityList();
}

Sofun.prototype.getCityList = function() {
	this.crawler.queue({
		uri:"http://newhouse.fang.com/house/s/list/",
		callback:function(error, result, $) {
			if(error) {
				console.log("[ERROR] error getting city list.\n[INFO] Job done with error.");
				return;
			}
			try {
				var cityList = $(".city20141104nr").eq(0).find("a");
			} catch(e) {
				console.log("[ERROR] error parsing city list.\n[INFO] job done with error.");
				return;
			}
			for(var i = 0; i < cityList.length; i++) {
				if(cityList.eq(i).text() == "香港" || cityList.eq(i).text() == "海外" || cityList.eq(i).text() == "377城市")
					continue;
				that.cityList.push(cityList.eq(i).attr("href").toString());
			}
			console.log(that.cityList);
			that.getListUrls();
		}
	})
}

Sofun.prototype.getListUrls = function() {
	var url = that.cityList.shift();
	if(!url) {
		console.log("[INFO] finish getting list urls, proceed to getting estate urls.");
		console.log(that.listUrls.length);
		for(var i = 0; i < 20; i++) {
			that.getDetailUrls();
		}
		return;
	}
	that.crawler.queue({
		uri:url,
		callback:function(error, result, $) {
			if(error) {
				console.log("[ERROR] error getting estate list for ", result.uri);
				setTimeout(that.getList, 0);
				return;
			}
			var houseFilterCode = that.findHouseFilterCode($);
			if(!houseFilterCode) {
				console.log("[ERROR] house filter code not found for ", result.uri);
				setTimeout(that.getList, 0);
				return;
			}
			var url = result.uri + houseFilterCode + "-b81";
			setTimeout(function(){that.getPageCount(url)}, 0);
		}
	});
}

Sofun.prototype.findHouseFilterCode = function($) {
	var filters = $("#sjina_C01_10 .quyu_name a");
	for(var i = 0; i < filters.length; i++) {
		if(filters.eq(i).text() == "住宅") {
			var href = filters.eq(i).attr("href");
			return href.match(/list\/(.*)\//)[1];
		}
	}
	return undefined;
}

Sofun.prototype.getPageCount = function(url) {
	this.crawler.queue({
		uri:url,
		urlWithFilter:url,
		callback:function(error, result, $) {
			var url = result.options.urlWithFilter;
			if(error) {
				console.log("[ERROR] error getting estate list for ", url);
				setTimeout(that.getListUrls, 0);
				return;
			}
			try {
				var pager = $(".page a");
			} catch(e) {
				console.log("[ERROR] error getting page for ", url);
				setTimeout(that.getListUrls, 0);
				return;
			}
			var finalPageHref = pager.eq(pager.length-1).attr("href");
			if(finalPageHref.length == 1) {
				that.listUrls.push(url + "-b91");
				setTimeout(that.getListUrls, 0);
				return;
			}
			var totalPage = finalPageHref.match(/b9(\d*)\//)[1];
			for(var page = 1; page <= totalPage; page++) {
				that.listUrls.push(url + "-b9" + page);
			}
			setTimeout(that.getListUrls, 0);
			console.log("[INFO] done filling list urls for ", url);
		}
	});
}

Sofun.prototype.getDetailUrls = function() {
	var listUrl = that.listUrls.shift();
	if(!listUrl) {
		console.log("[INFO] {0} detail urls left.".format(that.listLock.length));
		if(that.listLock.length == 0) {
			console.log("[INFO] total tasks: ", that.estateList.length);
			for(var i = 0; i < 20; i++) {
				that.getDetail();
			}
		}
		return;
	}
	that.listLock.push(0);
	that.crawler.queue({
		uri:listUrl,
		callback:that.process
	});
}

Sofun.prototype.process = function(error, result, $) {
	var url = result.uri;
	if(error) {
		console.log("[ERROR] error getting detail urls for ", url);
		setTimeout(that.getDetailUrls, 0);
		that.listLock.pop();
		return;
	}
	try {
		var estateList = $(".sslalone");
	} catch(e) {
		console.log("[ERROR] error parsing detail urls for ", url);
		setTimeout(that.getDetailUrls, 0);
		that.listLock.pop();
		return;
	}
	for(var i = 0; i < estateList.length; i++) {
		var href = estateList.eq(i).find("dt a").eq(0).attr("href");
		that.estateList.push(href.toString());
	}
	setTimeout(that.getDetailUrls, 0);
	that.listLock.pop();
	console.log("[INFO] getting detail urls done for ", url);
}

Sofun.prototype.getDetail = function() {
	var detailUrl = that.estateList.shift();
	if(!detailUrl) {
		console.log("[INFO] all estates done.");
		var programmeEndtime = new Date().getTime();
		var timeConsumed = calculateTimeConsumed(that.programmeStartTime, programmeEndtime);
		console.log("[INFO] time consumed: ", timeConsumed);
		return;
	}
	if(that.done[detailUrl]) {
		setTimeout(that.getDetail, 0);
		return;
	}
	console.log("[INFO] working on ", detailUrl);
	that.crawler.queue({
		uri:detailUrl,
		callback:function(error, result, $) {
			var task = result.uri;
			if(error) {
				console.log("[ERROR] error getting detail for ", result.uri);
				setTimeout(that.getDetail, 0);
				return;
			}
			try {
				var detail = new Detail($, task);
				var newcode = result.body.match(/var newcode = "(\d*)"/)[1];
			} catch(e) {
				console.log("[ERROR] error parsing detail for ", result.uri);
				setTimeout(that.getDetail, 0);
				return;
			}
			that.crawler.queue({
				uri:"http://chat.newhouse.soufun.com/house/newhousechat/zygwTel400.php?callback=that.getContact&newcode={0}&isqddslp=1&_={1}".format(newcode, new Date().getTime()),
				task:task,
				detail:detail,
				jQuery:false,
				callback:function(error, result) {
					var task = result.options.task;
					if(error) {
						console.log("[ERROR] error getting contacts.");
						setTimeout(that.getDetail, 0);
						return;
					}
					try {
						var contacts = eval(result.body);
						detail.firstContact = contacts[0];
						detail.secondContact = contacts[1];
					} catch(e) {
						console.log("[ERROR] error parsing contacts for ", task);
						console.log(e.stack);
						setTimeout(that.getDetail, 0);
						return;
					}
					that.fillContact(task, detail, 1);
				}
			});
		}
	});
}	

Sofun.prototype.getContact = function(data) {
	var result = [];
	var firstContact = {};
	var secondContact = {};
	if(data[0] && data[0]["realname"]) {
		firstContact.name = data[0]["realname"];
		firstContact.link = "http://www.fang.com/xinfangbang/u/{0}.htm".format(data[0]["user_id"]);
	} else {
		firstContact.name = "null";
		firstContact.link = "null";
	}
	if(data.length > 1 && data[1]["realname"]) {
		secondContact.name = data[1]["realname"];
		secondContact.link = "http://www.fang.com/xinfangbang/u/{0}.htm".format(data[1]["user_id"]);
	} else {
		secondContact.name = "null";
		secondContact.link = "null";
	}
	result.push(firstContact);
	result.push(secondContact);
	return result;
}

Sofun.prototype.fillContact = function(task, detail, i) {
	if(i > 2) {
		fs.appendFileSync(that.resultFile, detail.toString());
		console.log("[INFO] done ", task);
		setTimeout(that.getDetail, 0);
		return;
	}
	var link = i == 1 ? detail.firstContact.link : detail.secondContact.link;
	if(link == "null") {
		setTimeout(function(){that.fillContact(task, detail, ++i)}, 0);
		return;
	}
	that.crawler.queue({
		uri:link,
		task:task,
		detail:detail,
		i:i,
		callback:function(error, result, $) {
			var task = result.options.task;
			var detail = result.options.detail;
			var i = result.options.i;
			if(error) {
				setTimeout(function(){that.fillContact(task, detail, ++i)}, 0);
				return;
			}
			try {
				if(i == 1) {
					detail.firstContact.company = $(".person_list li").eq(1).text().replace(/\s/g, "");
					detail.firstContact.phone = $(".tel_box_phone").text().trim();
				} else {
					detail.secondContact.company = $(".person_list li").eq(1).text().replace(/\s/g, "");
					detail.secondContact.phone = $(".tel_box_phone").text().trim();
				}
			} catch(e) {
			}
			setTimeout(function(){that.fillContact(task, detail, ++i)}, 0);
		}
	});
}

function Detail($, url) {
	this.url = url;
	this.city = $("#xfxq_C01_03 .s4Box").text();
	this.estateName = $("#xfxq_C02_01").text();
	try {
		var promotion = $("#qdds_total > div").eq(0).children("div");
		var promotionLeft = promotion.eq(0);
		var promotionMid = promotion.eq(1);
		var promotionRight = promotion.eq(2);
		var name = promotionLeft.find("img").eq(0).attr("src");
		if(name.match("sfwt_logo.png")) {
			this.promotionName = "新房委托";
		} else if(name.match("djyh_logo.png")) {
			this.promotionName = "独家优惠";
		} else if(name.match("sfwd_logo.png")) {
			this.promotionName = "搜房网店";
		} else if(name.match("sfnt_logo.png")) {
			this.promotionName = "搜房补贴";
		}
		this.promotionParticipants = trimPromotionText(promotionLeft.text());
		this.promotionInfo = trimPromotionText(promotionMid.text());
		this.promotionApplyTime = trimPromotionText(promotionRight.text());
	} catch(e) {
		console.log("[INFO] no promotion info found.");
		// console.log(e.stack);
		this.promotionName = "null";
		this.promotionParticipants = "null";
		this.promotionInfo = "null";
		this.promotionApplyTime = "null";
	}
	this.guidingPrice = $(".prib.cn_ff").text().trim();
	this.specialInfo = $("#huodong_title").text();
	this.houseType = $("#xfxq_C03_12").text().replace(/\s/g, "");
}

Detail.prototype.toString = function() {
	var result = [];
	result.push(this.url);
	result.push(this.city);
	result.push(this.estateName);
	result.push(this.promotionName);
	result.push(this.promotionParticipants);
	result.push(this.promotionInfo);
	result.push(this.promotionApplyTime);
	result.push(this.guidingPrice);
	result.push(this.specialInfo);
	result.push(this.houseType);
	result.push(this.firstContact.name);
	this.firstContact.company ? result.push(this.firstContact.company) : result.push("null");
	this.firstContact.phone ? result.push(this.firstContact.phone) : result.push("null");
	result.push(this.secondContact.name);
	this.secondContact.company ? result.push(this.secondContact.company) : result.push("null");
	this.secondContact.phone ? result.push(this.secondContact.phone) : result.push("null");
	return result.join("\t") + "\n";
}

function trimPromotionText(str) {
	var trim = str.replace(/\n/g, ";").replace(/\s/g,"").replace(/;+/g, ";");
	if(trim.charAt(0) == ";") {
		trim = trim.slice(1);
	}
	if(trim.charAt(trim.length-1) == ";") {
		trim = trim.slice(0, -1);
	}
	return trim;
}

var that = new Sofun();
that.start();