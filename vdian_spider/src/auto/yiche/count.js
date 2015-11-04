var rootUrl = "http://dealer.bitauto.com";
var inputFileRoot = "/home/bda/Projects/spider/src/auto/yiche/"
var outputFileRoot = "/home/bda/Projects/spider/result/";
var urlFile = "url.txt";
var cnt = 0;
var count = 0;
var cheerio = require("cheerio");
var fs = require("fs");
var num = 0;

function start() {
    var fs = require("fs");
    var text = "";
    fs.readFile("tmp.txt", "utf8", function(err, data) {
        if (err) {
            throw err;
        }
        text += data;
        var a = text.split("\n");
        count = 0;
        for (var index in a) {
            var k = a[index];
            if (k.length > 0) {
                console.log(k);
                var b = k.split("\t");
                console.log(b[2]);
                count += parseInt(b[2]);
            }
        }
        console.log(count);
    });
}

start();
