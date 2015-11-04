var http = require('http')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')

function Rent() {
    this.dataDir = '../appdata/';
    this.resultDir = '../result/';
    this.cities = [];
    this.cityFile = "58.city.txt";
    this.resultFile = '58_regions.txt';
    this.doneCities = [];
}

Rent.prototype.init = function(){
    this.cities = fs.readFileSync(this.dataDir + this.cityFile).toString().split('\n').filter(function (line,i) {
        if (i >11) return false;
        return true;
    }).map(function (line) {
        if (!line) return;
        line = line.replace('\r', '');
        var vals = line.split(',');
        return { cname: vals[0], cen: vals[1] };
    });
}


Rent.prototype.start = function(){
    this.init();
    this.wgetLocationData();
}

Rent.prototype.wgetLocationData = function(){
    if(this.cities.length==0){
	fs.appendFileSync(this.resultDir+this.resultFile,JSON.stringify(this.doneCities));
	return;
    }

    var c = this.cities.shift();
    var opt = new helper.basic_options(c.cen+".58.com","/chuzu/");
    console.log("[GET ] %s",c.cname);
    opt.agent = false;
    helper.request_data(opt,null,function(data,args,res){
	that.processLocationData(data,args,res);
    },c);
}
Rent.prototype.processLocationData = function(data,args,res){
    if(!data){
	console.log("data empty.");
    }

    if(!args[0].districts){
	args[0].districts = [];
    }
    var $ = cheerio.load(data);
    var quyu = $("div.relative dl").first();
    $("dd>a",quyu).each(function(){
	if($(this).attr("id") == "fissionid"){
	    return;
	}
	var path = $(this).attr("href");
	var dPinyin = path && path.replace(/\/chuzu\//g,"").replace(/\//g,"");
	if(!dPinyin.trim() || dPinyin.indexOf("sub")==0){
	    return;
	}
	var dName = $(this).text();
	console.log("[DATA ] %s, %s",dName,dPinyin);
	args[0].districts.push({"pinyin":dPinyin,"name":dName,"regions":[]});
    });
    this.dIdx = 0;
    this.wgetRegions(args[0]);
}

Rent.prototype.wgetRegions = function(city){
    if(this.dIdx == city.districts.length){
	console.log("districts done. %s", city.cname);
	this.doneCities.push(city);
	this.wgetLocationData();
	return;
    }
    
    var district = city.districts[this.dIdx];
    console.log(this.dIdx+","+JSON.stringify(district));

    var opt = new helper.basic_options(city.cen+".58.com","/"+district.pinyin+"/chuzu/");
    console.log("[GET ] %s",district.name);
    opt.agent = false;
    helper.request_data(opt,null,function(data,args,res){
	that.processRegions(data,args,res);
    },city,district);
}
Rent.prototype.processRegions = function(data,args,res){
    if(!data){
	console.log("data empty");
    }
    var $ = cheerio.load(data);
    
    $(".subarea a").each(function(){
	var path = $(this).attr("href");
	var rPinyin = path && path.replace(/\/chuzu\//g,"").replace(/\//g,"");
	if(!rPinyin){
	    return;
	}
	var rName = $(this).text().trim();
	console.log("[GET ] %s, %s",rName,rPinyin);
	args[0].districts[that.dIdx].regions.push({"pinyin":rPinyin,"name":rName});
    });
    this.dIdx++;
    setTimeout(function(){
	that.wgetRegions(args[0]);
    },2000);
}

var instance = new Rent();
var that = instance;
that.start();
