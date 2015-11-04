var Crawler = require('node-webcrawler')
var fs = require('fs')
var _ = require('lodash')
var seenreq = require('seenreq')
var godotTransport = require("winston-godot")
var godot = require("godot")
var URL = require('url')
var moment = require('moment')
var logger = require('winston')
var env = process.env.NODE_ENV || "development"
logger.add(logger.transports.File, { filename: '../../log/vip.global.log' ,logstash:true,level:'warn',handleExceptions:true});
logger.cli();

if(env==="production"){
    logger.remove(logger.transports.Console);
}else{
    logger.transports.Console.level = 'verbose';
}

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"vip.global"});

var debug = env !== 'production'
var seen = new seenreq();
var list = ["http://global.vip.com"];

var resultFile="../../result/vertical/vip_global_"+moment().format("YYYY-MM-DD")+".csv";
fs.writeFile(resultFile,'\ufeffURL,特卖ID,特卖名称,品牌,标题,价格,市场价,剩余,抓取日期\n',function(e){if(e) logger.error(e);});
var today = moment().format("YYYY-MM-DD");

function te_salePlan(o){
    return o;
}

function countItem(error,result,$){
    if(error) logger.error(error);
    var tit = $("title").text().replace(/[,\s]/g,'');
    var count = $("span.page-total").text().trim();
    var matches = result.uri.match(/(?:show\-)?(\d+)\.html/);
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
    
    var r = [result.uri,showId,tit,c,today].join()+"\n";
    logger.info(r);
    fs.appendFile(resultFile,r,function(e){if(e) logger.error(e);});
}

function listProduct(error,result,$){
    if(error){
	logger.error(error);
    }

    if(!$){
	logger.error("$ is empty.");
    }
    
    var records = [];
    var left = "";
    if($("p.pro-fav-time-out").length>0){
	left=$("p.pro-fav-time-out").eq(0).text().replace(/[,\s]/g,'');
    }
    
    var showName = $("div.pro-fav-name p").first().text().replace(/[,\s]/g,'')
    , matches = result.uri.match(/(?!show\-)?(\d+)\.html/)
    , showId = matches && matches[1];
    if(!showId){
	matches = result.body.match(/'id'\s:\s'(\d+)'/);
	if(matches)
	    showId = matches[1];
    }
    
    $("div.pro_list > dl").each(function(){
	var brand = $("dd.brand_tit",this).text().replace(/[,\s]/g,'');
	var tit = $("dd.pro_list_tit a",this).text().replace(/[,\s]/g,'');
	var price = $("dd.pro_list_data span em",this).text().replace(/[,\s]/g,'');
	var mkprice = $("dd.pro_list_data del",this).text().replace(/[,\s]/g,'');
	
	records.push([result.uri,showId,showName,brand,tit,price,mkprice,left,today].join());
    });
    
    logger.info(result.request.uri);
    if(records.length > 0){
	var r = records.join("\n")+'\n';
	fs.appendFile(resultFile,r,function(e){if(e) logger.error(e);});
    }
    
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
    return {uri:"http://www.vip.com/show-"+item.id+".html",callback:listProduct};
}

function ajaxinfo(error, result) {
    if(error) logger.error(error);
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
    
    c.queue(urls);
}

var c = new Crawler({
    maxConnections : 5,
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
	$("a").each(function(){
	    var url = $(this).attr('href');
	    if(reg.test(url) && !seen.exists(url)){
		c.queue({uri:url,callback:listProduct});
	    }
	});
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
	    var opts = JSON.parse(dt).map(fn).filter(function(opt){
		return !seen.exists(opt);
	    });
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
//c.queue({uri:"http://www.vip.com/show-469080.html",callback:listProduct});
//c.queue({uri:"http://www.vip.com/index-ajax.php?callback=te_salePlan&act=getDayBrandList&warehouse=VIP_BJ&date="+moment().format("YYYYMMDD")+"&channelId=0&t=1",callback:ajaxinfo,jQuery:false});
//            http://www.vip.com/index-ajax.php?act=getReadyBrandList&warehouse=VIP_BJ&areaCode=101101&channelId=0&pagecode=a&sort_type=101&part=ready&page=5&pagesize=21&preview=&sell_time_from=&time_from=
//c.queue(list[0]);
list.forEach(function(l){
    c.queue(l);
});

/*var $ = cheerio.load(fs.readFileSync("index.html").toString());
var reg = /show\-\d+\.html/;
$("a").each(function(){
    var url = $(this).attr('href');
    if(reg.test(url) && !hash[url]){
	hash[url]=true;
	//c.queue({uri:url,callback:countItem});
    }
});

logger.info(Object.keys(hash).length);
*/
