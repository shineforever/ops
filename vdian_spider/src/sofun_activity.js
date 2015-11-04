var fs = require("fs")
var cheerio = require('cheerio')
var helper = require('../helpers/webhelper.js')
var Url = require("url")
var spawn = require('child_process').spawn

function Sofun() {
    this.resultDir = "../result/";
    this.dataDir = "../appdata/";
    this.resultFile = "sofun_activity_"+new Date().toString()+".txt";
    this.cities = [];
    this.taskQueue = [];
    this.interval = [0, 500];
    this.doneItems = {};
}

Sofun.prototype.init = function () {
    
}
Sofun.prototype.start = function () {
    var opt = new helper.basic_options('manage.news.fang.com',"/fangbu/index.jsp");
    helper.request_data(opt,null,function(data,args,res){
	that.process(data,args,res);
    });
}

Sofun.prototype.process = function(data,args,res){
    if(!data){
	console.log("no data");
	return;
    }
    console.log("[DONE] index page.");
    var $ = cheerio.load(data);
    $("#slideTxtBoxa #cityTab ul li").each(function(){
	var pinyin = $(this).attr("id");
	var name = $("a",this).text();
	var url = $("a",this).attr("href");
	that.cities.push({"pinyin":pinyin,"name":name,"url":url});
    });
    this.wgetCity();
}

Sofun.prototype.wgetCity = function(){
    if(this.cities.length==0){
	console.log("done.");
	var sendMail = spawn('node',['test_email.js']);
	sendMail.on('close',function(code){
	    console.log("mail sent.");
	});
	return;
    }
    var city = this.cities.shift();
    var parsedUrl = Url.parse(city.url);
    console.log("[GET] %s",city.name);
    var opt = new helper.basic_options('manage.news.fang.com',"/fangbu/index.jsp",'GET',false,false,{'city':city.pinyin});
    console.log(opt);
    //var opt = new helper.basic_options(parsedUrl.host,parsedUrl.pathname,'GET',false,false,parsedUrl.query);
    helper.request_data(opt,null,function(data,args){
	that.processCity(data,args);
    },city);
}

Sofun.prototype.processCity = function(data,args){
    if(!data){
	console.log("no data. processCity");
    }
    var $ = cheerio.load(data);
    console.log("[DONE] %s",args[0].name);
    args[0].houses = [];
    $(".bt_lplist .bt_lplist_img").each(function(){
	var houseName = $("li.li_lf strong",this).text().trim();
	houseName = houseName && houseName.replace(/[,，]/g,';');
	var match = houseName.match(/(?:\[|【)([^\]]*)(?:\]|】)/);
	var district = match && match.length>1 && match[1];
	houseName = houseName.replace(/(\[|【)[^\]]*(\]|】)/,'');
	var promo = $("li.li_lf p",this).text().trim();
	promo = promo && promo.replace(/[,，]/g,";");
	var commitCount = Number($("li.li_ri p",this).eq(0).text().match(/\d+/)[0]);
	var m = $("li.li_ri p",this).eq(1).text().match(/\d+/);
	var pps = m && m[0] && Number(m[0]);
	var update = new Date().toYYMMDD();
	var house = {"houseName":houseName,"promo":promo,"commitCount":commitCount,"pps":pps,"update":update,"district":district};
	args[0].houses.push(house);
	fs.appendFileSync(that.resultDir+that.resultFile,[args[0].name,houseName,promo,commitCount,pps,update,district,'\n'].join());
	console.log(house);
    });
    setTimeout(function(){
	that.wgetCity();
    },500);
}

var sofun = new Sofun();
var that = sofun;
sofun.start();
