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

Date.prototype.toPreciseString = function() {
    var year = this.getFullYear();
    var month = this.getMonth() + 1;
    var day = this.getDate();
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    var hour = this.getHours();
    var minute = this.getMinutes();
    return year + "-" + month + "-" + day+" "+hour+":"+minute
}

function Car() {
    this.startTime = new Date().getTime();
    this.resultDir = "./result/auto/";
    this.resultFile = "youxinbugfix_"+new Date().toString()+".txt";
    this.crawler = new Crawler({
        maxConnections:1,
        userAgent:"Mozilla/5.0"
    });
    this.tasks = [];
}

Car.prototype.init = function() {
	fs.readFileSync("./fuyibanlinks.txt").toString().split(",").forEach(function(link){
		this.tasks.push(link);
	}, this);
}

Car.prototype.run = function() {
    this.doDetail();
}

Car.prototype.doDetail = function() {
	var task = that.tasks.shift();
	if(!task) {
		console.log("[INFO] Job done.");
		return;
	}
    that.crawler.queue({
        uri:task,
        callback:function(error, result, $) {
            if(error || !$) {
                console.log("[ERROR] Error opening ", result.uri);
                setTimeout(function(){
                    that.doDetail();
                }, 0);
                return;
            }
            var car = {};
            car.href = result.uri;
            var titleMatch = $(".tit");
            var basicInfoMatch = $(".contit li");
            var priceMatch = $(".wan_1 em");
            var tagMatch = $(".d-tit img");
            var testTagMatch = $(".test-txt p img").attr("src");
            var transmissionMatch = result.body.match(/<td>变速箱<\/td><td>(.*?)<\/td>/);
            var shopUrlMatch = result.body.match(/<a href="(.*?)" class="cpbtn" target="_blank">进入店铺<\/a>/);
            var testPersonNameMatch = result.body.match(/<span>姓<b><\/b>名<\/span>(.*?)\s*<\/li>/);
            var testPersonTitleMatch = result.body.match(/<span>级<b><\/b>别<\/span>(.*?)\s*<\/li>/);
            var testTimeMatch = result.body.match(/<span>检测时间<\/span>(.*?)\s*<\/li>/);
            var shopNameMatch = result.body.match(/<p>(.*)<\/p>\s*<ul class="cpname">/);
            var carsSoldMatch = result.body.match(/<span>(\d+)辆<\/span><em>在售车辆<\/em>/);
            var isFuyibanMatch = result.body.match(/<b class="btn-half">/);
            car.title = titleMatch.length > 0 ? titleMatch.text().trim() : "无数据";
            car.brand = titleMatch.length > 0 ? car.title.split(" ")[0] : "无数据";
            car.model = titleMatch.length > 0 ? car.title.split(" ")[1] : "无数据";
            if(basicInfoMatch.length == 4) {
                car.registerDate = basicInfoMatch.eq(0).find("em").text();
                car.mileAge = basicInfoMatch.eq(1).find("em").text();
                car.engine = basicInfoMatch.eq(2).find("em").text();
                car.saleCity = basicInfoMatch.eq(3).find("em").text();
            } else {
                car.registerDate = "无数据";
                car.mileAge = "无数据";
                car.engine = "无数据";
                car.saleCity = "无数据";
            }
            car.price = priceMatch.length > 0 ? priceMatch.text() : "无数据";
            var tags = {};
            if(tagMatch.length > 1) {
                for(var i = 1; i < tagMatch.length; i++) {
                    var tag = tagMatch.eq(i).attr("src");
                    if(tag.match(/promise_ico/)) {
                        tags["无事故承诺"] = true;
                    } else if(tag.match(/quality_ico.png/)) {
                        tags["宝固质保"] = true;
                    } else if(tag.match(/presur_ico/)) {
                        tags["原厂质保"] = true;
                    } else if(tag.match(/sell_ico0407/)) {
                        tags["商家质保"] = true;
                    }
                }
            }
            if(testTagMatch) {
                var tag = testTagMatch;
                if(tag.match(/promise_ico/)) {
                    tags["无事故承诺"] = true;
                } else if(tag.match(/quality_ico.png/)) {
                    tags["宝固质保"] = true;
                } else if(tag.match(/presur_ico/)) {
                    tags["原厂质保"] = true;
                } else if(tag.match(/sell_ico0407/)) {
                    tags["商家质保"] = true;
                }
            }
            if(Object.keys(tags).length > 0) {
                car.tag = Object.keys(tags).join("/");
            } else {
                car.tag = "无";
            }
            car.transmission = transmissionMatch ? transmissionMatch[1] : "无数据";
            car.shopUrl = shopUrlMatch ? "http://www.xin.com"+shopUrlMatch[1] : "无商铺信息";
            car.testPersonName = testPersonNameMatch ? testPersonNameMatch[1] : "无测试人员信息";
            car.testPersonTitle = testPersonTitleMatch ? testPersonTitleMatch[1] : "无测试人员信息";
            car.testTime = testTimeMatch ? testTimeMatch[1] : "无测试时间信息";
            car.shopName = shopNameMatch ? shopNameMatch[1] : "无商铺信息";
            car.carsSold = carsSoldMatch ? carsSoldMatch[1] : "无商铺信息";
            car.isFuyiban = isFuyibanMatch ? "是" : "否";
            fs.appendFileSync(that.resultDir+that.resultFile, [
                    car.href,car.title,car.brand,car.model,car.registerDate,car.mileAge,
                    car.engine,car.transmission,car.saleCity,car.tag,car.price,car.shopUrl,
                    car.shopName,car.carsSold,car.testPersonName,car.testPersonTitle,
                    car.testTime,car.isFuyiban,new Date().toPreciseString()
                ].join("\t")+"\n");
            console.log("[INFO] Got ", result.uri);
            setTimeout(function(){
                that.doDetail();
            }, 2500);
        }
    });
}

Car.prototype.start = function() {
    this.init();
    this.run();
}

var that = new Car();
that.start();