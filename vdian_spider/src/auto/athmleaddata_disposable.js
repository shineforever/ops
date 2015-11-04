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

function calculateTimeConsumed(start, end) {
    var seconds = Math.floor((end - start)/1000);
    var hour = Math.floor(seconds/3600);
    var minute = Math.floor(seconds/60) % 60;
    var second = seconds % 60;
    return hour + "h" + minute + "m" + second + "s";
}

function LeadData() {
	this.startTime = new Date();
	this.endTime;
	this.resultDir = "../../result/auto/";
	this.resultFile = "athmLeadData_" + this.startTime.toString() + ".txt";
	this.dealerFile = this.resultDir + "athmDealerId.txt";
	this.crawler = new Crawler({
		maxConnections:30,
		userAgent:"Mozilla/4.0",
		forceUTF8:true,
		incomingEncoding:"gb2312"
	});
	this.dealers = [];
	this.dealerLock = 0;
}

LeadData.prototype.init = function() {
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	var dealerInfo = fs.readFileSync(this.resultDir+this.dealerFile).toString();
	if(dealerInfo) {
		dealerInfo.split("\n").forEach(function(dealer){
			var info = dealer.split("\t");
			var o = {
				id:info[0],
				name:info[1],
				city:info[2],
				brand:info[3]
			}
			this.dealers.push(o);
		}, this);
	}
}

LeadData.prototype.run = function() {
	setTimeout(function(){
		for(var i = 0; i < 30; i++) {
			that.doNext();
		}
	}, 0)
}

LeadData.prototype.doNext = function() {
	var dealer = that.dealers.pop();
	if(!dealer) {
		++that.dealerLock;
		console.log(that.dealerLock);
		if(that.dealerLock == 30) {
			console.log("[INFO] Job done.");
			that.endTime = new Date().getTime();
			console.log("[INFO] time consumed: ", calculateTimeConsumed(that.startTime, that.endTime));
		}
		return;
	}
	console.log("[INFO] tasks left: ", that.dealers.length);
	that.crawler.queue({
		uri:"http://dealer.autohome.com.cn/Ajax/GetDealerLatestOrderList?dealerId={0}&companyId={1}&_={2}".format(dealer.id, dealer.id, new Date().getTime()),
		jQuery:false,
		dealer:dealer,
		callback:function(error, result) {
			var dealer = result.options.dealer;
			if(error) {
				console.log("[ERROR] error dealerId: ", dealer.id);
				setTimeout(that.doNext, 0);
				return;
			}
			try {
				var data = JSON.parse(result.body);
			} catch(e) {
				console.log("[ERROR] parse error dealerId: ", dealer.id);
				setTimeout(that.doNext, 0);
				return;
			}
			if(data && data.length > 0) {
				var list = [];
				for(var i = 0; i < data.length; i++) {
					for(var j = 0; j < data[i].length; j++) {
						var name = data[i][j].CustomerName.replace(/\\n/g, "");
						var city = data[i][j].CityName;
						var sex = data[i][j].CustomerSex == 0 ? "男" : "女";
						var date = data[i][j].DateString.split(" ")[0];
						var time = data[i][j].DateString.split(" ")[1];
						list.push([dealer.id, dealer.name, dealer.city, dealer.brand, name, city, sex, date, time].join("\t"));
					}
				}
				fs.appendFileSync(that.resultDir+that.resultFile, list.join("\n") + "\n");
				console.log("[INFO] Got dealerId: ", dealer.id);
			} else {
				console.log("[INFO] No data found dealerId: ", dealer.id);
			}
			setTimeout(that.doNext, 0);
		}
	});
}

LeadData.prototype.start = function() {
	this.init();
	this.run();
}

// var that = new LeadData();
// that.start();

function getOffset(pre, cur, firstHit) {
	for(var i = firstHit; i >=0 ; i--) {
		if(cur[i] != pre[pre.length-1-(firstHit-i)]) {
			for(var j = firstHit-1; j >0; j--) {
				if(cur[j] == pre[pre.length-1]) {
					firstHit = j;
					break;
				}
				if(j == 1) {
					return 0;
				}
			}
			return getOffset(pre, cur, firstHit);
		}
		if(i == 0) {
			return firstHit+1;
		}
	}
}
