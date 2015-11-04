var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../helpers/webhelper.js')
var entity = require('../models/entity.js')

var goods_delay_unit = 1 * 1000;
var list_delay_unit = 300 * 1000;
function VIPSale(){
    this.evn_dir = ".";
    this.now = null;
    this.date = null;
    this.logFile = null;
    this.logPath = this.evn_dir + "/log/vip/";
    this.pageStoreDir = this.evn_dir + "/pageStore/vip/";
    this.resultDir = this.evn_dir + "/result/";
    this.dataDir = this.evn_dir + "/appdata/";
    this.resultFile = "app_vip_sale.txt";
    this.doneFile = "app_vip_done_sale.txt";

    this.goodsPageReqDelay = 0;
    this.goodsPageRequests = 0;
    this.goodsPageResponses = 0;

    this.reqGoodsDelay = 0;
    this.reqListDelay = 0;

    this.parsedGoodsPages = 0;
    this.validGoodPages = 0;

    this.writeProducts = 0;

    this.ADDR_VIP = "www.vip.com";
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
    this.wgetHome();
//    this.todoFlights.forEach(function(f,i,a){
//	this.wgetList(f);
//    },this);
//    this.wgetList(this.todoFlights[0]);
}

VIPSale.prototype.load=function(){
}
var sleepTime = 2400000;
var sleepCount = 0;
VIPSale.prototype.processList = function(data,args){
    if(Buffer.byteLength(data) < 1000){
	    that.writeLog("current ip has been forbidden.");
	    setTimeout(function(){
	        that.wgetList(args[0]);
	    },sleepTime);
	    sleepCount++;
	    sleepTime*=sleepCount+1;
	    return;
    }else{
	    sleepTime = 2400000;
	    sleepCount = 0;
    }
    var $ = cheerio.load(data);
    var sb = new helper.StringBuffer();
    var li_arr = $("li.goodsnew_item");
    var li_arr_len = li_arr.length;
    if(li_arr_len > 0){
        that.writeLog(args[0].name + " 专场数量 " + li_arr_len );
        
        li_arr.each(function(i,li){
            
            var goods_info_div = $("div.goodsnew_infos", li);
            var goods_info_t_div = $("div.goodsnew_infos_t", goods_info_div);
            var goods_new_p = $("p.goodsnew_name", goods_info_t_div);
            var goods_link = $("a", goods_new_p)[0];

            var goods_name = goods_link.children[0].data;
            var goods_href = goods_link.attribs["href"];
            var temp = goods_href.replace("http://", "");
            var goods_href_parts = temp.split("/");
            var goods_host = goods_href_parts[0];
            var goods_path = "/" + goods_href_parts[1];
            
            var link = {
                name: goods_name,
                href: goods_href,
                host: goods_host,
                path: goods_path,
                page: 1
            };
            // request goods
            that.wgetGoods(link);
        });

    }else{
        // 服饰鞋包
        var li_arr_new = $("li.s_mod");
        var li_arr_new_len = li_arr_new.length;

        that.writeLog(args[0].name + " 专场数量(最新上架) " + li_arr_new_len);
        
        var process_each_li = function(i, li)
        {
            var div = $("div", li)[0];
            var a = $("a", div)[0];
            var img = $("img", a)[0];
            var goods_name = img.attribs["alt"];
            var goods_href = a.attribs["href"];
            var temp = goods_href.replace("http://", "");
            var goods_href_parts = temp.split("/");
            var goods_host = goods_href_parts[0];
            var goods_path = "/" + goods_href_parts[1];
            
            var link = {
                name: goods_name,
                href: goods_href,
                host: goods_host,
                path: goods_path,
                page: 1    
            };
            // request goods
            that.wgetGoods(link);
        };

        li_arr_new.each(process_each_li);

        // 解析异步加载的js数据
        var scriptDom_arr = $('script[type="text/javascript"]');
        scriptDom_arr.each(function(i, scriptDom){
            var ScriptStr = scriptDom.children[0] ? scriptDom.children[0].data : null;
            if(!ScriptStr){
                return;    
            }
            var idx_start = ScriptStr.indexOf("var label = [");
            if(idx_start < 0)
            {
                return;
            }else{
              
                var idx_end = ScriptStr.indexOf("];", idx_start);
                if(idx_end < 0){
                    return;    
                }
                var list_info_str = ScriptStr.substring(idx_start + 12, idx_end + 1);
                
                //list_info_str = list_info_str.replace(/\'/g, '"');
                //list_info_str = list_info_str.replace(/\\/g, '\\\\');
                try{
                    var list_info_arr = JSON.parse(list_info_str);
                    for(var idx = 0; idx < list_info_arr.length; idx++)
                    {
                        var list_info = list_info_arr[idx];
                        var temp = list_info["link"].replace("http://", "");
                        var goods_href_parts = temp.split("/");
                        var goods_host = goods_href_parts[0];
                        var goods_path = "/" + goods_href_parts[1];

                         var link = {
                            name: list_info["name"],
                            href: list_info["link"],
                            host: goods_host,
                            path: goods_path,
                            page: 1    
                        };
                        // request goods
                        that.wgetGoods(link);
                    }
                }
                catch(e){
                    that.writeLog(e.message);
                }  
            }
            
        });
    }

/*
    if(args[0].pageCount==undefined){
	    var total = $("div.ct p:last-child").eq(0).text().match(/\d+/);
	    var pageCount = Math.ceil(total/10);
	    args[0].pageCount = pageCount;
    }
    if(args[0].pageIdx == undefined){
	    args[0].pageIdx = 1;
    }
    if(args[0].pageCount == args[0].pageIdx){
	    fs.appendFileSync(this.resultDir+this.doneFile,args[0].d.cname+'-'+args[0].a.cname+'\r\n');
    }
    args[0].pageIdx++;
    //    setTimeout(function(){
    //	that.wgetList(args[0]);
    //    },(Math.random()*3+20)*1000);
    this.wgetList(args[0]);
        
    while(args[0].pageIdx<args[0].pageCount){
	args[0].pageIdx++;
	setTimeout(function(){
	    that.wgetList(args[0]);
	},2000);
    }
    */
}

VIPSale.prototype.processList_2014_8 = function(data,args){
    if(Buffer.byteLength(data) < 1000){
	    that.writeLog("current ip has been forbidden.");
	    setTimeout(function(){
	        that.wgetList(args[0]);
	    },sleepTime);
	    sleepCount++;
	    sleepTime*=sleepCount+1;
	    return;
    }else{
	    sleepTime = 2400000;
	    sleepCount = 0;
    }
    that.reqGoodsDelay = 0;

    var $ = cheerio.load(data);
    var sb = new helper.StringBuffer();
    var li_arr = $("li.sales_item");
    var li_arr_len = li_arr.length;
    if(li_arr_len > 0){
        that.writeLog(args[0].name + " 专场数量 " + li_arr_len );
        that.parsedGoodsPages += li_arr_len;
        
        li_arr.each(function(i,li){
            
            var goods_info_div = $("div.sales_infos", li)[0];
            var goods_new_p = $("p.sales_name", goods_info_div)[0];
            var goods_link = $("a", li)[0];

            var goods_name = goods_new_p.children[0].data;
            var goods_href = goods_link.attribs["href"];
            goods_href = goods_href.replace("http://", "");
            var goods_href_parts = goods_href.split("/");
            var goods_host = goods_href_parts[0];
            if(goods_host == ""){
                goods_host = "www.vip.com";    
                goods_href = goods_host + goods_href;
            }
            var goods_path = "/" + goods_href_parts[1];
            
            var link = {
                name: goods_name,
                href: goods_href,
                host: goods_host,
                path: goods_path,
                page: 1
            };
            // request goods
            that.wgetGoods(link, true);
        });
    }

    // 服饰鞋包
    var li_arr_new = $("li.s_mod");
    var li_arr_new_len = li_arr_new.length;

    that.writeLog(args[0].name + " 专场数量(最新上架) " + li_arr_new_len);
    that.parsedGoodsPages += li_arr_new_len;
        
    var process_each_li = function(i, li)
    {
        var div = $("div", li)[0];
        var a = $("a", div)[0];
        var img = $("img", a)[0];
        var goods_name = img.attribs["alt"];
        var goods_href = a.attribs["href"];
        goods_href = goods_href.replace("http://", "");
        var goods_href_parts = goods_href.split("/");
        var goods_host = goods_href_parts[0];
        if(goods_host == ""){
            goods_host = "www.vip.com";   
            goods_href = goods_host + goods_href;
        }
        var goods_path = "/" + goods_href_parts[1];
            
        var link = {
            name: goods_name,
            href: goods_href,
            host: goods_host,
            path: goods_path,
            page: 1    
        };
        // request goods
        that.wgetGoods(link, true);
    };

    li_arr_new.each(process_each_li);

    // 最后疯抢
    var li_arr_last = $("li.s1_mod");
    var li_arr_last_len = li_arr_last.length;

    li_arr_new.each(process_each_li);

    // 解析异步加载的js数据
    var scriptDom_arr = $('script[type="text/javascript"]');
    scriptDom_arr.each(function(i, scriptDom){
        var ScriptStr = scriptDom.children[0] ? scriptDom.children[0].data : null;
        if(!ScriptStr){
            return;    
        }
        var idx_start = ScriptStr.indexOf("var label = [");
        if(idx_start < 0)
        {
            return;
        }else{
              
            var idx_end = ScriptStr.indexOf("];", idx_start);
            if(idx_end < 0){
                return;    
            }
            var list_info_str = ScriptStr.substring(idx_start + 12, idx_end + 1);
                
            //list_info_str = list_info_str.replace(/\'/g, '"');
            //list_info_str = list_info_str.replace(/\\/g, '\\\\');
            try{
                var list_info_arr = JSON.parse(list_info_str);
                that.parsedGoodsPages += list_info_arr.length;
                for(var idx = 0; idx < list_info_arr.length; idx++)
                {
                    var list_info = list_info_arr[idx];
                    var goods_href = list_info["link"];
                    var temp = goods_href.replace("http://", "");
                    var goods_href_parts = temp.split("/");
                    
                    var goods_host = goods_href_parts[0];
                    if(goods_host == ""){
                        goods_host = "www.vip.com";   
                        goods_href = goods_host + goods_href;
                    }
                    var goods_path = "/" + goods_href_parts[1];

                        var link = {
                        name: list_info["name"],
                        href: goods_href,
                        host: goods_host,
                        path: goods_path,
                        page: 1    
                    };
                    // request goods
                    that.wgetGoods(link, true);
                }
            }
            catch(e){
                that.writeLog(e.message);
            }  
        }   
    });

/*
    if(args[0].pageCount==undefined){
	    var total = $("div.ct p:last-child").eq(0).text().match(/\d+/);
	    var pageCount = Math.ceil(total/10);
	    args[0].pageCount = pageCount;
    }
    if(args[0].pageIdx == undefined){
	    args[0].pageIdx = 1;
    }
    if(args[0].pageCount == args[0].pageIdx){
	    fs.appendFileSync(this.resultDir+this.doneFile,args[0].d.cname+'-'+args[0].a.cname+'\r\n');
    }
    args[0].pageIdx++;
    //    setTimeout(function(){
    //	that.wgetList(args[0]);
    //    },(Math.random()*3+20)*1000);
    this.wgetList(args[0]);
        
    while(args[0].pageIdx<args[0].pageCount){
	args[0].pageIdx++;
	setTimeout(function(){
	    that.wgetList(args[0]);
	},2000);
    }
    */
}

VIPSale.prototype.processGoods = function(data,args){
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

    that.goodsPageResponses += 1;
    that.writeLog("Response 专场 " + args[0].name + " " + args[0].path + " Res: " + that.goodsPageResponses);

    // 每一行商品
    var pro_list = $("div.pro_list");
    if(pro_list.length > 0)
    {
        // 专场商品数
        var class_ul = $("div.pro_sortbarAll > ul")[0];
        var first_li = $("li", class_ul)[0];
        var pro_num = "";
        pro_num = first_li.children && first_li.children[0] && first_li.children[0].children && first_li.children[0].children[0].data;
        pro_num.replace("全部(", "");
        pro_num.replace(")", "");
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
                var img_href = img.attribs['src'];
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

                that.writeProducts += 1;
                that.writeLog("Record No : " + that.writeProducts);
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
                        var sb = new helper.StringBuffer();
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

                        that.writeProducts += 1;
                        that.writeLog("Record No : " + that.writeProducts);
                    }
                }
                catch(e){
                    that.writeLog(e.message);
                } 
            }
        });
        
        var a_pageNext = $("a#J_nextPage_link")[0];
        if(a_pageNext)
        {
            var path_pageNext = a_pageNext.attribs["href"];
            args[0].href = args[0].host + path_pageNext;
            args[0].path = path_pageNext;
            args[0].page = args[0].page + 1;

            that.parsedGoodsPages += 1;

            that.wgetGoods(args[0]);
        }
    }else{
        pro_list = $("ul.pnew_list");
        
        pro_list.each(function(i,ul){
            var page_mode_div = ul.prev;
            var page_total_span = $("span.page_total", page_mode_div)[0];
            var pro_num = "";
            if(page_total_span)
            {
                pro_num = page_total_span.children[0].data;
            }

            var li_arr = $("li", this);
            var li_arr_len = li_arr.length;
            for(var i = 0; i < li_arr_len; i++)
            {
                var sb = new helper.StringBuffer();

                var li = li_arr[i];
                var a = $("p > a", li)[0];
                var img = $("img", a)[0];
                if(!img){
                    continue;
                }
                var img_href = img.attribs['src'];
                var img_href_parts = img_href.split('/');
                var file_name = img_href_parts[img_href_parts.length - 1];
                var file_name_parts = file_name.split('-');
                var file_name_parts_len = file_name_parts.length;
                var pro_code = '';
                var pro_code_start_idx = file_name_parts_len > 2 ? 1 : 0;
                for(var j = pro_code_start_idx; j < file_name_parts.length - 1; j++)
                {
                    if(j > 1 && file_name_parts.length > 3 )
                    {
                        pro_code += '-'
                    }
                    pro_code += file_name_parts[j];
                }

                var info_div = $("div.pnl_info", li)[0];
                var title_p = $("p.pnl_info_tit", info_div)[0];
                var info_a = $("a", title_p)[0];
                var pro_name = "";
                if(info_a)
                {
                    pro_name = info_a.attribs['title'];
                }

                var price = "";
                var price_sale = "";

                var price_p = title_p ? title_p.next : null;
                if(price_p)
                {
                    var price_sale_span = $('span', price_p)[0];
                    var price_sale_em = $('em', price_sale_span)[0];
                    if(price_sale_em)
                    {
                        var pro_price_sale = price_sale_em.children[0].data;
                        price_sale = pro_price_sale.split(';')[1];
                    }
                    var price_del = $('del', price_p)[0];
                    if(price_del)
                    {
                        var pro_price = price_del.children[0].data;
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

                that.writeProducts += 1;
                that.writeLog("Record No : " + that.writeProducts);
            }
        });
    }
    
    
   
    /*
    if(args[0].pageCount==undefined){
	    var total = $("div.ct p:last-child").eq(0).text().match(/\d+/);
	    var pageCount = Math.ceil(total/10);
	    args[0].pageCount = pageCount;
    }
    if(args[0].pageIdx == undefined){
	    args[0].pageIdx = 1;
    }
    if(args[0].pageCount == args[0].pageIdx){
	    fs.appendFileSync(this.resultDir+this.doneFile,args[0].d.cname+'-'+args[0].a.cname+'\r\n');
    }
    args[0].pageIdx++;
    //    setTimeout(function(){
    //	that.wgetList(args[0]);
    //    },(Math.random()*3+20)*1000);
    this.wgetList(args[0]);
        
    while(args[0].pageIdx<args[0].pageCount){
	args[0].pageIdx++;
	setTimeout(function(){
	    that.wgetList(args[0]);
	},2000);
    }*/
    
}

// 处理抓取到得主页
VIPSale.prototype.processHome = function(data){
    if(Buffer.byteLength(data) < 1000)
    {
	    this.writeLog("current ip has been forbidden.");
    	return;
    }else
    {
	    sleepTime = 2400000;
	    sleepCount = 0;
    }
    var $ = cheerio.load(data);
    var li_arr = $("ul.header_snav > li");
    var li_arr_len = li_arr.length;
    if(li_arr_len == 0)
    {
        that.writeLog("cannot find valid links on home page: try again...");
        that.wgetHome();
        return;
    }

    var addr_arr = [
        //"www.vip.com/cloth", // 2014-07 for 服饰鞋包专场
        "vip.com/?vip_from=1", // 2014-08 for 服饰鞋包专场
        "beauty.vip.com",
        "kid.vip.com",
        "home.vip.com"
        ];
    for(var i = 0; i < addr_arr.length; i++){
        var addr = addr_arr[i];
        var addr_parts = addr.split("/");
        var host = addr_parts[0];
        var path = addr_parts[1];
        if(!path){
            path = "/"    
        }else{
            path = "/" + path + "/?f=3";   
        }
        var link = {
            name: addr,
            href: addr,
            host: host,
            path: path
        };
        that.wgetList(link);     
    }
    /*
    li_arr.each(function(i,li){
	    var a = $('a',this);
        var a_name = a.html();
        var a_Href = a.attr("href");
        
        var a_children = a.children();
        if(a_children.length)
        {
            var span = a_children[0];
            a_name = span.children[0].data;
        }
        
        switch(a_name)
        {
            case "服饰鞋包":
            case "美妆特卖":
            case "亲子特卖":
            case "居家特卖":
                var host = a_Href.replace("http://", "");
                var host = host.replace("/", "");
                var path = "/";
                var link = {
                    name: a_name,
                    href: a_Href,
                    host: host,
                    path: path
                };
                that.wgetList(link);
                break;
            default:
                break;
        }
    });
    */
    //this.wgetList(args[0]);

}

VIPSale.prototype.wgetHome = function(){
    this.writeLog("GET www.vip.com");

    var opt = new helper.basic_options(this.ADDR_VIP,'/','GET',false,false,null);
    opt.agent=false;

    helper.request_data(opt,null,this.processHome,null);
}

VIPSale.prototype.wgetList = function(link){
    /*
    if(!f || f.pageIdx>f.pageCount){
	    if(this.todoFlights.length==0) 
            return;
	    f = this.todoFlights.pop();
    }*/
    if(!link)
    {
        this.writeLog("wgetList:  invalid link");
        return;
    }
    
    //var query = new this.qunarQuery(f.d.cname,f.a.cname,f.pageIdx);
    var opt = new helper.basic_options(link.host, link.path, 'GET', false, false, null);
    opt.agent=false;
    //helper.request_data(opt, null, this.processList, link);
    setTimeout(function(){
        that.writeLog("GET " + link.href);
        helper.request_data(opt, null, that.processList_2014_8, link);
    }, that.reqListDelay);
    that.reqListDelay += list_delay_unit;
    //helper.request_data(opt, null, this.processList_2014_8, link);
}

VIPSale.prototype.wgetGoods = function(link, bDelay){
    if(!link)
    {
        this.writeLog("wgetGoods: invalid link");
        return;
    }
    
    
    var opt = new helper.basic_options(link.host, link.path, 'GET', false, false, null);
    opt.agent=false;

    that.goodsPageReqDelay += 1;
    if(bDelay)
    {
        setTimeout(function(){
            that.goodsPageRequests += 1;
            that.writeLog("GET 专场 " + link.name + " " + link.href + " Req: " + that.goodsPageRequests + " Parsed: " + that.parsedGoodsPages + " Sent+Delay: " + that.goodsPageReqDelay);
	        helper.request_data(opt, null, that.processGoods, link);
	    },that.reqGoodsDelay);
        that.reqGoodsDelay += goods_delay_unit;
    }
    else{
        that.goodsPageRequests += 1;
        that.writeLog("GET 专场 " + link.name + " " + link.href + " Req: " + that.goodsPageRequests + " Parsed: " + that.parsedGoodsPages + " Sent+Delay: " + that.goodsPageReqDelay);
        helper.request_data(opt, null, this.processGoods, link);
    }
}

var instance = new VIPSale();
var that = instance;
instance.start();