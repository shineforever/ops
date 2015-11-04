var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')
var Crawler = require('node-webcrawler')
var Emitter = require("events").EventEmitter
var URL = require('url')
var mysql = require('mysql')
var crypto = require('crypto')
var _ = require("lodash")
var logger = require("winston")
logger.add(logger.transports.File, { filename: '../../log/meilishuo.log' });

function Meilishuo() {
    this.resultDir = '../../result/meilishuo/';
    this.today = new Date().toString();
    this.dealidFile = "meilishuo.dealid_"+this.today+".txt";
    this.itemFile = '';
    this.shopFile = '';
    this.categoryFile = "meilishuo.category_"+this.today+".txt";
    this.doneCategories = {};
    
    this.dealidFile = 'meilishuo.dealid_' + this.today + '.txt';
    this.itemFile = 'meilishuo.item_' + this.today + '.txt';
    this.shopFile = 'meilishuo.shop_' + this.today + '.txt';
    this.timeFile = 'meilishuo.time_'+this.today+'.txt';
    
    //load category that finished.
    if(fs.existsSync(this.resultDir+this.categoryFile)){
	fs.readFileSync(this.resultDir+this.categoryFile).toString().split('\n').map(function(line){
	    return line.split(",");
	}).reduce(function(prev,pair){
	    if(pair[0]){
		prev[pair[0]] = pair.length>1?pair[1]:'';
	    }
	    return prev;
	},this.doneCategories);
    }
    
    this.c = new Crawler({
	maxConections:10,
	//rateLimits:1000,
	userAgent:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36',
	onDrain:function(){
	    //that.init();
	    //that.wgetItemHtml();
	},
	preRequest:function(ropts){
	    ropts.headers.nt = that.nt;
	    //logger.info(ropts.headers.nt);
	}
    });
    
    this.conn = mysql.createConnection({
	host     : 'db-server',
	user     : 'mike',
	password : 'Mike442144',
	database:'InternetCompanies'
    });
    
    this.frameCount = 8;//frame count per page
    this.ipf = 20;//items count per frame.
    this.maxPage = 75;
    
    this.nt = "";
    this.tokenList = [];
    
    this.e = new Emitter();
    this.e.on("SecondaryCategoryDone",function(opt){
	logger.info("category %s-%s done.",opt.primary,opt.secondary);
	that.recordProgress(opt);
    });
    this.primaryCategories = {
	// '上衣':{url:'/guang/catalog/dress?nid=5773&cata_id=2001000000000&frm=daeh'},
	// '裙子':{url:'/guang/catalog/dress?nid=5781&cata_id=2001000000000&frm=daeh'},
	// '裤子':{url:'/guang/catalog/dress?nid=5783&cata_id=2001000000000&frm=daeh'},
	// '内衣':{url:'/guang/catalog/dress?nid=5785&cata_id=2001000000000&frm=daeh'},
	// '鞋子':{url:'/guang/catalog/shoes?nid=13&cata_id=6000000000000&frm=daeh'},
	// '包包':{url:'/guang/catalog/bag?nid=15&cata_id=5000000000000&frm=daeh'},
	// '配饰':{url:'/guang/catalog/access?nid=1097&cata_id=7000000000000&frm=daeh'},
	// '家居':{url:'/guang/catalog/jiaju?nid=1093&cata_id=9000000000000&frm=daeh'},
	'美妆':{url:'/beauty?frm=daeh'}
    }
}

Meilishuo.prototype.recordProgress = function(opt){
    fs.appendFileSync(this.resultDir+this.categoryFile,[opt.primary+'-'+opt.secondary,opt.total,"\n"].join());
}

Meilishuo.prototype.wgetCategory = function(){
    var host = "www.meilishuo.com";
    Object.keys(this.primaryCategories).forEach(function(key){
	this.c.queue({
	    uri:"http://"+host+this.primaryCategories[key].url,
	    category:key,
	    callback:function(err,result,$){
		if(err || !$){
		    logger.error("%s",err||"cheerio load error");
		}else{
		    that.filterCategory(result,$);
		}
	    },
	});
    },this);
}

Meilishuo.prototype.filterToken = function(str){
    var token = "";
    if(str.length===64){
	token = str;
    }else{
	var matches = str.match(/nt\s*:\s*(?:'|")(.{64})(?:'|")/);
	token = matches && matches[1];
    }
    
    if(token)
	this.tokenList.push(token);
    
    this.nt =token|| this.nt;
    //logger.info(this.nt);
}

Meilishuo.prototype.filterCategory =function(result,$){
    this.filterToken(result.body);
    var category = result.options.category;
    $("ul.nav_list li p a").each(function(){
	var url=$(this).attr("href")
	,name = $(this).text().trim()
	,t = category+'-'+name;
	
	if(!(t in that.doneCategories)){
	    that.primaryCategories[category][name] = {url:url};
	}else{
	    logger.info("%s Done",t);
	}
    });
    
    logger.info("Got Category %s",category);
    this.wgetList(category);
}

Meilishuo.prototype.wgetList = function(primary){
    var url = 'http://www.meilishuo.com/aj/getGoods/catalog';
    Object.keys(this.primaryCategories[primary]).forEach(function(secondary){
	if(secondary =='url')
	    return;
	var objUrl = URL.parse("http://www.meilishuo.com"+this.primaryCategories[primary][secondary].url,true);
	logger.info("%s-%s, %s, %s",primary,secondary,objUrl.query.cata_id,objUrl.query.nid);
	
	this.c.queue({
	    uri:url,
	    qs:{
		frame:0,
		page:0,
		view:1,
		word:0,
		cata_id:objUrl.query.cata_id,
		section:'hot',
		price:'all',
		nid:objUrl.query.nid,
		pstrc:"fe_pos:wlc_words_0_0"
	    },
	    secondary:secondary,
	    headers:{
		nt:that.nt,
		Referer:"http://www.meilishuo.com",
	    },
	    primary:primary,
	    jQuery:false,
	    debug:true,
	    callback:function(err,result){
		if(err){
		    logger.error("%s",err);
		}else{
		    that.filterToken(result.headers.nt);
		    logger.info("%s-%s",primary,secondary);
		    var parsed = that.processList(result.body,true);
		    that.wgetFrameList({
			primary:result.options.primary,
			secondary:result.options.secondary,
			qs:result.options.qs,
			totalPage:parsed.totalPage,
			total:parsed.total
		    });
		}
	    }
	});
    },this);
}

Meilishuo.prototype.processList = function(content,calculatePage){
    var o = null;
    try{
	o = JSON.parse(content);
    }catch(error){
	logger.error("%s in processList",error.message);
	logger.info(content);
	return;
    }
    logger.info("%d items",o.tInfo.length);
    var items = o.tInfo.map(function(t){
	that.c.queue({
	    uri:"http://www.meilishuo.com/share/item/"+t.twitter_id,
	    dealid:t.twitter_id,
	    callback:function(err,result,$){
		if(err){
		    logger.error(err.message);
		}else{
		    that.processData(result,$);
		}
	    }
	});
	/*that.c.queue({
	    uri:"http://www.meilishuo.com/aj/getComment/deal?tid="+t.twitter_id+"&page=0",
	    dealid:t.twitter_id,
	    jQuery:false,
	    //priority:1,
	    headers:{
		nt:that.nt,
		Referer:"http://www.meilishuo.com",
	    },
	    callback:function(err,result){
		var d;
		try{
		    d = JSON.parse(result.body);
		}catch(e){
		    logger.error("%s in get deal time",e.message);
		    logger.info(result.body);
		    return;
		}
		that.filterToken(result.headers.nt);
		if(d.pages.totalNum<=1){
		    if(d.cInfos.length>0){
			var last = _.first(d.cInfos).time
			, first = _.last(d.cInfos).time
			fs.appendFileSync(that.resultDir+that.timeFile,[result.options.dealid,first,last,"\n"].join());
		    }
		}else{
		    that.c.queue({
			uri:'http://www.meilishuo.com/aj/getComment/deal?tid='+t.twitter_id+"&page="+(Math.ceil(d.pages.totalNum/15)-1),
			jQuery:false,
			//priority:1,
			last:_.first(d.cInfos).time,
			dealid:result.options.dealid,
			headers:{
			    nt:that.nt,
			    Referer:"http://www.meilishuo.com",
			},
			callback:function(err,result){
			    that.filterToken(result.headers.nt);
			    var t = _.last(JSON.parse(result.body).cInfos).time;
			    fs.appendFileSync(that.resultDir+that.timeFile,[result.options.dealid,t,result.options.last,'\n'].join());
			}
		    });
		}
	    }
	});*/
	var r = [];
	Object.keys(t).forEach(function(k){
	    switch(k){
	    case 'twitter_id':
	    case 'twitter_author_uid':
	    case 'twitter_create_time':
	    case 'sale_num':
	    case 'count_like':
	    case 'shop_id':
	    case 'count_reply':
	    case 'count_forward':
		r.push(t[k]);
		break;
	    case 'uinfo':
		r.push(t.uinfo && t.uinfo.nickname.replace(/[，,]/g,''));
		break;
	    }
	});
	return r.join();
    }).join("\n");
		    
    if(calculatePage){
	var page = Math.ceil(o.totalNum/(this.frameCount*this.ipf));
	return {
	    totalPage:page<this.maxPage ? page:this.maxPage
	    ,total:o.totalNum
	};
    }
}

Meilishuo.prototype.wgetFrameList = function(opt){
    //logger.info(opt);
    //return;
    if(opt.qs.frame<this.frameCount - 1){
	++opt.qs.frame;
    }else if(opt.qs.page<opt.totalPage-1){
	opt.qs.frame=0;
	++opt.qs.page;
    }else{
	this.e.emit("SecondaryCategoryDone",opt);
	return;
    }
    logger.info("%s-%s, %d/%d/%d",opt.primary,opt.secondary,opt.qs.frame,opt.qs.page,opt.totalPage);
    this.c.queue({
	uri:'http://www.meilishuo.com/aj/getGoods/catalog',
	qs:opt.qs,
	opt:opt,
	jQuery:false,
	Referer:"http://www.meilishuo.com",
	headers:{
	    nt:that.nt
	},
	callback:function(err,result){
	    if(err){
		logger.error("%s",err);
	    }else{
		that.processList(result.body);
		setTimeout(function(){
		    that.wgetFrameList(result.options.opt);
		},0);
	    }
	}
    });
}

Meilishuo.prototype.init = function(){
    var arguments = process.argv.splice(2);
    //this.name = arguments[0];
    this.dealidFile = 'meilishuo.dealid_' + this.today + '.txt';
    this.itemFile = 'meilishuo.item_' + this.today + '.txt';
    this.shopFile = 'meilishuo.shop_' + this.today + '.txt';
    
    //load dealid file
    this.tasks = []
    var lines = fs.readFileSync(this.resultDir+this.dealidFile).toString().split('\n');
    for(var i = 0, l = lines.length; i < l; i++) {
        if(lines[i]){
            this.tasks.push({"dealid":lines[i].split(",")[0]});
	}
    }
    var start = Number(arguments[0]) || 0;
    var len = Number(arguments[1]) || this.tasks.length;
    //前闭后开区间
    this.tasks = this.tasks.slice(start,start+len);
    logger.info("task count: %d",this.tasks.length);
}

Meilishuo.prototype.start = function(){
    this.wgetCategory();
}

Meilishuo.prototype.wgetItemHtml = function(t){
    /*if(this.tasks.length===0){
        logger.info("job done.");
        return;
    }
    t = this.tasks.shift();
    logger.info('task left: %d', this.tasks.length);
    
    this.c.queue({
	uri:"http://www.meilishuo.com/share/item/"+i.dealid,
	dealid:i.dealid,
	callback:function(err,result,$){
	    that.processData(result,$)
	}
    });
    */
    /*
    var opt = new helper.basic_options("www.meilishuo.com", "/share/item/" + t.dealid);
    opt.agent = false;
    logger.info("[GET dealid:] %s", t.dealid);
    helper.request_data(opt,null,function(data,args,res){
    	that.getFirstDealPage(data,args,res);
    },t);*/
    
}

Meilishuo.prototype.getFirstDealPage = function(data,args,res) {
    t = args[0];
    if(!data) {
        logger.warn("item data empty");
        setTimeout(function () {
            that.wgetItemHtml();
        }, 0);
    } else {
        var opt = new helper.basic_options("www.meilishuo.com", "/aj/getComment/deal?tid="+t.dealid+"&page=0");
        opt.agent = false;
        t.data = data;
        helper.request_data(opt,null,function(data1,args,res){
            that.getFirstDealRecord(data1,args,res);
        },t);
    }
}

Meilishuo.prototype.getFirstDealRecord = function(data,args,res) {
    t = args[0];
    if(!data || data[0] != '{') {
        logger.warn("first deal page data empty");
        t.first_deal_time = '';
        that.processData(t);
    } else {
	try{
	    var deal_info = JSON.parse(data);
	}catch(e){
	    logger.error(e);
	    t.first_deal_time = '';
            that.processData(t);
	    return;
	}
        
        var c_info = deal_info['cInfos'];
        var deal_total_num = parseInt(deal_info['pages']['totalNum']);
        if(deal_total_num == 0) {
            t.first_deal_time = '';
            that.processData(t);
        } else {
            var page_total = Math.ceil(deal_total_num / 15) - 1;
            if(page_total == 0) {
                item_info = c_info.pop();
                if(item_info &&"time" in item_info)
                    t.first_deal_time = item_info['time'];
                else
                    t.first_deal_time = '';
                that.processData(t);
            } else {
                var opt = new helper.basic_options("www.meilishuo.com", "/aj/getComment/deal?tid="+t.dealid+"&page="+page_total.toString());
                opt.agent = false;
                helper.request_data(opt,null,function(data1,args,res){
                    that.parseFirstDealTime(data1,args,res);
                },t);
            }
        }
    }
}

Meilishuo.prototype.parseFirstDealTime = function(data,args,res) {
    t = args[0];
    if(!data || data[0] != '{') {
        logger.warn("first deal record data empty");
        t.first_deal_time = '';
        that.processData(t);
    } else {
	try{
	    var deal_info = JSON.parse(data);
	}catch(e){
	    logger.error(e);
	    t.first_deal_time = '';
            that.processData(t);
	    return;
	}
        
        var c_info = deal_info['cInfos'];
        item_info = c_info.pop();
        if(item_info && "time" in item_info)
            t.first_deal_time = item_info['time'];
        else
            t.first_deal_time = '';
        that.processData(t);
    }
}

Meilishuo.prototype.processData = function(result,$){
    this.filterToken(result.body);
    var item_id = result.options.dealid;
    var item_title = $("h3.item-title").contents().filter(function(){return this.nodeType===3;}).text().replace(/[\n\r,，]/g,";");
    var item_price = $("#price-now").text();
    var item_sale_num = $("ul.item-data li span.item-data-wrap").first().text().replace(/[件 ]/g, '');
    //var item_category = this.name;
    //var item_first_deal_time = t.first_deal_time;
    
    var shop = $("div.sidebar div.shop");
    var shop_title = $("div.shop-wrap a.shop-name", shop);
    var shop_name = shop_title.text();
    var shop_url = shop_title.attr("href");
    var exec_res = /shop\/(\d+)/.exec(shop_url);
    var shop_id = ''
    if(exec_res) {
        shop_id = exec_res[1];
        //var shop_name = $("div.shop-wrap a", shop).first().text().replace(/[\n\r,，]/g,";");
        var shop_region = $("ul.shop-info li", shop).eq(0).text().replace('所在地区：', '');
        var shop_product_num = $("ul.shop-info li", shop).eq(1).text().replace('商品数量：', '');
        var shop_sale_num = $("ul.shop-info li", shop).eq(2).text().replace('销售数量：', '');
        var shop_create_time = $("ul.shop-info li i", shop).attr('title').replace('美丽说认证 ', '');
    }
    
    var item = [item_id,item_price,item_sale_num,shop_id,item_title,"\n"].join();
    var shop = [shop_id,shop_name,shop_region,shop_product_num,shop_sale_num,shop_create_time,"\n"].join();
    logger.info("Item: %s, Shop: %s",item_title,shop_name);
    if(item_title && shop_id) {
        fs.appendFileSync(that.resultDir+that.itemFile,item);
        fs.appendFileSync(that.resultDir+that.shopFile,shop);
    }else{
	logger.info();
    }
}

var instance = new Meilishuo();
var that = instance;
that.start();
