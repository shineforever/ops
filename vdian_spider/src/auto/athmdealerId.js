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

function DealerID() {
	this.resultDir = "../../result/auto/";
	this.resultFile = "athmDealerId.txt";
	this.crawler = new Crawler({
		maxConnections:10,
		userAgent:"Mozilla/4.0",
		forceUTF8:true,
		callback:function(error, result, $) {
			console.log(result.uri)
			if(error || !$) {
				console.log("[ERROR] error ", result.uri);
				return;
			}
			var toWrite = [];
			try {
				var dealers = $(".dealer-cont.js-dealer").find(".dealer-cont-title");
				for(var i = 0; i < dealers.length; i++) {
					var dealer = dealers.eq(i).find("a");
					dealer = dealer.eq(dealer.length-1);
					var dealerName = dealer.text();
					var dealerCity = dealer.attr("js-darea");
					var dealerBrand = dealer.attr("js-dbrand");
					var dealerId = dealer.attr("js-did");
					toWrite.push([dealerId, dealerName, dealerCity, dealerBrand].join("\t"));
				}
			} catch(e) {
				console.log("[ERROR] parse error ", result.uri);
				return;
			}
			fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join("\n") + "\n");
			console.log("[INFO] done");
		}
	});
}

DealerID.prototype.init = function() {
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
}

DealerID.prototype.start = function() {
	this.init();
	this.crawler.queue({
		uri:"http://dealer.autohome.com.cn/china",
		jQuery:false,
		callback:function(error, result) {
			if(error) {
				console.log("[ERROR] error getting total page.");
				return;
			}
			var totalPage = result.body.match(/共(\d+)页/)[1];
			console.log("[INFO] total page: ", totalPage);
			var tasks = [];
			for(var i = 1; i < parseInt(totalPage)+1; i++) {
				tasks.push("http://dealer.autohome.com.cn/china/0_0_0_0_{0}.html".format(i));
			}
			setTimeout(that.crawler.queue(tasks));
		}
	});
}

var that = new DealerID();
that.start();