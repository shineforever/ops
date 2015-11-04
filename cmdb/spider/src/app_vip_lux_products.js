var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../helpers/webhelper.js')
var entity = require('../models/entity.js')

function VIPLux(){
    this.evn_dir = ".";
    this.now = null;
    this.date = null;
    this.logFile = null;
    this.logPath = this.evn_dir + "/log/viplux/";
    this.pageStoreDir = this.evn_dir + "/pageStore/viplux/";
    this.resultDir = this.evn_dir + "/result/";
    this.dataDir = this.evn_dir + "/appdata/";
    this.resultFile = "app_vip_lux.txt";
    this.doneFile = "app_vip_done_lux.txt";

    this.ADDR_VIP = "lux.vip.com";
    this.RequestFirst = true;
}

VIPLux.prototype.writeLog = function(logStr){
    this.now = new Date();
    var time = "[" + this.now.getHours() + ":" + this.now.getMinutes() + ":" + this.now.getSeconds() + "] ";
    var sb = new helper.StringBuffer();
    sb.append(time);
    sb.append(logStr);
    sb.append("\r\n");
    fs.appendFileSync(this.logPath + this.logFile, sb.toString());

    console.log(time, logStr);
}

VIPLux.prototype.init = function(){
    var today = this.date.getFullYear() + '-' + (this.date.getMonth() + 1) + '-' + this.date.getDate();
    this.logFile = today + ".log";

    //fs.rmdir(this.pageStoreDir + today + '/');
    
    fs.mkdirSync(this.pageStoreDir + today + '/');
}

VIPLux.prototype.start = function(){
    this.date = new Date();
    this.load();
    this.init();
//    console.log("%d flights todo.",this.todoFlights.length);
    // 抓取爱丽奢主页
    var link = {
        name: "爱丽奢",
        href: that.ADDR_VIP,
        host: that.ADDR_VIP,
        path: "/",
        page: 1
    };
    this.wgetHome(link);
//    this.todoFlights.forEach(function(f,i,a){
//	this.wgetList(f);
//    },this);
//    this.wgetList(this.todoFlights[0]);
}

VIPLux.prototype.load=function(){
}
var sleepTime = 2400000;
var sleepCount = 0;

VIPLux.prototype.processHome = function(data, args){
    if(Buffer.byteLength(data) < 1000){
        that.writeLog("current ip has been forbidden.");
        setTimeout(function(){
            that.wgetHome();
        },sleepTime);
        sleepCount++;
        sleepTime*=sleepCount+1;
        return;
    }else{
        sleepTime = 2400000;
        sleepCount = 0;
    }
    var $ = cheerio.load(data);

    that.writeLog("Response "  + args[0].name + " " + args[0].path);

    var lux_list = $("li.lux_list_item");
    lux_list.each(function(i, li){
        var a = $("span.lux_info_title > a", li)[0];
        var lux_show_path = a.attribs["href"];
        var lux_shwo_name = a.children[0] ? a.children[0].data : "";

        var link = {
            name: lux_shwo_name,
            href: args[0].host + lux_show_path,
            host: args[0].host,
            path: lux_show_path
        };
        that.wgetGoods(link);
    });
}

// 处理抓取到得商品页
VIPLux.prototype.processGoods = function(data, args){
    if(Buffer.byteLength(data) < 1000){
        that.writeLog("current ip has been forbidden.");
        setTimeout(function(){
            that.wgetGoods(args[0]);
        },sleepTime);
        sleepCount++;
        sleepTime*=sleepCount+1;
        return;
    }else{
        sleepTime = 2400000;
        sleepCount = 0;
    }
    var $ = cheerio.load(data);

    // 专场id
    var id = args[0].path.split('?')[0].replace('/', '');
    var name = args[0].name;
    var today = that.date.getFullYear() + '-' + (that.date.getMonth() + 1) + '-' + that.date.getDate();
    // 保存文件
    fs.writeFileSync(that.pageStoreDir + today + '/' + name + id + args[0].page, data);

    that.writeLog("Response 专场 " + args[0].name + " " + args[0].path);

    // 每一行商品
    var pro_list = $("div.pro_list");
    if(pro_list.length > 0)
    {
        // 专场商品数
        var pro_num_span = $("span.page_total")[0];
        var pro_num = pro_num_span.children[0] ? pro_num_span.children[0].data : "";
        pro_num.replace("共", "");
        pro_num.replace("条", "");
        // 解析正常加载的页面数据
        pro_list.each(function(i,div){
            var dl_arr = $('dl',this);
            var dl_arr_len = dl_arr.length;

            for(var i = 0; i < dl_arr_len; i++)
            {
                var sb = new helper.StringBuffer();

                var dl = dl_arr[i];

                var a_pic = $('dt > a', dl)[0];
                var img = $('img', a_pic)[0];
                if(!img){
                    continue;
                }
                var img_href = img.attribs['data-original'];
                var img_href_parts = img_href.split('/');
                var file_name = img_href_parts[img_href_parts.length - 1];
                var file_name_parts = file_name.split('-');
                var pro_code = '';
                for(var j = 1; j < file_name_parts.length - 1; j++)
                {
                    if(j > 1 && file_name_parts.length > 3 )
                    {
                        pro_code += '-'
                    }
                    pro_code += file_name_parts[j];
                }
                var pro_name = img.attribs['alt'];
                var pro_brand = "";
                var brand_dd = $('dd.brand_tit', dl)[0];
                if(brand_dd){
                    pro_brand = brand_dd.children[0] ? brand_dd.children[0].data : '';
                }

                pro_name = pro_brand + pro_name;

                var price = "",
                    price_sale = "";

                var pro_price_dd = $('dd.pro_list_data', dl)[0];
                if(pro_price_dd)
                {
                    var price_sale_span = $('span', pro_price_dd)[0];
                    var price_sale_em = $('em', price_sale_span)[0];
                    var price_del = $('del', pro_price_dd)[0];
                    if(price_sale_em)
                    {
                        var pro_price_sale = price_sale_em.children[0] ? price_sale_em.children[0].data : "";
                        price_sale = pro_price_sale.split(';')[1];
                    }
                    if(price_del)
                    {
                        var pro_price = price_del.children[0] ? price_del.children[0].data : "";
                        price = pro_price.split(';')[1];
                    }
                }

                sb.append(id);
                sb.append(',');
                sb.append(name);
                sb.append(',');
                sb.append(pro_num);
                sb.append(',');
                sb.append(pro_name);
                sb.append(',');
                sb.append(pro_code);
                sb.append(',');
                sb.append(price);
                sb.append(',');
                sb.append(price_sale);
                sb.append(',');
                sb.append(today);
                sb.append(',');
                sb.append(today);
                sb.append(',');
                sb.append(today);
                sb.append(',');
                sb.append(today);
                sb.append(',');
                sb.append('5');
                sb.append('\r\n');
                fs.appendFileSync(that.resultDir + that.resultFile, sb.toString());
            }
        });

        // 解析异步加载的js数据
        var scriptDom_arr = $('script[type="text/javascript"]');
        scriptDom_arr.each(function(i, scriptDom){
            var ScriptStr = scriptDom.children[0] ? scriptDom.children[0].data : null;
            if(!ScriptStr){
                return;
            }
            var idx_start = ScriptStr.indexOf("var merchandise = [");
            if(idx_start < 0)
            {
                return;
            }else{
                var sb = new helper.StringBuffer();

                var idx_end = ScriptStr.indexOf("];", idx_start);
                if(idx_end < 0){
                    return;
                }
                var pro_info_str = ScriptStr.substring(idx_start + 18, idx_end + 1);

                pro_info_str = pro_info_str.replace(/\'/g, '"');
                pro_info_str = pro_info_str.replace(/\\/g, '\\\\');
                try{
                    var pro_info_arr = JSON.parse(pro_info_str);
                    for(var idx = 0; idx < pro_info_arr.length; idx++)
                    {
                        var pro_info = pro_info_arr[idx];

                        var pro_name = pro_info["name"];
                        if(!pro_name)
                        {
                            continue;
                        }
                        var pro_img = pro_info["img"];
                        var img_href_parts = pro_img.split('/');
                        var file_name = img_href_parts[img_href_parts.length - 1];
                        var file_name_parts = file_name.split('-');
                        var pro_code = '';
                        for(var j = 1; j < file_name_parts.length - 1; j++)
                        {
                            if(j > 1 && file_name_parts.length > 3 )
                            {
                                pro_code += '-'
                            }
                            pro_code += file_name_parts[j];
                        }

                        var price = pro_info["market_price"];
                        var price_sale = pro_info["sell_price"];

                        sb.append(id);
                        sb.append(',');
                        sb.append(name);
                        sb.append(',');
                        sb.append(pro_num);
                        sb.append(',');
                        sb.append(pro_name);
                        sb.append(',');
                        sb.append(pro_code);
                        sb.append(',');
                        sb.append(price);
                        sb.append(',');
                        sb.append(price_sale);
                        sb.append(',');
                        sb.append(today);
                        sb.append(',');
                        sb.append(today);
                        sb.append(',');
                        sb.append(today);
                        sb.append(',');
                        sb.append(today);
                        sb.append(',');
                        sb.append('5');
                        sb.append('\r\n');
                        fs.appendFileSync(that.resultDir + that.resultFile, sb.toString());
                    }
                }
                catch(e){
                    that.writeLog(e.message);
                }
            }
        });

        var a_pageNext = $("span.page_select")[0].next.next;
        if(a_pageNext && a_pageNext.name == "a" )
        {
            var path_pageNext = a_pageNext.attribs["href"];
            args[0].href = args[0].host + path_pageNext;
            args[0].path = path_pageNext;
            args[0].page = args[0].page + 1;

            that.wgetGoods(args[0]);
        }
    }
}

VIPLux.prototype.wgetHome = function(link){
    this.writeLog("GET lux.vip.com");

    var opt = new helper.basic_options(link.host,link.path,'GET',false,false,null);
    opt.agent=false;

    helper.request_data(opt,null,this.processHome,link);
}

VIPLux.prototype.wgetGoods = function(link){
    if(!link)
    {
        this.writeLog("wgetGoods: invalid link");
        return;
    }

    this.writeLog("GET 爱丽奢专场 " + link.name + " " + link.href);
    var opt = new helper.basic_options(link.host, link.path, 'GET', false, false, null);
    opt.agent=false;
    helper.request_data(opt, null, this.processGoods, link);
}

var instance = new VIPLux();
var that = instance;
instance.start();