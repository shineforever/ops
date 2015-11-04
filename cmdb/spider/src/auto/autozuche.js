var fs = require('fs')
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

var cityMap = {
    "上海":{cityCode:"310100",cityName:encodeURIComponent("上海"),cityLat:"31.243466",cityLon:"121.491121",cityTelPrefix:"021"},
    "南京":{cityCode:"320100",cityName:encodeURIComponent("南京"),cityLat:"32.057236",cityLon:"118.778074",cityTelPrefix:"025"},
    "杭州":{cityCode:"330100",cityName:encodeURIComponent("杭州"),cityLat:"30.259258",cityLon:"120.219294",cityTelPrefix:"0571"},
    "广州":{cityCode:"440100",cityName:encodeURIComponent("广州"),cityLat:"23.120049",cityLon:"113.30765",cityTelPrefix:"020"},
    "深圳":{cityCode:"440300",cityName:encodeURIComponent("深圳"),cityLat:"22.546054",cityLon:"114.025974",cityTelPrefix:"0755"},
    "北京":{cityCode:"110100",cityName:encodeURIComponent("北京"),cityLat:"39.914889",cityLon:"116.403874",cityTelPrefix:"010"},
    "重庆":{cityCode:"500100",cityName:encodeURIComponent("重庆"),cityLat:"29.544606",cityLon:"106.530635",cityTelPrefix:"023"}
}

function CarRental() {
    this.resultDir = "../../result/auto/";
    this.resultFile = "autozuche_" + new Date().toString() + ".txt";
    this.crawler = new Crawler({
        maxConnections:5,
        userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.101 Safari/537.36",
        jQuery:false,
        jar:true,
        callback:function(error, result) {
            if(error) {
                console.log("[ERROR] Error opeing ", result.uri);
                setTimeout(that.doCar, 0);
                return;
            }
            var city = result.options.city;
            var carIdMatch = result.body.match(/value="(.*?)" data-key="dCarNo"/);
            var pricePerDayMatch = result.body.match(/(￥\d+)<\/span>\/天/);
            var pricePerHourMatch = result.body.match(/(￥\d+)\/小时/);
            var pricePerWeekMatch = result.body.match(/(￥\d+)\/周/);
            var brandMatch = result.body.match(/value="(.*?)" data-key="dBrand"/);
            var modelMatch = result.body.match(/value="(.*?)" data-key="dType"/);
            var addressMatch = result.body.match(/value="(.*?)" data-key="getCarAddr"/);
            var yearMatch = result.body.match(/(\d+年)&nbsp;/);
            var carNoMatch = result.body.match(/（(.*?)）<\/h4>/);
            var dealCountMatch = result.body.match(/\d+次/);
            var acceptRateMatch = result.body.match(/接单率<br\/><span>\s*(\d+%)\s*<\/span>/);
            var autoAcceptMatch = result.body.match(/自动接单<br\/><span>(.*?)<\/span>/);
            var mileAgeMatch = result.body.match(/<li class="ic6">\s*(.*)\s*<\/li>/);
            var engineMatch = result.body.match(/<li class="ic1">(.*?)<\/li>/);
            if(!carIdMatch || !pricePerDayMatch || !pricePerHourMatch || !pricePerWeekMatch ||
                !brandMatch || !modelMatch || !addressMatch || !yearMatch || !carNoMatch ||
                !autoAcceptMatch || !mileAgeMatch || !engineMatch) {
                console.log("[ERROR] Error parsing ", result.uri);
                setTimeout(that.doCar, 0);
                return;
            }
            if(!dealCountMatch || !acceptRateMatch) {
                var toWrite = [
                    carIdMatch[1],carNoMatch[1],brandMatch[1],modelMatch[1],yearMatch[1],
                    addressMatch[1],pricePerDayMatch[1],pricePerHourMatch[1],pricePerWeekMatch[1],
                    mileAgeMatch[1],engineMatch[1],"暂无接单","暂无统计",autoAcceptMatch[1],city
                ].join("\t");
            } else {
                var toWrite = [
                    carIdMatch[1],carNoMatch[1],brandMatch[1],modelMatch[1],yearMatch[1],
                    addressMatch[1],pricePerDayMatch[1],pricePerHourMatch[1],pricePerWeekMatch[1],
                    mileAgeMatch[1],engineMatch[1],dealCountMatch[0],acceptRateMatch[1],autoAcceptMatch[1],city
                ].join("\t");
            }
            setTimeout(function(){
                that.getFirstComment(carIdMatch[1], toWrite);
            }, 0);
        }
    });
    this.cities = [];
    this.pageUrls = [];
    this.cars = [];
    this.currentCity;
    this.carLock = 5;
}

CarRental.prototype.init = function() {
    this.cities = Object.keys(cityMap);
}

CarRental.prototype.getFirstComment = function(carNo, toWrite) {
    that.crawler.queue({
        uri:"http://www.aotuzuche.com/car/{0}/eval?carNo={0}&pageNum=1&pageSize=100".format(carNo),
        toWrite:toWrite,
        callback:function(error, result) {
            var toWrite = result.options.toWrite;
            if(error) {
                console.log("[ERROR] Error getting first comment ", result.uri);
                fs.appendFileSync(that.resultDir+that.resultFile, toWrite+"\n");
                setTimeout(that.doCar, 0);
                return;
            }
            try {
                var data = JSON.parse(result.body);
                if(data.msg != "success" || !data.data.content || data.data.content.length == 0 || data.data.totalPageNum != 1) {
                    console.log("[ERROR] Cannot get first comment ", result.uri);
                    fs.appendFileSync(that.resultDir+that.resultFile, toWrite+"\t"+"暂无数据"+"\n");
                } else {
                    var content = data.data.content;
                    fs.appendFileSync(that.resultDir+that.resultFile, toWrite+"\t"+content[content.length-1].issueTime+"\n");
                }
            } catch(e) {
                console.log("[ERROR] Error parsing first comment ", result.uri);
            }
            setTimeout(that.doCar, 0);
        }
    })
}

CarRental.prototype.doCar = function() {
    var car = that.cars.shift();
    if(!car) {
        --that.carLock;
        if(that.carLock == 0) {
            console.log("[INFO] Job done.");
        }
        return;
    }
    console.log("[INFO] tasks left: ", that.cars.length);
    that.crawler.queue({
        uri:car.url,
        city:car.city,
    });
}

CarRental.prototype.doPage = function() {
    var pageUrl = that.pageUrls.shift();
    if(!pageUrl) {
        console.log("[INFO] Get carIds done.");
        console.log("[INFO] Total carIds: ", that.cars.length);
        setTimeout(function(){
            for(var i = 0; i < 5; i++) {
                that.doCar();
            }
        }, 0);
        return;
    }
    console.log("[INFO] pages left: ", that.pageUrls.length);
    that.crawler.queue({
        uri:pageUrl.url,
        city:pageUrl.city,
        callback:function(error, result) {
            if(error) {
                console.log("[ERROR] Error opening ", result.uri);
                setTimeout(that.doPage, 0);
                return;
            }
            try {
                var city = result.options.city;
                var data = JSON.parse(result.body);
                if(data.msg != "success" || !data.data.content || data.data.content.length == 0) {
                    console.log("[ERROR] No data found ", result.uri);
                    setTimeout(that.doPage, 0);
                    return;
                }
                data.data.content.forEach(function(content){
                    that.cars.push({
                        url:"http://www.aotuzuche.com/car/reDetail/" + content.carNo,
                        city:city
                    });
                });
            } catch(e) {
                console.log("[ERROR] Error parsing ", result.uri);
            }
            setTimeout(that.doPage, 0);
        }
    });
}

CarRental.prototype.doCity = function() {
    var city = that.cities.shift();
    if(!city) {
        console.log("[INFO] Get page urls done.\n[INFO] Proceed to getting carIds");
        setTimeout(that.doPage, 0);
        return;
    }
    that.currentCity = city;
    var cookieValue = cityMap[city];
    that.crawler.queue({
        uri:"http://www.aotuzuche.com/car/searchListMap/1?lon={0}&lat={1}&gbType=0&carType=0&seq=0&startTime=0&endTime=0&brandId=0&isLocal=0&seatNum=0&driveType=0&skylightsType=0&seatType=0&radar=0&area=0&minPrice=0&maxPrice=1000&areaCode=0&colorCode=0&nearby=0&city={2}&pageNum=1&pageSize=100".format(cookieValue.cityLon, cookieValue.cityLat, cookieValue.cityCode),
        city:city,
        callback:function(error, result) {
            if(error) {
                console.log("[ERROR] Error opening ", city);
                setTimeout(that.doCity, 0);
                return;
            }
            var pagecount;
            try {
                pagecount = JSON.parse(result.body).data.totalPageNum;
            } catch(e) {
                console.log("[ERROR] Error parsing ", city);
                that.cities.push(result.options.city);
                setTimeout(that.doCity, 0);
                return;
            }
            var cookieValue = cityMap[that.currentCity];
            for(var page = 1; page <= pagecount; page++) {
                that.pageUrls.push({
                    url:"http://www.aotuzuche.com/car/searchListMap/1?lon={0}&lat={1}&gbType=0&carType=0&seq=0&startTime=0&endTime=0&brandId=0&isLocal=0&seatNum=0&driveType=0&skylightsType=0&seatType=0&radar=0&area=0&minPrice=0&maxPrice=1000&areaCode=0&colorCode=0&nearby=0&city={2}&pageNum={3}&pageSize=100".format(cookieValue.cityLon, cookieValue.cityLat, cookieValue.cityCode, page),
                    city:that.currentCity
                });
            }
            console.log("[INFO] {0} total page: {1}".format(that.currentCity, pagecount));
            setTimeout(that.doCity, 0);
        }
    });
}

CarRental.prototype.initCookie = function() {
    this.crawler.queue({
        uri:"http://www.aotuzuche.com/car/search",
        callback:function(error, result) {
            setTimeout(that.doCity, 0);
        }
    });
}

CarRental.prototype.run = function() {
    this.initCookie();
}

CarRental.prototype.start = function() {
    this.init();
    this.run();
}

var that = new CarRental();
that.start();