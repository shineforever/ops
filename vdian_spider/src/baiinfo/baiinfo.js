var fs = require('fs')
var util = require("util")
var logger = require('winston')
var seenreq = require("seenreq")
var moment = require("moment")
var Crawler = require('node-webcrawler')

var env = process.env.NODE_ENV || "development"

//日志初始化
logger.cli();
if(env==="production"){
    logger.add(logger.transports.File, {filename:"../../log/gome_airconditioner.log", logstash:true, level:"info"});
    logger.remove(logger.transports.Console);
}

var c = new Crawler({
    	maxConnections:1,//\
 	callback:function(err,result,$){
		that.processList(err,result,$);
    	},
	//logger:logger,
	//forceUTF8:true,
    	//debug:env === "development",
    	userAgent:"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:35.0) Gecko/20100101 Firefox/35.0",
	jar:true,
	onDrain:function(){
		logger.info("Job done.");
	},
	rateLimits:1000//时间间隔，毫秒单位
})

function dealstr(str){
	if(typeof(str)=='string'){
	        var nodotstr = str.replace(/,/g, ' ');
	        return nodotstr.replace(/\s+/g, ' ');
	}                                                                                                       
	else{
	        return str;
	} 
}

function dealEmpty(value){
	if(typeof(value)=='number'){
		return value;
	}
	else{
		return (value?value:"N/A");
	}
}

var Dealer = function(){
	 this.resultDir = "../../result/baiinfo/";
	 this.resultFile = "baiinfo_"+moment().format("YYYY-MM-DD");
	 this.seen = new seenreq();
}

Dealer.prototype.init = function(){
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
}

Dealer.prototype.start = function(){
    	this.init();
	var type = 'week';
	this.addqueue(['http://www.baiinfo.com/Orders/NewsList/102?pageid=1'], type);
	type = 'mouth';
	this.addqueue(['http://www.baiinfo.com/Orders/NewsList/1078?pageid=1'], type);
}

//拍重，将url加入到queue中
//使用C的默认callback, 即使用processList处理
Dealer.prototype.addqueue = function(urls, type){
    	urls.filter(
		function(url){
			return !this.seen.exists(url);
    		},this
	).forEach(
		function(url){
			logger.info("queue:%s", url);
			c.queue({uri:url, type:type, callback:function(err, result, $){
				that.processList(err, result, $);
			}});
		}
	);
}

//获取url列表, c的默认callback
Dealer.prototype.processList = function(err,result,$){
    if(err){
	logger.error(err);
    }else{
		if(!$){
			logger.error('$ is empty.');
		}
		logger.info("processList start");	
		fs.writeFile("/home/zero/tmp.html", result.body, null);

		var type = result.options.type;
		var linklist = $(".title-txt_2");
		logger.info("link length:%d", linklist.length);
		for (var i = 0; i < linklist.length; i++) {
			var linkstr = linklist.eq(i).attr('href');
			var title = linklist.eq(i).attr('title');
			logger.info("link :%s, %s", linkstr, title);
			c.queue({uri:"http://www.baiinfo.com/"+linkstr, 
				type:type, title:title,encoding:null,
				callback:function(err, result, $){
					that.processItem(err, result, $);
				}
			});
		}

		//next url
		var nextlist = $("a[href]");
		logger.info("link length:%d", nextlist.length);
		for (var i = 0; i < nextlist.length; i++) {
			if(nextlist.eq(i).text() == '下一页'){
				var nextlink = nextlist.eq(i).attr('href');
				logger.info("link :%s", nextlink);
				this.addqueue(["http://www.baiinfo.com/"+nextlink], type);
			}
		}
	}
}

Dealer.prototype.processItem = function(err,result,$){
	if(err){
		logger.error(err);
   	 }
   	 else{
   	 	if (result ) {
   	 		var type = result.options.type;
   	 		var title = result.options.title;
   	 		// if (typeof(result.body) == '') {} else{};
   	 		logger.info(typeof(result.body));
   	 		fs.writeFile(this.resultDir+type+"_"+title+".rar", result.body, function(e){
				if(e){ logger.error(e);}
			});
   	 	};
   	 }
}

var that = new Dealer();
that.start();
