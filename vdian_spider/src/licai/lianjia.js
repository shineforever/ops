var fs = require('fs')
var util = require("util")
var logger = require('winston')
var seenreq = require("seenreq")
var moment = require("moment")
var Crawler = require('node-webcrawler')

var env = process.env.NODE_ENV || "development"

//日志初始化

var c = new Crawler({
	maxConnections:1,//必须设为1. 后续涉及到并发
	callback:function(err,result,$){
		that.processList(err,result,$);
	},
	logger:logger,
	//forceUTF8:true,
	debug:env === "development",
	userAgent:"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:35.0) Gecko/20100101 Firefox/35.0",
	// jar:true,//cookie
	// agentOptions:
	followRedirect:false,//http 重定向请求
	// strictSSL:true,//If true, requires SSL certificates be valid
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
	this.resultDir = "../../result/licai/";
	this.resultFile = "lianjia_"+moment().format("YYYY_MM_DD")+".txt";
	this.seen = new seenreq();
}

Dealer.prototype.init = function(){
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}	
}

Dealer.prototype.start = function(){
	this.init();
	//this.wgetList(["http://list.suning.com/0-431504-0-0-0-9017.html"]); 
	this.wgetList(["https://licai.lianjia.com/manageMoney/sort?sortType=9&page=2&num=15&t=XKCzUwwa"]);
	// this.wgetList(["https://www.baidu.com/"]);
}

//拍重，将url加入到queue中
//使用C的默认callback, 即使用processList处理
Dealer.prototype.wgetList = function(urls){
	urls.filter(
		function(url){
			return !this.seen.exists(url);
		},this
	).forEach(
		function(url){
			c.queue(url);
			logger.info(url);
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
		return;

		//获取item链接，并加入队列
		var itemlink = $(".proName");		
		logger.info("itemlink length : %d", itemlink.length);

		for(var i = 0; i<itemlink.length; ++i){
			var linkstr = itemlink.eq(i).attr("href");
			logger.info(linkstr);
			c.queue({uri:linkstr, callback:function(err, result, $){
				that.processItem(err, result, $);
			}});
		}		

		//获取下一页链接
		var nextpage = $("#nextPage").not(".disable");
		if( nextpage.length > 0 ){
			npstr="http://list.suning.com"+nextpage.eq(0).attr("href");
			logger.info("Next Page: %s", npstr);
			that.wgetList([npstr]);
		}
	}
}


//获取item数据，并保存到硬盘
Dealer.prototype.processItem = function(err,result,$){
	logger.info("processItem start");
	//fs.writeFile("/home/zero/tmp.html", result.body, null);
	
	//========获取item数据
	//title
	var titlestr = $("#itemDisplayName").text().trim();
	if(!titlestr){
		c.queue({uri:result.uri, callback:function(err, result, $){
			that.processItem(err, result, $);
		}});
		return ;
	}
	titlestr = dealstr(titlestr)||"N/A";
	//logger.info("title name: %s", titlestr);
}

Dealer.prototype.saveData=function(detail){
	logger.info(detail);
	var service = util.format("由\"%s\"销售和发货/并提供售后服务", 
		detail["shopname"]=="苏宁自营"?"苏宁":detail["shopname"]);
	var strdata = detail["title"] + "," + detail["proid"] + "," + detail["shopname"]
	+ "," + detail["brand"] + "," + detail["model"] + "," + detail["prePrice"] 
	+ "," + detail["refPrice"] + "," + detail["type"] +","+detail["onlinedate"]
	+ "," + detail["capacity"] + "," + detail["powerlevel"] 
	+ "," + detail["reviewCount"] + "," + service + "," + detail["url"]+ "\n";
	
	logger.info(strdata);
	fs.appendFile(this.resultDir+this.resultFile, strdata, function(e){
		if(e){ logger.error(e);}
	});
}

var that = new Dealer();
that.start();
//c.queue("http://list.suning.com/0-431504-0-0-0-9017.html");
//c.queue("http://www.suning.com");



