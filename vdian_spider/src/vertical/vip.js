var Crawler = require('node-webcrawler')
var fs = require('fs')
var _ = require('lodash')
var godotTransport = require("winston-godot")
var godot = require("godot")
var seenreq = require('seenreq')
var URL = require('url')
var moment = require('moment')
var logger = require('winston')
var env = process.env.NODE_ENV || "development"
logger.add(logger.transports.File, { filename: '../../log/vip.log' ,logstash:true,level:'info',handleExceptions:true});
logger.cli();


if(env==="production"){
    logger.remove(logger.transports.Console);
}else{
    logger.transports.Console.level = 'verbose';
}

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"vip"});

var debug = env==='development'
var seen = new seenreq();
var list = ["http://beauty.vip.com"
	    ,"http://global.vip.com"
	    ,"http://home.vip.com"
	    ,"http://www.vip.com"
	   ];

var resultFile="../../result/vertical/vip_list_"+moment().format("YYYY-MM-DD")+".csv";
fs.writeFile(resultFile,'\ufeffURL,特卖ID,标题,品牌,SKU数量,抓取日期\n',function(e){if(e) logger.error(e);});
var today = moment().format("YYYY-MM-DD");
function te_salePlan(o){
    return o;
}

function countItem(error,result,$){
    if(error) {
	logger.error(error);
	return;
    };
    
    if($('title').text().search('（原Vipshop.com）')>-1){
	return;
    }
    
    var tit = $("title").text().replace(/[,\s]/g,'');
    var count = $("span.page-total").text().trim();
    var matches = result.uri.match(/(?:show\-)?(\d+)\.html/);
    var brand = $("dd.brand_tit").eq(0).text().replace(/[,\s]/g,'');
    var showId = matches && matches[1];
    var c = count && count.match(/\d+/)[0];
    
    if(!c){
	c=0;
	var reg = /detail\-\d+\-\d+\.html/g
	var ms= result.body.match(reg);
	c = ms && ms.length;
    }
    
    if(!c){
	var ms = result.body.match(/\.com\/detail/g);
	c = ms && ms.length;
    }
    
    var r = [result.uri,showId,tit,brand,c,today].join()+"\n";
    logger.info(r);
    fs.appendFile(resultFile,r,function(e){if(e) logger.error(e);});
}

function listProduct(error,result,$){
    if(error){
	logger.error(error);
	return;
    }

    if(!$){
	logger.error("$ is empty.");
	return;
    }
    
    var records = [""];
    var left = "";
    if($("p.pro-fav-time-out").length>0){
	left=$("p.pro-fav-time-out").eq(0).text().replace(/[,\s]/g,'');
    }
    
    var showName = $("div.pro-fav-name p").first().text().replace(/[,\s]/g,'')
    , matches = result.uri.match(/show-(\d+)/)
    , showId = matches && matches[1];
    
    $("div.pro_list > dl").each(function(){
	var brand = $("dd.brand_tit",this).text().replace(/[,\s]/g,'');
	var tit = $("dd.pro_list_tit a",this).text().replace(/[,\s]/g,'');
	var price = $("dd.pro_list_data span em",this).text().replace(/[,\s]/g,'');
	var mkprice = $("dd.pro_list_data del",this).text().replace(/[,\s]/g,'');
	
	records.push([showId,showName,brand,tit,price,mkprice,left,today].join());
    });
    
    var r = records.join("\n");
    fs.appendFile(resultFile,r,function(e){if(e) logger.error(e);});
    var host = result.request.uri.host;
    var pages = $("div.page.list-define-page > a")
	.map(function(){return {uri:"http://"+host+$(this).attr('href'),callback:listProduct};})
	.get()
	.filter(function(opt){
	    return opt && !seen.exists(opt)
	});
    
    logger.info("url:%s, page: %d",result.uri,pages.length);
    c.queue(pages);
}

function fn(item){
    return {uri:"http://www.vip.com/show-"+item.id+".html",callback:countItem};
}

function ajaxinfo(error, result) {
    if(error) {
	logger.error(error);
	return;
    }
    
    var obj = eval(result.body);
    if(obj.part_top instanceof Array){
	return;
    }
    
    var urls = _.flatten(
	Object.keys(obj)
	    .filter(function(k){return obj[k].items instanceof Array})
	    .map(function(k){return obj[k].items.map(fn);})
    ).filter(function(opt){return !seen.exists(opt);});
    
    logger.info("%d items",urls.length);
    
    if(urls.length > 0)
	c.queue(urls);
}

var c = new Crawler({
    maxConnections : 5,
    logger:logger,
    debug:env!=='production',
    onDrain:function(){
	logger.info("===All done.===");
	client.close();
    },
    // This will be called for each crawled page
    callback : function(error,result,$){
	if(error){
	    return;
	}
	
	var reg = /show\-\d+\.html/;
	var reLink = /http:\\?\/\\?\/[a-z]*\.vip\.com\\?\/show-[0-9]+.html/ig;
	var shows = result.body.match(reLink);
	if(shows){
	    shows = shows.filter(function(link){return !seen.exists(link);}).map(function(link){return {uri:link.replace(/\\/g,''),callback:countItem};});
	    logger.info("%d shows",shows.length);
	    c.queue(shows);
	}
	
	var matches = result.body.match(/newToday\s=\s([^\n]+)/);
	var dt = matches && matches[1].trim();
	
	if(dt){
	    if(dt[dt.length-1]==';')
		dt = dt.slice(0,-1);
	    var opts = JSON.parse(dt).map(fn).filter(function(opt){
		return !seen.exists(opt);
	    });
	    c.queue(opts);
	}
	
	matches = result.body.match(/label\s=\s([^\n]+)/);
	dt = matches && matches[1].trim();
	
	if(dt){
	    if(dt[dt.length-1]==';')
		dt = dt.slice(0,-1);
	    var opts = JSON.parse(dt).map(fn).filter(function(opt){
		return !seen.exists(opt);
	    });
	    c.queue(opts);
	}
	
	var reg = /data : (\[[^\]]+\])/g;
	while(matches = reg.exec(result.body)){
	    dt = matches[1];
	    var opts = JSON.parse(dt).map(fn).filter(function(opt){return !seen.exists(opt);});
	    logger.info(opts.length);
	    c.queue(opts);
	}
	
	matches = result.body.match(/\.readyData = (\[[^\]]+\])/);
	if(matches && matches.length>0){
	    dt = matches[1];
	    if(dt){
		var opts = JSON.parse(dt).map(fn).filter(function(item){
		    return !seen.exists(item);
		});
		logger.info("%d",opts.length);
		c.queue(opts);
	    }
	}
	
	matches = result.body.match(/\.todayBrandData = (\[[^\]]+\])/);
	if(matches && matches.length>0){
	    dt = matches[1];
	    if(dt){
		var opts = JSON.parse(dt).map(fn).filter(function(item){
		    return !seen.exists(item);
		});
		logger.info("%d",opts.length);
		c.queue(opts);
	    }
	}
	
	matches = result.body.match(/\.hotBrandData = (\[[^\]]+\])/);
	if(matches && matches.length>0){
	    dt = matches[1];
	    if(dt){
		var opts = JSON.parse(dt).map(fn).filter(function(item){
		    return !seen.exists(item);
		});
		c.queue(opts);
	    }
	}
    }
});

function processBrandList(err,result){
    if(err){
	logger.error(err);
	return;
    }
    
    var obj = JSON.parse(result.body);
    if(obj.code==200){
	var opts = obj.data && obj.data.items.map(fn).filter(function(opt){return !seen.exists(opt);});
	if(opts && opts.length > 0){
	    logger.info("%d items",opts.length);
	    c.queue(opts);
	}
	
	var urlObj = URL.parse(result.uri,true);
	var cur = urlObj.query.page;
	
	logger.info(obj.data.pageCount);
	
	if(obj.data.pageCount > cur){
	    ++urlObj.query.page;
	    delete urlObj.search;
	    if(!seen.exists(URL.format(urlObj))){
		c.queue({uri:URL.format(urlObj),callback:processBrandList});
	    }
	}
    }
}

//c.queue({uri:"http://www.vip.com/show-469080.html",callback:listProduct});
var home = {
    uri:"http://www.vip.com/index-ajax.php?callback=te_salePlan&act=getDayBrandList&warehouse=VIP_BJ&areaCode=101101&date="+moment().format('YYYYMMDD')+"&channelId=0&t=1",
    callback:ajaxinfo,
    jQuery:false
};

var brands = {
    uri:'http://www.vip.com/index-ajax.php?act=getSellingBrandList&warehouse=VIP_BJ&areaCode=101101&channelId=0&pagecode=a&sort_type=101&part=part2&page=1&pagesize=21&preview=&sell_time_from=&time_from=',
    jQuery:false,
    callback:processBrandList
}

var readyBrand = {
    uri:'http://www.vip.com/index-ajax.php?act=getReadyBrandList&warehouse=VIP_BJ&areaCode=101101&channelId=0&pagecode=a&sort_type=101&part=ready&page=1&pagesize=21&preview=&sell_time_from=&time_from=',
    jQuery:false,
    callback:processBrandList
}

c.queue(home);
c.queue(brands);
c.queue(readyBrand);

//            http://www.vip.com/index-ajax.php?act=getReadyBrandList&warehouse=VIP_BJ&areaCode=101101&channelId=0&pagecode=a&sort_type=101&part=ready&page=5&pagesize=21&preview=&sell_time_from=&time_from=
//c.queue(list[0]);
list.forEach(function(l){
    c.queue(l);
});
