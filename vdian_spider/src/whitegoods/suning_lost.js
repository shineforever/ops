var fs = require('fs')
var util = require("util")
var logger = require('winston')
var seenreq = require("seenreq")
var moment = require("moment")
var Crawler = require('node-webcrawler')

var env = process.env.NODE_ENV || "development"

//日志初始化
logger.add(logger.transports.File, { filename: '../../log/suning_lost.log',logstash:true }); 
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
	this.type='';
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

Dealer.prototype.processAcItem=function(detail, $){
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

	detail = {
		"brand":brand||"N/A", "model":model||"N/A",
		"series":series||"N/A", "type":type||"N/A", 
		"onlinedate":onlinedate||"N/A", "power":power||"N/A",
		"hctype":hctype||"N/A", "freqtype":freqtype||"N/A", "powerlevel":powerlevel||"N/A"
	};
	return detail;
}

Dealer.prototype.processWmItem=function(detail, $){
	//paramter
	var paramlist = $("#itemParameter");
	logger.info("param length: %d", paramlist.length);

	var trlist = paramlist.find("tr");
	//logger.info("tr length: %d", trlist.length);
	
	var brand, model, capacity, type, onlinedate, powerlevel;
   	var paramnum = 6;

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
			case '洗衣容量':
				capacity = tdlist.eq(1).text().trim();
				paramnum--;
				break;
			case '产品类型':
				type = tdlist.eq(1).text().trim();
				paramnum--;
				break;
			case '上市时间':
				onlinedate = tdlist.eq(1).text().trim();
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

	detail = {
		"brand":dealstr(brand)||"N/A", "model":dealstr(model)||"N/A",
		"type":dealstr(type)||"N/A", "onlinedate":dealstr(onlinedate)||"N/A",
		"capacity":dealstr(capacity)||"N/A", "powerlevel":dealstr(powerlevel)||"N/A"
	};
	return detail;
}

Dealer.prototype.processFriItem=function(detail, $){
	//=======paramter
	var paramlist = $("#itemParameter");
	logger.info("param length: %d", paramlist.length);

	var trlist = paramlist.find("tr");
	//logger.info("tr length: %d", trlist.length);
	
	var brand, model, series, doortype, onlinedate,coldtype, powerlevel, capacity;
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
			case '箱门结构':
				doortype = tdlist.eq(1).text().trim();
				paramnum--;
				break;
			case '上市时间':
				onlinedate = tdlist.eq(1).text().trim();
				paramnum--;
				break;
			case '制冷方式':
				coldtype = tdlist.eq(1).text().trim();
				paramnum--;
				break;
			case '国家能效等级':
				powerlevel = tdlist.eq(1).text().trim();
				paramnum--;
				break;
			case '总有效容积':
				capacity = tdlist.eq(1).text().trim();
				paramnum--;
				break;
			default:
				break;
		}

		if(paramnum<=0){
			break;
		}
	}

	detail = {
		"brand":dealstr(brand)||"N/A", "model":dealstr(model)||"N/A",
		"series":dealstr(series)||"N/A", "doortype":dealstr(doortype)||"N/A",
		"onlinedate":dealstr(onlinedate)||"N/A", "coldtype":dealstr(coldtype)||"N/A",
		"capacity":dealstr(capacity)||"N/A", "powerlevel":dealstr(powerlevel)||"N/A"
	};
	return detail;
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

	var detail;
	//====param====
	switch(this.type){
		case 'ac':
			detail = this.processAcItem(detail, $);	
			break;
		case 'wm':
			detail = this.processWmItem(detail, $);
			break;
		case 'fri':
			detail = this.processFriItem(detail, $);
			break;
		default:
			return ;
	}

	detail['title'] = titlestr;
	detail['proid']=proid;
	detail["url"]=result.uri;

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
		logger.info("price err: %d", detail['proid']);   
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
		logger.info("shopname err: %d", detail['proid']);   
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
		logger.info("review err: %d", detail['proid']);
	}

	detail["reviewCount"]=dealEmpty(reviewCount);

//	logger.info(detail);
	this.recFinish.pop();
	if(this.recFinish.length<=0){
		    this.saveData(detail);
	}
}

function buildAcRec(detail){
	var service = util.format("由\"%s\"销售和发货/并提供售后服务", 
			detail["shopname"]=="苏宁自营"?"苏宁":detail["shopname"]);
	var strdata = detail["title"] + "," + detail["proid"] + "," + detail["shopname"]
			 + "," + detail["brand"] + "," + detail["model"] + "," + detail["prePrice"] 
			 + "," + detail["refPrice"] + "," + detail["series"] + "," + detail["type"]
			 + "," + detail["onlinedate"] + "," + detail["power"] + "," + detail["hctype"]
			 + "," + detail["freqtype"] + "," + detail["powerlevel"] 
			 + "," + detail["reviewCount"] + "," + service+  "," + detail["url"]+ "\n";
	return strdata;
}

function buildWmRec(detail){
	//logger.info(detail);
	var service = util.format("由\"%s\"销售和发货/并提供售后服务", 
			detail["shopname"]=="苏宁自营"?"苏宁":detail["shopname"]);
	var strdata = detail["title"] + "," + detail["proid"] + "," + detail["shopname"]
			 + "," + detail["brand"] + "," + detail["model"] + "," + detail["prePrice"] 
			 + "," + detail["refPrice"] + "," + detail["type"] +","+detail["onlinedate"]
			 + "," + detail["capacity"] + "," + detail["powerlevel"] 
			 + "," + detail["reviewCount"] + "," + service + "," + detail["url"]+ "\n";
	return strdata;
}

function buildFriRec(detail){
	var service = util.format("由\"%s\"销售和发货/并提供售后服务", 
			detail["shopname"]=="苏宁自营"?"苏宁":detail["shopname"]);
	var strdata = detail["title"] + "," + detail["proid"] + "," + detail["shopname"]
			 + "," + detail["brand"] + "," + detail["model"] + "," + detail["prePrice"] 
			 + "," + detail["refPrice"] + "," + detail["series"] + "," + detail["doortype"]
			 + "," + detail["onlinedate"] + "," + detail["capacity"] 
			 + "," + detail["powerlevel"] + "," + detail["reviewCount"] 
			 + "," + detail["coldtype"] + "," + service + "," + detail["url"] + "\n";
	return strdata;
}

Dealer.prototype.saveData=function(detail){
	//logger.info(detail);
	var strdata;
	switch(this.type){
		case 'ac':
			strdata = buildAcRec(detail);	
			break;
		case 'wm':
			strdata = buildWmRec(detail);
			break;
		case 'fri':
			strdata = buildFriRec(detail);
			break;
		default:
			return ;
	}
	
	//logger.info(strdata);
	fs.appendFile(this.resultDir+this.resultFile, strdata, function(e){
		if(e){ logger.error(e);}
	});
}


Dealer.prototype.init = function(){
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}	
}

Dealer.prototype.start = function(){
    this.init();
	
	this.type = process.argv.splice(2)[0];
	if(this.type!='ac' && this.type!='fri' && this.type!='wm'){
		logger.info("node suning_lost.js <ac|wm|fri>");
		return;
	}

	//读取文件，加入队列
	if(!fs.existsSync('lost/' + this.type)){
		return ;	
	}

	//var filelist = fs.readdirSync('lost/');
	//logger.info(filelist);
	//for(var i=0; i< filelist.length; ++i){
		this.resultFile = "suning_" + this.type + "_" 
				+moment().format("YYYY-MM-DD_HHmmss")+".txt";
		logger.info(that.resultFile);
		var content = fs.readFileSync('lost/'+this.type);
		var conStr = content.toString();
		var proidlist = conStr.trim().split('\n');
		logger.info("len %d", proidlist.length);
		for(var j = 0; j<proidlist.length; ++j){
			var url = util.format("http://product.suning.com/%s.html",proidlist[j].trim() );
			c.queue({uri:url, callback:function(err, result, $){
				that.processItem(err, result, $);
			}});
		}
	//}
}

var that = new Dealer();
that.start();
