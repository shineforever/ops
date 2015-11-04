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

function LeadData() {
	this.resultDir = "../../result/auto/";
	this.dealerFile = this.resultDir + "athmDealerId.txt";
	this.crawler = new Crawler({
		maxConnections:30,
		userAgent:"Mozilla/4.0",
		forceUTF8:true,
		incomingEncoding:"gb2312",
		callback:function(error, result) {
			var dealer = result.options.dealer;
			var preInterval = result.options.preInterval;
			if(error) {
				console.log("[ERROR] error dealerId: ", dealer.id);
				setTimeout(function(){
					that.crawler.queue({
						uri:"http://dealer.autohome.com.cn/Ajax/GetDealerLatestOrderList?dealerId={0}&companyId={1}&_={2}".format(dealer.id, dealer.id, new Date().getTime()),
						jQuery:false,
						dealer:dealer,
						priority:9
					})
				}, 0);
				return;
			}
			try {
				var data = JSON.parse(result.body);
			} catch(e) {
				console.log("[ERROR] parse error dealerId: ", dealer.id);
				setTimeout(function(){
					that.crawler.queue({
						uri:"http://dealer.autohome.com.cn/Ajax/GetDealerLatestOrderList?dealerId={0}&companyId={1}&_={2}".format(dealer.id, dealer.id, new Date().getTime()),
						jQuery:false,
						dealer:dealer,
						priority:9
					})
				}, 0);
				return;
			}
			var interval;
			if(data && data.length > 0) {
				var curList = [];
				var list = [];
				for(var i = 0; i < data.length; i++) {
					for(var j = 0; j < data[i].length; j++) {
						var name = data[i][j].CustomerName.replace(/\\n/g, "");
						var city = data[i][j].CityName.replace(/\\n/g, "");
						var sex = data[i][j].CustomerSex == 0 ? "男" : "女";
						var date = data[i][j].DateString.split(" ")[0];
						var time = data[i][j].DateString.split(" ")[1];
						curList.push(date+" "+time+"&"+city+name);
						list.push([dealer.id, dealer.name, dealer.city, dealer.brand, name, city, sex, date, time].join("\t"));
					}
				}
				var diff = new Date(list[0].split("\t")[7]+" "+list[0].split("\t")[8]).getTime()-new Date("2015-03-01 00:00").getTime();
				if(list.length < 2 || diff < 0) {
					interval = 3600000;
				} else {
					interval = getInterval(list);
				}
				var preList = result.options.preList;
				list.reverse();
				curList.reverse();
				if(!preList || preList.length < 2 || list.length < 2) {
					fs.appendFileSync(that.resultDir+"athmLeadData_"+new Date().toString()+".txt", list.join("\n") + "\n");
					console.log("[INFO] Got {0} records dealerId: {1}".format(list.length, dealer.id));
				} else {
					if(new Date(list[list.length-1].split("\t")[7]+" "+list[list.length-1].split("\t")[8]).getTime()-new Date(preList[preList.length-1].split("&")[0]).getTime() > 0) {
						var toAdd = list.slice(getOffset(preList, curList, curList.length-1));
						if(toAdd.length > 0) {
							fs.appendFileSync(that.resultDir+"athmLeadData_"+new Date().toString()+".txt", toAdd.join("\n") + "\n");
						} else {
							if(preInterval) {
								interval = preInterval + 60000;
							} else {
								interval += 60000;
							}
							
						}
						console.log("[INFO] Got {0} records dealerId: {1}".format(toAdd.length, dealer.id));
					} else {
						console.log("[INFO] Bad Data dealerId: ", dealer.id);
						curList = preList;
						interval = preInterval + 60000;
					}
				}
				console.log("[INFO] interval: ", interval);
				setTimeout(function(){
					that.crawler.queue({
						uri:"http://dealer.autohome.com.cn/Ajax/GetDealerLatestOrderList?dealerId={0}&companyId={1}&_={2}".format(dealer.id, dealer.id, new Date().getTime()+interval),
						jQuery:false,
						dealer:dealer,
						priority:5,
						preList:curList,
						preInterval:interval
					})
				}, interval);
			} else {
				console.log("[INFO] No data found dealerId: ", dealer.id);
				interval = 7200000;
				setTimeout(function(){
					that.crawler.queue({
						uri:"http://dealer.autohome.com.cn/Ajax/GetDealerLatestOrderList?dealerId={0}&companyId={1}&_={2}".format(dealer.id, dealer.id, new Date().getTime()+interval),
						jQuery:false,
						dealer:dealer,
						priority:5
					})
				}, interval);
			}
			
		}
	});
	this.dealers = [];
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
				brand:info[3].replace(/[\r\n]/g, "")
			}
			this.dealers.push(o);
		}, this);
	}
}

LeadData.prototype.run = function() {
	for(var i = 0; i < this.dealers.length; i++) {
		var dealer = this.dealers[i];
		this.crawler.queue({
			uri:"http://dealer.autohome.com.cn/Ajax/GetDealerLatestOrderList?dealerId={0}&companyId={1}&_={2}".format(dealer.id, dealer.id, new Date().getTime()),
			jQuery:false,
			dealer:dealer,
			priority:9
		});
	}
}

LeadData.prototype.start = function() {
	this.init();
	this.run();
}

var that = new LeadData();
that.start();

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

function getInterval(list) {
	var benchmarkDate = new Date();
	benchmarkDate.setDate(benchmarkDate.getDate()-3);
	list = list.map(function(str){
		return str.split("\t")[7] + " " + str.split("\t")[8];
	});
	if(new Date(list[0]).getTime()-benchmarkDate.getTime() > 0) {
		var gap = new Date(list[0]).getTime() - new Date(list[1]).getTime();
		gap = gap > 3600000 ? 3600000 : gap;
		return gap;
	}
	var diff = 0;
	for(var i = 0; i < list.length-1; i++) {
		diff += new Date(list[i]).getTime() - new Date(list[i+1]).getTime();
	}
	diff = Math.floor(diff/list.length-1);
	diff = diff > 3600000 ? 3600000 : diff;
	return diff;
}
