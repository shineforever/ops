var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../helpers/webhelper.js')
var entity = require('../models/entity.js')

var city_start_id = 1;
var city_end_id = 400;
var args = process.argv.slice(2);
if (args.length > 0) {
    city_start_id = args[0];
    
    if (args.length > 1) {
        city_end_id = args[1];
    } else {
        city_end_id = city_start_id;
    }
}
console.log("start_id: %d end_id: %d", city_start_id, city_end_id);


function Dp() {
    this.resultDir = "../result/";
    this.dataDir = "../appdata/";
    this.resultFile = "dp_get_city_" + city_start_id + "-" + city_end_id + ".txt";
    this.todoFile = "dp_get_city_todo_" + city_start_id + "-" + city_end_id + ".js";
    this.cityFile = "dp_city.txt"
    
    this.taskQueue = [];
    this.interval = [0,500];
    this.doneItems = {};
}
Dp.prototype.loadTodo = function () {
    var need_init = true;
    if (fs.existsSync(this.dataDir + this.todoFile)) {
        var todo = fs.readFileSync(this.dataDir + this.todoFile).toString();
        if (todo) {
            this.todo = JSON.parse(todo);
            need_init = false;
        }
    }
    
    if (need_init) {
        this.todo = { city_id: city_start_id, page_idx: 1 };
        this.saveTodo();
    }
}
Dp.prototype.saveTodo = function () {
    fs.writeFileSync(this.dataDir + this.todoFile, JSON.stringify(this.todo));
}
Dp.prototype.init = function () {
    console.log("[INIT] %d", 0);
    this.loadTodo();
}

Dp.prototype.writeCity = function (city) {
    console.log("[CITY] ", city);
    fs.appendFileSync(this.dataDir + this.cityFile, city);
}

Dp.prototype.start = function () {
    this.init();
    for (var i = this.todo.city_id; i <= city_end_id; i++) {
        this.taskQueue.push({ city: { id: i, name: 'unknown', pinyin: 'unknown' }, cate: { id: '10/g110', name: '火锅' } });
    }
    
    console.log("[TASKS] %d", this.taskQueue.length);
    
    this.wgetList();
}
Dp.prototype.wgetList = function (t) {
    if (!t) {
        t = this.taskQueue.shift();
        if (!t) {
            console.log('ok');
            return 1;
        }
        t.pageIdx = this.todo.page_idx;
        t.shopCount = -1;
        t.shops = [];
    }
    var id = t.cate.id;
    var path = '/search/category/' + t.city.id + '/' + t.cate.id;
    var opt = new helper.basic_options('www.dianping.com', path);
    console.log(opt);
    console.log("[GET] %d,%s", t.city.id, t.cate.name);
    helper.request_data(opt, null, function (data, args, res) {
        that.processList(data, args, res);
    }, t);
}

Dp.prototype.processList = function (data, args, res) {
    if (res.statusCode == 403) {
        console.log("IP has been forbidden");
        return;
    }
    if (!data) {
        console.log("data empty");
        
        return 0;
    }
    
    var city_name = "";
    
    var $ = cheerio.load(data);

    var city_name = $("div#page-header div.container a.city").text();
    var tuan_a = $("div#main-nav div.container div.channel-nav a")[1];
    if(!tuan_a)
    {
        console.log("[INVALID_DATA] %d %s", args[0].city.id, city_tuan_href);
    }else{
        var city_tuan_href = tuan_a.attribs['href'];
        if (!city_name
            || !city_tuan_href) {
            console.log("[INVALID_DATA] %d %s", args[0].city.id, city_tuan_href);
        } else {
            args[0].city.name = city_name.trim();
            var city_href_parts = city_tuan_href.split('/');
            var len = city_href_parts.length;
            var city_pinyin = city_href_parts[len-1];
            this.writeCity(args[0].city.id + ',' + args[0].city.name + ',' + city_pinyin + '\r\n');
        }
    }
    

    that.todo.city_id++;
        
    setTimeout(function () {
        that.wgetList();
    }, 1000);

    this.saveTodo();
}

var instance = new Dp();
var that = instance;
instance.start();