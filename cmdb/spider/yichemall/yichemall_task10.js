/*
Todo:
collecte information(include: car-brand, car-models, Big-Sale-Price, Mall-Price, Factory-Price, salingArea)
from www.yichemall.com

inc   : BDA Inc.
author: Mark   email : bda20141107@gmail.com
date  : 2014/11/07 -- 2014/11/10

language: javascript

nodejs module : cheerio & http

*/
var cheerio = require("cheerio");
var http = require("http");

var url = "http://www.yichemall.com";//the root page url
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
var queue3 = [];//

function download(url, callback){
	http.get(url, function(res){
		var data = "";
		res.on('data', function(chunk){
			data += chunk;
		});
		res.on('end', function(){
			callback(data);
		});
	}).on("error", function(){
		callback(null);
	});
}

download(url, function(data){
	if(data){
		//console.log(data);
		var $ = cheerio.load(data);
		var x;
		$("div.brands-item-wraper > a").each(function(i,e){
			x = $(e).attr("href");
			//console.log(x);
			queue.push(url + x);
		});
		console.log("done!");
		/*the 2nd level*/
		for(var i = 0, _len = queue.length; i < _len; i++){
			data = "";
			var current = queue.shift();
			console.log("fetch 2nd : " + current);
			download(current, function(data2){
				if(data2){
					//console.log(data2);
					$ = cheerio.load(data2);
					$("p.car-name > a").each(function(i,e){
						x = $(e).attr("href");
						//console.log(x);
						queue2.push(url+x);
					});
					console.log("== done 2! ==");
					/*the 3rd level*/
					console.log("queue2.length = " + queue2.length);
					for(var i = 0, _len = queue2.length; i < _len; i++){
						var current = queue2.shift();
						console.log("fetch 3rd : " + current);
						download(current, function(data3){
							if(data3){
								$ = cheerio.load(data3);
								$("div.tc-box > ul > li > a").each(function(i,e){
									x = $(e).attr("href");
									//console.log("fetch 4th : " + x);
									queue3.push(url+x);
								});
								console.log("===done 3!===");
								console.log("queue3.length = " + queue3.length);
								/*the 4th level*/
								for(var i = 0, _len = queue3.length; i < _len; i++){
									var current = queue3.shift();
									console.log("fetch 4th : " + current);

								}
							}else{
								console.log("error 3");
							}
						});
						break;
					}//for x in queue2
				}else{
					console.log("error 2");
				}
			});
			break;
		}//for x in queue

	}else{
		console.log("error");
	}
});