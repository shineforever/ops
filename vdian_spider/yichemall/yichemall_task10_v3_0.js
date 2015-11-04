/*
Todo:
collecte information(include: car-brand, car-models, Big-Sale-Price, Mall-Price, Factory-Price, salingArea)
from www.yichemall.com

inc   : BDA Inc.
author: Mark   email : bda20141107@gmail.com
date  : 2014/11/07 -- 2014/11/10

language: javascript

nodejs module : cheerio & http
version: 3.0

change: ignore the 4th level and analysis data3

*/
var cheerio = require("cheerio");
var http = require("http");
var fs = require("fs");

var url = "http://59.151.102.205" || "http://www.yichemall.com";//the root page url
/*website tree
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
var queue = [];//"BFS" -- the child of root url
var queue2 = [];//"BFS" -- the grandChild of root url
//var queue3 = [];// ignore this level

function download(url, callback){
	http.get(url, function(res){
		var data = "";
		res.on('data', function(chunk){
			data += chunk;
		});
		res.on('end', function(){
			callback(data);
		});
	}).on("error", function(err){
		console.log(err + url + '\n\n');
		callback(null);
	});
}

download(url, function(data){
	if(data){
		////console.log(data);
		var $ = cheerio.load(data);
		var x;
		$("div.brands-item-wraper > a").each(function(i,e){
			x = $(e).attr("href");
			////console.log(x);
			queue.push(url + x);
		});
		/*the 2nd level*/
		for(var i = 0, _len = queue.length; i < _len; i++){
			data = "";
			var current = queue.shift();
			download(current, function(data2){
				if(data2){
					$ = cheerio.load(data2);
					$("p.car-name > a").each(function(i,e){
						x = $(e).attr("href");
						////console.log(x);
						queue2.push(url+x);
					});
					/*the 3rd level*/
					for(var i = 0, _len = queue2.length; i < _len; i++){
						var current = queue2.shift();
						download(current, function(data3){
							if(data3){
								$ = cheerio.load(data3);
								if($("h4").length){

									//fs.appendFileSync('../result/yichemall.txt', "--- [BigSale] --- \t");

									//var carBrand = "品牌 : " + $("h2").attr("title");
									var carBrand = $("h2").attr("title").split(/\s+/);
									fs.appendFileSync('../result/yichemall.txt', carBrand[0] + ',' + carBrand[1] + ',');

									if(carBrand == "undefined"){
										console.log(data3);
									}
									var carModels = $("#carTab").text().trim();
									fs.appendFileSync('../result/yichemall.txt', carModels + ',');
									
									//var bigSalePrice = "大促价 : " + $("dd.sc_jia > strong").text().trim();
									var bigSalePrice = $("div.cont > dl > dd.sc_jia > strong").text().trim();
									fs.appendFileSync('../result/yichemall.txt', bigSalePrice + ',');
									
									//var mallPrice = "商城价 : " + $("#MallPrice").text().trim();
									var mallPrice = $("#MallPrice").text().trim();
									fs.appendFileSync('../result/yichemall.txt', mallPrice + ',');
									
									//var factoryPrice = "厂商指导价 : " + $("dd.sc_jia > del > span").text().trim();
									var factoryPrice = $("#FactoryPrice").text().trim();
									fs.appendFileSync('../result/yichemall.txt', factoryPrice + ',');
									
									//var carBrand = "品牌 : " + $("h2").attr("title");
									var saleArea = $("#StockNumber").text().trim();
									fs.appendFileSync('../result/yichemall.txt', saleArea + '\n');
									
								}else{

									//fs.appendFileSync('../result/yichemall.txt', "--- [Normal Price] --- \t");

									//var carBrand = "品牌 : " + $("h2").attr("title");
									var carBrand = $("h2").attr("title");
									if(carBrand == "undefined"){
										console.log(data3);
									}else{
										try{
											carBrand = carBrand.split(/\s+/);
											fs.appendFileSync('../result/yichemall.txt', carBrand[0] + ',' + carBrand[1] + ',');	
										}catch(error){
											console.log(error);
										}
									}
									

									//var carModels = $("#carTab").text().trim();
									var carModels = $("#carTab").text().trim();
									fs.appendFileSync('../result/yichemall.txt', carModels + ',');

									fs.appendFileSync('../result/yichemall.txt', ',');

									//var mallPrice = "商城价 : " + $("#MallPrice").text().trim();
									var mallPrice = $("#MallPrice").text().trim();
									fs.appendFileSync('../result/yichemall.txt', mallPrice + ',');
									
									//var factoryPrice = "厂商指导价 : " + $("dd.sc_jia > del > span").text().trim();
									var factoryPrice = $("#FactoryPrice").text().trim();
									fs.appendFileSync('../result/yichemall.txt', factoryPrice + ',');
									
									//var saleArea = "售卖地区 : " + $("#currentProvince").text().trim() + "  " + $("#currentCity").text().trim() + "  " + $("#currentDealer").text().trim();
									var saleArea = $("#currentProvince").text().trim() + "," + $("#currentCity").text().trim() + "," + $("#currentDealer").text().trim();
									fs.appendFileSync('../result/yichemall.txt', saleArea + '\n');
								}
								
							}else{
								console.log("error 3 : " + current);
							}
						});
						//break;
					}//for x in queue2
				}else{
					console.log("error 2 : " + current);
				}
			});
			//break;
		}//for x in queue

	}else{
		console.log("error 1 : " + url);
	}
});