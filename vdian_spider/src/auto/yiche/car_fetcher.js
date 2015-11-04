var rootUrl = "http://dealer.bitauto.com";
var fileRoot = "/home/bda/Projects/spider/src/auto/yiche/";
var outputFileRoot = "/home/bda/Projects/spider/result/";
var urlFile = "url.txt";
var count = 0;
var cheerio = require("cheerio");
var fs = require("fs");
function getUrl(fileText, callback) {
    var list = fileText.split("  \n");
    for (var index in list) {
        var s = list[index];
        var l = s.split("\t");
        var brand = l[0];
        var url = l[1];
        callback(brand, url);
    }
}

function shopType(i) {
    if (i == 1) {
        return "zonghe";
    }
    if (i == 2) {
        return "4s";
    }
    return "texv";
}

function start() {
    var fs = require("fs");
    fs.readFile(fileRoot + urlFile, "utf8", function(err, data) {
        if (err) {
            throw err;
        }
        getUrl(data, function(brand, subUrl) {
            for (var i = 1; i < 4; ++ i) {
                var h = brand + "\t" + shopType(i);
                getBrandData(h, rootUrl + subUrl + "?BizModes=" + i, function(hh, data) {
                    var now = new Date();
                    var mn = now.getMonth() + 1;
                    var t = now.getFullYear() + "-" + mn + "-" + now.getDate();
                    fs.appendFile("yicheShop.txt",t + "\t" + hh + "\t" + data + "\n", "utf8", function(err) {
                        if (err) {
                            console.log("file");
                        }
                    })
                });
            }
        });
    });
}

function getBrandData(h, url, callback) {
    function getNextData(hh, subUrl) {
        getBrandData(hh, rootUrl + subUrl, callback);
    }
    download(h, url, function(u, hh, html) {
        parseHtml(u, hh, html, getNextData, callback);
    });
}

function parseHtml(u, hh, html, callback1, callback2) {
    var $ = cheerio.load(html);
    var list = $("span.next_off");

    if (list.length == 0) {
        var subUrl = $(".the_pages").find("a").last().attr("href");
	
        var sul = "" + subUrl;
        if (sul != "undefined") {
            callback1(hh, sul);
        }
    }
    var dt = $(".clearfix");
    dt.each(function(i, e) {
        var data = "";
        $("b.qg-ico-box", this).replaceWith("");
        data = data + $("span.phone-sty", this).text().trim();
        data = data + "\t" + $("div.p-tit a", this).text().trim();
        data = data + "\t" + $("div.infor-box", this).text().trim();
	console.log(data);
        callback2(hh, data);
    });
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
            callback(url, h, data);
        });
    }).on("error", function(e) {

        fs.appendFile("errorurl.txt", url + "\n", "utf8", function(err) {
            if (err) {
                console.log("file");
            }
        });
    });
}

exports.download = download;
exports.parseHtml = parseHtml;
start();
