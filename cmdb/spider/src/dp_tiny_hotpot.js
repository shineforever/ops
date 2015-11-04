var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../helpers/webhelper.js')
var entity = require('../models/entity.js')

var city_start_id = 1;
var city_end_id = 10;
var args = process.argv.slice(2);
if(args.length>0){
    city_start_id = args[0];
    
    if(args.length>1){
        city_end_id = args[1];
    }else
    {
        city_end_id = city_start_id;
    }
}
console.log("start_id: %d end_id: %d", city_start_id, city_end_id);


function Dp() {
    this.resultDir = "../result/";
    this.dataDir = "../appdata/";
    this.logFile = "dp_tiny_hotpot_log_" + city_start_id + "-" + city_end_id + ".log";
    this.resultFile = "dp_tiny_hotpot_" + city_start_id + "-" + city_end_id + ".txt";
    this.todoFile = "dp_tiny_hotpot_todo_" + city_start_id + "-" + city_end_id + ".js";
    this.cityFile = "dp_city.txt"

    this.taskQueue = [];
    this.interval = [0,500];
    this.doneItems = {};
}
Dp.prototype.loadTodo = function () {
    var need_init = true;
    if(fs.existsSync(this.dataDir + this.todoFile))
    {
        var todo = fs.readFileSync(this.dataDir + this.todoFile).toString();
        if (todo) {
            this.todo = JSON.parse(todo);
            need_init = false;
        } 
    }
    
    if(need_init){
        this.todo = {city_id: city_start_id, page_idx: 1};
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

Dp.prototype.writeCity = function(city){
    console.log("[CITY] ", city);
    fs.writeFileSync(this.dataDir + this.cityFile, city);
}

Dp.prototype.start = function () {
    this.init();
    for (var i = this.todo.city_id; i <= city_end_id; i++) {
        this.taskQueue.push({ city: { id: i, name: 'unknown_city' }, cate: {id: '10/g110', name: '火锅'}});
    }

    console.log("[TASKS] %d", this.taskQueue.length);
    
    this.wgetList();
}
Dp.prototype.wgetList = function (t) {
    if (!t) {
        t = this.taskQueue.shift();
        if(!t){
            console.log('ok');
            return 1;    
        }
        t.pageIdx = this.todo.page_idx;
        t.shopCount = -1;
        t.shops = [];
    }
    var id = t.cate.id;
    var path = '/search/category/' + t.city.id + '/' + t.cate.id + 'p' + t.pageIdx;
    var opt = new helper.basic_options('www.dianping.com', path);
    console.log(opt);
    console.log("[GET] %d,%s: %d/%d", t.city.id, t.cate.name, t.pageIdx, Math.ceil(t.shopCount / 15));
    helper.request_data(opt, null, function (data, args, res) {
        that.processList(data, args, res);
    }, t);
}

Dp.prototype.processList = function (data, args, res) {
    if(!res) {
        if (args[0].pageIdx < args[0].pageCount) {
            that.todo.page_idx++;

            args[0].pageIdx++;
            setTimeout(function () {
                that.wgetList(args[0]);
            }, 2500);
        } else {
            that.todo.city_id++;
            that.todo.page_idx = 1;

            setTimeout(function () {
                that.wgetList();
            }, 2500);
        }
        this.saveTodo();
        return;
    }
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
    if (args[0].shopCount == -1) {
        var city_name = $("div#page-header div.container a.city").text();
        var total_num = $("div.section div.bread span.num").text();
        if (!total_num
            || !city_name) {
            args[0].pageCount = 0;
            args[0].shopCount = 0;
            if(city_name){
                args[0].city.name = city_name;
            }
            
            console.log("[INVALID_DATA] %s, %s, %d, %d", args[0].city.name, args[0].cate.name, args[0].pageIdx, args[0].shopCount);
        }else{
            var m = Number(total_num.trim().match(/\d+/)[0]);
            args[0].shopCount = m;
            args[0].pageCount = Math.min(Math.ceil(m / 15), 50);
            args[0].city.name = city_name.trim();
        }
    }
    if (args[0].shopCount != 0) {
        var itemSelector;
        itemSelector = "div#shop-all-list ul li";
        $(itemSelector).each(function () {
            var shop_url = "http://www.dianping.com"+$("div.pic a", this).attr("href") || "xx";
            var shop_title = $("div.txt div.tit a", this).attr('title') || "xx";
            var shop_star = $("div.txt div.comment span.sml-rank-stars", this).attr('title') || "xx";
            var shop_comment = $("div.txt div.comment a.review-num b", this).text() || "xx";
            var shop_price = $("div.txt div.comment a.mean-price b", this).text().trim() || "xx"
            var shop_addr = $("div.txt span.addr",this).text().replace(/\,g/, ' ') || "xx";
            var shop_points = $("div.txt span.comment-list span b",this).map(function(){
	            return $(this).text();
	        });
	        if(shop_points.length==0){
	            shop_points = [0,0,0];
	        }

            var shop_flavor = shop_points[0];
            var shop_environment = shop_points[1];
            var shop_service = shop_points[2];

            var record = [
                shop_url,
                args[0].city.name,
                shop_addr,
                shop_title,
                shop_star,
                shop_price,
                shop_comment,
                shop_flavor,
                shop_environment,
                shop_service,
                '\n'].join();
            fs.appendFileSync(that.resultDir + that.resultFile, record);
            console.log("[DONE] %s", record);
        });
        
        console.log("[DATA] %s, %s, %d, %d", args[0].city.name, args[0].cate.name, args[0].pageIdx, args[0].shopCount);
    }

    if (args[0].pageIdx < args[0].pageCount) {
        that.todo.page_idx++;

        args[0].pageIdx++;
        setTimeout(function () {
            that.wgetList(args[0]);
        }, 2500);
    } else {
        that.todo.city_id++;
        that.todo.page_idx = 1;

        setTimeout(function () {
            that.wgetList();
        }, 2500);
    }
    this.saveTodo();
}

var instance = new Dp();
var that = instance;
instance.start();