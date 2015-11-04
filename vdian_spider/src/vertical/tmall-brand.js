var Crawler = require('crawler')
var fs = require('fs')
var helper = require("../../helpers/webhelper.js")
var cheerio = require('cheerio')

var resultFile="../../result/vertical/pd.tmall.txt";
var resultBrandFile = "../../result/vertical/brand.tmall.txt";
var today = new Date().toDatetime();

var c = new Crawler({
    maxConnections:5,
    callback:listProduct,
    userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36",
    debug:true,
    forceUTF8:true
});

function listBrand(error,result,$){
    if(error){
	console.log(error);
    }
    
    $(".l-floor.J_Floor.placeholder.ju-wrapper").each(function(){
	var url = $(this).attr("data-ajax");
	if(!url) return;
	//console.log(url);
	c.queue({
	    uri:url,
	    callback:processList,
	    jQuery:false
	});
    });
}

function processList(error,result){
    if(error){
	console.log(error);
    }
    var data = result.body;
    if(typeof data === 'string'){
	data = JSON.parse(data);
    }
    var reg = /brand_items\.htm/i;
    if(data.brandList.length>0){
	var records = [""];
	data.brandList.forEach(function(b){
	    var i = b.baseInfo;

	    var m = b.materials;
	    var r = b.remind;
	    var p = b.price;
	    if(reg.test(i.activityUrl)){
		c.queue(i.activityUrl);
		//console.log(i);
		var desc = m.brandDesc && m.brandDesc.replace(/\s/g,'');
		records.push([i.activityUrl,i.brandId,i.sellerId,desc,p.discount,r.soldCount,r.timeRemind,today].join("\t"));
	    }
	});
	fs.appendFileSync(resultBrandFile,records.join("\n"));
    }
}

function listProduct(error,result,$){
    if(error){
	console.log(error);
    }
    //console.log(result.body);
    //var left="";
    var records=[""];
    $("#floor1 .ju-itemlist > ul > li").each(function(){
	var tit = $("h3.shortname",this).text().trim();
	//left = $("div.row div.lefttime strong",this).text().trim();
	var soldcount = $("div.row div.soldcount em",this).text().trim();
	var price = $("div.row.row-price span.price span.actPrice em",this).text().trim();
	var oriPrice = $("div.row.row-price span.price span.dock del",this).text().trim();
	records.push(["",tit,soldcount,price,oriPrice,today].join("\t"));
    });
    
    $("div.l-floor.J_Floor.J_ItemList").each(function(){
	var url = $(this).attr("data-url");
	if(!url) return;
	c.queue({
	    uri:url,
	    callback:processProducts,
	    jQuery:false
	});
    });

    fs.appendFileSync(resultFile,records.join("\n"));
}

function jsonpfloor(obj){
    return obj.html;
}

function processProducts(error,result){
    if(error){
	console.log(error);
    }
    
    if(result && result.body){
	var func = "jsonpfloor"+result.body.trim();
	var html = eval(func);
	//var data = JSON.parse(str);
	var $ = cheerio.load(html);
	var records = [""];
	$("li.item-small-v3").each(function(){
	    var tit = $("div.status-avil > a > h4",this).text().replace(/\s/g,'');
	    var subtit = $("div.status-avil > a > h3",this).text().replace(/\s/g,'');
	    var price = $("div.status-avil > a > div.item-prices div.price em",this).text();
	    var oriprice = $("div.status-avil > a > div.item-prices .dock del",this).text().replace(/\s/g,'');
	    var soldcount = $("div.status-avil > a > div.item-prices .prompt span.sold-num em",this).text().replace(/\s/g,'');
	    records.push([subtit,tit,soldcount,price,oriprice,today].join("\t"));
	});
	var r = records.join("\n");
	console.log(r);
	fs.appendFileSync(resultFile,r);
    }
}

c.queue({uri:"http://ju.taobao.com/tg/brand.htm?spm=608.2291429.102202.4.Jll9mn",callback:listBrand});
