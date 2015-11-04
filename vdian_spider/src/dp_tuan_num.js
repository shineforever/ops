var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../helpers/webhelper.js')
var entity = require('../models/entity.js')


var city_start_id = 1;
var city_end_id = 400;
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
    this.resultFile = "dp_num_"  + city_start_id + "-" + city_end_id +  ".txt";
    this.templateFile = "dp_city_num_task_template.json";
    this.todoFile = "dp_num_todo_"  + city_start_id + "-" + city_end_id +  ".json";
    this.cityFile = "dp_city.txt";

    //this.doneFile = "yelp_done_item.txt";
    this.todo = {};
    this.taskQueue = [];
    this.interval = [0,500];
    this.doneItems = {};
}
Dp.prototype.loadCity = function () {
    this.cities = {};
    fs.readFileSync(this.dataDir + this.cityFile).toString().split('\r\n').filter(function (line) {
        return line;
    }).map(function (line) {
        var vals = line.split(',');
        that.cities[vals[0]] = { id: vals[0], name: vals[1], pinyin: vals[2] };
    });
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
        this.todo = this.getCityTaskTemplate();
        this.todo.id = 1;
        this.saveTodo();
    }
}
Dp.prototype.saveTodo = function () {
    fs.writeFileSync(this.dataDir + this.todoFile, JSON.stringify(this.todo));
}

Dp.prototype.topTask = function(){
    var task = {};
    task.city = {id: this.todo.id};
    if(!this.todo.categories[0])
    {
        if(this.todo.id < city_end_id)
        {
            this.todo = this.getCityTaskTemplate();
            this.todo.id = task.city.id + 1;
            return this.topTask();
        }else{
            return null;
        }
    }

    if(!this.todo.categories[0].sub_categories[0])
    {
        this.todo.categories.shift();
        return this.topTask();
    }

    task.cate = {id: this.todo.categories[0].id};
    task.sub_cate = {id : this.todo.categories[0].sub_categories[0].id};

    return task;
}

Dp.prototype.popTask = function(){
    this.todo.categories[0].sub_categories.shift();
}


Dp.prototype.getCityTaskTemplate = function(){
    var city_task_template_str = fs.readFileSync(this.dataDir + this.templateFile).toString();
    return JSON.parse(city_task_template_str);
}

Dp.prototype.init = function () {
    this.loadCity();
    this.loadTodo();
    
    console.log("[TODO] ---");
    console.log(this.todo);
}

Dp.prototype.start = function () {
    this.init();
    

    console.log("[START] ");
    
    this.wgetList();
}
Dp.prototype.wgetList = function (t) {
    if (!t) {
        t = this.topTask();
        if(!t)
        {
            console.log('ok');
            return 1;    
        }
        t.numType = '';
        t.tatal_num = 0;
        t.tuan_num = 0;
        t.ding_num = 0;
        t.waimai_num = 0;
    }
    
    var path = '/search/category/' + t.city.id + '/' + t.cate.id + '/g' + t.sub_cate.id + t.numType;
    var opt = new helper.basic_options('www.dianping.com', path);
    //console.log(opt);
    console.log("[GET] %s", path);
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
        return;
    }

    function write_record(t)
    {
        var record = [
            that.cities[t.city.id].name,
            cate_map[t.cate.id],
            sub_cate_map[t.sub_cate.id],
            t.total_num,
            t.tuan_num,
            t.ding_num,
            t.waimai_num,
            '\n'].join();
        fs.appendFileSync(that.resultDir + that.resultFile, record);
        console.log("[DONE] %s", record);
            
        that.popTask();
        that.saveTodo();
        setTimeout(function () {
            that.wgetList();
        }, 1000);
    }
    
    var $ = cheerio.load(data);
    var num = $("div.section div.bread span.num").text();
    if (!num) {
        // write empty record
        console.log("[INVALID_DATA] %s, %s, %d, %d", args[0].city.name, args[0].cate.name, args[0].pageIdx, args[0].shopCount);
        write_record(args[0]);
    }else{
        var m = Number(num.trim().match(/\d+/)[0]);
        if (!args[0].numType) {
            args[0].total_num = m;
            // todo: check type exist
            $("div.filter-box div.filt-classify a").each(function(){
                var href = $(this).attr('href');
                if(href.indexOf('m3') >= 0){
                    args[0].need_tuan = true;
                }else if(href.indexOf('m5') >= 0){
                    args[0].need_ding = true;
                }else if(href.indexOf('m6') >= 0){
                    args[0].need_waimai = true;
                }
            });

            if (args[0].need_tuan) { 
                args[0].numType = 'm3';
                setTimeout(function () {
                    that.wgetList(args[0]);
                }, 1000);
            }else if(args[0].need_ding){
                args[0].numType = 'm5';
                setTimeout(function () {
                    that.wgetList(args[0]);
                }, 1000);
            }else if(args[0].need_waimai){
                args[0].numType = 'm6';
                setTimeout(function () {
                    that.wgetList(args[0]);
                }, 1000);
            }else{
                write_record(args[0]);    
            }
        } else if (args[0].numType == 'm3') {
            args[0].tuan_num = m;
            if (args[0].need_ding) { 
                args[0].numType = 'm5';
                setTimeout(function () {
                    that.wgetList(args[0]);
                }, 1000);
            }else if(args[0].need_waimai){
                 args[0].numType = 'm6';
                setTimeout(function () {
                    that.wgetList(args[0]);
                }, 1000);
            }else 
            {
                write_record(args[0]);   
            }
        } else if (args[0].numType == 'm5') {
            args[0].ding_num = m;
            if (args[0].need_waimai) {
                args[0].numType = 'm6';
                setTimeout(function () {
                    that.wgetList(args[0]);
                }, 1000);
            }else
            {
                write_record(args[0]);
            }

        } else if (args[0].numType == 'm6') {
            args[0].waimai_num = m;
            write_record(args[0]);
        }
    }
}

Dp.prototype.test_task = function () {
    this.init();
    
    while(true)
    {
        var t = this.topTask();
        if(!t){
            break;
        }
        console.log(t);
        this.popTask();
    }
}

var cate_map = { "10": "美食", "30": "休闲娱乐", "50": "丽人", "20": "购物", "45": "运动健身", "80": "生活服务", "65":"爱车" };
var sub_cate_map = {
    // 美食
    "110": "火锅", "112": "小吃快餐", "113": "日本", "117": "面包甜点", "111": "自助餐", "101": "本帮江浙菜", "116": "西餐", "132": "咖啡厅", "114": "韩国料理", "103": "粤菜", "115": "东南亚菜", "102": "川菜", "508": "烧烤", "109": "素菜", "3243": "新疆菜", "106": "东北菜", "104": "湘菜", "248": "云南菜", "26481": "西北菜", "107": "台湾菜", "105": "贵州菜", "108": "清真菜", "118": "其他",
    // 休闲娱乐
    "135": "KTV", "141": "足疗按摩", "140": "洗浴", "5672": "温泉", "133": "酒吧", "136": "电影院", "132": "咖啡厅", "20041": "私人影院", "139": "景点/郊游", "144": "DIY手工坊", "20040": "轰趴馆", "2754": "密室", "20042": "休闲网吧", "134": "茶馆", "156": "桌球馆", "6694": "桌面游戏", "32732": "棋牌室", "137": "游乐游艺", "20039": "真人CS", "20038": "采摘/农家乐", "142": "文化艺术", "138": "公园", "26490": "更多休闲娱乐",
    // 丽人
    "157": "美发", "149": "舞蹈", "148": "瑜伽", "160": "美甲", "123": "化妆品", "20043": "美睫", "6700": "个性写真", "158": "美容/SPA", "182": "齿科", "183": "整形", "493": "纹身", "2790": "产后塑形", "159": "瘦身纤体",
    // 购物
    "120":"服饰鞋包", "187": "超市/便利店", "235": "药店", "123": "化妆品", "128": "眼镜店", "119": "综合商场", "26085": "花店", "122": "珠宝饰品", "125": "亲子购物", "124": "数码产品", "127": "书店", "121": "运动户外", "129": "特色集市", "126": "家居建材", "130": "品牌折扣店", "26101": "办公/文化用品", "184": "食品茶酒", "131": "更多购物场所",
    // 运动健身
    "147":"健身中心", "149": "舞蹈", "148": "瑜伽", "151": "游泳馆", "152": "羽毛球馆", "6701": "武术场馆", "154": "高尔夫场", "146": "篮球场", "153": "网球场", "6702": "足球场", "155": "保龄球馆", "6712": "乒乓球馆", "156": "桌球馆", "150": "体育场馆", "27852": "滑雪场", "145": "更多运动场馆",
    // 生活服务
    "237": "银行", "181": "医院", "194": "宠物", "4607": "快照/冲印", "6120": "洗衣店", "835": "电信营业厅", "196": "培训", "195": "家政", "182": "齿科", "32743": "奢侈品护理", "612": "体检中心", "197": "旅行社", "980": "售票点","26117":"居家维修", "260": "学校", "32742": "物流快递", "26465": "小区", "836": "房屋地产", "26466": "商务楼", "6823": "交通", "979": "公司企业", "26119": "网站", "26491": "更多生活服务",
    // 爱车
    "176": "维修保养", "236": "加油站", "180": "停车场", "20026": "汽车美容", "175": "4S店/汽车销售", "179": "驾校", "178": "汽车租赁", "177": "配件/车饰", "259": "汽车保险"
};

var instance = new Dp();
var that = instance;
instance.start();
//instance.test_task();