var fs = require("fs")
var util = require("util")
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

Date.prototype.addDays = function(daysToAdd) {
    var day = this.getDate();
    this.setDate(day + daysToAdd);
    return this;
}

function CarRental() {
    this.resultDir = "../../result/auto/";
    this.resultFile = "baojiazuche_" + new Date().toString() + ".txt";
    this.crawler = new Crawler({
        maxConnections:20,
        userAgent:"Mozilla/4.0",
        jQuery:false,
        callback:function(error, result) {
            // var city = result.options.city;
            var city = result.uri.match(/http:\/\/www\.baojia\.com\/(.*?)\//)[1];
            if(error) {
                console.log("[ERROR] Error getting car info: ", result.uri);
                // setTimeout(that.doCar, 0);
                return;
            }
            var modelMatch = result.body.match(/<h1 class="year-make-model">\s*(.*?)\s/);
            var yearMatch = result.body.match(/<span class="year">(\d+)<\/span>/);
            var vehicleNameMatch = result.body.match(/<h2 itemprop="name" class="vehicle-name">([\s\S]*?)<\/h2>/);
            var regexp = /<span class="value">(.*?)<\/span>/g;
            var responseInfoMatch;
            var responseInfo = [];
            while(responseInfoMatch = regexp.exec(result.body)) {
                responseInfo.push(responseInfoMatch[1]);
            }
            regexp = /<span class="dollars">(\d+)<\/span>/g;
            var priceInfoMatch;
            var priceInfo = [];
            while(priceInfoMatch = regexp.exec(result.body)) {
                priceInfo.push(priceInfoMatch[1]);
            }
            var colorMatch = result.body.match(/颜色 : (.*?)\s/);
            var transmissionMatch = result.body.match(/变速器 : (.*?)\s/);
            var seatsMatch = result.body.match(/座位数 : (.*?)\s/);
            var mileAgeMatch = result.body.match(/驶程 : (.*?)\s/);
            var petrolMatch = result.body.match(/油号 : (.*?)\s/);
            var carNumMatch = result.body.match(/车牌号 : (.*?)\s/);
            var longtermRentalMatch = result.body.match(/可长期租用 : (.*?)\s/);
            var deliveryMatch = result.body.match(/交车方式 : (.*?)\s/);
            var smokeMatch = result.body.match(/可抽烟 : (.*?)\s/);
            var mileRestrictionDailyMatch = result.body.match(/(\d+.*?) \/ 天/);
            var mileRestrictionWeeklyMatch = result.body.match(/(\d+.*?) \/ 周/);
            var mileRestrictionMonthlyMatch = result.body.match(/(\d+.*?) \/ 月/);
            var reservationCountMatch = result.body.match(/<div class="trips-taken">\s*<span class="number">(\d+)<\/span>/);
            var reviewCountMatch = result.body.match(/<div itemprop="reviewCount" class="number-of-reviews">\s*<span class="number">(\d+)<\/span>/);
            if(!modelMatch || !yearMatch || !vehicleNameMatch || responseInfo.length!=2 || priceInfo.length!=3 || 
                !mileAgeMatch || !carNumMatch || !reservationCountMatch) {
                console.log("[ERROR] Error parsing car info: ", result.uri);
                // setTimeout(that.doCar, 0);
                return;
            }
            var toWrite = [];
            toWrite.push(result.uri);
            toWrite.push(city);
            toWrite.push(modelMatch[1]);
            toWrite.push(yearMatch[1]);
            toWrite.push(vehicleNameMatch[1].replace(/\s/g,""));
            toWrite.push(responseInfo[0]);
            toWrite.push(responseInfo[1]);
            toWrite.push(priceInfo[0]);
            toWrite.push(priceInfo[1]);
            toWrite.push(priceInfo[2]);
            if(colorMatch) {
                toWrite.push(colorMatch[1]);
            } else {
                toWrite.push("无颜色信息");
            }
            if(transmissionMatch) {
                toWrite.push(transmissionMatch[1]);
            } else {
                toWrite.push("无变档信息");
            }
            if(seatsMatch) {
                toWrite.push(seatsMatch[1]);
            } else {
                toWrite.push("无座位信息");
            }
            toWrite.push(mileAgeMatch[1]);
            if(petrolMatch) {
                toWrite.push(petrolMatch[1]);
            } else {
                toWrite.push("无油号信息");
            }
            toWrite.push(carNumMatch[1]);
            if(longtermRentalMatch) {
                toWrite.push(longtermRentalMatch[1]);
            } else {
                toWrite.push("无长期租用信息");
            }
            if(deliveryMatch) {
                toWrite.push(deliveryMatch[1]);
            } else {
                toWrite.push("无交车方式信息");
            }
            if(smokeMatch) {
                toWrite.push(smokeMatch[1]);
            } else {
                toWrite.push("无抽烟信息");
            }
            if(mileRestrictionDailyMatch && mileRestrictionWeeklyMatch && mileRestrictionMonthlyMatch) {
                toWrite.push(mileRestrictionDailyMatch[1]);
                toWrite.push(mileRestrictionWeeklyMatch[1]);
                toWrite.push(mileRestrictionMonthlyMatch[1]);
            } else {
                toWrite.push("不限");
                toWrite.push("不限");
                toWrite.push("不限");
            }
            toWrite.push(reservationCountMatch[1]);
            if(reviewCountMatch) {
                toWrite.push(reviewCountMatch[1]);
                var firstCommentMatch = result.body.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\s*<\/span>\s*<\/div>\s*<\/div>\s*<div class="spacer"><\/div>\s*<\/li>\s*<\/ul>/);
                if(firstCommentMatch) {
                    toWrite.push(firstCommentMatch[1]);
                } else {
                    toWrite.push("No match");
                }
            } else {
                toWrite.push("0");
                toWrite.push("暂无评论");
            }
            fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join("\t")+"\n");
            console.log("[INFO] Got ", result.uri);
            // console.log("[INFO] car task left: ", that.carUrls.length);
            // setTimeout(that.doCar, 0);
        }
    });
    this.cityLinks = [];
    this.pageUrls = [];
    this.carUrls = [];
    this.cityLock = 0;
    this.pageLock = 20;
    this.carLock = 20;
}

CarRental.prototype.init = function() {
    console.log("[INFO] initialization starts.");
    if(!fs.existsSync(this.resultDir)) {
        fs.mkdirSync(this.resultDir);
    }
    fs.appendFileSync(this.resultDir+this.resultFile, [
            "Url","City","CarModel","CarPurchaseYear","CarDetail","ResponseRate","ResponseTime",
            "PricePerHour","PricePerDay","PricePerWeek","CarColour","Transmission","Seats",
            "MileAge","Petrol","CarNum","Long-term Rental Allowed","Delivery","Smoke Allowed",
            "MileRestrictionPerDay","MileRestrictionPerWeek","MileRestrictionPerMonth",
            "ReservationCount","ReviewCount","FirstCommentDate"
        ].join("\t")+"\n");
    console.log("[INFO] initialization completes.");
}

CarRental.prototype.run = function() {
    this.doPage(1);
    // this.crawler.queue({
    //     uri:"http://www.baojia.com/",
    //     jQuery:true,
    //     callback:function(error, result, $) {
    //         if(error || !$) {
    //             console.log("[ERROR] Error getting city list.\n[ERROR] Job done with error.");
    //             return;
    //         }
    //         try {
    //             $(".city-links li").each(function(index){
    //                 that.cityLinks.push("http://www.baojia.com"+$(this).find("a").attr("href"));
    //             });
    //         } catch(e) {
    //             console.log("[ERROR] Error parsing city list.\n[ERROR] Job done with error.")
    //             return;
    //         }
    //         console.log("[INFO] cityLinks: ", that.cityLinks.length);
    //         for(var i = 0; i < that.cityLinks.length; i++) {
    //             ++that.cityLock;
    //             that.crawler.queue({
    //                 uri:that.cityLinks[i],
    //                 callback:function(error, result) {
    //                     console.log(result.uri);
    //                     if(error) {
    //                         console.log("[ERROR] Error opening ", result.uri);
    //                         --that.cityLock;
    //                         if(that.cityLock == 0) {
    //                             setTimeout(function(){
    //                                 for(var i = 0; i < 20; i++) {
    //                                     that.doPage();
    //                                 }
    //                             }, 0);
    //                         }
    //                         return;
    //                     }
    //                     var locMatch = result.body.match(/var cityname="(.*?)";/);
    //                     var current_urlMatch = result.body.match(/var SELF1="(.*?)";/);
    //                     var city_idMatch = result.body.match(/<input type="hidden" name="city_id" id="city_id" value="(\d+)">/);
    //                     var minpriceMatch = result.body.match(/<input id="minimum-price" type="hidden" name="minimumPrice" value="(.*?)">/);
    //                     var maxpriceMatch = result.body.match(/<input id="maximum-price" type="hidden" name="maximumPrice" value="(.*?)">/);
    //                     var pMatch = result.body.match(/var nowpage="(\d+)";/);
    //                     if(!locMatch || !current_urlMatch || !city_idMatch || !minpriceMatch || !maxpriceMatch || !pMatch) {
    //                         console.log("[ERROR] Error parsing ", result.uri);
    //                         --that.cityLock;
    //                         if(that.cityLock == 0) {
    //                             setTimeout(function(){
    //                                 for(var i = 0; i < 20; i++) {
    //                                     that.doPage();
    //                                 }
    //                             }, 0);
    //                         }
    //                         return;
    //                     }
    //                     var p = pMatch[1];
    //                     var current_url = encodeURIComponent(current_urlMatch[1]);
    //                     var city_id = city_idMatch[1];
    //                     var minprice = parseInt(minpriceMatch[1]);
    //                     minprice = minprice > 0 ? minprice : 0;
    //                     var maxprice = parseInt(maxpriceMatch[1]);
    //                     maxprice = maxprice > 5000 ? 5000 : maxprice;
    //                     var price = minprice + "_" + maxprice;
    //                     var loc = encodeURIComponent(locMatch[1]);
    //                     that.crawler.queue({
    //                         uri:"http://www.baojia.com/?s=Home-BjList-IndexListAjax&loc={0}&startDate=NaN&endDate=NaN&price={1}&tag=&makes=&city_id={2}&series_id=&year_style=&street_id=&makes2=&zone_id=&poi=0&current_url={3}&sort=&p={4}".format(loc, price, city_id, current_url, p),
    //                         callback:function(error, result) {
    //                             --that.cityLock;
    //                             if(error) {
    //                                 console.log("[ERROR] Error opening ", result.uri);
    //                                 if(that.cityLock == 0) {
    //                                     setTimeout(function(){
    //                                         for(var i = 0; i < 20; i++) {
    //                                             that.doPage();
    //                                         }
    //                                     }, 0);
    //                                 }
    //                                 return;
    //                             }
    //                             var data;
    //                             var match;
    //                             try {
    //                                 data = JSON.parse(result.body).rent_list[2];
    //                                 match = data.match(/<a  href="\/(\w+)\/\?p=(\d+)"><span class="clickable page-link" >末页/);
    //                                 if(!match) {
    //                                     throw "No match found.";
    //                                 }
    //                             } catch(e) {
    //                                 console.log("[ERROR] Error parsing ", result.uri);
    //                                 if(that.cityLock == 0) {
    //                                     setTimeout(function(){
    //                                         for(var i = 0; i < 20; i++) {
    //                                             that.doPage();
    //                                         }
    //                                     }, 0);
    //                                 }
    //                                 return;
    //                             }
    //                             var city = match[1];
    //                             var pagecount = match[2];
    //                             for(var page = 1; page <= pagecount; page++) {
    //                                 that.pageUrls.push("http://www.baojia.com/{0}/?p={1}".format(city, page));
    //                             }
    //                             console.log("[INFO] {0} page count: {1}".format(city, pagecount));
    //                             if(that.cityLock == 0) {
    //                                 console.log("[INFO] total pages: ", that.pageUrls.length);
    //                                 setTimeout(function(){
    //                                     for(var i = 0; i < 20; i++) {
    //                                         that.doPage();
    //                                     }
    //                                 }, 0);
    //                             }
    //                         }
    //                     });
    //                 }
    //             });
    //         }
    //     }
    // });
}

CarRental.prototype.doPage = function(page) {
    that.crawler.queue({
        uri:"http://www.baojia.com/beijing/?p="+page,
        callback:function(error, result) {
            var curpage = parseInt(result.uri.match(/\?p=(\d+)/)[1]);
            if(error) {
                console.log("[ERROR] Error opening ", result.uri);
                setTimeout(function(){that.doPage(++curpage)}, 0);
                return;
            }
            var count = 0;
            var match, regex = /<a href="(.+?)" data-index/g;
            while(match = regex.exec(result.body)) {
                ++count;
                that.crawler.queue({
                    uri:"http://www.baojia.com"+match[1],
                    priority:0
                });
            }
            console.log(util.format("[INFO] Got %s cars in page %s.", count, curpage));
            if(count == 0) {
                console.log("[INFO] Reach final page.");
                return;
            }
            setTimeout(function(){that.doPage(++curpage)}, 0);
        }
    });




    // var pageUrl = that.pageUrls.pop();
    // if(!pageUrl) {
    //     setTimeout(that.doCar, 0);
    //     return;
    //     --that.pageLock;
    //     if(that.pageLock == 0) {
    //         console.log("[INFO] total tasks: ", that.carUrls.length);
    //         setTimeout(function(){
    //             for(var i = 0; i < 20; i++) {
    //                 that.doCar();
    //             }
    //         }, 0);
    //     }
    //     return;
    // }
    // that.crawler.queue({
    //     uri:pageUrl,
    //     callback:function(error, result) {
    //         var city = result.uri.match(/www\.baojia\.com\/(.*?)\//)[1];
    //         if(error) {
    //             console.log("[ERROR] Error opening ", result.uri);
    //             setTimeout(that.doPage, 0);
    //             return;
    //         }
    //         var regexp = /<a href="(.+?)" data-index/g;
    //         var match;
    //         var urls = [];
    //         while(match = regexp.exec(result.body)) {
    //             urls.push(match[1]);
    //         }
    //         urls.forEach(function(url){
    //             that.carUrls.push({url:"http://www.baojia.com"+url,city:city});
    //         });
    //         console.log("[INFO] page task left: ", that.pageUrls.length);
    //         setTimeout(that.doPage, 0);
    //     }
    // });
}

CarRental.prototype.doCar = function() {
    var carUrl = that.carUrls.pop();
    if(!carUrl) {
        --that.carLock;
        if(that.carLock == 0) {
            console.log("[INFO] Job done.");
        }
        return;
    }
    that.crawler.queue({
        uri:carUrl.url,
        city:carUrl.city
    });
}

CarRental.prototype.start = function() {
    this.init();
    this.run();
}

var that = new CarRental();
that.start();