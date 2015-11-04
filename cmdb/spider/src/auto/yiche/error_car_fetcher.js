var rootUrl = "http://dealer.bitauto.com";
var fileRoot = "/home/bda/Projects/spider/src/auto/yiche/";
var outputFileRoot = "/home/bda/Projects/spider/result/";
var urlFile = "url.txt";
var count = 0;
var cheerio = require("cheerio");
var fs = require("fs");
var urlList=[];
var cur = 0;
function getUrl(fileText, callback) {
    var list = fileText.split("  \n");
    for (var index in list) {
  //  var index = 0;
        var s = list[index];
        var l = s.split("\t");
        var brand = l[0];
        var url = l[1];
        callback(brand, url);
  //      console.log(brand + "\n" + url);
    }
//    callback(true, null, null);
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
    var text = "";
    fs.readFile("errorurl.txt", "utf8", function(err, data) {
        if (err) {
            throw err;
        }
        text += data;
        urlList = text.split("\n");
//        getUrl(data, function(brand, subUrl) {
            //{
                //console.log(i);
//                var url = rootUrl + subUrl + "?BizModes=" + i;
  //              console.log(brand + "\t" + subUrl);
//                var h = brand + "\t" + shopType(i);
                //console.log(url);
//                var s = shopType(i);
                var url = urlList[0];
                getBrandData("", url, function(hh, data) {
                    var now = new Date();
                    var mn = now.getMonth() + 1;
                    var t = now.getFullYear() + "-" + mn + "-" + now.getDate();
                    console.log(count + "\t" + t + "\t" + hh + "\t" + data);
                    count ++;
                    fs.appendFile("yicheShop.txt",t + "\t" + hh + "\t" + data + "\n", "utf8", function(err) {
                        if (err) {
                            console.log("file");
                        }
                    })
                });
            //}
  //      });
    });
}

function getBrandData(h, url, callback) {
    function getNextData(hh, ur) {
        //console.log(rootUrl + subUrl);
        getBrandData(hh, ur, callback);
    }
//    console.log(url);
    download(h, url, function(u, hh, html) {
        parseHtml(u, hh, html, getNextData, callback);
    });
}

function parseHtml(u, hh, html, callback1, callback2) {
//    console.log(html);   
    //count = count + 1;
    //console.log(count);
    //console.log(html);
    var $ = cheerio.load(html);
    var brand = $('div.tree_navigate').find('strong').text();
    var dt = $(".clearfix");
    dt.each(function(i, e) {
        //if (i == 0) {
            var data = "";
            $("b.qg-ico-box", this).replaceWith("");
            data = data + $("span.phone-sty", this).text().trim();
            data = data + "\t" + $("div.p-tit a", this).text().trim();
            data = data + "\t" + $("div.infor-box", this).text().trim();
            callback2(brand + "", data);
        //}
    });
    var list = $("span.next_off");
   // console.log(list.length);
    if (list.length == 0) {
        var subUrl = $(".the_pages").find("a").last().attr("href");
        //console.log(u);
        //console.log(subUrl);
        //console.log("\n");
        var sul = "" + subUrl;
        if (sul != "undefined") {
            callback1(hh, rootUrl + sul);
        } else {if (cur < urlList.length - 1) { cur ++; var sul = urlList[cur]; callback1(hh, sul);}}
    } else {
        if (cur < urlList.length - 1) { cur ++; var sul = urlList[cur]; callback1(hh, sul);}
    }
    
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
      //  callback(null);
        fs.appendFile("errorurl1.txt", url + "\n", "utf8", function(err) {
                        if (err) {
                            console.log("file");
                        }
                    });
        //console.log("fail to get " + url + " error " + e.message);
      //  download(h, url, callback);
    });
}

exports.download = download;
exports.parseHtml = parseHtml;
start();
