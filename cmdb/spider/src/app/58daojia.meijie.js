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
logger.add(godotTransport, {godot:client, service:"58daojia.meijie"});

logger.add(logger.transports.File, { filename: '../../log/daojia.meijie.log' ,logstash:true,level:'info',handleExceptions:true});
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
    this.appointmentDay = moment().add(3, "d").format("YYYY-MM-DD") + " 19:00:00"//new Date().addDays(3).toString() + " 19:00:00";
    this.programmeStartTime = new Date().getTime();
    this.resultDir = "../../result/app/58daojia.meijie/";
    this.resultFile = "58daojia.meijie." + this.today + ".csv";
    this.dataDir = "../../appdata/";
    this.cityFile = "58daojia.txt";
    this.tasks = [];
    this.cityids = [];
    this.cityidMap = {};
    this.structuredTasks = {};
    this.crawler = new Crawler({
        maxConnections:10,
        userAgent:"58daojiaandroid",
        headers:{
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
                setTimeout(that.getWorkers, 0);
                return;
            }
            // logger.info(result.body)
            try {
                var data = JSON.parse(result.body);
            } catch(e) {
                logger.error("error parsing worker for ", result.uri);
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
                // list.push(data.data[i].star == 0 ? "暂无评价" : data.data[i].star + "星");
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
            // logger.info("[INFO] Done ", result.uri);
            setTimeout(that.getWorkers, 0);
            logger.info("task left: ", that.tasks.length);
        }
    });
    this.cityLock = 0;
    this.workerLock = 0;
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
            o.meijiaIds = [];
            this.structuredTasks[cityid] = o;
        }
        this.structuredTasks[cityid].locations.push({lng:point[3],lat:point[4]});
    }, this);
    this.cityids = Object.keys(this.structuredTasks);
    logger.info("initilization completes.");
}

App.prototype.run = function() {
    for(var i = 0; i < this.cityids.length; i++) {
        var cityid = this.cityids[i];
        ++this.cityLock;
        this.crawler.queue({
            uri:util.format("http://jzt2.58.com/api/v23/meijiexiufu/meijie?r=%s&cityid=%s", App.prototype.random(), cityid),
            cityid:cityid,
            jQuery:true,
            callback:function(error, result, $) {
                var cityid = result.options.cityid;
                if(error || !$) {
                    logger.error("Error getting meijiaid for cityid ", cityid);
                    --that.cityLock;
                    if(that.cityLock == 0) {
                        setTimeout(that.generateTasks, 0);
                    }
                    return;
                }
                var list = $("ul.meijie-list li");
                if(!list || list.length == 0) {
                    logger.error("Xiufu service is temporarily invalid in city ", cityid);
                    --that.cityLock;
                    if(that.cityLock == 0) {
                        setTimeout(that.generateTasks, 0);
                    }
                    return;
                }
                for(var i = 0; i < list.length; i++) {
                    that.structuredTasks[cityid].meijiaIds.push(list.eq(i).find("input.mjid").attr("value"));
                }
                logger.info(util.format("Got %s meijiaIds for city %s", list.length, cityid));
                --that.cityLock;
                if(that.cityLock == 0) {
                    setTimeout(that.generateTasks, 0);
                }
                return;
            }
        });
    }
}

App.prototype.generateTasks = function() {
    logger.info("task generation starts.");
    Object.keys(that.structuredTasks).forEach(function(cityid){
        var locations = that.structuredTasks[cityid].locations;
        var meijiaIds = that.structuredTasks[cityid].meijiaIds;
        for(var i = 0; i < meijiaIds.length; i++) {
            for(var j = 0; j < locations.length; j++) {
                var task = {};
                var request = {
                    r:App.prototype.random(),
                    pagesize:10,
                    duration:1.5,
                    jinpai:0,
                    meijiaid:meijiaIds[i],
                    address:"长寿路89号",
                    page:1,
                    lng:locations[j].lng,
                    type:28,
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
    logger.info("Total tasks: ", that.tasks.length);
    // var task = that.tasks.pop();
    // task.request.meijiaid = 378;
    // task.request.lng = "116.476071";
    // task.request.lat = "39.90432";
    // task.request.address = "长寿路89号";
    // task.request.date = "2015-06-08 19:00:00";
    // task.request.cityid = "1";
    // task.c = App.prototype.hash(task.request, "~!@#$%^&*");
    // logger.info(task);
    // that.crawler.queue({
    //     uri:"http://jzt2.58.com/api/guest/workersnearby?" + App.prototype.buildRequest(task.request),
    //     headers:{
    //         c:task.c,
    //         channelid:279,
    //         i:1,
    //         imei:"864178021678783",
    //         mobile:"",
    //         mobile_board:"Lenovo S810t",
    //         mobile_version:"4.3",
    //         modle:"",
    //         useid:"",
    //         version:"3.0.0",
    //         Host:"jzt2.58.com"
    //     },
    //     task:task
    // });
    setTimeout(function(){
        for(var i = 0; i < 10; i++) {
            ++that.workerLock;
            that.getWorkers();
        }
    }, 0);
}

App.prototype.getWorkers = function() {
    var task = that.tasks.pop();
    if(!task) {
        --that.workerLock;
        if(that.workerLock == 0) {
            logger.info("Job done!");
            client.close();
            var programmeEndTime = new Date().getTime();
            logger.info("time consumed: ", calculateTimeConsumed(that.programmeStartTime, programmeEndTime));
        }
        return;
    }
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
