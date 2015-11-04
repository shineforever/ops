var fs = require("fs")
var util = require("util")
var moment = require("moment")
var crypto = require("crypto")
var Crawler = require("node-webcrawler")

var logger = require("winston")
var godotTransport = require("winston-godot")
var godot = require("godot")
var env = process.env.NODE_ENV || "development"

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"58daojia.nail"});

logger.add(logger.transports.File, { filename: '../../log/daojia.nail.log' ,logstash:true,level:'info',handleExceptions:true});
logger.cli();

if(env==="production"){
    logger.remove(logger.transports.Console);
}

function calculateTimeConsumed(start, end) {
    var seconds = Math.floor((end - start)/1000);
    var hour = Math.floor(seconds/3600);
    var minute = Math.floor(seconds/60) % 60;
    var second = seconds % 60;
    return hour + "h" + minute + "m" + second + "s";
}

var workerMap = {};

function App() {
    this.today = moment().format("YYYY-MM-DD");
    this.appointmentDay = moment().add(3, "d").format("YYYY-MM-DD") + " 10:30:00";
    this.programmeStartTime = new Date().getTime();
    this.resultDir = "../../result/app/58daojia.nail/";
    this.resultFile = "58daojia.nail." + this.today + ".csv";
    this.dataDir = "../../appdata/";
    this.cityFile = "58daojia.txt";
    this.tasks = [];
    this.cityids = [];
    this.cityidMap = {};
    this.structuredTasks = {};
    this.detailUrls = {};
    this.crawler = new Crawler({
        maxConnections:10,
        userAgent:"58daojiaandroid",
        headers:{
            channelid:279,
            i:1,
            imei:"864178021678783",
            mobile:"",
            mobile_board:"Lenovo S810t",
            mobile_version:"4.3",
            modle:"",
            useid:"",
            version:"3.0.0",
            Host:"jzt2.58.com"
        },
        jQuery:false,
        callback:function(error, result) {
            var task = result.options.task;
            if(error) {
                logger.error("error getting worker for ", result.uri);
                that.workerLock.pop();
                setTimeout(that.getWorkers, 0);
                return;
            }
            try {
                var data = JSON.parse(result.body);
            } catch(e) {
                logger.error("error parsing worker for ", result.uri);
                that.workerLock.pop();
                setTimeout(that.getWorkers, 0);
                return;
            }
            if(data.data.length >= 10) {
                task.request.page += 1;
                task.c = App.prototype.hash(task.request, "~!@#$%^&*");
                that.tasks.push(task);
            }
            var resultStr = [];
            for(var i = 0; i < data.data.length; i++) {
                if(workerMap[data.data[i].uid]) {
                    continue;
                } else {
                    workerMap[data.data[i].uid] = true;
                }
                var list = [];
                list.push(that.cityidMap[task.request.cityid]);
                list.push(data.data[i].uid);
                list.push(data.data[i].idcard);
                list.push(data.data[i].name);
                list.push(data.data[i].sex == 0 ? "女" : "男");
                list.push(data.data[i].age);
                list.push(data.data[i].province);
                list.push(data.data[i].mobile);
                if(data.data[i].address) {
                    list.push(data.data[i].address.replace(/[,\s]/g, ""));
                } else {
                    list.push(data.data[i].address);
                }
                list.push(data.data[i].servicecount);
                list.push(data.data[i].commentcount);
                list.push(data.data[i].servicecountofthismonth);
                list.push(data.data[i].commentcountofthismonth);
                list.push(data.data[i].distance_with_unit);
                list.push(data.data[i].goodrate || "暂无好评");
                list.push(data.data[i].entrytime || "暂无注册时间");
                list.push(that.today);
                resultStr.push(list.join() + "\n");
            }
            fs.appendFileSync(that.resultDir + that.resultFile, resultStr.join(""));
            // logger.info("Done ", result.uri);
            that.workerLock.pop();
            setTimeout(that.getWorkers, 0);
            logger.info("task left: ", that.tasks.length);
        }
    });
    this.listLock = [];
    this.detailLock = [];
    this.workerLock = [];
}

App.prototype.init = function() {
    logger.info("initilization starts.");
    if(!fs.existsSync(this.resultDir)) {
        fs.mkdirSync(this.resultDir);
    }
    fs.writeFileSync(this.resultDir+this.resultFile, "\ufeff城市,ID,身份证,姓名,性别,年龄,籍贯,手机号,地址,服务次数,评论次数,本月服务次数,本月评论次数,距离,好评率,注册时间,抓取时间\n");
    var addrPoints = fs.readFileSync(this.dataDir+this.cityFile).toString().split("\n").filter(function(line){return line.trim();});
    addrPoints.forEach(function(point){
        point = point.split("\t");
        var cityid = point[7];
        this.cityidMap[cityid] = point[0];
        if(!this.structuredTasks[cityid]) {
            var o = {};
            o.locations = [];
            o.nailOilIds = [];
            this.structuredTasks[cityid] = o;
        }
        this.structuredTasks[cityid].locations.push({lng:point[3],lat:point[4]});
    }, this);
    this.cityids = Object.keys(this.structuredTasks);
    this.cityids.forEach(function(cityid){
        this.detailUrls[cityid] = [];
    }, this);
    logger.info("initilization completes.");
}

App.prototype.run = function() {
    for(var i = 0; i < this.cityids.length; i++) {
        var cityid = this.cityids[i];
        this.listLock.push(0);
        this.crawler.queue({
            uri:util.format("http://jzt2.58.com/api/v23/meijiays?r=%s&from=android&cityid=%s", App.prototype.random(), cityid),
            cityid:cityid,
            jQuery:false,
            callback:function(error, result) {
                var cityid = result.options.cityid;
                if(error) {
                    logger.error("error getting nail style list info for cityid = ", cityid);
                    that.listLock.pop();
                    if(that.listLock.length == 0) {
                        setTimeout(that.getNailOilId, 0);
                    }
                    return;
                }
                var urlPattern = "http://jzt2.58.com/api/v23/meijiadetail?from=android&meijiaid=%s&mjcode=%s&cityid=%s&uid=";
                var pattern = /todetail\('(\d*?)','(.*?)'/g;
                var match;
                while ( (match = pattern.exec(result.body)) != null ) {
                    var mjId = match[1];
                    var mjCode = match[2];
                    that.detailUrls[cityid].push(util.format(urlPattern, mjId, mjCode, cityid));
                }
                that.listLock.pop();
                if(that.listLock.length == 0) {
                    setTimeout(that.getNailOilId, 0);
                }
                return;
            }
        });
    }
}

App.prototype.getNailOilId = function() {
    Object.keys(that.detailUrls).forEach(function(cityid){
        logger.info(cityid + " total nail polish styles: " + that.detailUrls[cityid].length);
    });
    Object.keys(that.detailUrls).forEach(function(cityid){
        var urls = that.detailUrls[cityid];
        for(var i = 0; i < urls.length; i++) {
            that.detailLock.push(0);
            that.crawler.queue({
                uri:urls[i],
                jQuery:false,
                cityid:cityid,
                callback:function(error, result) {
                    var cityid = result.options.cityid;
                    if(error) {
                        logger.error("error getting nailOilId for ", result.uri);
                        that.detailLock.pop();
                        if(that.detailLock.length == 0) {
                            setTimeout(that.removeDuplicatedNailOilId, 0);
                        }
                        return;
                    }
                    var pattern = /class="id 甲油胶" value="(\d*?)"/;
                    var match = result.body.match(pattern);
                    if(match != null && match.length > 1) {
                        var nailOilId = match[1];
                        that.structuredTasks[cityid].nailOilIds.push(nailOilId);
                        logger.info("Got cityid:%s nailOilId:%s", cityid, nailOilId);
                    }
                    that.detailLock.pop();
                    if(that.detailLock.length == 0) {
                        setTimeout(that.removeDuplicatedNailOilId, 0);
                    }
                }
            });
        }
    });
}

App.prototype.removeDuplicatedNailOilId = function() {
    logger.info("Get nailOilId done.\nduplicates removal starts.");
    // Object.keys(that.structuredTasks).forEach(function(cityid){
    //     var o = {};
    //     var nailOilIdsWithDuplicates = that.structuredTasks[cityid].nailOilIds;
    //     logger.info("%s before removal: %s", cityid, nailOilIdsWithDuplicates.length);
    //     var nailOilIds = [];
    //     for(var i = 0; i < nailOilIdsWithDuplicates.length; i++) {
    //         if(!o[nailOilIdsWithDuplicates[i]]) {
    //             nailOilIds.push(nailOilIdsWithDuplicates[i]);
    //             o[nailOilIdsWithDuplicates[i]] = true;
    //         }
    //     }
    //     that.structuredTasks[cityid].nailOilIds = nailOilIds;
    //     logger.info("%s after removal: %s", cityid, nailOilIds.length);
    // });
    logger.info("duplicates removal completes.");
    logger.info("task generation starts.");
    Object.keys(that.structuredTasks).forEach(function(cityid){
        var locations = that.structuredTasks[cityid].locations;
        var nailOilIds = that.structuredTasks[cityid].nailOilIds;
        for(var i = 0; i < nailOilIds.length; i++) {
            if(i > 0) {
                continue;
            }
            for(var j = 0; j < locations.length; j++) {
                var task = {};
                var request = {
                    r:App.prototype.random(),
                    pagesize:10,
                    duration:2,
                    jinpai:0,
                    meijiaid:nailOilIds[i],
                    address:"长寿路89号",
                    page:1,
                    xiejia:0,
                    lng:locations[j].lng,
                    type:26,
                    date:that.appointmentDay,
                    lat:locations[j].lat,
                    cityid:cityid
                };
                var c = App.prototype.hash(request, "~!@#$%^&*");
                task.request = request;
                task.c = c;
                that.tasks.push(task);
            }
        }
    });
    logger.info("task generation completes.");
    setTimeout(function(){
        for(var i = 0; i < 10; i++) {
            that.getWorkers();
        }
    }, 0);
}

App.prototype.getWorkers = function() {
    var task = that.tasks.pop();
    if(!task) {
        if(that.workerLock.length == 0) {
            logger.info("Job done!");
            client.close();
            var programmeEndTime = new Date().getTime();
            logger.info("time consumed: ", calculateTimeConsumed(that.programmeStartTime, programmeEndTime));
        }
        return;
    }
    that.workerLock.push(0);
    that.crawler.queue({
        uri:"http://jzt2.58.com/api/guest/workersnearby?" + App.prototype.buildRequest(task.request),
        headers:{
            c:task.c,
            channelid:279,
            i:1,
            imei:"864178021678783",
            mobile:"",
            mobile_board:"Lenovo S810t",
            mobile_version:"4.3",
            modle:"",
            useid:"",
            version:"3.0.0",
            Host:"jzt2.58.com"
        },
        task:task
    });
}

App.prototype.start = function() {
    this.init();
    this.run();
}

App.prototype.buildRequest = function(request) {
    var list = [];
    Object.keys(request).forEach(function(key){
        list.push(key + "=" + encodeURIComponent(request[key].toString().replace(/ /g, "_")));
    });
    return list.join("&").replace(/_/g, "+");
}

App.prototype.random = function() {
    return Math.random().toString();
}

App.prototype.hash = function(obj, salt) {
    var keys = Object.keys(obj);
    keys.sort(function(a,b){
        for(;a.length<5;a+='`');
        for(;b.length<5;b+='`');
        return App.prototype.crypto(a).localeCompare(App.prototype.crypto(b));
    });
    //logger.info(keys);
    var str = '';
    for(var i = 0; i < keys.length; i++) {
        if(str == '') {
            str = keys[i] + "=" + obj[keys[i]];
        } else {
            str += "&" + keys[i] + "=" + obj[keys[i]];
        }
    }
    //logger.info(str);
    return this.crypto(str+salt);
}

App.prototype.crypto = function(str) {
    var hasher = crypto.createHash('md5');
    hasher.update(str,'utf8');
    var digest = hasher.digest('hex');
    return digest;
}

var that = new App();
that.start();
