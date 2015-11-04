var fs = require("fs")
var util = require("util")
var Crawler = require("node-webcrawler")
var request = require("request")

if(!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) { 
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

function calculateTimeConsumed(start, end) {
    var seconds = Math.floor((end - start)/1000);
    var hour = Math.floor(seconds/3600);
    var minute = Math.floor(seconds/60) % 60;
    var second = seconds % 60;
    return hour + "h" + minute + "m" + second + "s";
}

Date.prototype.toString = function() {
    var year = this.getFullYear();
    var month = this.getMonth() + 1;
    var day = this.getDate();
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    return year + "-" + month + "-" + day;
}

function Yiche() {
    this.resultDir = "../../../result/auto/";
    this.resultFile = "yichehuodong_" + new Date().toString() + ".txt";
    this.crawler = new Crawler({
        maxConnections:10,
        userAgent:"Mozilla 5.0"
    });
    this.cities = [];
    this.brands = [];
    this.brandIds = [];
    this.series = {};
    this.keys = [];
    this.cityMap = {};
}

Yiche.prototype.init = function() {

}

Yiche.prototype.run = function() {
    // Get city
    this.crawler.queue({
        uri:"http://img1.bitautoimg.com/brandmarket/yichehuinew/pc/js/citydata/bitauto.js",
        jQuery:false,
        callback:function(error, result) {
            if(error) {
                console.log("[ERROR] Error getting city.\n[ERROR] Job done with error.");
                return;
            }
            try {
                eval(result.body);
            } catch(e) {
                console.log("[ERROR] Error parsing city info.\n[ERROR] Job done with error.");
                return;
            }
            var provinceMap = {};
            BitAutoAreas.masterArea.forEach(function(area){
                if(area.parentID == "0") {
                    provinceMap[area.selfID] = area.fullname;
                } else {
                    if(provinceMap[area.parentID]) {
                        that.cities.push(util.format("http://mai.bitauto.com/Ajax/Activity/ActivityHandler.ashx?ran=0.4599611950106919&action=GetActivityListForPage&acttype=1&sort=2&pSize=100&pPage=0&cityID=%s", area.selfID));
                        that.cityMap[area.selfID] = {name:area.fullname, province:provinceMap[area.parentID]};
                    }
                }
            });
            if(that.cities.length == 0) {
                console.log("[ERROR] No city found.\n[ERROR] Job done with error.");
                return;
            }
            console.log("[INFO] Total cities: ", that.cities.length);
            setTimeout(that.getBrands, 0);
        }
    });
}

Yiche.prototype.getBrands = function() {
    that.crawler.queue({
        uri:"http://api.car.bitauto.com/CarInfo/MasterBrandToSerialNew.aspx?type=2&pid=0&rt=master&serias=m&key=key",
        jQuery:false,
        callback:function(error, result) {
            if(error) {
                console.log("[ERROR] Error getting brands.\n[ERROR] Job done with error.");
                return;
            }
            var regex = /"id":"(\d*?)","name":"(.*?)"/g;
            var match;
            while(match = regex.exec(result.body)) {
                that.brands.push(match[2]);
                that.brandIds.push({id:match[1],name:match[2]});
            }
            if(that.brands.length == 0) {
                console.log("[ERROR] No brands found.\n[ERROR] Job done with error.");
                return;
            }
            console.log("[INFO] Total brands: ", that.brands.length);
            setTimeout(that.getSeries, 0);
        }
    });
}

Yiche.prototype.getSeries = function() {
    var brand = that.brandIds.pop();
    if(!brand) {
        that.keys = Object.keys(that.series);
        console.log("[INFO] Total series: ", that.keys.length);
        setTimeout(that.doCity, 0);
        return;
    }
    that.crawler.queue({
        uri:"http://api.car.bitauto.com/CarInfo/MasterBrandToSerialNew.aspx?type=2&pid={0}&rt=serial&serias=m&key=key&include=1".format(brand.id),
        jQuery:false,
        brand:brand,
        callback:function(error, result) {
            var brand = result.options.brand;
            if(error) {
                console.log("[ERROR] Error getting series: {0} {1}".format(brand.id, brand.name));
                setTimeout(that.getSeries, 0);
                return;
            }
            var regex = /"name":"(.*?)"/g;
            var match;
            while(match = regex.exec(result.body)) {
                that.series[match[1]] = brand.name;
            }
            setTimeout(that.getSeries, 0);
            console.log("[INFO] Got {0} {1}".format(brand.id, brand.name));
        }
    });
}

Yiche.prototype.doCity = function() {
    var city = that.cities.shift();
    if(!city) {
        console.log("[INFO] Job done.");
        return;
    }
    that.crawler.queue({
        uri:city,
        callback:function(error, result, $) {
            if(error || !$) {
                console.log("[ERROR] Error opening ", result.uri);
                setTimeout(that.doCity, 0);
                return;
            }
            var city = result.uri.match(/cityID=(\d+)/)[1];
            city = that.cityMap[city];
            var toWrite = [];
            $("li").each(function(){
                var content = $(this).find("h2").text().replace(/\s/g, "");
                var href = $(this).find("a").attr("href");
                var brand = that.estimateBrand(content);
                if(brand == "无匹配") {
                    brand = that.estimateSeries(content);
                }
                toWrite.push([city.province,city.name,content,href,brand].join("\t")+"\n");
            });
            fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join(""));
            console.log("[INFO] cities left: ", that.cities.length);
            setTimeout(that.doCity, 0);
        }
    });
}

Yiche.prototype.estimateBrand = function(content) {
    var result = "";
    var count = 0;
    for(var i = 0; i < that.brands.length; i++) {
        if(content.search(that.brands[i]) != -1) {
            ++count;
            if(count == 3) {
                return "无法确定";
            }
            result += that.brands[i];
        }
    }
    result = count > 0 ? result : "无匹配";
    return result;
}

Yiche.prototype.estimateSeries = function(content) {
    var result = "无匹配";
    for(var i = 0; i < that.keys.length; i++) {
        if(content.search(that.keys[i]) != -1) {
            result = that.series[that.keys[i]];
            break;
        }
    }
    return result;
}

Yiche.prototype.start = function() {
    this.init();
    this.run();
}

var that = new Yiche();
that.start();
