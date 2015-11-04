var rootUrl = "http://dealer.bitauto.com";
var fileRoot = "/home/bda/Projects/spider/src/auto/yiche/";
var outputFileRoot = "/home/bda/Projects/spider/result/";
var urlFile = "url.txt";
var count = 0;
var cheerio = require("cheerio");
var fs = require("fs");
var urlList=[];
var cur = 0;
function logData(hh, data) {
    var now = new Date();
    var mn = now.getMonth() + 1;
    var t = now.getFullYear() + "-" + mn + "-" + now.getDate();
    console.log(count + "\t" + t + "\t" + hh + "\t" + data);
    fs.appendFile(/*outputFileRoot + */"yicheShopNum.txt",t + "\t" + hh + "\t" + data + "\n", "utf8", function(err) {
        if (err) {
            console.log("file");
        }
    });
}
function start() {
    var fs = require("fs");
    var text = "";
    fs.readFile(fileRoot + "url.txt", "utf8", function(err, data) {
        if (err) {
            throw err;
        }
        text += data;
        urlList = text.split("  \n");
        var url = urlList[0];
        getBrandData(url);
    });
}
function getBrandData(url) {
    console.log(url);
    var k = url.split("\t");
    var brand = k[0];
    var su = k[1];
    download(brand, rootUrl + su, parseHtml);
}
function parseHtml(brand, html) {
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
                console.log(k);console.log(count);
            }
            s = s + k;
        }
    });
    logData(brand, s);
    if (cur < urlList.length - 1) { cur ++; var sul = urlList[cur]; getBrandData(sul);}
    
}
function download(h, url, callback) {
    console.log(url);
    var http = require("http");
    http.get(url, function(res) {
        var data = "";
        res.on("data", function(chunk) {
            data += chunk;
        });
        res.on("end", function() {
            callback(h, data);
        });
    }).on("error", function(e) {
        console.log("fail to get " + url + " error " + e.message);
    });
}
exports.download = download;
exports.parseHtml = parseHtml;
start();
