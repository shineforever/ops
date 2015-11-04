var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")

var logger = require("winston")
var godotTransport = require("winston-godot")
var godot = require("godot")
var env = process.env.NODE_ENV || "development"

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"youxin.newlypost"});

logger.add(logger.transports.File, { filename: '../../log/youxin_newlypost.log' ,logstash:true,level:'info',handleExceptions:true});
logger.cli();

if(env==="production"){
    logger.remove(logger.transports.Console);
}

function Car() {
    this.drainTimes = 2;
    this.startTime = moment().valueOf();
    this.today = moment().format("YYYY-MM-DD");
    this.resultDir = "../../result/auto/";
    this.resultFile = "youxinnewlypost_"+this.today+".csv";
    this.endpointFile = "../../log/youxinnewlypost_endpoint.txt";
    this.crawler = new Crawler({
        maxConnections:1,
        userAgent:"Mozilla/5.0",
        rateLimits:3000,
        onDrain:function(){
            --that.drainTimes;
            if(!that.drainTimes) {
                logger.info("[%s] Job done.", moment().format("YYYY-MM-DD HH:mm:ss"));
                client.close();
            }
        }
    });
    this.endId = 698224;
    this.largestId = 1;
    this.curStopId;
}

Car.prototype.init = function() {
    try {
        this.endId = parseInt(fs.readFileSync(this.endpointFile).toString());
    } catch(e) {
    }
    fs.writeFileSync(this.resultDir+this.resultFile, "\ufeffUrl,标题,品牌,系列,上牌时间,里程,排量,变速,售卖城市,标签,价格,商户Url,商户名称,商户销量,测试人员姓名,测试人员头衔,测试时间,是否付一半,抓取时间\n");
    logger.info("end ID: ", this.endId);
}

Car.prototype.run = function() {
    this.getLargestId();
}

Car.prototype.getLargestId = function() {
    for(var page = 1; page < 100; page++) {
        that.crawler.queue({
            uri:util.format("http://www.xin.com/quanguo/s/o2a10i%sv1", page),
            page:page,
            callback:function(error, result, $) {
                if(error || !$) {
                    logger.error("Error opening %s", result.uri);
                    return;
                }
                $(".car-vtc.vtc-border").each(function(){
                    var match = $(this).find(".vtc-info").find("a").attr("href").match(/10(\d+)/);
                    var carId = match ? parseInt(match[1]) : 1;
                    that.largestId = that.largestId > carId ? that.largestId : carId;
                });
                logger.info("Current largestId: %s", that.largestId);
                var page = result.options.page;
                if(page >= 99) {
                    logger.info("Final largestId: %s", that.largestId);
                    fs.writeFileSync(that.endpointFile, that.largestId);
                    setTimeout(that.doDetail);
                }
            }
        });
    }
}

Car.prototype.doDetail = function(id) {
    for(var id = that.largestId; id > that.endId; id--) {
        that.crawler.queue({
            uri:util.format("http://www.xin.com/c/10%s.html", id),
            id:id,
            callback:that.processDetail
        });
    }
    logger.info("Do detail starts.");
}

Car.prototype.processDetail = function(error, result, $) {
    logger.info(result.uri);
    var id = result.options.id;
    if(error || !$) {
        logger.error("Error opening %s", id);
        return;
    }
    if(result.body.match(/这个页面找不到啦/)) {
        logger.error("Page not found %s", id);
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
            car.href,car.title.replace(/,/g, ""),car.brand,car.model,car.registerDate,car.mileAge,
            car.engine,car.transmission,car.saleCity,car.tag,car.price,car.shopUrl,
            car.shopName.replace(/,/g, ""),car.carsSold,car.testPersonName,car.testPersonTitle,
            car.testTime,car.isFuyiban,moment().format("YYYY-MM-DD HH:mm:ss")
        ].join()+"\n");
    logger.info("Got %s", result.uri);
}

Car.prototype.start = function() {
    this.init();
    this.run();
}

var that = new Car();
that.start();
