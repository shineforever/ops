var fs = require('fs')
var Crawler = require("node-webcrawler")
var util = require("util")
var seenreq = require('seenreq')
var godotTransport = require("winston-godot")
var godot = require("godot")
var URL = require('url')
var moment = require('moment')
var logger = require('winston')
var env = process.env.NODE_ENV || "development"
logger.add(logger.transports.File, { filename: '../../log/xdf.log' ,logstash:true,level:'warn',handleExceptions:true});
logger.cli();

// var godotServer = require("../../config.json")[env].godotServer;
// var client = godot.createClient(godotServer);
// client.connect(godotServer.port);
// logger.add(godotTransport, {godot:client, service:"xdf"});

if(env==="production"){
    logger.remove(logger.transports.Console);
}else{
    logger.transports.Console.level = 'verbose';
}

var c = new Crawler({
    maxConnections:1,
    callback:processCity,
    debug : env === 'development',
    logger:logger,
    retries:1,
    userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36",
    onDain:function(){
	logger.info("===All done.===");
	//client.close();
    }
});

var n=1
,resultFile = "../../result/edu/xdf_"+moment().format("YYYY-MM-DD")+".csv"
,voucherFile = "../../result/edu/xdf_voucher_"+moment().format("YYYY-MM-DD")+".csv"
,seen = new seenreq()
,today = moment().format("YYYY-MM-DD");

fs.writeFile(resultFile,'\ufeffURL,一级目录,二级目录,三级目录,课程编号,人数,时间,地点,价格,城市,抓取日期,备注\n',function(e){if(e) logger.error(e);});
fs.writeFile(voucherFile,'\ufeff课程编号,优惠额,名称\n',function(e){if(e) logger.error(e);});

function processCity(error,result,$){
    if(error){
	logger.error(error);
	return;
    }
    
    if(!$){
	logger.error('$ is empty');
	return;
    }
    
    var items = $("#selectcity_pop ul li a").map(function(){
	var url = $(this).attr("href");
	var txt = $(this).text();
	return {uri:url,callback:processCategory};
    }).get().filter(function(opt){
	return !seen.exists(opt);
    });
    
    if(items.length>0)
	c.queue(items);
}

function processVoucher(err,result){
    if(err){
	logger.error(err);
	return;
    }
    
    var obj = null;
    try{
	obj = JSON.parse(result.body);
    }catch(e){
	logger.error(e);
	logger.info(result.body);
	return;
    }
    
    if(obj.length>0){
	var info = obj[0][0];
	var coupon = info.dPay;
	var code = info.sClassCode;
	var name = info.sVoucherName;
	var r = [code,coupon,name].join()+"\n";
	
	logger.info(r);
	fs.appendFile(voucherFile,r,function(e){if(e) logger.error(e);});
    }
}

function processCategory(error,result,$){
    if(error){
	logger.error(error);
	return;
    }
    
    if(!$){
	logger.error('$ is empty');
	return;
    }
    
    var host = result.request.uri.host;
    var categories = $(".dlList > dd > h3 a").map(function(){
	var href = $(this).attr("href");
	
	if(href.indexOf('http')==-1){
	    href = "http://"+host+href;
	}
	
	href += "&applystate=0&hide=0"
	return {uri:href,callback:processList};
    }).get().filter(function(opt){
	return !seen.exists(opt);
    });
    
    logger.info("categories: %d",categories.length);
    c.queue(categories);
}

function processList(error,result,$){
    if(error){
	logger.error(error);
	return;
    }
    
    if(!$){
	logger.error('$ is empty');
	return;
    }
    
    var host = result.request.uri.host;
    
    $("a.u-btn").each(function(){
	var url = $(this).attr("href")+"&hide=0";
	if(url.indexOf('http')==-1){
	    url = "http://"+host+url;
	}
	
	if(!seen.exists(url)){
	    c.queue({uri:url,callback:processDetail});
	}
    });
    
    //logger.info(result.request.uri.host);
    
    logger.info("%s",result.uri);
    
    var nextPageBtn = $("div.coli_page .nextlink");
    if(nextPageBtn.length>0){
	if(!seen.exists(nextPageBtn.attr('href'))){
	    c.queue({uri:nextPageBtn.attr('href'),callback:processList});
	}
    }
}

function processDetail(error,result,$){
    if(error){
	logger.error(error);
	return;
    }
    if(!$){
	logger.error('$ is empty');
	return;
    }
    
    var records = []
    ,cates = $("p.position").text().replace(/[,\s]/g,'').split(/>/);
    if(cates.length<=1){
	cates = $('div.m-crumbs').text().replace(/[,\s]/g,'').split(/>/);
    }
    
    var cate1 = ''
    , cate2 = ''
    , cate3 = ''
    , city = $("#selectcity cite.selected").text().trim();
    
    if(cates.length>1)
	cate1 = cates[1];
    if(cates.length>2)
	cate2=cates[2];
    if(cates.length>3)
	cate3 = cates[3];
    
    if($("ul.kc_cont").length==0){
	var tit = $("h2.m-coursedetails-h2").text().replace(/[,\s]/g,'');
	
	$("div.m-classlist").each(function(){
	    var no = $(".m-classlist-title h3 a",this).text().replace(/[\s,]/g,''),
	    href = $(".m-classlist-title h3 a",this).attr('href'),
	    p = $(".m-class-price u-people",this).text().replace(/[\s,]/g,''),
	    time = $(".m-class-info .u-title",this).eq(0).text().replace(/时间：/g,'').replace(/[\s,]/g,''),
	    addr = $(".m-class-info .u-title",this).eq(1).text().replace(/地点：/g,'').replace(/[\s,]/g,''),
	    price = $(".m-class-price .u-price",this).text().replace(/[\s,￥]/g,'');
	    
	    records.push([href,cate1,cate2,cate3,no,p,time,addr,price,city,today,''].join());
	    
	    var cookie = encodeURI([no,tit,1,city,price,'正常报名',1].join());
	    logger.info(cookie);
	    c.queue({
		uri:"http://baoming.xdf.cn/ShoppingCart/Handlers/getCartVoucherHandler.ashx",
		method:'POST',
		headers:{
		    Cookie:"Xdf.WebPay.V4.Cart="+cookie
		},
		jQuery:false,
		callback:processVoucher
	    });
	});
    }else{
	var tit = $(".box2 .hd > h2").contents().filter(function() {
	    return this.nodeType == 3;
	}).text().replace(/[,\s]/g,'');
	
	$("ul.kc_cont").each(function(){
	    var no = $("li.seg2 span.classNum",this).text().replace(/[\s,]/g,''),
	    href = $("li.seg2 span.classNum a",this).attr('href'),
	    p = $("li.seg2 span.pNum",this).text().replace(/[\s,]/g,''),
	    time = $("li.seg6 dl.tLists dd",this).eq(0).text().replace(/时间：/g,'').replace(/[\s,]/g,''),
	    addr = $("li.seg6 dl.tLists dd",this).eq(1).text().replace(/地点：/g,'').replace(/[\s,]/g,''),

	    price = $("li.seg10 span.price em",this).text().replace(/[\s,￥]/g,''),
	    note = '';
	    
	    if($("li.seg6 dl.tLists dd",this).length>2){
		note = $("li.seg6 dl.tLists dd",this).eq(2).text().replace(/[\s,]/g,'');
	    }
	    
	    records.push([href,cate1,cate2,cate3,no,p,time,addr,price,city,today,note].join());
	    
	    var cookie = encodeURI([no,tit,1,city,price,'正常报名',1].join());
	    logger.info(cookie);
	    
	    c.queue({
		uri:"http://baoming.xdf.cn/ShoppingCart/Handlers/getCartVoucherHandler.ashx",
		method:'POST',
		headers:{
		    Cookie:"Xdf.WebPay.V4.Cart="+cookie
		},
		jQuery:false,
		callback:processVoucher
	    });
	});
    }
    
    if(records.length>0){
	var r = records.join("\n")+'\n';
	fs.appendFile(resultFile,r,function(e){if(e) logger.error(e);});
    }
    
    var pages = $("div.coli_page a").not("linkno").not('prelinkno').not('nextlinkno').filter(function(){
	return !seen.exists($(this).attr('href'));
    }).map(function(){
	return {uri:$(this).attr('href'),callback:processDetail};
    }).get();
    
    if(pages.length>0){
	c.queue(pages);
    }
}

//var city = cities.shift();
//c.queue("http://souke.xdf.cn/Category/1.html");

c.queue({
    uri:"http://souke.xdf.cn/shanghai-2.html",
    callback:processCategory
});
