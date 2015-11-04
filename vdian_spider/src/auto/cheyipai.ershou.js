var fs = require('fs')
var Crawler = require("node-webcrawler")
var URL = require('url')
var logger = require("winston")
var moment = require("moment")
var env = process.env.NODE_ENV || "development;"

logger.add(logger.transports.File, { filename: '../../log/cheyipai.ershou.log',logstash:true,handleExceptions:true });
if(env==="production"){
    logger.remove(logger.transports.Console);
}

var resultFile = "../../result/auto/cheyipai.ershou.txt";
var pageSize = 100;
var bparam = {"sort":"","regCity":"","page":1,"pageSize":100};
var c = new Crawler({
    maxConnections:1,
    rateLimits:1000,
    userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36",
    jQuery:false,
    timeout:15000,
    callback:processList,
    retries:1,
    logger: logger,
    debug:env === "development",
    onDrain:function(){
	logger.info("Job Done!");
    }
});

var keys = ["seriaName",
            "volume",
            "carModelYear",
            "transformMode",
            "modelType",
            "price",
            "mileage",
            "city",
            "regYear",
            "goodsId",
            "useYears"
	   ];

function processList(err,result){
    if(err){
	logger.error(err);
	return;
    }
    
    var obj = null;
    try{
	obj = JSON.parse(result.body);
    }catch(error){
	logger.error(error);
	return;
    }
    
    if(obj.status!==0){
	logger.error(obj.bstatus.desc);
	return;
    }
    
    var maxIdx = Math.ceil(obj.count/100);
    logger.info("cur:%d, total: %d",obj.reqparams.page,maxIdx);
    
    obj.data.forEach(function(item){
	var vals = keys.map(function(k){
	    return item[k];
	});
	
	c.queue({uri:"http://c.cheyipai.com/api/goods/goodsDetail?timeStamp="+new Date().getTime()+'&bparam={"id":"'+item.goodsId+'"}',callback:processDetail,vals:vals});
    });
    
    if(obj.reqparams.page < maxIdx){
	bparam.page = obj.reqparams.page+1;
	c.queue("http://c.cheyipai.com/api/goods/goodsList?timeStamp="+(new Date().getTime())+'&bparam='+JSON.stringify(bparam));
    }
}

function processDetail(err,result){
    if(err){
	logger.error(err);
	return;
    }
    
    var obj = null;
    try{
	obj = JSON.parse(result.body);
    }catch(e){
	logger.error(e);
	return;
    }
    
    var r = result.options.vals;
    r.push(obj.data.cr.checkInfo.crCheckerName);
    r.push(obj.data.cr.checkInfo.crCheckerAccount);
    r.push(obj.data.sellerName);
    r.push(obj.data.goodsNo);
    r.push(obj.data.goodsCarnum);
    r.push(obj.data.goodsOlinedate);
    r.push(obj.data.goodsCheckDate);
    r.push(moment().format("YYYY-MM-DD HH:mm:ss"));
    
    logger.info("serialName: %s",r[0]);
    fs.appendFile(resultFile,r.join()+"\n",function(e){if(e) logger.error(e);});
}

logger.info("start");
c.queue("http://c.cheyipai.com/api/goods/goodsList?timeStamp="+(new Date().getTime())+'&bparam='+JSON.stringify(bparam));
