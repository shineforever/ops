var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')
var Crawler = require("crawler")
var util = require("util")

var c = new Crawler({
    maxConnections:1,
    callback:processList,
    userAgent:"Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch)"
});

var today = new Date().toString();
var resultFile = "../../result/daojiawap_"+today+".txt";
var n=1;
var cities=["bj","sh","gz","sz","tj","cq","hz","cd","wh","nj","sy","hrb","sjz","jn","fz","cs","xa","nc","ty","hf"];

function processList(error,result,$){
    if(error){
	console.log(error);
	c.queue(result.uri);
	return;
    }
    if(!result.body.trim()){
	console.log("[DONE] %s",result.uri);
	if(cities.length>0){
	    n=1;
	    city = cities.shift();
	    c.queue(util.format("http://t.jzt.58.com/%s/xiaoshigongzyy/pn%d/?from=index_daojia_2",city,n));
	}
	return;
    }
    var records = [""];
    $("li dl").each(function(){
	var name = $("dt strong ",this).text().trim();
	var item = "\t";
	$("dd span",this).each(function(){
	    item += $(this).text().trim()+"\t";
	});
	records.push(name+item+city);
    });
    var r = records.join("\n");
    console.log(n);
    fs.appendFileSync(resultFile,r);
    n++;
    c.queue(util.format("http://t.jzt.58.com/%s/xiaoshigongzyy/pn%d/?from=index_daojia_2",city,n));
}
var city = cities.shift();
c.queue(util.format("http://t.jzt.58.com/%s/xiaoshigongzyy/pn%d/?from=index_daojia_2",city,n));

function req(n){
    console.log(n);
    var opt = new helper.basic_options("","","GET",true,true);
    helper.request_data(opt,null,function(data,args,res){
	if(!data){
	    console.log("empty");
	}
	var $ = cheerio.load(data);
	var records = [""];
	$("li dl").each(function(){
	    var name = $("dt strong ",this).text().trim();
	    var item = "\t";
	    $("dd span",this).each(function(){
		item += $(this).text().trim()+"\t";
	    });
	    records.push(name+item);
	});
	var r = records.join("\n");
	console.log(r);
	fs.appendFileSync("../../result/daojiawap.txt",r);
	setTimeout(function(){
	    req(++n);
	},0);
    });
}

//req(1);