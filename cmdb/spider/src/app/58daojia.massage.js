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
logger.add(godotTransport, {godot:client, service:"58daojia.massage"});

logger.add(logger.transports.File, { filename: '../../log/daojia.massage.log' ,logstash:true,level:'info',handleExceptions:true});
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

var cities = [
    {name:"Beijing",id:"1",localid:"1202"},
    {name:"Hangzhou",id:"79",localid:"79"},
    {name:"Chengdu",id:"102",localid:"102"},
    {name:"Changsha",id:"414",localid:"414"},
    {name:"Chongqing",id:"37",localid:"37"},
    {name:"Tianjin",id:"18",localid:"18"},
    {name:"Xi'an",id:"483",localid:"483"},
    {name:"Shenzhen",id:"4",localid:"4"},
    {name:"Guangzhou",id:"3",localid:"3"},
    {name:"Harbin",id:"202",localid:"202"},
    {name:"Jinan",id:"265",localid:"265"},
    {name:"Fuzhou",id:"304",localid:"304"},
    {name:"Wuhan",id:"158",localid:"158"},
    {name:"Taiyuan",id:"740",localid:"740"},
    {name:"Shijiazhuang",id:"241",localid:"241"},
    {name:"Nanchang",id:"669",localid:"669"},
    {name:"Shenyang",id:"188",localid:"188"},
    {name:"Nanjing",id:"172",localid:"172"},
    {name:"Hefei",id:"837",localid:"837"},
    {name:"Shanghai",id:"2",localid:"2"},
    {name:"Mianyang",id:"1057",localid:"1057"}
];

var workerMap = {};

function App() {
    this.today = moment().format("YYYY-MM-DD");
    this.programmeStartTime = new Date().getTime();
    this.resultDir = "../../result/app/58daojia.massage/";
    this.resultFile = "58daojia.massage." + this.today + ".csv";
    this.crawler = new Crawler({
        maxConnections:10,
        userAgent:"58daojiaandroid",
        jQuery:false,
        callback:function(error, result) {
            var task = result.options.task;
            if(error) {
                logger.error(util.format("Error opening %s startId %s", task.city, task.request.start));
                setTimeout(that.getWorker, 0);
                return;
            }
            try {
                var data = JSON.parse(result.body).data;
            } catch(e) {
                logger.error(util.format("Error parsing %s startId %s", task.city, task.request.start));
                setTimeout(that.getWorker, 0);
                return;
            }
            if(data.length >= 200) {
                task.request.start += 200;
                task.request._ = new Date().getTime();
                that.tasks.push(task);
            }
            var resultStr = [];
            for(var i = 0; i < data.length; i++) {
                if(workerMap[data[i].tid]) {
                    continue;
                } else {
                    workerMap[data[i].tid] = true;
                }
                var list = [];
                list.push(task.city);
                list.push(data[i].tid);
                list.push(data[i].truename);
                list.push(data[i].am_pic.replace("|", ""));
                list.push(data[i].sex == 1 ? "男" : "女");
                list.push(data[i].borthdate);
                list.push(data[i].native_place);
                list.push(data[i].workyear);
                list.push(that.today);
                resultStr.push(list.join() + "\n");
            }
            fs.appendFileSync(that.resultDir + that.resultFile, resultStr.join(""));
            // logger.info("[INFO] Done {0} {1} page {2}".format(task.city, task.type, task.request.page));
            setTimeout(that.getWorker, 0);
        }
    });
    this.tasks = [];
    this.lock = 0;
}

App.prototype.init = function() {
    logger.info("initilization starts.");
    if(!fs.existsSync(this.resultDir)) {
        fs.mkdirSync(this.resultDir);
    }
    fs.writeFileSync(this.resultDir+this.resultFile, "\ufeff城市,ID,姓名,职称,性别,出生年月,籍贯,工龄,抓取日期\n");
    logger.info("initilization completes.");
    this.generateTasks();
}

App.prototype.generateTasks = function() {
    logger.info("task generation starts.");
    cities.forEach(function(city){
        var task = {};
        var request = {
            city_id:city.id,
            latlnt:"39.90432,116.47607",
            start:0,
            limit:200,
            vendor:"baidu",
            _:new Date().getTime()
        }
        task.request = request;
        task.city = city.name;
        that.tasks.push(task);
    });
    logger.info("task generation completes.");
    logger.info("Total tasks: ", that.tasks.length);
}

App.prototype.run = function() {
    var length = this.tasks.length > 5 ? 5 : this.tasks.length;
    for(var i = 0; i < length; i++) {
        ++this.lock;
        this.getWorker();
    }
}

App.prototype.getWorker = function() {
    var task = that.tasks.shift();
    if(!task) {
        --that.lock;
        if(that.lock == 0) {
            logger.info("Job done.");
            client.close();
            var programmeEndTime = new Date().getTime();
            logger.info("time consumed: ", calculateTimeConsumed(that.programmeStartTime, programmeEndTime));
        }
        return;
    }
    logger.info("task left: ", that.tasks.length);
    that.crawler.queue({
        uri:"http://dj.diandao.org/api/therapist/get_therapist_list?" + App.prototype.buildRequest(task.request),
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
        list.push(key + "=" + encodeURIComponent(request[key]));
    });
    return list.join("&");
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
