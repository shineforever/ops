var request = require("request");
var http = require("http");
var cheerio = require("cheerio");
var fs = require("fs");

var time = (new Date()).getTime();

var brandList = /\<[a]\shref\=\"\/([a-z\-0-9]+)\/\">([\u4E00-\u9FA5\uF900-\uFA2Da-zA-Z]+)<\/a>/g;
var moduleList = /\<[a]\shref\=\"\/([a-z\-0-9]+)\?carid\=([0-9]+)\"\>([\u4E00-\u9FA5\uF900-\uFA2DA-Z0-9a-z\s\.\—\-\·\）\（\(\)]+)\<\/a\>/g;

var selectCityURL = 'http://beijing.huimaiche.com/city';

function download(url,callback){
	request(url, function(error, response, body){
		if(!error && response.statusCode == 200){
			callback(body);
		}else{
			console.log(error);
			fs.appendFileSync('../result/2014AllCityError_file' + time + ".txt", url+"\n");
		}
	});
	/*
	http.get(url, function(res){
		var data = "";
		res.on('data', function(chunk){
			data += chunk;
		});
		res.on('end', function(){
			callback(data);
		});
		

	}).on('error', function(){
		callback(null);
	});
*/
}


download(selectCityURL, function(data){
	if(data){
		var $ = cheerio.load(data);
		$("dl.small-city div.select-city-list > ul > li > a").each(function(i, e){
			var currentCityURL = $(e).attr("href");
			var cityName =$(e).text().trim();
			var rootURL = currentCityURL + '/select';

			download(rootURL, function(data){
				if(data){
					var list = data.match(brandList);
					for(var i = 0, _len = list.length; i < _len; i++){
						var x = list[i];
						var partURL = x.match(/\/([a-z\-0-9]+)\//);
						var nextURL = currentCityURL + partURL[0];
						
						download(nextURL, function(data){
							if(data){
								var $ = cheerio.load(data);
								var double_11_carList = $("div.double-11-carList > ul > li").each(function(i, e){
									var href = $("a.pic", this).attr("href");
									var currentURL = currentCityURL + href;
									download(currentURL, function(data){
										if(data){
											//
											var modelList = data.match(moduleList);
											if(modelList){
												if(modelList.length == 1) console.log(currentURL);
												for(var j = 0, _leng = modelList.length; j < _leng; j++){
													var part2URL = modelList[j].match(/\/([a-z\-0-9]+)\?carid\=([0-9]+)/)[0];
													var leafURL = currentCityURL + part2URL;
													download(leafURL, function(data){
														if(data){
															var $ = cheerio.load(data);
															var brand = $("h1").text().trim().split(/\s+/).join(' ');
															var carStyle = $("span.car-style").text().trim().split(/\s+/).join(' ');
															var guidePrice = $("span.guide-price > i").text();
															var hotPrice = $("div.hot-price > div > strong").text().trim();

															fs.appendFileSync('../result/2014huimaicheAllCity' + time + '.txt', cityName + "," + brand + "," + carStyle + "," + guidePrice + "," + hotPrice + "\n");
														}else{
															console.log('[failed] to fetch url : ' + leafURL);
														}
													});
												}
											}else{
												console.log(modelList + " : " + currentURL);
											}
										}else{
											console.log('[failed] to fetch url : ' + currentURL);
										}
									});
								});
							}else{
								console.log('[failed] to fetch url : ' + nextURL);
							}
						});
						//break;
					}//for 52 brands
					
				}else{
					console.log('[failed] to fetch url : ' + rootURL);
				}
			});
		});
	}else{
		console.log('[**failed**] to fetch city list : ' + selectCityURL);
	}
});