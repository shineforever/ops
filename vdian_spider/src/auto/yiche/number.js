var rootUrl = "http://dealer.bitauto.com";
var inputFileRoot = "/home/bda/Projects/spider/src/auto/yiche/"
var outputFileRoot = "/home/bda/Projects/spider/result/";
var urlFile = "url.txt";
var cnt = 0;
var count = 0;
var cheerio = require("cheerio");
var fs = require("fs");
var num = 0;
function getUrl(fileText, callback) {
    var list = fileText.split("  \n");
    num = list.length;
    for (var index in list) {
        var s = list[index];
        var l = s.split("\t");
        var brand = l[0];
        var url = l[1];
        callback(brand, url);
    }
}

function start() {
    var fs = require("fs");
    fs.readFile(inputFileRoot + urlFile, "utf8", function(err, data) {
        if (err) {
            throw err;
        }
        getUrl(data, function(brand, subUrl) {
            var url = rootUrl + subUrl;
            download(brand, url, parseHtml)
        });
    });
}

function logData(brand, s) {
    var now = new Date();
    var mn = now.getMonth() + 1;
    var t = now.getFullYear() + '-' + mn + '-' + now.getDate();
    var o = t + "\t" + brand + "\t" + s + "\n";
    console.log(brand + "\t" + s);
    fs.appendFile(/*outputFileRoot + */"yicheShopNum.txt", o, "utf8", function(err) {
        if (err) {
            console.log(err);
        }
    });
    cnt = cnt + 1;
    if (cnt >= num) {
        console.log(count);
    }
}

function parseHtml(h, html) {
    var $ = cheerio.load(html);
    var s = "";
    $("li.bt-hover a").each(function(i, e) {
        if (i > 0) {
            var ss = $(this).text();
            var a = ss.split("(");
            var k = Number(a[a.length - 1].split(")")[0]);
            if (a.length == 1) {
                console.log(ss + "-------------------" + h);
            }
            if (i > 1) {
                s = s + "\t";
            } else {
                count = count + k;
            }
            s = s + k;
        }
    });
    logData(h, s);
}

function download(h, url, callback) {
    var http = require("http");
    http.get(url, function(res) {
        var data = "";
        res.on("data", function(chunk) {
            data += chunk;
        });
        res.on("end", function() {
            callback(h, data);
        });
    }).on("error", function() {
      console.log("fail to get num " + url);
    });
}

exports.download = download;
exports.parseHtml = parseHtml;
start();
