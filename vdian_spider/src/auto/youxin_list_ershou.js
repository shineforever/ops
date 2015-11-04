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
logger.add(godotTransport, {godot:client, service:"youxin.ershou"});

logger.cli();
logger.add(logger.transports.File, {filename:"../../log/youxin_list_ershou.log", logstash:true, level:"info",handleExceptions:true});
if(env==="production"){
    logger.remove(logger.transports.Console);
}

function Car() {
    //由于列表页过长，无法在规定时间内跑完，现在分为两太机器跑，一台1-15000页，一台15001-末页
    var arguments = process.argv.splice(2);
    this.startPage = arguments[0] || 1;
    this.endPage = arguments[1] || 15000;
    this.today = this.startPage == 1 ? moment().format("YYYY-MM-DD") : moment().add(-1, "days").format("YYYY-MM-DD");
    this.resultDir = "../../result/auto/";
    this.resultFile = "youxinlistershou_"+this.today+".txt";
    this.crawler = new Crawler({
        maxConnections:1,
        userAgent:"Mozilla/5.0"
    });
}

Car.prototype.init = function() {
}

Car.prototype.run = function() {
    this.doPage(this.startPage);
}

Car.prototype.doPage = function(page) {
    that.crawler.queue({
        uri:util.format("http://www.xin.com/quanguo/s/o2a10i%sv1", page),
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
            try {
                if(page == that.startPage && page > 15000) {
                    var paginator = $(".search_page_link a");
                    that.endPage = Number(paginator.eq(paginator.length-2).attr("data-page"));
                }
            } catch(e) {
                logger.error("Error getting end page.");
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
                        car.href,car.title,car.brand,car.model,car.registerDate,
                        car.mileAge,car.transmission,car.tag,car.price,car.isSold,
                        moment().format("YYYY-MM-DD HH:mm:ss")
                    ].join("\t")+"\n");
            }
            fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join(""));
            logger.info("Got %s cars for page %s", list.length, page);
            if(page == 15000 || (list.length < 20 && page >= that.endPage)) {
                logger.info("Job done.");
                client.close();
                return;
            }
            setTimeout(function(){
                that.doPage(++page);
            }, 3000);
        }
    });
}

Car.prototype.start = function() {
    this.init();
    this.run();
}

var that = new Car();
that.start();
