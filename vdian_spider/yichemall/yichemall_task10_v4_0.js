/*
Title: task 10
[collecte information(include: car-brand, car-models, Big-Sale-Price, Mall-Price, Factory-Price, salingArea)
from www.yichemall.com]

inc   : BDA Inc.
author: Mark   email : bda20141107@gmail.com
date  : 2014/11/12

language: javascript

nodejs module : cheerio & http & fs & selfModules
version: 4.0

==	website tree  ==
			index
			  |
	---------------------
	|	|	|	|	|	|
  audi bmw
  	|
-------------
|	|	|	|
A7	A8	A6	Q7
|
-----
|	|
FSI TFSI
*/
var helper = require("../helpers/webhelper.js");
var querystring = require("querystring");
var cheerio = require("cheerio");
var fs = require("fs");
var path = require("path");
var url = require("url");

var root = "http://59.151.102.205" || "http://www.yichemall.com";//the root page url
var filename = '../result/huimaiche-com-Task10 @' + Date().split(/\s+/).join('-') + '.txt';
var count = 0;
var mcount = 0;

//queue for urls
var brandQueue = [];
var carTypeQueue = [];

function getBrand(rootURL){
	var t = url.parse(rootURL);
	var opt = new helper.basic_options(t.host, t.path);
	helper.request_data(opt, null, function(data, args){
		if(data){
			var $ = cheerio.load(data);
			var i = 0;
			$("div.brands-item-wraper > a").each(function(i, e){
				console.log(i++ + " : " + $(e).text());
				var brandURL = rootURL + $(e).attr("href");
				brandQueue.push(brandURL);
			});
			travBrand(brandQueue);
		}
	});	
}

function getCarType(brandURL){//che xing
	var t = url.parse(brandURL);
	var opt = new helper.basic_options(t.host, t.path);
	helper.request_data(opt, null, function(data, args){
		if(data){
			var $ = cheerio.load(data);
			var i = 0;
			$("a.dis_in_block.mt10").each(function(i, e){
				console.log(count++ + " : " + $(e).attr("href"));
				carTypeQueue.push(root + $(e).attr("href") + '\n');
			});
			travCarType(carTypeQueue);
		}
	});
}

function getCarModel(typeURL){//kuan shi
	var t = url.parse(typeURL);
	var opt = new helper.basic_options(t.host, t.path);
	helper.request_data(opt, null, function(data, args){
		if(data){
			var $ = cheerio.load(data);
			try{
				var dataModelId = querystring.stringify({"modelId": $("#ModelId").val(), "productName": $("#ProductName").val()});
				console.log(mcount++ + " : " + typeURL);
				var opt = new helper.basic_options(url.parse(root).host, "/SingleProduct/GetProductList", 'POST', false, true, dataModelId);
				helper.request_data(opt, dataModelId, function(data, args){
					var model = data.Product;
					travModels(model);
				});
			}catch(err){
				console.log(err);
			}
			
		}
	})
}

function getDetailInfo(leafURL){
	var t = url.parse(leafURL);
	var opt = new helper.basic_options(t.host, t.path);
	helper.request_data(opt, null, function(data, args){
		if(data){
			var $ = cheerio.load(data);
			if($("h4").length){
				//var carBrand = "品牌 : " + $("h2").attr("title");
				var carBrand = $("h2").attr("title").split(/\s+/);
				fs.appendFileSync(filename, carBrand[0] + ',' + carBrand[1] + ',');
				if(carBrand == "undefined"){
					console.log(data3);
				}
				var carModels = $("#carTab").text().trim();
				fs.appendFileSync(filename, carModels + ',');
								
				//var bigSalePrice = "大促价 : " + $("dd.sc_jia > strong").text().trim();
				var bigSalePrice = $("div.cont > dl > dd.sc_jia > strong").text().trim();
				fs.appendFileSync(filename, bigSalePrice + ',');
							
				//var mallPrice = "商城价 : " + $("#MallPrice").text().trim();
				var mallPrice = $("#MallPrice").text().trim();
				fs.appendFileSync(filename, mallPrice + ',');
									
				//var factoryPrice = "厂商指导价 : " + $("dd.sc_jia > del > span").text().trim();
				var factoryPrice = $("#FactoryPrice").text().trim();
				fs.appendFileSync(filename, factoryPrice + ',');
				
				//var carBrand = "dealer : " + $("h2").attr("title");
				var saleArea = $("#StockNumber").text().trim();
				fs.appendFileSync(filename, saleArea + '\n');
			}else{
				//var carBrand = "品牌 : " + $("h2").attr("title");
				var carBrand = $("h2").attr("title");
				if(carBrand == "undefined"){
					console.log(data3);
				}else{
					try{
						carBrand = carBrand.split(/\s+/);
						fs.appendFileSync(filename, carBrand[0] + ',' + carBrand[1] + ',');	
					}catch(error){
						console.log("brand : " + error);
					}
				}
				
				//var carModels = $("#carTab").text().trim();
				var carModels = $("#carTab").text().trim();
				fs.appendFileSync(filename, carModels + ',');

				fs.appendFileSync(filename, ',');
				//var mallPrice = "商城价 : " + $("#MallPrice").text().trim();
				var mallPrice = $("#MallPrice").text().trim();
				fs.appendFileSync(filename, mallPrice + ',');
				
				//var factoryPrice = "厂商指导价 : " + $("dd.sc_jia > del > span").text().trim();
				var factoryPrice = $("#FactoryPrice").text().trim();
				fs.appendFileSync(filename, factoryPrice + ',');
				
				//var saleArea = "售卖地区 : " + $("#currentProvince").text().trim() + "  " + $("#currentCity").text().trim() + "  " + $("#currentDealer").text().trim();
				var saleArea = $("#currentProvince").text().trim() + "," + $("#currentCity").text().trim() + "," + $("#currentDealer").text().trim();
				fs.appendFileSync(filename, saleArea + '\n');
			}
		}
	});
}

function travBrand(qBrand){//queue of brands url
	var len = qBrand.length;
	for(var i = 0; i < len; i++){
		var current = qBrand.shift();
		getCarType(current);
	}
}

function travCarType(qCarType){
	var len = carTypeQueue.length;
	for(var i = 0; i < len; i++){
		var current = qCarType.shift();
		getCarModel(current);
	}
}

function travModels(model){
	for(var i = 0, len = model.length; i < len; i++){
		//'/car/detail/c_' + res.Product[i].CarId + '_' + encodeURIComponent(res.Product[i].CarName)
		var current = root + '/car/detail/c_' + model[i].CarId + '_' + encodeURIComponent(model[i].CarName);
		getDetailInfo(current);
	}
}
getBrand(root);
//getCarModel('http://59.151.102.205/car/detail/3813');