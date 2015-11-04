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
logger.add(godotTransport, {godot:client, service:"youxin.fuyiban"});

logger.add(logger.transports.File, { filename: '../../log/youxin_list_fuyiban.log' ,logstash:true,level:'info',handleExceptions:true});
logger.cli();

if(env==="production"){
    logger.remove(logger.transports.Console);
}

function Car() {
    this.resultDir = "../../result/auto/";
    this.resultFile = "youxinlistfuyiban_"+moment().format("YYYY-MM-DD")+".csv";
    this.crawler = new Crawler({
        maxConnections:1,
        userAgent:"Mozilla/5.0"
    });
}

Car.prototype.init = function() {
    fs.writeFileSync(this.resultDir+this.resultFile, "\ufeffUrl,标题,品牌,系列,上牌时间,里程,变速,标签,价格,是否出售,抓取时间\n");
}

Car.prototype.run = function() {
    this.doPage(1);
}

Car.prototype.doPage = function(page) {
    that.crawler.queue({
        uri:util.format("http://www.xin.com/quanguo/h/o2a10i%s", page),
        page:page,
        callback:function(error, result, $) {
            var page = result.options.page;
            if(error || !$) {
                logger.error("Error opening page ", page);
                setTimeout(function(){
                    that.doPage(++page);
                }, (Math.random()*12 + 8)*100);
                return;
            }
            var toWrite = [];
            var list = $(".car-vtc.vtc-border");
            for(var i = 0; i < list.length; i++) {
                var car = {};
                var soldIcon = list.eq(i).find(".vtc-img .tips-2.collect-ico.abs");
                car.isSold = soldIcon.length > 0 ? "已出售" : "未出售";
                var basicInfo = list.eq(i).find(".vtc-info");
                car.href = "http://www.xin.com" + basicInfo.find("a").attr("href");
                car.title = basicInfo.find("a").attr("title");
                car.brand = car.title.split(" ")[0];
                car.model = car.title.split(" ")[1];
                car.registerDate = basicInfo.find("ul li").eq(0).text();
                car.mileAge = basicInfo.find("ul li").eq(1).text();
                car.transmission = basicInfo.find("ul li").eq(2).text();
                car.saleCity = basicInfo.find("ul li").eq(3).text();
                car.tag = [];
                basicInfo.find(".back img").each(function(item){
                    var tag = $(this).attr("src");
                    switch(tag) {
                        case "http://imgs.xin.com/xin/images/car-sale/promise_ico.png":
                            car.tag.push("无事故承诺");break;
                        case "http://imgs.xin.com/xin/images/car-sale/quality_ico.png":
                            car.tag.push("宝固质保");break;
                        case "http://imgs.xin.com/xin/images/car-sale/presur_ico.png":
                            car.tag.push("原厂质保");break;
                        case "http://imgs.xin.com/xin/images/car-sale/sell_ico0407.png":
                            car.tag.push("商家质保");break;
                        default:
                            car.tag.push("无");break;
                    }
                });
                car.tag = car.tag.join("/");
                car.price = list.eq(i).find(".vtc-money em").text();
                toWrite.push([
                        car.href,car.title.replace(/,/g, ""),car.brand,car.model,car.registerDate,
                        car.mileAge,car.transmission,car.tag,car.price,car.isSold,
                        moment().format("YYYY-MM-DD HH:mm:ss")
                    ].join()+"\n");
            }
            fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join(""));
            logger.info("Got %s cars for page %s", list.length, page);
            if(list.length < 20) {
                logger.info("Job done.");
                client.close();
                return;
            }
            setTimeout(function(){
                that.doPage(++page);
            }, (Math.random()*10 + 15)*100);
        }
    });
}

Car.prototype.start = function() {
    this.init();
    this.run();
}

var that = new Car();
that.start();
