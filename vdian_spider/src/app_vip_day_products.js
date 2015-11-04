var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../helpers/webhelper.js')
var entity = require('../models/entity.js')

function VIPSale(){
    this.evn_dir = ".";
    this.now = null;
    this.date = null;
    this.logFile = null;
    this.logPath = this.evn_dir + "/log/vipday/";
    this.pageStoreDir = this.evn_dir + "/pageStore/vipday/";
    this.resultDir = this.evn_dir + "/result/";
    this.dataDir = this.evn_dir + "/appdata/";
    this.resultFile = "app_vip_day.txt";
    this.doneFile = "app_vip_done_day.txt";

    this.ADDR_VIP = "day.vip.com";
    this.RequestFirst = true;
}

VIPSale.prototype.writeLog = function(logStr){
    this.now = new Date();
    var time = "[" + this.now.getHours() + ":" + this.now.getMinutes() + ":" + this.now.getSeconds() + "] ";
    var sb = new helper.StringBuffer();
    sb.append(time);
    sb.append(logStr);
    sb.append("\r\n");
    fs.appendFileSync(this.logPath + this.logFile, sb.toString());

    console.log(time, logStr);
}

VIPSale.prototype.init = function(){
    var today = this.date.getFullYear() + '-' + (this.date.getMonth() + 1) + '-' + this.date.getDate();
    this.logFile = today + ".log";

    //fs.rmdir(this.pageStoreDir + today + '/');
    
    fs.mkdirSync(this.pageStoreDir + today + '/');
}

VIPSale.prototype.start = function(){
    this.date = new Date();
    this.load();
    this.init();
//    console.log("%d flights todo.",this.todoFlights.length);
    // 抓取唯品会主页
    var link = {
        name: "唯品团",
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

VIPSale.prototype.load=function(){
}
var sleepTime = 2400000;
var sleepCount = 0;


// 处理抓取到得主页
VIPSale.prototype.processHome = function(data, args){
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
    
    var name = args[0].name;
    var today = that.date.getFullYear() + '-' + (that.date.getMonth() + 1) + '-' + that.date.getDate();
    // 保存文件
    fs.writeFileSync(that.pageStoreDir + today + '/' + name + args[0].page + ".html", data);

    that.writeLog("Response 唯品团 " + args[0].path);

    // 每一个商品
    var pro_list = $("section.m_group_goods > figure");
    if(pro_list.length > 0)
    {
        pro_list.each(function(i,pro_figure){
	        var pro_figurecaption = $("figcaption", pro_figure)[0];
            if(!pro_figurecaption)return;

            var title_h3 = $("h3", pro_figurecaption)[0];
            if(!title_h3)return;
            var pro_name = title_h3.children[1] ? title_h3.children[1].data : "***";

            var pro_price_div = $("div.group_goods_info", pro_figurecaption)[0];
            if(!pro_price_div)return;
            var pro_price_info_span = $("span.group_goods_price", pro_price_div)[0];
            if(!pro_price_info_span)return;
            var pro_price_span = $("span", pro_price_info_span)[0];
            if(!pro_price_span)return
            var pro_price_sale = pro_price_span.children[0].data;
    
            var pro_price_p = $("p.discount_wrap", pro_price_div)[0];
            if(!pro_price_p)return;
            var pro_price_del = $("del", pro_price_p)[0];
            if(!pro_price_del)return;
            var pro_price = pro_price_del.children[0].data.split(";")[1];

            var pro_buy_num_p = $("p.group_purchase_num")[0];
            if(!pro_buy_num_p)return;
            var pro_buy_num_b = $("b", pro_buy_num_p)[0];
            var pro_buy_num = 0;
            pro_buy_num = pro_buy_num_b.children[0] ? pro_buy_num_b.children[0].data : 0;
            
            var pro_code = "***";
            var sb = new helper.StringBuffer();

            sb.append(pro_name);
            sb.append(',');
            sb.append(pro_code);
            sb.append(',');
            sb.append(pro_price);
            sb.append(',');
            sb.append(pro_price_sale);
            sb.append(',');
            sb.append(pro_buy_num);
            sb.append(',');
            sb.append(today);
            sb.append(',');
            sb.append(today);
            sb.append('\r\n');
            fs.appendFileSync(that.resultDir + that.resultFile, sb.toString());
        });
    }

    var a_pageNext_arr = $("a.page_btn");
    var a_pageNext = null;
    if(a_pageNext_arr.length == 1){
        if(that.RequestFirst)
        {
            a_pageNext = a_pageNext_arr[0];    
            that.RequestFirst = false;
        }
    }else if(a_pageNext_arr.length == 2){
        a_pageNext = a_pageNext_arr[1];
    }
    if(a_pageNext)
    {
        var path_pageNext = a_pageNext.attribs["href"];
        args[0].href = args[0].host + path_pageNext;
        args[0].path = path_pageNext;
        args[0].page = args[0].page + 1;

        that.wgetHome(args[0]);
    }

}

VIPSale.prototype.wgetHome = function(link){
    this.writeLog("GET day.vip.com");

    var opt = new helper.basic_options(link.host,link.path,'GET',false,false,null);
    opt.agent=false;

    helper.request_data(opt,null,this.processHome,link);
}


var instance = new VIPSale();
var that = instance;
instance.start();