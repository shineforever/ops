/***************************************
Title     : task 12
Author    : Mark@BDA 
E-mail    : bda20141107@gmail.com
Edit time : 2014/11/12 - 
language  : js
platform  : ubuntu 12.10LTS & node.js v.0.10.33
modules   : cheerio & url & path & fs
selfModule: webhelper.js

==  website tree  ==
			indexPage(select city)
					  |
-------------------------------------------------
|	|	|	|	|	|	|	|	|	|	|	|	|
A 	B 	C 	D 	E 	F 	G 	H 	I 	J 	K 	L 	M ...
|
-------------(car OnSale)
|	|	|	|
a1 	a2 	a3 	a4
|
Detail
***************************************/
var helper = require("../helpers/webhelper.js");
var querystring = require("querystring");
var cheerio = require("cheerio");
var fs = require("fs");
var path = require("path");
var url = require("url");

var root = 'http://mall.autohome.com.cn/home/changecity';

function selectCity(rootURL){
	var t = url.parse(rootURL);
	var opt = helper.basic_options;
}