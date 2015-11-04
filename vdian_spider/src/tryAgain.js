//read error file -> get urlList -> reget

var fs = require('fs'),
	request = require('request'),
	cheerio = require('cheerio'),
    readline = require('readline');

var rd = readline.createInterface({
    input: fs.createReadStream('../result/_error_file1415707116520.txt'),
    output: process.stdout,
    terminal: false
});

var time = (new Date()).getTime();
function download(url,callback){
	request(url, function(error, response, body){
		if(!error && response.statusCode == 200){
			callback(body);
		}else{
			console.log(error);
			fs.appendFileSync('../result/_error_file' + time + ".txt", url+"\n");
		}
	});
}

var x = 0;
rd.on('line', function(line) {
	var type_url = line.split(/\s+/);
	switch(type_url[0]){
		case 0:
			
			break;
		case 1:

		case 2:

		case 3:

		default:
			statements_def
			break;
	}
	if(line[line.length-1] == '\/'){

	}else{
		x++;
		console.log(x + "  " + line);

		download(line, function(data){
			if(data){
				var $ = cheerio.load(data);
				var brand = $("h1").text().trim().split(/\s+/).join(' ');
				var carStyle = $("span.car-style").text().trim().split(/\s+/).join(' ');
				var guidePrice = $("span.guide-price > i").text();
				var hotPrice = $("div.hot-price > div > strong").text().trim();

				fs.appendFileSync('../result/0test.txt', brand + "," + carStyle + "," + guidePrice + "," + hotPrice + "\n");
			}else{
				console.log('[failed] to fetch url : ' + leafURL);
			}
		});
	}
});


