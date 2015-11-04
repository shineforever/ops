var fs = require("fs");
var cheerio = require("cheerio");

var html = fs.readFileSync("../result/autohome_11_11.txt", "utf8").toString();

var list = html.split("\n");
for(var i = 0, len = list.length; i < len; i++){
	var list2 = list[i].split(/\s+/);
	var out = list2[0] + ', ';
	for(var j = 1, len2 = list2.length; j < len2; j++){
		out += (list2[j]+' ');
	}
	fs.appendFileSync('../result/autohome_11_11_v2.txt', out+'\n');
}
