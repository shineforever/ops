var helper = require('../../helpers/webhelper.js')
var fs = require('fs')
var url = require('url')
var cheerio = require('cheerio')
var path = require('path')
var Crawler = require("crawler")

function Worker(){
    this.resultDir = "../../result/vertical/";
    this.dataDir = '../../appdata/';
    this.resultFile = "jumei-meizhuang.txt";
    //this.progressFile = "bitadealer_progress_"+new Date().toString()+".txt";
    this.done = {};
    this.tasks = [];
    this.today = new Date().toString();
    this.crawler = new Crawler({maxConnections:1,callback:this.processCategory});
    this.categories = [{"url":"http://mall.jumei.com/products/0-1-0-11-1.html?from=mall_null_list_left_cate_null&lo=3434&mat=27051","name":"护肤"},
		       {"url":"http://mall.jumei.com/products/0-3-0-11-1.html?from=mall_null_list_left_cate_null&lo=3434&mat=27051","name":"彩妆"},
		       {"url":"http://mall.jumei.com/products/0-34-0-11-1.html?from=mall_null_list_left_cate_null&lo=3434&mat=27051","name":"香氛"},
		       {"url":"http://mall.jumei.com/products/0-21-0-11-1.html?from=mall_null_list_left_cate_null&lo=3434&mat=27051","name":"身体护理"},
		       {"url":"http://mall.jumei.com/products/0-0-65-11-1.html?from=mall_null_list_left_cate_null&lo=3434&mat=27051","name":"男士专区"}];
}

Worker.prototype.processCategory = function(error,result,$){
    if(error){
	console.log(error);
	that.crawler.queue(result.uri);
	return;
    }
    
    //var $ = cheerio.load(data);
    var catename = $(".search_filter_top strong span").text().trim();
    console.log("[INFO] got category: %s",catename);
    $("#filter_brand ul li a").each(function(){
	if(!$(this).attr('href')) return;
	that.tasks.push({
	    'url':$(this).attr('href'),
	    'brand':$(this).text().trim(),
	    'c':catename
	});
    });
    that.categories.shift();
    if(0==that.categories.length){
	setTimeout(function(){that.wgetList();},0);
    }    
}

Worker.prototype.check = function(){
    if(!fs.existsSync(this.resultDir)){
	fs.mkdir(this.resultDir,function(error){
	    if(error){
		console.log(error);
		return false;
	    }
	});
    }
    return true;
}

Worker.prototype.init = function(){
    if(!this.check()){
	process.exit(1);
    }
    if(!fs.existsSync(this.resultDir+this.resultFile)){
	fs.appendFileSync(this.resultDir+this.resultFile,['URL','商品编号','标题','价格','折扣','品牌','分类','规格','是否特卖','是否抢光','购买人数','结束日期','\n'].join('\t'));
    }
}

Worker.prototype.start = function(){
    this.init();
    this.wget();
}

Worker.prototype.wget = function(){
    var doneCategories = 0;
    this.categories.forEach(function(cate){
	that.crawler.queue(cate.url);
	//var opt = new helper.basic_options("pop.jumei.com",cate.path);
	//helper.request_data(cate.url,null,,cate);
    });
}

Worker.prototype.wgetList = function(t){
    if(!t){
	if(this.tasks.length==0){
	    console.log("[INFO] job done.");
	    return;
	}
	t = this.tasks.shift();
	t.pageIdx = 1;
    }
    
    console.log("[INFO] %s GET: %s,%d/%d",new Date().toDatetime(),t.brand,t.pageIdx,t.total);
    //var opt = new helper.basic_options("pop.jumei.com","/ajax_details-"+promoId+"-"+t.pageIdx+"-sales_desc-0-0.html","GET",false,true);
    helper.request_data(t.url,null,function(data,args,res){
	that.processList(data,args,res);
    },t);
}

Worker.prototype.processList = function(data,args,res){
    if(!data){
	console.log("[ERROR] %s data empty.",new Date().toDatetime());
	this.wgetList(args[0]);
	return;
    }
    var $ = cheerio.load(data);
    if(!args[0].total){
	var lastli = $("ul.page-nav li").last();
	if(0 == lastli.length){
	    args[0].total = 1;
	}else{
	    args[0].total = Number(lastli.prev().text().trim());
	}
    }
    if(args[0].pageIdx<args[0].total){
	args[0].url = $("ul.page-nav li.current").next().find("a").attr('href');
    }
    
    var records = [""];
    args[0].products = [];
    args[0].done=[""];
    $("div.products_wrap>ul>li").each(function(){
	var id = $(this).attr('pid');
	var link = $("div.s_l_name a",this);
	var title = link.text().trim();
	var m = title.match(/[\d一二三四五六七八九十两]+(\.\d)?(mg|g|ml|l|kg|个|块|张|片|包|袋|瓶|盒|对|只|支|抽|枚|根|回|件套|件|套|克|毫升|升|cc|粒)(\*\d)?/gi);
	var unit = m && m.join();
	title = title && title.replace(/[\s\t]/g,'');
	var url = link.attr('href');
	var price = $("div.search_list_price>span",this).text().trim();
	var discount = $("div.s_l_name a span.disc",this).text().trim();
	discount = discount && discount.replace(/[\(\)\s\/\+包邮]/g,'') || '无';
	var prod = [that.today,url,id,title,price,discount,args[0].brand,args[0].c,unit];
	
	if( $("div.s_l_onsale",this).length > 0 ){// just a product. not a deal.
	    prod.push("Y");
	    prod.push('N');
	    //args[0].products.push(prod);
	    var matches = $(".search_pl",this).text().match(/\d+/);
	    var num = matches && matches[0];
	    var delta = Number($(".time_countdown",this).attr("diff"))*1000;
	    var end = new Date(delta + (new Date().getTime())).toString();
	    prod.push(num);
	    prod.push(end);
	}else{
	    if(0 < $("div.qiang_guang",this).length){
		prod.push("Y");
		prod.push('Y');
	    }else{
		prod.push("N");
		prod.push("N/A");
	    }
	}
	records.push(prod.join('\t'));
    });
    fs.appendFileSync(this.resultDir+this.resultFile,records.join('\n'));
    console.log("[INFO] %s,%d/%d done.",args[0].brand,args[0].pageIdx,args[0].total);
    if(args[0].products.length>0){
	console.log("[INFO] mall deal starting, total :%d",args[0].products.length);
	this.wgetDetail(args);
    }else if(args[0].pageIdx<args[0].total){
	++args[0].pageIdx;
	this.wgetList(args[0]);
    }else{
	console.log("[INFO] %s done.",args[0].brand);
	this.wgetList();
    }
}

Worker.prototype.wgetDetail = function(args,p){
    if(!p && args[0].products.length>0){
	p = args[0].products.shift();
    }
    if(!p){
	console.log("[INFO] %s brand %s of %d/%d complete.",new Date().toDatetime(),args[0].brand,args[0].pageIdx,args[0].total);
	if(args[0].done.length>1){
	    fs.appendFileSync(this.resultDir+this.resultFile,args[0].done.join('\n'));
	}
	if(args[0].pageIdx<args[0].total){
	    ++args[0].pageIdx;
	    this.wgetList(args[0]);
	}else{
	    console.log("[INFO] %s %s done.",new Date().toDatetime(),args[0].brand);
	    this.wgetList();
	}
    }else{
	if(!p[1]){
	    this.wgetDetail(args);
	    return;
	}
	args.push(p);
	console.log("[INFO] %s GET %s",new Date().toDatetime(),p);
	helper.request_data(p[1],null,function(data,a){
	    var r = that.processDetail(data,a)
	    if(r){
		args[0].done.push(r.join('\t'));
		that.wgetDetail(a);
	    }
	},args);
    }
}

Worker.prototype.processDetail = function(data,args){
    var p = args.pop();
    if(!data){
	console.log("[ERROR] data empty.");
	this.wgetDetail(args,p);
	return;
    }
    var $ = cheerio.load(data);
    var buyCount = $(".newdeal_right_timer div p span").text().trim();
    var delta = Number($("#time_left").val())*1000;
    var end = new Date(delta+(new Date().getTime())).toString();
    p.push(buyCount,end);
    return p;
}

var that = new Worker();
that.start();