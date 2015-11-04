var fs = require('fs')
var logger = require('winston')
var seenreq = require("seenreq")
var moment = require("moment")
var Crawler = require('node-webcrawler')
var URL = require('url')
var _ = require('lodash')

var env = process.env.NODE_ENV || "development"
logger.add(logger.transports.File, { filename: '../../log/miaoche.log',logstash:true ,handleExceptions: true});
if(env==="production"){
    logger.remove(logger.transports.Console);
}

var godotTransport = require("winston-godot")
var godot = require("godot")
var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"miaoche"});//service名称需要更改

var c = new Crawler({
    maxConnections:2,
    callback:function(err,result,$){
	that.processList(err,result,$);
    },
    logger:logger,
    // debug:env === "development",
    onDrain:function(){
	logger.info("Job done.");
	logger.remove(godotTransport);
	client.close();
    },
    userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"
})

var Car = function(){
    this.resultDir = "../../result/auto/";
    this.dataDir = '../../appdata/';
    this.resultFile = "miaoche_"+moment().format("YYYY-MM-DD")+".csv";
    this.done = {};
    this.seen = new seenreq();
    this.curPageIdx = 1;
}
//http://deal.autohome.com.cn/china/?k=2, 综合经销商

Car.prototype.init = function(){
    var header = '\ufeff内饰,外观,裸车价,保险,服务,装饰,安装,库存,城市,品牌,型号,标题,人气,成交,指导价\n';
    
    fs.writeFile(this.resultDir+this.resultFile,header,function(err){
	if(err){
	    logger.error(err);
	}
    });
}

Car.prototype.start = function(){
    this.init();
    this.wgetCities("http://www.miaoche.com/guangzhou/search");
    //this.wgetList(["http://www.miaoche.com/guangzhou/search"]);
}

Car.prototype.wgetCities = function(url){
    c.queue({uri:url,callback:function(err,result,$){
	if(err){
	    logger.error(err);
	}else{
	    var host = URL.parse(result.uri).host;
	    that.wgetList(
		$(".area_item_wrap a").map(function(){
		    return 'http://' + host + $(this).attr('href')+'search';
		}).get()
	    );
	}
    }});
}

Car.prototype.wgetList = function(urls){
    urls.filter(function(url){
	return !this.seen.exists(url);
    },this).forEach(function(url){
	c.queue(url);
	logger.info(url);
    });
}

Car.prototype.processDetail = function(err,result,$){
    if(err){
	logger.error(err);
	return;
    }
    try{
	    var breadcrumb = $('.breadcrumb_wrap span').not('.sep')
	    , city = breadcrumb.eq(0).text().trim()
	    , brand = breadcrumb.eq(1).text().trim()
	    , model = breadcrumb.eq(2).text().trim()
	    , tit = breadcrumb.eq(3).text().trim()
	    , mktPrice = $('.package_specinfo_wrap .msrp s').text().replace(/[,\s]/g,'')
	    , popularity = $('.package_specinfo_wrap .weight').text().replace(/[,\s]/g,'')
	    , volume = $('.package_specinfo_wrap .transaction a').text().replace(/[,\s]/g,'')
	    //, stock = $('#stock').text().trim()
	    , matches = result.body.match(/colorGroup\s*=\s*(.+)/)
	    , colorInfo = matches && matches[1].slice(0,matches[1].length-1)
	    , colorInfo = colorInfo && JSON.parse(colorInfo);

	    var records = _.flatten(Object.keys(colorInfo).map(function(k){
	    	if (colorInfo[k].packages) {
	    	return colorInfo[k].packages.map(function(pkg){
		    return [colorInfo[k].inner_name,colorInfo[k].outer_name,pkg.base_price,pkg.insurance_price,pkg.service_price,
		    	pkg.decorate_price,pkg.installment_price,pkg.stock,city,brand,model,tit,popularity,volume,mktPrice];
	    	    });
	    	};
	    }));
	    
	    var r = records.join('\n')+'\n';
	    // logger.info(r);
	    fs.appendFile(this.resultDir+this.resultFile,r,function(e){
		if(e){
		    logger.error(e);
		}
	    });
    }catch(e){
    	if (result.body) {
    		fs.writeFileSync("tmp_error.log", result.body);
    	}
    	logger.error("uri:%s", result.uri?result.uri:"");    	
    	logger.error(e);
    }

    
}

Car.prototype.processList = function(err,result,$){
    if(err){
	logger.error(err);
    }else{
	if(!$){
	    logger.error('$ is empty.');
	}
	
	var host = URL.parse(result.uri).host;
	var opts = $("div.spec_recom_common_item > a").map(function(){
	    return {uri:'http://'+host+$(this).attr('href'),
		    callback:function(err,result,$){
			that.processDetail(err,result,$);
		    },
		    priority:0
		   };
	}).get().filter(function(opt){
	    return !that.seen.exists(opt);
	});
	
	c.queue(opts);
	
	var pages = $("div.pagination_wrap a").not('.current').not('.ellipsis').map(function(){return 'http://'+host+$(this).attr('href');}).get();
	
	// process.nextTick(function(){
	//     that.wgetList(pages);
	// });

	this.wgetList(pages);
    }
}

var that = new Car();
that.start();

