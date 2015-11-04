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
	this.resultFile = "shandiangou_item.txt";
	this.dataFile = "../../result/app/shandiangou_communityId.txt";
	this.crawler = new Crawler({
		maxConnections:3,
		userAgent:"Mozilla/5.0",
		jQuery:false,
		callback:function(error, result) {
			if(error) {
				console.log("[ERROR] Error opening ", result.uri);
				setTimeout(that.doNext, 0);
				return;
			}
			var task = result.options.task;
			var data;
			try {
				data = JSON.parse(result.body);
			} catch(e) {
				console.log("[ERROR] Error parsing ", result.uri);
				setTimeout(that.doNext, 0);
				return;
			}
			if(!data.length || data.length == 0) {
				console.log("[INFO] No data found ", result.uri);
				setTimeout(that.doNext, 0);
				return;
			}
			var toWrite = [];
			data.forEach(function(item){
				if(item["upload_user_id"] == null) {
					item["upload_user_id"] = "null";
				}
				toWrite.push([
					item["id"].toString().replace(/\s/g, ""),
					item["item_name"].toString().replace(/\s/g, ""),
					item["price"].toString().replace(/\s/g, ""),
					item["property"].toString().replace(/\s/g, "")+"/"+item["unit"].toString().replace(/\s/g, ""),
					item["upload_user_id"].toString().replace(/\s/g, ""),
					item["shop_name"].toString().replace(/\s/g, ""),
					task["communityId"],
					task["category"],
					task["catDesc"]
				].join("\t"));
			});
			fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join("\n")+"\n");
			if(data.length = 100) {
				that.tasks.push({
					communityId:task.communityId,
					category:task.category,
					catDesc:task.catDesc,
					page:task.page+1
				});
			}
			setTimeout(that.doNext, 0);
			console.log("[INFO] task left: ", that.tasks.length);
			return;
		}
	});
	this.tasks = [];
	this.lock = 3;
}

FlashBuy.prototype.init = function() {
	if(fs.existsSync(this.dataFile)) {
		fs.readFileSync(this.dataFile).toString().split("\n").forEach(function(line){
			var split = line.split("\t");
			if(split.length != 3) {
				console.log("[ERROR] Illegal communityId format");
				return;
			}
			this.tasks.push({
				communityId:split[0],
				category:split[1],
				catDesc:split[2],
				page:1
			});
		}, this);
	}
	console.log("[INFO] Total tasks: ", this.tasks.length);
}

FlashBuy.prototype.run = function() {
	if(this.tasks.length == 0) {
		console.log("[INFO] No data file found.\n[INFO] Job done.");
		return;
	}
	for(var i = 0; i < 3; i++) {
		that.doNext();
	}
}

FlashBuy.prototype.doNext = function() {
	var task = that.tasks.pop();
	if(!task) {
		--that.lock;
		if(that.lock == 0) {
			console.log("[INFO] Job done.");
		}
		return;
	}
	that.crawler.queue({
		uri:"http://www.52shangou.com/o2o/home/item_list_data.php?1=1&page={0}&pageSize=100&communityId={1}&catId={2}".format(task.page, task.communityId, task.category),
		task:task
	});
}

FlashBuy.prototype.start = function() {
	this.init();
	this.run();
}

var that = new FlashBuy();
that.start();
