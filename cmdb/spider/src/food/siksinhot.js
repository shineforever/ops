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

function Food() {
    this.resultDir = "../../result/food/";
    this.resultFile = "siksinhot.txt";
    this.crawler = new Crawler({
        maxConnections:10,
        userAgent:"Mozilla/5.0"
    });
    this.area = {};
    this.areaLock = 0;
    this.subareas = [];
    this.tasks = [];
    this.restaurantLock = 0;
    this.restaurants = [];
    this.detailLock = 0;
}

Food.prototype.init = function() {
    if(!fs.existsSync(this.resultDir)) {
        fs.mkdirSync(this.resultDir);
    }
}

Food.prototype.run = function() {
    this.crawler.queue({
        uri:"http://www.siksinhot.com/hot/location/main.do",
        callback:function(error, result, $) {
            if(error || !$) {
                console.log("[ERROR] Error opening {0}\n[ERROR] Job done with error.".format(result.uri));
                return;
            }
            var uparealist = $(".pmList.area-list.up-area-list li");
            uparealist.each(function(uparea){
                that.area[$(this).attr("id").match(/\d+/)[0]] = [];
            });
            Object.keys(that.area).forEach(function(upareaId){
                ++that.areaLock;
                that.crawler.queue({
                    uri:"http://siksinhot.com/hot/location/getDnAreaList.do?upHpAreaId={0}&useBest=Y".format(upareaId),
                    upareaId:upareaId,
                    jQuery:false,
                    callback:function(error, result) {
                        var upareaId = result.options.upareaId;
                        if(error) {
                            console.log("[ERROR] Error getting subareaId for upareaId = ", upareaId);
                            --that.areaLock;
                            if(that.areaLock == 0) {
                                setTimeout(that.generateAreaTasks, 0);
                            }
                            return;
                        }
                        try {
                            var data = JSON.parse(result.body);
                            data = data.dnAreaList;
                            data.forEach(function(subarea){
                                // that.area[upareaId].push(subarea.id);
                                that.subareas.push({subareaId:subarea.id,upareaId:upareaId,count:subarea.cnt});
                            });
                            console.log("[INFO] Got {0} subareas for upareaId = {1}".format(data.length, upareaId));
                        } catch(e) {
                            console.log("[ERROR] Error parsing subareaId for upareaId = ", upareaId);
                        }
                        --that.areaLock;
                        if(that.areaLock == 0) {
                            setTimeout(that.generateTasks, 0);
                        }
                    }
                });
            });
        }
    });
}

Food.prototype.generateTasks = function() {
    console.log("[INFO] Total subareas: ", that.subareas.length);
    that.subareas.forEach(function(subarea){
        var pagecount = Math.ceil(subarea.count/15);
        for(var page = 1; page <= pagecount; page++) {
            if(subarea.upareaId == subarea.subareaId) {
                that.tasks.push("http://www.siksinhot.com/hot/location/main.do?upHpAreaId={0}&bestYn=Y&nO={1}".format(subarea.upareaId, page));
            } else {
                that.tasks.push("http://www.siksinhot.com/hot/location/main.do?upHpAreaId={0}&hpAreaId={1}&nO={2}".format(subarea.upareaId, subarea.subareaId, page));
            }
        }
    });
    console.log("[INFO] Total tasks: ", that.tasks.length);
    var length = that.tasks.length > 5 ? 5 : that.tasks.length;
    for(var i = 0; i < length; i++) {
        ++that.restaurantLock;
        that.getRestaurants();
    }
}

Food.prototype.getRestaurants = function() {
    var url = that.tasks.shift();
    if(!url) {
        --that.restaurantLock;
        if(that.restaurantLock == 0) {
            setTimeout(function(){
                var length = that.restaurants.length > 5 ? 5 : that.restaurants.length;
                for(var i = 0; i < length; i++) {
                    ++that.detailLock;
                    that.doDetail();
                }
            });
        }
        return;
    }
    console.log("[INFO] {0} pages left.".format(that.tasks.length));
    that.crawler.queue({
        uri:url,
        callback:function(error, result, $) {
            if(error || !$) {
                console.log("[ERROR] Error opening ", result.uri);
                setTimeout(that.getRestaurants, 0);
                return;
            }
            var count = 0;
            $(".place-item").each(function(item){
                var item = $(this);
                try {
                    that.restaurants.push({
                        id:item.find(".gridBox").children("a").attr("href").match(/\d+/)[0],
                        title:item.find(".pltit").text().trim(),
                        commentCount:item.find(".comCont2 .count").eq(0).text(),
                        markCount:item.find(".comCont2 .count").eq(1).text(),
                        viewCount:item.find(".comCont2 .count").eq(2).text(),
                        callCount:item.find(".comCont2 .count").eq(3).text(),
                        star:item.find(".starNum").text()
                    });
                    ++count;
                } catch(e) {
                    console.log("[ERROR] parse error ", result.uri);
                }
            });
            console.log(result.uri);
            console.log("[INFO] Got {0} restaurants.".format(count));
            setTimeout(that.getRestaurants, 0);
        }
    });
}

Food.prototype.doDetail = function() {
    var restaurant = that.restaurants.shift();
    if(!restaurant) {
        --that.detailLock;
        if(that.detailLock == 0) {
            console.log("[INFO] Job done.");
        }
        return;
    }
    console.log("[INFO] Restaurants left: ", that.restaurants.length);
    that.crawler.queue({
        uri:"http://www.siksinhot.com/P/" + restaurant.id,
        restaurant:restaurant,
        jQuery:false,
        callback:function(error, result) {
            var restaurant = result.options.restaurant;
            if(error) {
                console.log("[ERROR] Error opening ", result.uri);
                setTimeout(that.doDetail, 0);
                return;
            }
            var pathMath = result.body.match(/<dt>업종<\/dt>\s*<dd>(.*)<\/dd>/);
            var telMatch = result.body.match(/<span class="tel">(.*)<\/span>/);
            var addressMatch = result.body.match(/<dt>주소<\/dt>\s*<dd>(.*)<\/dd>/);
            var hoursMatch = result.body.match(/<dt>운영시간<\/dt>\s*<dd>(.*)<\/dd>/);
            var priceMatch = result.body.match(/<dt>가격대<\/dt>\s*<dd>(.*)<\/dd>/);
            var closedMatch = result.body.match(/<dt>휴무<\/dt>\s*<dd>\s*(.*)\s*<\/dd>/);
            restaurant.path = pathMath ? pathMath[1] : "无匹配";
            restaurant.tel = telMatch ? telMatch[1] : "无匹配";
            restaurant.address = addressMatch ? addressMatch[1].trim() : "无匹配";
            restaurant.openingHours = hoursMatch ? hoursMatch[1] : "无匹配";
            restaurant.price = priceMatch ? priceMatch[1].replace(/\s/g, "") : "无匹配";
            restaurant.closed = closedMatch ? closedMatch[1].replace(/\s/g, "") : "无匹配";
            fs.appendFileSync(that.resultDir+that.resultFile, [
                    restaurant.id,restaurant.title,restaurant.tel,restaurant.address,
                    restaurant.path,restaurant.star,restaurant.commentCount,
                    restaurant.markCount,restaurant.viewCount,restaurant.callCount,
                    restaurant.price,restaurant.openingHours,restaurant.closed
                ].join("\t")+"\n");
            setTimeout(that.doDetail, 0);
        }
    });
}

Food.prototype.start = function() {
    this.init();
    this.run();
}

var that = new Food();
that.start();