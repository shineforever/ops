var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../helpers/webhelper.js')
var entity = require('../models/entity.js')

var city_start_id = 1;
var city_end_id = 400;

console.log("start_id: %d end_id: %d", city_start_id, city_end_id);

function Dp() {
    var args = process.argv.slice(2);
    if (args.length > 0) {
	city_start_id = parseInt(args[0]);
	
	if (args.length > 1) {
            city_end_id = parseInt(args[1]);
	} else {
            city_end_id = city_start_id;
	}
    }

    
    this.resultDir = "../result/";
    this.dataDir = "../appdata/";
    this.resultFile = "dp_tuan_products_" + city_start_id + "-" + city_end_id + ".txt";
    this.templateFile = "dp_city_products_task_template.json";
    this.todoFile = "dp_tuan_products_todo_" + city_start_id + "-" + city_end_id + ".json";
    this.cityFile = "dp_city.txt";
    
    //this.doneFile = "yelp_done_item.txt";
    this.todo = {};
    this.taskQueue = [];
    this.interval = [0,500];
    this.doneItems = {};
    
    if(args.length > 2 && args[2]=="reset"){
	console.log("removing points file...");
	if (fs.existsSync(this.resultDir + this.todoFile)) {
	    fs.unlinkSync(this.resultDir + this.todoFile);
	    console.log("points file deleted!");
	}
	if(fs.existsSync(this.resultDir + this.resultFile)){
	    //fs.unlinkSync(this.resultDir + this.resultFile);
	    //console.log("result file deleted!");
	}
    }
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
    if (fs.existsSync(this.resultDir + this.todoFile)) {
        var todo = fs.readFileSync(this.resultDir + this.todoFile).toString();
        if (todo) {
            this.todo = JSON.parse(todo);
            need_init = false;
        }
    }
    
    if (need_init) {
        this.todo = this.getCityTaskTemplate();
        this.todo.id = city_start_id;
        this.saveTodo();
    }
}

Dp.prototype.saveTodo = function () {
    fs.writeFileSync(this.resultDir + this.todoFile, JSON.stringify(this.todo));
}

Dp.prototype.topTask = function () {
    var task = {};
    var city_id = this.todo.id;
    task.city = { id: city_id, name: this.cities[city_id].name, pinyin: this.cities[city_id].pinyin };
    if (!this.todo.categories[0]) {
        if (this.todo.id < city_end_id) {
            var next_city_id = task.city.id + 1;
            
            while (!this.cities[next_city_id]) {
                if (next_city_id == city_end_id) {
                    return null;
                }
                next_city_id++;
            }
            this.todo = this.getCityTaskTemplate();
            this.todo.id = next_city_id;
            return this.topTask();
        } else {
            return null;
        }
    }
    
    if (!this.todo.categories[0].sub_categories[0]) {
        this.todo.categories.shift();
        return this.topTask();
    }
    
    task.cate = { id: this.todo.categories[0].id };
    task.sub_cate = { id : this.todo.categories[0].sub_categories[0].id };
    
    if (!this.todo.categories[0].sub_categories[0].parts[0]) {
        if (this.todo.categories[0].sub_categories[0].toPart) {
            task.pageIdx = 0;
            return task;
        } else {
            this.todo.categories[0].sub_categories.shift();
            return this.topTask();
        }
    }
    
    task.part_url = this.todo.categories[0].sub_categories[0].parts[0].url;
    task.pageIdx = this.todo.categories[0].sub_categories[0].parts[0].page_idx || 0;
    
    return task;


}

Dp.prototype.popTask = function () {
    this.todo.categories[0].sub_categories.shift();
}


Dp.prototype.getCityTaskTemplate = function () {
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
        if (!t) {
            console.log('ok');
            return 1;
        }
        t.shopCount = -1;
    }
    
    var path = '/list/' + t.city.pinyin + '-category_' + t.sub_cate.id;
    if (t.part_url) {
        path = t.part_url + '?pageIndex=' + t.pageIdx;
    }
    var opt = new helper.basic_options('t.dianping.com', path);
    opt.agent = false;
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
        setTimeout(function () {
            that.wgetList(args[0]);
        }, 2000);
        return;
    }
    
    var $ = cheerio.load(data);
    if (args[0].part_url)// got part url already
    {
        if (args[0].shopCount == -1) {
            args[0].shopCount = 1;
        }
        if (args[0].shopCount == 1) {
            var itemSelector;
            itemSelector = "div.tg-list div.tg-tab-box ul.tg-floor-list li.tg-floor-item div.tg-floor-item-wrap";
            $(itemSelector).each(function () {
                var shop_title = $("a.tg-floor-title h3", this).text().trim().replace(/\,/g, ' ') || "xx";
                var dealid = $("a.tg-floor-title", this).attr("href");
                var product_name = $("a.tg-floor-title h4", this).text().trim().replace(/\，/g, ' ').replace(/\,/g, ' ').replace(/\n/g, ' ') || "xx";
                var old_price = $("span.tg-floor-price span.tg-floor-price-old del", this).text().trim() || "xx";
                var new_price = $("span.tg-floor-price span.tg-floor-price-new em", this).text().trim() || "xx";
                var sold_match = $("span.tg-floor-sold", this).text().trim().match(/\d+/);
                var sold_count = sold_match && sold_match[0] || "xx";
                
                var record = [
                    args[0].city.name,
                    cate_map['' + args[0].cate.id],
                    sub_cate_map[args[0].sub_cate.id],
                    shop_title,
                    product_name,
                    old_price,
                    new_price,
                    sold_count,
		    dealid,
		    new Date().toDatetime(),
                    '\n'].join();
                fs.appendFileSync(that.resultDir + that.resultFile, record);
                //console.log("[DONE] %s", record);
            });
            
            console.log("[DATA] %s, %s, %s, %d", args[0].city.name, cate_map[args[0].cate.id], sub_cate_map[args[0].sub_cate.id], args[0].pageIdx);
        }
        
        var next = false;
        $("#paginator div.tg-paginator-wrap a.tg-paginator-next").each(function () {
            var next_page_text = $(this).text().trim();
            if (next_page_text == "下一页") {
                next = true;
                console.log("[NEXT PAGE] %s ", next_page_text);
                that.todo.categories[0].sub_categories[0].parts[0].page_idx++;
                that.saveTodo();
                
                args[0].pageIdx++;
                setTimeout(function () {
                    that.wgetList(args[0]);
                }, 2000);
            }
        });
        
        
        if (!next) {
            this.popTask();
            this.saveTodo();
            setTimeout(function () {
                that.wgetList();
            }, 2000);
        }
    } else // to get (area) part url & push to parts arr
    {
        var li = $('#classify div.tg-tab-box div.tg-classify-wrap ul li');
        var a = $('#classify div.tg-tab-box div.tg-classify-wrap ul li a');
        $('#classify div.tg-tab-box div.tg-classify-wrap ul li a').each(function () {
            var href = $(this).attr('href');
            if (href.indexOf('region_3s') >= 0) {
                that.todo.categories[0].sub_categories[0].parts.push({ url: href });
            }
        });
        if (that.todo.categories[0].sub_categories[0].parts.length == 0) {
            var fake_part_url = '/list/' + args[0].city.pinyin + '-category_' + args[0].sub_cate.id;
            that.todo.categories[0].sub_categories[0].parts.push({ url: fake_part_url });
        }
        that.todo.categories[0].sub_categories[0].toPart = 0;
        this.saveTodo();
        
        setTimeout(function () {
            that.wgetList();
        }, 3000);
    }
}

Dp.prototype.test_task = function () {
    this.init();
    
    while (true) {
        var t = this.topTask();
        if (!t) {
            break;
        }
        console.log(t);
        this.popTask();
    }
}

var cate_map = { "1": "美食", "3": "休闲娱乐", "5": "丽人", "8": "结婚", "9": "亲子", "10": "生活服务" };
var sub_cate_map = {
    // 美食
    "34": "聚餐宴请", "18": "日韩料理", "15": "火锅", "16": "午市套餐", "23": "江浙菜", "20": "小吃套餐", "24": "川湘菜", "19": "西餐", "22": "粤菜/茶餐厅", "14": "自助餐", "27": "东南亚菜", "12": "蛋糕面包", "13": "甜点饮料", "21": "烧烤/烤肉", "25": "咖啡茶馆", "130": "烤鱼", "17": "下午茶", "35": "特色菜", "136": "情侣套餐", "131": "闽菜", "26": "海鲜", "30": "台湾菜", "132": "8-10人套餐", "29": "西北/新疆菜", "133": "东北菜", "33": "汤/粥/炖菜", "137": "农家土菜", "36": "蟹宴", "32": "京菜/鲁菜", "28": "清真", "31": "云贵菜", "38": "其他美食",
    // 休闲娱乐
    "40": "KTV", "43": "洗浴/汗蒸", "42": "温泉", "56": "滑雪", "52": "公园/游乐园", "53": "景点/郊游", "50": "密室逃脱", "45": "桌游/电玩/网吧", "48": "酒吧", "41": "足疗按摩", "39": "电影", "49": "4D/5D电影", "46": "演出/赛事/展览", "47": "DIY手工", "51": "真人CS/卡丁车", "127": "私人影院", "55": "农家乐/采摘", "44": "运动健身", "57": "游泳", "128": "轰趴馆", "58": "水上乐园", "54": "亲子游玩", "129": "更多",
    // 丽人
    "67": "美发", "68": "美甲", "69": "美容/SPA", "72": "瑜珈/舞蹈", "71": "瘦身纤体", "70": "个性写真", "73": "其他",
    // 生活服务
    "116": "家具建材", "126": "商场购物券", "119": "个性写真", "111": "汽车服务", "112": "体检保健", "114": "鲜花婚庆", "118": "婚纱摄影", "113": "培训课程", "123": "宠物服务", "122": "服装洗护", "115": "照片冲印", "124": "家政服务", "125": "配眼镜",
    // 结婚
    "93": "婚纱摄影", "100": "婚戒首饰", "96": "婚纱礼服", "95": "婚庆公司", "101": "婚礼小商品", "98": "成衣定制", "99": "彩妆造型", "94": "旅游婚纱照", "102": "婚礼跟拍", "103": "婚车租赁", "105": "其他", 
    // 亲子
    "107": "亲子游乐", "106": "亲子摄影", "108": "幼儿教育", "109": "亲子购物", "97": "孕产护理", "110": "其他"
};

var instance = new Dp();
var that = instance;
instance.start();
//instance.test_task();