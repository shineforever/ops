var fs = require("fs")
var crypto = require("crypto")
var Crawler = require("node-webcrawler")

var password = "shenzhoucar123123";
var algorithm = "aes-128-cbc";
var key = new Buffer(password.slice(0, 16), "binary");
var iv = new Buffer([10,1,11,5,4,15,7,9,23,3,1,6,8,12,13,91]);

if(!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) { 
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

Date.prototype.toString = function() {
    var year = this.getFullYear();
    var month = this.getMonth() + 1;
    var day = this.getDate();
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    return year + "-" + month + "-" + day;
}

function decrypt(encryptedStr) {
	var decipher = crypto.createDecipheriv(algorithm, key, iv);
	var decrypted = decipher.update(encryptedStr, "base64", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
}

function encrypt(toEncrypt) {
	var cipher = crypto.createCipheriv(algorithm, key, iv);
	var encrypted = cipher.update(toEncrypt, "utf8", "base64");
	encrypted += cipher.final("base64");
	return encrypted;
}

var query = {
    takeCityId:"",
    page:15,
    pageNo:1,
    returnCityId:"",
    attentionCity:"",
    takeDate:""
}

function App() {
    this.resultDir = "../../result/app/";
    this.resultFile = "shenzhouzhuanche_" + new Date().toString() + ".txt";
    this.crawler = new Crawler({
        maxConnections:10,
        userAgent:"Apache-HttpClient/UNAVAILABLE (java 1.4)"
    });
}

App.prototype.init = function() {

}

App.prototype.run = function() {
    this.crawler.queue({
        uri:"http://"
    });
}

App.prototype.start = function() {
    this.init();
    this.run();
}

var that = new App();
that.start();
