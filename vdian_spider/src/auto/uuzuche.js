var fs = require("fs")
var moment = require("moment")
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
    "北京":"/?act=user&con=change_city&cityId=010",
    "长沙":"/?act=user&con=change_city&cityId=0731",
    "成都":"/?act=user&con=change_city&cityId=028",
    "重庆":"/?act=user&con=change_city&cityId=023",
    "大连":"/?act=user&con=change_city&cityId=0411",
    "东莞":"/?act=user&con=change_city&cityId=0769",
    "广州":"/?act=user&con=change_city&cityId=020",
    "海口":"/?act=user&con=change_city&cityId=08982",
    "杭州":"/?act=user&con=change_city&cityId=0571",
    "合肥":"/?act=user&con=change_city&cityId=0551",
    "南京":"/?act=user&con=change_city&cityId=025",
    "青岛":"/?act=user&con=change_city&cityId=0532",
    "三亚":"/?act=user&con=change_city&cityId=0898",
    "上海":"/?act=user&con=change_city&cityId=021",
    "深圳":"/?act=user&con=change_city&cityId=0755",
    "苏州":"/?act=user&con=change_city&cityId=0512",
    "天津":"/?act=user&con=change_city&cityId=022",
    "武汉":"/?act=user&con=change_city&cityId=027",
    "西安":"/?act=user&con=change_city&cityId=029",
    "厦门":"/?act=user&con=change_city&cityId=0592"
};

function CarRental() {
    this.resultDir = "../../result/auto/";
    this.resultFile = "uuzuche_" + moment().format("YYYY-MM-DD") + ".txt";
    var daysToAdd = parseInt(process.argv.splice(2)[0]) || 0;
    this.start_date = moment().add(daysToAdd, "days").hour(10).minute(0).second(0).format("YYYY-MM-DD HH:mm:ss");
    this.end_date = moment().add(daysToAdd+1, "days").hour(10).minute(0).second(0).format("YYYY-MM-DD HH:mm:ss");
    this.crawler = new Crawler({
        maxConnections:20,
        userAgent:"Mozilla/4.0",
        jar:true,
        jQuery:false,
        callback:function(error, result, $) {
            var carId = result.uri.match(/sn=(.*?)(?=&)/);
            if(!carId) {
                console.log("[ERROR] Bad url.");
                setTimeout(that.doCar, 0);
                return;
            }
            carId = carId[1];
            if(error || !$) {
                console.log("[ERROR] Error opening ", carId);
                setTimeout(that.doCar, 0);
                return;
            }
            var city = result.options.city;
            try {
                var purchaseYear = $("#pageP0 .tit h4 em").text();
                var model = $("#pageP0 .tit h4").children().remove().end().text();
                var title = $("#pageP0 .tit p").text();
                var split = title.split(" ");
                if(split.length < 3) {
                    console.log("[ERROR] Data illegal.");
                    throw "illegal data";
                }
                var mileAge = split[0];
                var engine = split[1];
                var owner = "";
                for(var i = 2; i < split.length; i++) {
                    owner = owner + split[i];
                }
                var pricePerDay = $(".carTime h4 span.pre").text();
                if($(".carTime h4 span.hour em").length == 2) {
                    var pricePerHour = $(".carTime h4 span.hour em").eq(0).text();
                    var pricePerWeek = $(".carTime h4 span.hour em").eq(1).text();
                } else {
                    var pricePerHour = "None";
                    var pricePerWeek = "None";
                }
                var acceptRate = $(".carPre .fl").text();
                var responseTime = $(".carPre .fr").text();
                fs.appendFileSync(that.resultDir+that.resultFile, [
                        carId, model, owner, purchaseYear, mileAge, engine,
                        pricePerDay, pricePerHour, pricePerWeek,
                        acceptRate, responseTime, city
                    ].join("\t")+"\n");
                setTimeout(that.doCar, 0);
            } catch(e) {
                console.log("[ERROR] Error parsing ", carId);
                setTimeout(that.doCar, 0);
                return;
            }
        }
    });
    this.cities = Object.keys(cityMap);
    this.carIds = [];
    this.currentCity;
    this.currentCarIds = [];
    this.carLock = 5;
    this.doneCar = {};
}

CarRental.prototype.init = function() {
    fs.appendFileSync(this.resultDir+this.resultFile, [
        "id","model", "owner", "purchaseYear", "mileAge", "engine",
        "pricePerDay", "pricePerHour", "pricePerWeek",
        "acceptRate", "responseTime", "city"].join("\t")+"\n");
    fs.readFileSync(this.resultDir+this.resultFile).toString().split("\n").forEach(function(line){
        var split = line.split("\t");
        this.doneCar[split[0]] = true;
    }, this);
}

CarRental.prototype.doNextCity = function() {
    var city = that.cities.pop();
    if(!city) {
        console.log("[INFO] Get carIds done.");
        console.log("[INFO] total cars: ", that.carIds.length);
        setTimeout(function(){
            for(var i = 0; i < 5; i++) {
                that.doCar();
            }
        }, 0);
        return;
    }
    that.currentCity = city;
    that.currentCarIds = [];
    that.crawler.queue({
        uri:"http://www.uuzuche.com.cn" + cityMap[city],
        callback:function(error, result) {
            if(error) {
                console.log("[ERROR] Error swithing to ", that.currentCity);
                setTimeout(that.doNextCity, 0);
                return;
            }
            that.crawler.queue({
                uri:"http://www.uuzuche.com.cn/?act=findcar",
                callback:function(error, result) {
                    if(error) {
                        console.log("[ERROR] Error opening ", that.currentCity);
                        setTimeout(that.doNextCity, 0);
                        return;
                    }
                    var cityLatMatch = result.body.match(/var cityLat = lat = '(.*?)';/);
                    var cityLngMatch = result.body.match(/var cityLng = lng = '(.*?)';/);
                    if(!cityLngMatch || !cityLatMatch) {
                        console.log("[ERROR] Error getting location info for ", that.currentCity);
                        setTimeout(that.doNextCity, 0);
                        return;
                    }
                    var formdata = {
                        "pageNum":1,
                        "pointer":"",
                        "act":"findcar",
                        "con":"ajax_find_car_page",
                        "qc_time":that.start_date,
                        "hc_time":that.end_date,
                        "address":"",
                        "min_price":"",
                        "max_price":"",
                        "boxiang":"",
                        "brand":"",
                        "gps":"",
                        "daocheleida":"",
                        "type":"",
                        "amap_lat":cityLatMatch[1],
                        "amap_lng":cityLngMatch[1]
                    }
                    setTimeout(function(){
                        that.doPage(formdata);
                    });
                } 
            });
        }
    });
}

CarRental.prototype.doPage = function(formdata) {
    that.crawler.queue({
        uri:"http://www.uuzuche.com.cn/index.php",
        form:formdata,
        method:"POST",
        formdata:formdata,
        callback:function(error, result) {
            var formdata = result.options.formdata; 
            if(error) {
                console.log("[ERROR] Error doing page where pointer is ", formdata.pointer);
                that.carIds = that.carIds.concat(that.currentCarIds);
                setTimeout(that.doNextCity, 0);
                return;
            }
            var data;
            try {
                data = JSON.parse(result.body);
            } catch(e) {
                console.log("[ERROR] Error parsing page where pointer is ", formdata.pointer);
                that.carIds = that.carIds.concat(that.currentCarIds);
                setTimeout(that.doNextCity, 0);
                return;
            }
            data.car_data.forEach(function(car){
                that.currentCarIds.push({carId:car.carId, city:that.currentCity});
            });
            console.log("[INFO] {0} page Got.".format(that.currentCity));
            if(data.hasMore == 1 && data.pageStart) {
                formdata.pageNum = 2;
                formdata.pointer = data.pageStart;
                setTimeout(function(){
                    that.doPage(formdata);
                });
            } else {
                console.log("[INFO] {0} total carIds: {1}".format(that.currentCity, that.currentCarIds.length));
                that.carIds = that.carIds.concat(that.currentCarIds);
                setTimeout(that.doNextCity, 0);
            }
        }
    });
}

CarRental.prototype.doCar = function() {
    var carId = that.carIds.pop();
    if(!carId) {
        --that.carLock;
        if(that.carLock == 0) {
            console.log("[INFO] Job done.");
        }
        return;
    }
    if(that.doneCar[carId.carId]) {
        setTimeout(that.doCar, 0);
        return;
    }
    console.log("[INFO] tasks left: ", that.carIds.length);
    that.crawler.queue({
        uri:"http://www.uuzuche.com.cn/?act=findcar&con=detail&sn={0}&s_t=&e_t=".format(carId.carId),
        jQuery:true,
        city:carId.city
    });
}

CarRental.prototype.run = function() {
    this.doNextCity();
}

CarRental.prototype.start = function() {
    this.init();
    this.run();
}

var that = new CarRental();
that.start();

