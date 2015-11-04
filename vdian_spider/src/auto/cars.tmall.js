var fs = require("fs")
var Crawler = require("node-webcrawler")
var helper = require("../../helpers/webhelper.js")
var URL = require("url")
var logger = require('winston')

var env = process.env.NODE_ENV || "development"

var godotTransport = require("winston-godot")
var godot = require("godot")
var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"cars.tmall"});//service名称需要更改

logger.add(logger.transports.File, { filename: '../../log/cars.tmall.log',logstash:true,handleExceptions:true });
if(env==="production"){
    logger.remove(logger.transports.Console);
}

var resultFile = "../../result/auto/cars.tmall_"+new Date().toString()+".csv";
var cars = {};
fs.writeFileSync(resultFile, "\ufeff价钱,月成交量,标题,品牌,车系,日期\n");


function processList(error,result,$){
    if(error){
	logger.error(error);
	return ;
    }
    
    if(!$){
	logger.error("$ is empty.");
	return;
    }
    var urls=[];
    
    $(".product").each(function(){
              var url = $("p.productTitle a",this);
              if (!url || url.length==0) {
                logger.info("no link: %s", result.uri);
                return;
              };
	urls.push("http:"+url.attr("href"));
	var id = $(this).attr("data-id");
	cars[id]=[];
	cars[id].push($("p.productPrice",this).text().replace(/\s/g,''));
	cars[id].push($("p.productStatus span em",this).text().replace(/笔/,''));
    });
    //logger.info(cars);
    logger.info("urls: %d",urls.length);
    c.queue(urls);
    if($(".ui-page .ui-page-num a.ui-page-next").length>0){
	c.queue({uri:"http://list.tmall.com/search_product.htm"+$(".ui-page-next").attr("href"),callback:processList});
    }
}

function processDetail(error,result,$){
    if(error){
	logger.error(error);
	return;
    }
    
    if(!$){
	logger.error("$ is empty");
	return;
    }
    
    var id = URL.parse(result.uri,true).query.id;
    var tit = $(".tb-detail-hd h1").text().trim();
    var t = tit.split(/\s/)[0];
    cars[id].push(t);
    cars[id].push($('#J_attrBrandName').text().replace(/品牌:/,''));
    cars[id].push($('#J_AttrUL li').eq(1).text().replace(/车(型|系)(,|:)/g,''));
    cars[id].push(new Date().toString());
    
    var r = cars[id].join(",");
    
    // logger.info(r);
    fs.appendFile(resultFile,r,function(e){if(e) logger.error(e);});
    fs.appendFile(resultFile,"\n",function(e){if(e) logger.error(e);});
}

var c = new Crawler({
    maxConnections:1,
    callback:processDetail,
    jar:true,
    forceUTF8:true,
    onDrain:function(){
        logger.info("Job done.");
        logger.remove(godotTransport);
        client.close();
    },
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36'
});

c.queue({uri:"http://list.tmall.com/search_product.htm?spm=a220m.1000858.0.0.HGSMWG&cat=50106135&s=0&sort=s&style=g&from=sn_1_cat-qp&active=1&industryCatId=50106135&type=pc#J_Filter",callback:processList});
