var fs = require('fs')
var Crawler = require('node-webcrawler')
var cheerio = require('cheerio')

var logger = require('winston')
var env = process.env.NODE_ENV || "development"
logger.add(logger.transports.File, { filename: '../../log/jd_aiwu.log',logstash:true ,handleExceptions: true});
if(env==="production"){
    logger.remove(logger.transports.Console);
}

var godotTransport = require("winston-godot")
var godot = require("godot")
var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"jd_aiwu"});//service名称需要更改

// 'http://ad.3.cn/ads/mgets?callback=jQuery2921991&skuids=AD_1488258514&areaCode=1_72_2799&_=1429085579458'
// 'http://d.jd.com/fittingInfo/get?callback=jQuery8585524&skuId=1488258514&_=1429085579556'
// 'http://p.3.cn/prices/mgets?callback=jQuery2101534&type=1&area=1_2800_2850_0&skuIds=J_1512380540%2CJ_1512393156&_=1429090442321'

if(!Date.prototype.toDateStr) {
    Date.prototype.toDateStr = function() {
        var year = this.getFullYear();
        var month = this.getMonth() + 1;
        month = month < 10 ? "0" + month : month;
        var day = this.getDate();
        day = day < 10 ? "0" + day : day;
        return year + "_" + month + "_" + day;
    }
}

function cw(){
	this.resultFile = "../../result/auto/jd_aiwu_" + new Date().toDateStr() + ".csv"
    this.cars = {};
    this.c = new Crawler({
	maxConnectinos:1,
	rateLimits:1000,
	forceUTF8:true,
	onDrain:function(){
		logger.info("Job done.");
		logger.remove(godotTransport);
		client.close();
	},
	callback:function(err,result,$){
	    if(err){
		logger.error(err);
	    }else{
		that.processDetail(result,$);
	    }
	}
    });
}

cw.prototype.init = function(){
    //skuid,品牌,车型,标题,价格
    fs.writeFileSync(this.resultFile, "\ufeffskuid,品牌,车型,标题,价格\n");
}

cw.prototype.start = function(){
    this.init();
    this.wget();
}

cw.prototype.wget = function(){
    this.c.queue({
	uri:'http://bitauto.jd.com/',
	page:1,
	callback:function(err,result,$){
	if(err){
	    logger.error(err);
	}else{
	    that.process(result,$);
	}
    }});
}

cw.prototype.process = function(result,$){
    logger.info("[GOT ] product list %s",$('title').text().trim());
    
    var urls = [];
    $(".mc ul li .jPic a ").each(function(){
	urls.push($(this).attr('href'));
    });
    logger.info("[GOT ] urls %d",urls.length);
    this.c.queue(urls);

    //logger.info(Math.ceil(Number($(".jPage em").text().match(/\d+/)[0])/24));
    this.totalPage = Math.ceil(Number($(".jPage em").text().match(/\d+/)[0])/24);
    if(result.options.page < this.totalPage){
	var p = result.options.page+1;
	this.wgetList(p);
    }
}

cw.prototype.wgetList = function(p){
    var u = 'http://module.jshop.jd.com/module/getModuleHtml.html?appId=176098&orderBy=1&pageNo='+p+'&direction=1&categoryId=0&pageSize=24&domainKey=bitauto&pagePrototypeId=8&pageInstanceId=6491070&moduleInstanceId=11515267&prototypeId=34&templateId=400152&layoutInstanceId=11515267&origin=0&shopId=51210&venderId=55201&callback=processList&_='+new Date().getTime();
    this.c.queue({
	uri:u,
	priority:1,
	page:p,
	jQuery:false,
	callback:function(err,result){
	    if(err){
		logger.error(err);
	    }else{
		eval(result.body);
		if(result.options.page<that.totalPage){
		    that.wgetList(result.options.page+1);
		}
	    }
	}
    });
}

cw.prototype.processDetail = function(result,$){
    logger.info("[GOT ] %s",$("title").text());
    var sku = $('#notice-downp').attr('data-sku');
    
    var tit = $('#name h1').text().trim();
    tit = tit && tit.replace(/【.+】/,'');
    tit = tit && tit.replace(/\s+/,' ');
    var vals = tit.split(' ');
    
    this.cars[sku] = {'sku':sku,'title':tit,'detail':vals};
    
    var u = 'http://p.3.cn/prices/mgets?callback=processPrice&type=1&area=1_2800_2850_0&skuIds=J_'+sku+'&_='+new Date().getTime();
    
    this.c.queue({
	uri:u,
	jQuery:false,
	callback:function(err,result){
	if(err){
	    logger.error(err);
	}else{
	    eval(result.body);
	}
    }});
}

function processPrice(obj){
    var sku = obj[0].id.replace('J_','')
    , c = that.cars[sku];
    c.price = obj[0].p;
    
    var r = [c.sku,c.detail[0],c.detail[1],c.title,c.price,'\n'].join();
    fs.appendFileSync(that.resultFile,r);
    logger.info('[DONE] %s',r);
}

function processList(obj){
    if(obj.result){
	var $ = cheerio.load(obj.moduleText);
	var urls = [];
	$(".jPic a").each(function(){
	    urls.push($(this).attr('href'));
	});
	that.c.queue(urls);
	logger.info("[GOT ] urls %d",urls.length);
    }
}

var that = new cw();
that.start();
