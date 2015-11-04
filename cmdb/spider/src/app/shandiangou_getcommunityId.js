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

function FlashBuy() {
	this.resultDir = "../../result/app/";
	this.resultFile = "shandiangou_communityId.txt";
	this.count = 0;
	this.crawler = new Crawler({
		maxConnections:5,
		userAgent:"Mozilla/5.0",
		jQuery:false,
		callback:function(error, result) {
			var communityId = result.uri.match(/communityId=(\d+)&/)[1];
			if(error) {
				console.log("[ERROR]");
				return;
			}
			try {
				var data = JSON.parse(result.body);
			} catch(e) {
				console.log("[ERROR] parse error ", result.uri);
				console.log(result.body);
				setTimeout(that.doNext, 3000);
				return;
			}
			if(!data.featureItem.length) {
				console.log("[INFO] {0} not a valid communityId".format(communityId));
			} else {
				console.log("[INFO] {0} is a valid communityId".format(communityId));
				var cats = data.cats;
				cats.shift();
				var toWrite = [];
				cats.forEach(function(cat){
					toWrite.push([communityId, cat["0"], cat["1"]].join("\t"));
				});
				fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join("\n")+"\n");
			}
			setTimeout(that.doNext, 0);
		}
	});
}

FlashBuy.prototype.init = function() {

}

FlashBuy.prototype.run = function() {
	for(var i = 0; i < 5; i++) {
		this.doNext();
	}
}

FlashBuy.prototype.doNext = function() {
	if(that.count > 300000) {
		console.log("[INFO] Job done.");
		return;
	}
	console.log("[INFO] working on ", that.count);
	that.crawler.queue({
		uri:"http://www.52shangou.com/o2o/home/item_list_data.php?1=1&communityId={0}&act=newCommunity".format(that.count)
	});
	++that.count;
}

FlashBuy.prototype.start = function() {
	this.init();
	this.run();
}

var that = new FlashBuy();
that.start();
