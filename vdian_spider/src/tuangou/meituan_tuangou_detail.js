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

function Meituan() {
	this.today = new Date().toString();
	this.today = "2015-07-07";
	this.resultDir = "../../result/";
	this.resultFile = "meituan.tuangoudetail." + this.today + ".txt";
	this.doneFile = "meituan.doneid.txt";
	this.idFile = "meituan.txt";
	this.crawler = new Crawler({
		maxConnections:1,
		userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.101 Safari/537.36",
		jar:true
	});
	this.done = {};
	this.tasks = [];
}

Meituan.prototype.init = function() {
	console.log("[INFO] Initialization starts.");
	fs.readFileSync(this.resultDir+this.resultFile).toString().split("\n").forEach(function(line){
		var split = line.split("\t");
		if(split.length != 7) {
			return;
		}
		this.done[split[5]] = true;
	}, this);
	fs.readFileSync(this.resultDir+this.doneFile).toString().split("\n").forEach(function(line){
		this.done[line] = true;
	}, this);
	fs.readFileSync(this.resultDir+this.idFile).toString().split("\n").forEach(function(line){
		if(line) {
			var split = line.split("\t");
			if(split.length == 4 && !this.done[split[3]]) {
				this.tasks.push({city:split[0],mainCategory:split[1],subCategory:split[2],url:"http://www.meituan.com/shop/"+split[3]});
			}
		}
	}, this);
	console.log("[INFO] Initialization completes.");
}

Meituan.prototype.run = function() {
	this.doDetail();
}

Meituan.prototype.doDetail = function() {
	var task = that.tasks.shift();
	if(!task) {
		console.log("[INFO] Job done.");
		return;
	}
	console.log("[INFO] Task left: ", that.tasks.length);
	that.crawler.queue({
		uri:task.url,
		task:task,
		callback:function(error, result, $) {
			console.log(result.uri);
			try {
				var task = result.options.task;
				var shopId = task.url.match(/\d+/)[0];
			} catch(e) {
				console.log("[ERROR] Network error. Job done.");
				return;
			}
			if(error || !$) {
				console.log("[ERROR] Error ", result.uri);
				setTimeout(that.doDetail, (Math.random()*2+2)*1000);
				return;
			}
			var toWrite = [];
			$(".item.cf").each(function(){
				var basic = $(this).children("a").eq(0);
				var url = basic.attr("href");
				var title = basic.attr("title").replace(/\s/g, "");
				var type = "N/A";
				switch($("span.type-mark i", this).attr("class")) {
					case "sp-coupon":
						type = "团购";break;
					case "sp-voucher":
						type = "代金券";break;
					default:
						break;
				}
				var price = $("em.price strong", this).text();
				var sale = $("span.sale", this).text().match(/\d+/)[0];
				toWrite.push([url,title,type,price,sale,shopId,task.city].join("\t"));
			});
			if(toWrite.length == 0) {
				if(result.body.match(/请输入验证码以继续访问/)) {
					console.log("[WARN] 验证码 needed.");
					return;
				}
			} else {
				fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join("\n")+"\n");
			}
			fs.appendFileSync(that.resultDir+that.doneFile, shopId+"\n");
			console.log("[INFO] Found %s deals in %s", toWrite.length, shopId);
			setTimeout(that.doDetail, (Math.random()*2+2)*1000);
		}
	});

}

Meituan.prototype.start = function() {
	this.init();
	this.run();
}

var that = new Meituan();
that.start();