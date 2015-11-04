var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')

function Rent() {
    this.dataDir = '../appdata/';
    this.resultDir = '../result/ganji/';
    this.cities = [];
    this.cityFile = "ganji.regions.txt";
    this.today = new Date().toString();
    var strs = this.today.split('-');
    this.resultFile = 'ganji_rent_'+strs[0]+'-'+strs[1]+'.txt';
    this.pagePerTask = 1;
}

Rent.prototype.init = function(){
    this.cities = JSON.parse(fs.readFileSync(this.dataDir+this.cityFile).toString());
    this.tasks = [];
    for(var i=0; i< this.cities.length;i++){
        var city = this.cities[i];
        var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"districtName":"全部","regionName":"全部","category":city.cname,"class":'1'};
        this.tasks.push(tmp);
        for(var j=0;j<city.districts.length;j++){
            var district = city.districts[j];
            var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"districtName":district.name,"districtPinyin":district.pinyin,"regionName":"全部","category":district.name,"class":'2'};
            this.tasks.push(tmp);
            if(district.regions.length!=0){
                for(var k=0;k<district.regions.length;k++){
                    var region = district.regions[k];
                    var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"districtName":district.name,"districtPinyin":district.pinyin,"regionName":region.name,"regionPinyin":region.pinyin,"category":region.name,'class':'3'}
                    this.tasks.push(tmp);
                }
            }
        }
    }
    
    var arguments = process.argv.splice(2);
    var start = Number(arguments[0]);
    var len = Number(arguments[1]);
    //前闭后开区间
    this.tasks = this.tasks.slice(start,start+len);
    console.log("[INFO] task count: %d",this.tasks.length);
}

Rent.prototype.start = function(){
    this.init();
    this.wgetList();
}

Rent.prototype.wgetList = function(t){
    if(!t){
	if(this.tasks.length==0){
	    console.log("job done.");
	    return;
	}
	t = this.tasks.shift();
	t.pn = 1;
    }
    if(t.class == '3') {
        var pinyin = t.regionPinyin;
        var name = t.regionName;
        var opt = new helper.basic_options(t.cityPinyin+".ganji.com","/fang1/"+pinyin+"/o"+t.pn+"/");
        console.log("[GET ] %s, %s, %s, %d",t.cityName,t.districtName,name,t.pn);
    } else if(t.class == '2') {
        var pinyin = t.districtPinyin;
        var name = t.districtName;
        var opt = new helper.basic_options(t.cityPinyin+".ganji.com","/fang1/"+pinyin+"/");
        console.log("[GET ] %s, %s",t.cityName,t.districtName);
    } else {
        var opt = new helper.basic_options(t.cityPinyin+".ganji.com","/fang1/");
        console.log("[GET ] %s",t.cityName);
    }
    opt.agent = false;
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    },t);
}

Rent.prototype.processList = function(data,args,res){
    if(!data){
	   console.log("data empty.");
        if(args[0].class == '1' || args[0].class == '2') {
            console.log("[DONE] Category: " + args[0].category);
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 4 + 2) * 1000);
        } else {
            args[0].pn++;
            setTimeout(function () {
                that.wgetList(args[0]);
            }, (Math.random() * 4 + 2) * 1000);
        }
    } else {
        var $ = cheerio.load(data);
        var memberCount = 0;
        $("ul.list-style1 li div.list-mod4").each(function(){
        	var link = $("div.info-title>a",this);
        	var name = link.attr("title").trim().replace(/[\s,，]/g,"");
        	var url = link.attr("href");
        	var words = $("div.list-mod2 div.list-word span",this);
        	var houseName,addr;
        	if(words.length>0){
        	    houseName = words.eq(0).text().trim();
        	}
        	if(words.length>1){
        	    addr = words.eq(1).text().trim();
        	}
        	houseName = houseName && houseName.replace(/[\s,，]/g,'');
        	words = $("div.list-mod2 p.list-word",this).text().trim();
        	words = words && words.split("/");
        	var pubDate = words[words.length-1];
        	
        	var member = $("div.list-mod3 p.gj-bang-box span",this).text()||0;
        	if(member)
        	    memberCount++;
        	var top = $("a em.ico-stick-yellow",this).length;
        	var adTop = $("a em.ico-stick-red",this).length;
        	var hot = $("span.ico-hot",this).length;
            var jing = $("span.ico-jing",this).length;
        	//jjrName||"",jjcmp||"",jjbranchcmp||""
            var record = [args[0].cityName,args[0].districtName,args[0].regionName,member,hot,jing,top,adTop,name,houseName||"",pubDate||"",url,that.today,"\n"].join();
        	fs.appendFileSync(that.resultDir+that.resultFile,record);
        });
        
        if(args[0].class == '1' || args[0].class == '2') {
            console.log("[DONE] Category: " + args[0].category);
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 4 + 2) * 1000);
        } else {
            if ($("ul.list-style1 li").length<10 || memberCount<4) {
                console.log("[DONE] less info,Category: " + args[0].category);
                setTimeout(function () {
                    that.wgetList();
                }, (Math.random() * 4 + 2) * 1000);
            } else if ($('.pageLink li a').last().attr("class") == "next" && args[0].pn < this.pagePerTask) {
                data = null;
                args[0].pn++;
                setTimeout(function () {
                    that.wgetList(args[0]);
                }, (Math.random() * 4 + 2) * 1000);
            } else {
                console.log("[DONE] Category: " + args[0].category);
                setTimeout(function () {
                    that.wgetList();
                }, (Math.random() * 4 + 2) * 1000);
            }
        }
    }
}

var instance = new Rent();
var that = instance;
that.start();
