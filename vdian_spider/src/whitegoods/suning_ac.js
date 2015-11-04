var fs = require('fs')
var util = require("util")
var logger = require('winston')
var seenreq = require("seenreq")
var moment = require("moment")
var Crawler = require('node-webcrawler')

var env = process.env.NODE_ENV || "development"

//日志初始化
logger.add(logger.transports.File, { filename: '../../log/suning_ac.log',logstash:true }); 
if(env==="production"){
	    logger.remove(logger.transports.Console);
}

var c = new Crawler({
    maxConnections:1,//必须设为1. 后续涉及到并发
    callback:function(err,result,$){
	that.processList(err,result,$);
    },
    logger:logger,
//    forceUTF8:true,
    debug:env === "development",
    userAgent:"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:35.0) Gecko/20100101 Firefox/35.0",
	jar:true,
	rateLimits:1000//时间间隔，毫秒单位
})

var Dealer = function(){
    this.resultDir = "../../result/suning/";
    this.dataDir = '../../appdata/';
    this.resultFile = "suning_ac_"+moment().format("YYYY-MM-DD")+".txt";
    this.done = {};
    this.seen = new seenreq();
    this.curPageIdx = 1;
	this.recFinish = new Array();
}

Dealer.prototype.init = function(){
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}	
}

Dealer.prototype.start = function(){
    this.init();
    this.wgetList(["http://list.suning.com/0-431504-0-0-0-9017.html"]);
}

//拍重，将url加入到queue中
//使用C的默认callback, 即使用processList处理
Dealer.prototype.wgetList = function(urls){
    urls.filter(
	function(url){
		return !this.seen.exists(url);
    	},this).forEach(
		function(url){
			c.queue(url);
			logger.info(url);
    		});
}

function dealEmpty(value){
    if(typeof(value)=='number'){
        return value;
    }
    else{
        return (value?value:"N/A");
    }
}

function dealstr(str){
	if(typeof(str)=='string'){
		var nodotstr = str.replace(/,/g, ' ');
		return nodotstr.replace(/\s+/g, ' ');
	}                                                                                                           
	else{                                                                                                              
		return str;
	}
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
		//获取item链接，并加入队列
		var itemlink = $(".proName");

//		fs.writeFile("/home/zero/tmp.html", result.body, null);
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

	//proid
	var proid = result.uri.match(/com\/(\d+)\.html/)[1];
	proid = proid||"N/A";	
	//logger.info("uri, proid : %s, %s", result.uri, proid);
	//paramter
	var paramlist = $("#itemParameter");
	logger.info("param length: %d", paramlist.length);

	var trlist = paramlist.find("tr");
	//logger.info("tr length: %d", trlist.length);
	
	var brand, model, series, type, onlinedate,hctype, power, freqtype, powerlevel;
   	var paramnum = 9;

	for(var i=0; i<trlist.length; ++i){
		var tdlist = trlist.eq(i).find("td");
	//	logger.info("td length: %d, %s", tdlist.length, tdlist.eq(0).text().trim());
		if(trlist.length<=0){
			continue;
		}
		var tdname = tdlist.eq(0).text().trim();
		if(tdname.length>15){
			tdname = tdname
		}

	//	logger.info("tdname : %s", tdname.length>15?tdname.substring(0, 14).trim():tdname);
		switch(tdname.length>15?tdname.substring(0, 14).trim():tdname){
			case '品牌':
				brand = tdlist.eq(1).text().trim();
				paramnum--;
				break;
			case '型号':
				model = tdlist.eq(1).text().trim();
				paramnum--;
				break;
			case '系列':
				series = tdlist.eq(1).text().trim();
				paramnum--;
				break;
			case '空调类型':
				type = tdlist.eq(1).text().trim();
				paramnum--;
				break;
			case '上市时间':
				onlinedate = tdlist.eq(1).text().trim();
				paramnum--;
				break;
			case '匹数':
				power = tdlist.eq(1).text().trim();
				paramnum--;
				break;
			case '冷暖类型':
				hctype = tdlist.eq(1).text().trim();
				paramnum--;
				break;
			case '变频/定频':
				freqtype = tdlist.eq(1).text().trim();
				paramnum--;
				break;
			case '国家能效等级':
				powerlevel = tdlist.eq(1).text().trim();
				paramnum--;
				break;
			default:
				break;
		}

		if(paramnum<=0){
			break;
		}
	}

	var detail = {
		"title":titlestr,"proid":proid,	"brand":brand||"N/A", "model":model||"N/A",
		"series":series||"N/A", "type":type||"N/A", "url":result.uri,
		"onlinedate":onlinedate||"N/A", "power":power||"N/A",
		"hctype":hctype||"N/A", "freqtype":freqtype||"N/A", "powerlevel":powerlevel||"N/A"
	};

//	logger.info(detail);
	var retrytimes = 3;
	//价格：易购价，参考价
	var priceurl = util.format("http://www.suning.com/webapp/wcs/stores/ItemPrice/000000000%s__9017_10106_1.html",detail["proid"]);	
	c.queue({
		uri:priceurl, detail:detail, priority:0, retrytimes:retrytimes,
		callback:function(err, result, $){
			that.processPrice(err, result, $);
		}
	});
	this.recFinish.push(1);
	//店铺
	var shopurl = util.format("http://www.suning.com/emall/psl_10052_10051_000000000%s_9017_10106_FourPage.showShopList_.html", detail["proid"]);	
	c.queue({
		uri:shopurl, detail:detail, priority:0, retrytimes:retrytimes,
		callback:function(err, result, $){
			that.processShopName(err, result, $);
		}
	});
	this.recFinish.push(1);

	//评价数
	var reviewurl = util.format("http://review.suning.com/ajax/review_satisfy/general-000000000%s------satisfy.htm", detail["proid"]);
	c.queue({
		uri:reviewurl, detail:detail, priority:0, retrytimes:retrytimes,
		callback:function(err, result, $){
			that.processReview(err, result, $);
		}
	});
	this.recFinish.push(1);

	//保存到硬盘
}

function showSaleStatus(json){
	var result;
	if(json.saleInfo[0].priceType==1){
		result = [json.saleInfo[0].promotionPrice, json.saleInfo[0].netPrice];
	}
	else{
		result = [json.saleInfo[0].promotionPrice, json.saleInfo[0].refPrice];
	}

	return result;
}

Dealer.prototype.processPrice=function(err,result,$){
	logger.info("processPrice start.");
	//fs.writeFile("/home/zero/tmp.dat", result.body, null);

//	var refPrice = result.body.match(/"refPrice":"([^"]+)"/)[1];
//	var prePrice = result.body.match(/"promotionPrice":"([^"]+)"/)[1];
	var refPrice, prePrice ;
	var detail = result.options.detail;
	if(result.body.slice(0,14) == "showSaleStatus"){
		var price = eval(result.body);
		prePrice = price[0];
		refPrice = price[1];
	}
	else{
		var retrytimes = result.options.retrytimes;
		if(retrytimes>0){
			retrytimes--;
			c.queue({
				uri:result.uri, detail:detail, priority:0, retrytimes:retrytimes,
				callback:function(err, result, $){ 
					that.processPrice(err, result, $); 
				}
			});
			return;
		}
	}
	
	detail["refPrice"]=dealEmpty(refPrice);
	detail["prePrice"]=dealEmpty(prePrice);

//	logger.info(detail);
	this.recFinish.pop();
	if(this.recFinish.length<=0){
		this.saveData(detail);
	}
}

Dealer.prototype.processShopName=function(err,result,$){
	logger.info("processShopName start.");
	//fs.writeFile("/home/zero/tmp.dat", result.body, null);
	var shoplist = result.body.match(/"shopName":"([^"]+)"/);
	var shop;
	var detail = result.options.detail;
	if( shoplist && shoplist.length>1){
		shop = shoplist[1];
	}
    else{
		var retrytimes = result.options.retrytimes;
		if(retrytimes>0){
			retrytimes--;
		    c.queue({
			    uri:result.uri, detail:detail, priority:0, retrytimes:retrytimes,
			    callback:function(err, result, $){ 
					that.processShopName(err, result, $); 
				}
			});
			return ;
		}
	}

	detail["shopname"]=shop||"N/A";

//	logger.info(detail);
	this.recFinish.pop();
	if(this.recFinish.length<=0){
		    this.saveData(detail);
	}
}

function satisfy(json){
	return json.reviewCounts[0].totalCount;
}

Dealer.prototype.processReview=function(err,result,$){
	logger.info("processReview start.");
	//var reviewCount = result.body.match(/"totalCount":(\d+),/)[1];
	var reviewCount;
	var detail = result.options.detail;
	if( result.body.slice(0,7) == "satisfy"){
		reviewCount = eval(result.body);
	}
	else{
		var retrytimes = result.options.retrytimes;
		if(retrytimes>0){
			retrytimes--;
			c.queue({
				uri:result.uri, detail:detail, priority:0, retrytimes:retrytimes,
				callback:function(err, result, $){ 
					that.processReview(err, result, $); 
				}
			});
			return ;
		}
	}

	detail["reviewCount"]=dealEmpty(reviewCount);

//	logger.info(detail);
	this.recFinish.pop();
	if(this.recFinish.length<=0){
		    this.saveData(detail);
	}
}

Dealer.prototype.saveData=function(detail){
	logger.info(detail);
	var service = util.format("由\"%s\"销售和发货/并提供售后服务", 
			detail["shopname"]=="苏宁自营"?"苏宁":detail["shopname"]);
	var strdata = detail["title"] + "," + detail["proid"] + "," + detail["shopname"]
			 + "," + detail["brand"] + "," + detail["model"] + "," + detail["prePrice"] 
			 + "," + detail["refPrice"] + "," + detail["series"] + "," + detail["type"]
			 + "," + detail["onlinedate"] + "," + detail["power"] + "," + detail["hctype"]
			 + "," + detail["freqtype"] + "," + detail["powerlevel"] 
			 + "," + detail["reviewCount"] + "," + service+ "\n";
	
	logger.info(strdata);
	fs.appendFile(this.resultDir+this.resultFile, strdata, function(e){
		if(e){ logger.error(e);}
	});
}

var that = new Dealer();
that.start();
//c.queue("http://list.suning.com/0-431504-0-0-0-9017.html");
//c.queue("http://www.suning.com");



