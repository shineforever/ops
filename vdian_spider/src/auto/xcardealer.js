var brandPaths =
    ["/d1000/1.htm",
"/d1000/56.htm",
"/d1000/2.htm",
"/d1000/3.htm",
"/d1000/13.htm",
"/d1000/17.htm",
"/d1000/5.htm",
"/d1000/27.htm",
"/d1000/52.htm",
"/d1000/88.htm",
"/d1000/109.htm",
"/d1000/179.htm",
"/d1000/129.htm",
"/d1000/184.htm",
"/d1000/123.htm",
"/d1000/105.htm",
"/d1000/57.htm",
"/d1000/58.htm",
"/d1000/30.htm",
"/d1000/29.htm",
"/d1000/130.htm",
"/d1000/28.htm",
"/d1000/189.htm",
"/d1000/124.htm",
"/d1000/11.htm",
"/d1000/34.htm",
"/d1000/33.htm",
"/d1000/131.htm",
"/d1000/90.htm",
"/d1000/163.htm",
"/d1000/127.htm",
"/d1000/4.htm",
"/d1000/10.htm",
"/d1000/18.htm",
"/d1000/6.htm",
"/d1000/76.htm",
"/d1000/59.htm",
"/d1000/116.htm",
"/d1000/178.htm",
"/d1000/119.htm",
"/d1000/103.htm",
"/d1000/92.htm",
"/d1000/104.htm",
"/d1000/111.htm",
"/d1000/139.htm",
"/d1000/38.htm",
"/d1000/132.htm",
"/d1000/80.htm",
"/d1000/37.htm",
"/d1000/106.htm",
"/d1000/91.htm",
"/d1000/125.htm",
"/d1000/138.htm",
"/d1000/164.htm",
"/d1000/26.htm",
"/d1000/77.htm",
"/d1000/44.htm",
"/d1000/60.htm",
"/d1000/39.htm",
"/d1000/79.htm",
"/d1000/169.htm",
"/d1000/170.htm",
"/d1000/171.htm",
"/d1000/69.htm",
"/d1000/12.htm",
"/d1000/99.htm",
"/d1000/121.htm",
"/d1000/183.htm",
"/d1000/71.htm",
"/d1000/19.htm",
"/d1000/63.htm",
"/d1000/65.htm",
"/d1000/40.htm",
"/d1000/112.htm",
"/d1000/45.htm",
"/d1000/31.htm",
"/d1000/108.htm",
"/d1000/186.htm",
"/d1000/70.htm",
"/d1000/61.htm",
"/d1000/62.htm",
"/d1000/24.htm",
"/d1000/180.htm",
"/d1000/14.htm",
"/d1000/15.htm",
"/d1000/54.htm",
"/d1000/66.htm",
"/d1000/126.htm",
"/d1000/175.htm",
"/d1000/113.htm",
"/d1000/72.htm",
"/d1000/55.htm",
"/d1000/117.htm",
"/d1000/22.htm",
"/d1000/25.htm",
"/d1000/114.htm",
"/d1000/20.htm",
"/d1000/46.htm",
"/d1000/97.htm",
"/d1000/21.htm",
"/d1000/7.htm",
"/d1000/73.htm",
"/d1000/83.htm",
"/d1000/135.htm",
"/d1000/75.htm",
"/d1000/120.htm",
"/d1000/47.htm",
"/d1000/87.htm",
"/d1000/134.htm",
"/d1000/147.htm",
"/d1000/110.htm",
"/d1000/142.htm",
"/d1000/122.htm",
"/d1000/9.htm",
"/d1000/82.htm",
"/d1000/98.htm",
"/d1000/145.htm",
"/d1000/128.htm",
"/d1000/16.htm",
"/d1000/23.htm",
"/d1000/8.htm",
"/d1000/86.htm",
"/d1000/176.htm",
"/d1000/74.htm",
"/d1000/50.htm",
"/d1000/81.htm",
"/d1000/35.htm",
"/d1000/115.htm",
"/d1000/182.htm",
"/d1000/41.htm",
"/d1000/93.htm",
"/d1000/51.htm"]

var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')
var logger = require('winston')

var env = process.env.NODE_ENV || "development"

var godotTransport = require("winston-godot")
var godot = require("godot")
var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"xcardealer"});//service名称需要更改

logger.add(logger.transports.File, { filename: '../../log/xcardealer.log',logstash:true,handleExceptions:true });
if(env==="production"){
    logger.remove(logger.transports.Console);
}

var Dealer = function(){
    this.resultDir = "../../result/auto/";
    this.dataDir = '../../appdata/';
    this.resultFile = "xcardealer_"+new Date().toString()+".csv";
    this.processFile = "xcardealer_process_"+new Date().toString()+".txt";
    this.done = {};
    this.curPageIdx = 1;
}

Dealer.prototype.init = function(){
    if(fs.existsSync(this.resultDir+this.processFile)){
	fs.readFileSync(this.resultDir+this.processFile).toString().split('\n').reduce(function(pre,cur){
	    if(cur){
		pre[cur]=true;
	    }
	    return pre;
	},this.done);
    }

    if(!fs.existsSync(this.resultDir+this.resultFile)){
    	fs.writeFileSync(this.resultDir+this.resultFile, "\ufeff名称,品牌,地址,电话,加V,店铺属性\n");
    }
    logger.info(this.done);
}

Dealer.prototype.start = function(){
    this.init();
    this.wgetList();
}

Dealer.prototype.wgetList = function(t){
    if(!t){
	var path = null;
	do{
	    path = brandPaths.shift();
	}while(this.done[path] && brandPaths.length>0 );
	
	if(!path){
	    logger.info("[DONE] job done.");
	    logger.remove(godotTransport);
	    client.close();	    
	    return;
	}
	var t = {"path":path,"pageIdx":1,"brand":null,"type":1,"maxPage":undefined};
    }
    var host = "dealer.xcar.com.cn";
    var opt = new helper.basic_options(host,t.path,"GET",false,false,{"type":t.type,"page":t.pageIdx});
    opt.agent = false;
    logger.info("%s, %d/%d",t.brand,t.pageIdx,t.maxPage);
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    },t);
}

Dealer.prototype.processList = function(data,args,res){
    if(!data){
	logger.error("data empty");
	setTimeout(function(){
	    that.wgetList(args[0]);
	},3000);
	return;
    }
    var $ = cheerio.load(data);

    if(!$(".selectedcar_tit b i").text()){
	logger.error("page incorrect.");
	setTimeout(function(){
	    that.wgetList(args[0]);
	},10000);
	return
    }
    
    var records = [];
    if(!args[0].brand){
	args[0].brand = $(".dealer_tb h2").text().trim().split(/\s/)[0];
    }
    var func = function(){
	var links = $("dl dt a",this);
	var title = "";
	var vip = false;
	if(links.length>0){
	    var title = links.first().attr("title");
	}
	if(links.length>1){
	    vip = links.last().attr("class")=="agency_vip";
	}
	title = title && title.replace(/[,，\s]/g,"");
	var phone = $("dl dd.phone em b",this).text()||"无";
	var addr = $("dl dd.site span",this).last().text().trim();
	addr = addr && addr.replace(/[,，\s]/g,"");
	records.push([title,args[0].brand,addr,phone,vip?"是":"否",args[0].type==1?"4s":"综合"].join(','));
    }
    var nextPage = null;
    if(args[0].type==1){
	$("#dlists_4s li").each(func);
	nextPage = $("#dlists_4s div.unify_page a").last();
    }else{
	$("#dlists_zh li").each(func);
	nextPage = $("#dlists_zh div.unify_page a").last();
    }
    
    if (records.length>0) {
    	fs.appendFileSync(this.resultDir+this.resultFile, records.join('\n')+"\n");
    };
    
    if(!args[0].maxPage && nextPage){
	var maxPage = nextPage.prev();
	args[0].maxPage = Number(maxPage.text());
    }
    
    var nextPageClass = nextPage && nextPage.attr('class');
    
    if(nextPageClass && nextPageClass.trim()=="page_down"){
	args[0].pageIdx++;
	setTimeout(function(){
	    that.wgetList(args[0]);
	},100);
    }else{
	//no more pages.
	logger.info("[DONE] %s, %d",args[0].brand,args[0].type);
	if(args[0].type==1){
	    args[0].type=2;
	    args[0].pageIdx = 1;
	    args[0].maxPage = undefined;
	    setTimeout(function(){
		that.wgetList(args[0]);
	    },100);
	}else{
	    fs.appendFileSync(this.resultDir+this.processFile,args[0].path+"\n");
	    setTimeout(function(){
		that.wgetList();
	    },100);
	}	
    }
}

var instance = new Dealer();
var that = instance;
instance.start();
