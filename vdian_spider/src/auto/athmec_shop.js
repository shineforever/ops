var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')
var url = require('url')
var Crawler = require("crawler")

var Dealer = function(){
    this.resultDir = "../../result/auto/";
    this.dataDir = '../../appdata/';
    this.resultFile = "athmec_shop_"+new Date().toString()+".txt";
    this.progressFile = "athmec_progress_"+new Date().toString()+".txt";
    this.done = {};
    this.curPageIdx = 1;
    this.cities = [];
    this.shops = [];
    this.items = [];
}
//http://deal.autohome.com.cn/china/?k=2, 综合经销商

Dealer.prototype.init = function(){
    if(fs.existsSync(this.resultDir+this.progressFile)){
	fs.readFileSync(this.resultDir+this.progressFile).toString().split('\n').reduce(function(pre,cur){
	    if(cur){
		pre[cur]=true;
	    }
	    return pre;
	},this.done);
    }
    this.getCity();
}

Dealer.prototype.getCity = function(){
    var opt = new helper.basic_options("mall.autohome.com.cn","/home/changecity");
    helper.request_data(opt,null,function(data,args,res){
	if(!data){
	    console.log("[ERROR] error while getting city list.");
	    setTimeout(function(){
		that.getCity();
	    },20000);
	    return;
	}
	var $ = cheerio.load(data);
	$(".city-main-list a.point").each(function(){
	    var path = $(this).attr("href");
	    var name = $(this).text().trim();
	    that.cities.push({"name":name,"path":path});
	});
	console.log("[INFO] city count:%d",that.cities.length);
	that.wgetList();
    });
}

Dealer.prototype.start = function(){
    this.init();
    //this.wgetList();
}

Dealer.prototype.wgetList = function(){
    var host = "mall.autohome.com.cn";
    var path = "/home/changecity";
    var c = null;
    do{
	c = this.cities.shift();
    }
    while(c&&this.done[c.name] && this.cities.length);
    if(!c){
	console.log("[DONE] job done.");
	return;
    }
    var q = url.parse("http://mall.autohome.com.cn"+c.path,true).query;
    var opt = new helper.basic_options(host,path,'GET',false,false,q);
    opt.agent = false;
    console.log("[GET ] %s",c.name);
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    },c);
}

Dealer.prototype.processList = function(data,args,res){
    if(!data){
	console.log("[ERROR] data empty");
	setTimeout(function(){
	    that.wgetList();
	},3000);
	return;
    }
    var $ = cheerio.load(data);
    //var records = [""];
    
    $("ul.card-list li.card a").each(function(){
	var name = $("h2",this).text().trim();
	name = name && name.replace(/\s/g,'');
	var price = $("strong.promotion-bigcard-price",this).text().trim();
	if(price)
	    return;
	that.shops.push({url:$(this).attr("href"),page:1,city:$("#AreaCity_x").val(),items:[]});
	/*
	var delta = $("strong.promotion-bigcard-info",this).text().trim();
	var matches = $("p.promotion-bigcard-leftnumber",this).eq(0).text().match(/\d+/);
	var leftCount = matches && matches[0];
	var leftTime = $("label.mallTimer",this).attr("data-seconds");
	var started = true;
	if(!leftTime){
	    leftTime = $("p.promotion-bigcard-lefttime label",this).text();
	    started = false;
	}
	var promo = $("div.promotion-bigcard-footer",this).text().trim();
	promo = promo && promo.replace(/[\s]/g,'');
	var record = [args[0].name,name,price,delta,leftCount,leftTime,promo,started?"Y":"N"].join('\t');
	console.log(record);
	records.push(record);*/
    });
    
    //fs.appendFileSync(this.resultDir+this.resultFile,records.join('\n'));
    //fs.appendFileSync(this.resultDir+this.progressFile,this.curPageIdx+"\n");
    //var nextPage = $("div.page a").last();
    //var nextPageClass = nextPage && nextPage.attr('class');
    //if(nextPageClass && nextPageClass.indexOf("page-disabled")>-1){
	//no more pages.
        //console.log("[DONE]job done");
	//return;
    //}else{
//	this.curPageIdx++;
//    }
    this.wgetShop();
}

Dealer.prototype.wgetShop = function(shop){
    if(!shop){
	if(this.shops.length==0){
	    this.wgetList();
	    return;
	}
	shop = this.shops.pop();
    }
    var urlObj = url.parse(shop.url);
    
    console.log("[GET] shop: %s",shop.url);
    var opt = new helper.basic_options(urlObj.host,urlObj.pathname,"POST",false,false,{cityId:shop.city,pageNum:shop.page});
    helper.request_data(shop.url,null,function(data,args,res){
	that.processShop(data,args,res);
    },shop);
}

Dealer.prototype.processShop = function(data,args,res){
    if(!data){
	console.log("empty");
	this.wgetDetail(args[0]);
	return;
    }
    var $ = cheerio.load(data);
    
    $("ul.pop-index-list li a").each(function(){
	args[0].items.push($(this).attr("href"));
    });
    console.log("[DATA] %d items.",args[0].items.length);
    var nextPage = Number($(".businessl-sub a.active").next().text());
    console.log(nextPage);
    if(isNaN(nextPage) || nextPage <= args[0].page){
	args[0].end=true;
    }else{
	args[0].end=false;
	++args[0].page;
    }
    
    this.wgetDetail(args[0]);
}

Dealer.prototype.wgetDetail = function(shop){
    if(shop.items.length==0){
	if(shop.end){
	    this.wgetShop();
	}else{
	    this.wgetShop(shop);
	}
	return;
    }
    var item = shop.items.pop();
    
    console.log("[GET] detail: %s",item);
    helper.request_data(item,null,function(data,args,res){
	that.processDetail(data,args,res);
    },shop);
}
Dealer.prototype.processDetail = function(data,args,res){
    if(!data){
	console.log("empty");
	this.wgetDetail(args[0]);
	return;
    }
    var $ = cheerio.load(data);
    
    var brand = $("div.auto-introduction-left h2").text().trim();
    var tit = $("div.auto-introduction-right h3").text().trim();
    var li = $("#car-model li");
    
    var shopPrice = li.attr("shopprice");
    var origPrice = li.attr("origprice");
    var prePay = li.attr("prepay");
    var marketPrice = li.attr("marketprice");
    //console.log(res);
    var r = [brand,tit,shopPrice,origPrice,prePay,marketPrice,res.req.path].join("\t");
    console.log(r);
    fs.appendFileSync(that.resultDir+that.resultFile,r+"\n");
    setTimeout(function(){
	that.wgetDetail(args[0]);
    },0);
}

var instance = new Dealer();
var that = instance;
instance.start();