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
    this.resultFile = "mangoplate.txt";
    this.crawler = new Crawler({
        maxConnections:10,
        jQuery:false,
        userAgent:"Mozilla/5.0",
        jar:true
    });
    this.categories = [];
    this.restaurantTasks = [];
    this.restaurantLock = 0;
    this.restaurants = {};
    this.restaurantKeys = [];
    this.detailLock = 0;
}

Food.prototype.init = function() {
    if(!fs.existsSync(this.resultDir)) {
        fs.mkdirSync(this.resultDir);
    }
    this.crawler.queue({
        uri:"http://www.mangoplate.com/eng",
        callback:function(error, result) {
            that.run();
        }
    })
}

Food.prototype.getCategory = function(startIndex) {
    that.crawler.queue({
        uri:"http://www.mangoplate.com/api/mp_curation/list.json?language=eng&region_code=0&start_index=" + startIndex,
        startIndex:startIndex,
        callback:function(error, result) {
            var startIndex = result.options.startIndex;
            if(error) {
                console.log("[ERROR] Error opening ", result.uri);
                setTimeout(function(){that.getCategory(startIndex)}, 0);
                return;
            }
            try {
                var data = JSON.parse(result.body);
            } catch(e) {
                console.log("[ERROR] Error parsing ", result.uri);
                setTimeout(function(){that.getCategory(startIndex)}, 0);
                return;
            }
            if(data.length == 0) {
                console.log("[INFO] All categories got.\n[INFO] Total categories: {0}\n[INFO] Proceed to restaurants.".format(that.categories.length));
                that.categories.forEach(function(category){
                    that.restaurantTasks.push("http://www.mangoplate.com/api/mp_curation/list/{0}/restaurants.json?language=eng&region_code=undefined&metro_code=0&start_index=0&request_count=100".format(category));
                });
                setTimeout(function(){
                    var length = that.categories.length > 5 ? 5 : that.categories.length;
                    for(var i = 0; i < length; i++) {
                        ++that.restaurantLock;
                        that.getRestaurant();
                    }
                }, 0);
                return;
            }
            data.forEach(function(category){
                that.categories.push(category.path);
            });
            console.log("[INFO] Got category, startIndex = ", startIndex);
            setTimeout(function(){that.getCategory(startIndex+20)}, 0);
        }
    });
}

Food.prototype.getRestaurant = function() {
    var restaurantTask = that.restaurantTasks.shift();
    if(!restaurantTask) {
        --that.restaurantLock;
        if(that.restaurantLock == 0) {
            that.restaurantKeys = Object.keys(that.restaurants);
            console.log("[INFO] All restaurants got.\n[INFO] Total restaurants: {0}\n[INFO] Proceed to details.".format(that.restaurantKeys.length));
            setTimeout(function(){
                var length = that.restaurantKeys.length > 5 ? 5 : that.restaurantKeys.length;
                for(var i = 0; i < length; i++) {
                    ++that.detailLock;
                    that.getDetail();
                }
            }, 0);
        }
        return;
    }
    that.crawler.queue({
        uri:restaurantTask,
        callback:function(error, result) {
            var restaurantTask = result.options.uri;
            if(error) {
                console.log("[ERROR] Error opening ", restaurantTask);
                that.restaurantTasks.push(restaurantTask);
                setTimeout(that.getRestaurant, 0);
                return;
            }
            try {
                var data = JSON.parse(result.body);
            } catch(e) {
                console.log("[ERROR] Error parsing ", restaurantTask);
                that.restaurantTasks.push(restaurantTask);
                setTimeout(that.getRestaurant, 0);
                return;
            }
            var category = restaurantTask.match(/list\/(.*)\/restaurants/)[1];
            if(data.length == 100) {
                var startIndex = restaurantTask.match(/start_index=(\d+)(?=&)/)[1];
                startIndex = parseInt(startIndex) + 100;
                that.restaurantTasks.push("http://www.mangoplate.com/api/mp_curation/list/{0}/restaurants.json?language=eng&region_code=undefined&metro_code=0&start_index={1}&request_count=100".format(category, startIndex));
            }
            data.forEach(function(restaurant){
                that.restaurants[restaurant.restaurant.restaurant_key] = {
                    key:restaurant.restaurant.restaurant_key,
                    name:restaurant.restaurant.name + " " + restaurant.restaurant.branch_name,
                    phone:restaurant.restaurant.phone_number,
                    wannaGoCount:restaurant.wanna_go_count,
                    beenCount:restaurant.been_here_count,
                    reviewCount:restaurant.review_count,
                    viewCount:restaurant.view_count,
                    rating:restaurant.rating
                }
            });
            console.log("[INFO] {0} Got {1} restaurants.".format(category, data.length));
            setTimeout(that.getRestaurant, 0);
        }
    });
}

Food.prototype.getDetail = function() {
    var restaurantKey = that.restaurantKeys.shift();
    if(!restaurantKey) {
        --that.detailLock;
        if(that.detailLock == 0) {
            console.log("[INFO] All details got.\n[INFO] Job done.");
        }
        return;
    }
    console.log("[INFO] Task left: ", that.restaurantKeys.length);
    that.crawler.queue({
        uri:"http://www.mangoplate.com/restaurants/" + restaurantKey,
        key:restaurantKey,
        jQuery:true,
        callback:function(error, result, $) {
            var key = result.options.key;
            if(error || !$) {
                console.log("[ERROR] Error opening ", key);
                setTimeout(that.getDetail, 0);
                return;
            }
            var restaurant = that.restaurants[key];
            var location = $(".item-location");
            var category = $(".item-category");
            var price = $(".item-price");
            var parking = $(".item-parking");
            var hours = $(".item-business-hours");
            var photo = $(".t-photo em");
            restaurant.address = location.length > 0 ? location.text().trim() : "无此信息";
            restaurant.path = category.length > 0 ? category.text().replace(/\s/g, "") : "无此信息";
            restaurant.price = price.length > 0 ? price.text().trim() : "无此信息";
            restaurant.parking = parking.length > 0 ? parking.text().trim() : "无此信息";
            restaurant.openingHours = hours.length > 0 ? hours.text().trim() : "无此信息";
            restaurant.photoCount = photo.length > 0 ? photo.text() : "无此信息";
            fs.appendFileSync(that.resultDir+that.resultFile, [
                    restaurant.key,restaurant.name,restaurant.phone,restaurant.address,
                    restaurant.viewCount,restaurant.beenCount,restaurant.wannaGoCount,
                    restaurant.reviewCount,restaurant.rating,restaurant.path,restaurant.price,
                    restaurant.parking,restaurant.openingHours,restaurant.photoCount
                ].join("\t")+"\n");
            setTimeout(that.getDetail, 0);
        }
    });
}

Food.prototype.run = function() {
    this.getCategory(0);
}

Food.prototype.start = function() {
    this.init();
}

var that = new Food();
that.start();