var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')

function Mogujie() {
    this.resultDir = '../../result/';
    this.breakpointDir = '../../log/breakpoint/';
    this.dealidFile = "";
    this.itemFile = '';
    this.shopFile = '';
}

Mogujie.prototype.init = function(){
    var arguments = process.argv.splice(2);
    this.name = arguments[0];
    this.dealidFile = 'mogujie.' + this.name + '.dealid.txt';
    this.breakpointFile = 'mogujie.' + this.name + '.js.breakpoint';
    this.itemFile = 'mogujie.' + this.name + '.item.txt';
    this.shopFile = 'mogujie.' + this.name + '.shop.txt';
    var start = Number(arguments[1]);
    var len = Number(arguments[2]);

    this.breakpoint = '';
    if(fs.existsSync(this.breakpointDir+this.breakpointFile)) {
        var lines = fs.readFileSync(this.breakpointDir+this.breakpointFile).toString().split('\n');
        for(var i = 0, l = lines.length; i < l; i++) {
            if(lines[i]) {
                this.breakpoint = lines[i];
            }
        }
    }
    console.log(this.breakpoint);
    //load dealid file
    this.tasks = [];
    var lines = fs.readFileSync(this.resultDir+this.dealidFile).toString().split('\n');
    for(var i = 0, l = lines.length; i < l; i++) {
        if(lines[i]) {
            var vals = lines[i].split(',');
            this.tasks.push({"dealid":vals[0],"sale_num":vals[1],"create_time":vals[2]});
        }
    }

    //前闭后开区间
    this.tasks = this.tasks.slice(start,start+len);
    console.log("[INFO] task count: %d",this.tasks.length);
}

Mogujie.prototype.start = function(){
    this.init();
    this.wgetItemHtml();
}

Mogujie.prototype.wgetItemHtml = function(t){
    if(this.tasks.length==0){
        console.log("job done.");
        return;
    }
    while(!t&&this.tasks.length>0){
	t = this.tasks.shift();
    }
    
    if(!t){
	return;
    }
    
    while(this.breakpoint && t.dealid != this.breakpoint) {
        t = this.tasks.shift();
    }
    this.breakpoint = '';
    
    console.log('task left: %d', this.tasks.length);
    
    var opt = new helper.basic_options("shop.mogujie.com", "/detail/" + t.dealid);
    opt.agent = false;
    console.log("[GET dealid:] %s", t.dealid);
    fs.writeFileSync(that.breakpointDir+that.breakpointFile,t.dealid+'\n');
    helper.request_data(opt,null,function(data,args,res){
    	that.getFirstDealPage(data,args,res);
    },t);
}

Mogujie.prototype.getFirstDealPage = function(data,args,res) {
    t = args[0];
    if(!data) {
        console.log("item data empty");
        setTimeout(function () {
            that.wgetItemHtml();
        }, (Math.random() * 1 + 2) * 1000);
    } else {
        //var opt = new helper.basic_options("shop.mogujie.com","/trade/item_detail/orderlist?itemId="+t.dealid+"&page=1","POST",0,1,{"isNewDetail": 1});
        var opt = new helper.basic_options("shop.mogujie.com","/trade/item_detail/orderlist?itemId="+t.dealid+"&page=1&isNewDetail=1");
        opt.agent = false;
        t.data = data;
        helper.request_data(opt,null,function(data1,args,res){
            that.getFirstDealRecord(data1,args,res);
        },t);
    }
}

Mogujie.prototype.getFirstDealRecord = function(data,args,res) {
    t = args[0];
    if(!data || data[0] != '{') {
        console.log("first deal page data empty");
        t.first_deal_time = '';
        that.processData(t);
    } else {
        var deal_info = JSON.parse(data);
        var result = deal_info['result'];
        var deal_total_num = parseInt(result['count'])||0;
        if(deal_total_num == 0) {
            t.first_deal_time = '';
            that.processData(t);
        } else {
            var page_total = Math.ceil(deal_total_num / 15);
            if(page_total == 1) {
                if(result && "html" in result) {
                    html = result['html'];
                    var $ = cheerio.load(html);
                    t.first_deal_time = $("td.date-s").last().text();
                } else
                    t.first_deal_time = '';
                that.processData(t);
            } else {
                //var opt = new helper.basic_options("shop.mogujie.com","/trade/item_detail/orderlist?itemId="+t.dealid+"&page="+page_total.toString());
                var opt = new helper.basic_options("shop.mogujie.com","/trade/item_detail/orderlist?itemId="+t.dealid+"&page="+page_total.toString()+"&isNewDetail=1");
                opt.agent = false;
                helper.request_data(opt,null,function(data1,args,res){
                    that.parseFirstDealTime(data1,args,res);
                },t);
            }
        }
    }
}

Mogujie.prototype.parseFirstDealTime = function(data,args,res) {
    t = args[0];
    if(!data || data[0] != '{') {
        console.log("first deal record data empty");
        t.first_deal_time = '';
        that.processData(t);
    } else {
        var deal_info = JSON.parse(data);
        var result = deal_info['result'];
        if(result && "html" in result) {
            html = result['html'];
            var $ = cheerio.load(html);
            t.first_deal_time = $("td.date-s").last().text();
        } else
            t.first_deal_time = '';
        that.processData(t);
    }
}

Mogujie.prototype.processData = function(t){
    if(!t.data){
        console.log("data empty.");
        setTimeout(function () {
            that.wgetItemHtml();
        }, (Math.random() * 1 + 2) * 1000);
    } else {
        var $ = cheerio.load(t.data);

        var div = $("div.goods-info-box");
        var item_id = t.dealid;
        var item_title = $("h1.goods-title",div).text().replace(/[\n\r,，]/g,";");
        var item_price = $("#J_NowPrice").text()||$("p.price.fl span.price-n",div).text();
        var item_sale_num = t.sale_num;
        var item_category = this.name;
        var item_create_time = t.create_time;
        var item_first_deal_time = t.first_deal_time;

        var shop = $("div.header.clearfix");
        var shop_url = $("div.shop-name.fl span a", shop).attr("href");
        var shop_name = $("div.shop-name.fl span a", shop).text();

        var shop_info = $("div.shop-info.clearfix");
        var shop_region = $("div.info-box.fl ol.li.li3 li",shop_info).eq(0).text().replace(/[所在地区："]/g, '');
        var shop_product_num = $("div.info-box.fl ol.li.li3 li",shop_info).eq(1).text().replace(/[商品数量："]/g, '');
        var shop_sale_num = $("div.info-box.fl ol.li.li3 li",shop_info).eq(2).text().replace(/[销售量："]/g, '');
        var shop_create_time = $("div.info-box.fl ol.li.li3 li",shop_info).eq(3).text().replace(/[创建时间："]/g, '');

        var shop_deliver_time = $("ol.li.li4 li span",shop_info).eq(0).text()
        var shop_return_rate = $("ol.li.li4 li span",shop_info).eq(1).text()

        var item = [item_id,item_price,item_sale_num,item_category,shop_url,item_create_time,item_first_deal_time,item_title,"\n"].join();
        var shop = [shop_url,shop_name,shop_region,shop_product_num,shop_sale_num,shop_create_time,shop_deliver_time,shop_return_rate,"\n"].join();
        if(item_title && shop_url) {
            fs.appendFileSync(that.resultDir+that.itemFile,item);
            fs.appendFileSync(that.resultDir+that.shopFile,shop);
        }

        setTimeout(function () {
            that.wgetItemHtml();
        }, 0);
    }
}

var instance = new Mogujie();
var that = instance;
that.start();
