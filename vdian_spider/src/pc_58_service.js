var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')

function Rent() {
    this.dataDir = '../appdata/';
    this.resultDir = '../result/58/';
    this.cities = [];
    this.cityFile = '58.city.txt';
    this.services = [];
    this.serviceFile = "58.service.txt";
    this.today = new Date().toString();
    var strs = this.today.split('-');
    this.resultFile = '58_service_'+strs[0]+'-'+strs[1]+'.txt';
    this.pagePerTask = 1;
}

Rent.prototype.init = function(){
    //load city from file
    this.cities = fs.readFileSync(this.dataDir+this.cityFile).toString().split('\n').filter(function (line,i) {
        if (i > 11) return false;
        return true;
    }).map(function (line) {
        if(!line) return;
        line = line.replace('\r', '');
        var vals = line.split(',');
        return { cname: vals[0], cen: vals[1] };
    });

    //load service category file
    this.services = fs.readFileSync(this.dataDir+this.serviceFile).toString().split('\n').map(function (line) {
        if(!line) return;
        line = line.replace('\r', '');
        var vals = line.split(',');
        return {"class": vals[0], "cat1_name": vals[1], "cat2_name": vals[2], "cat_ename": vals[3]};
    });

    //add service task
    this.tasks = [];
    for(var i=0; i< this.cities.length;i++){
        var city = this.cities[i];
        for(var j=0;j<this.services.length;j++){
            var service = this.services[j];
            if (!service) continue;
            var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"cat1_name":service.cat1_name,"cat2_name":service.cat2_name,"cat_ename":service.cat_ename,"class":service.class};
            this.tasks.push(tmp);
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
        console.log('task left: %d', this.tasks.length);
    }
    var pinyin = t.regionPinyin || t.districtPinyin;
    var name = t.regionName || t.districtName;
    var opt = new helper.basic_options(t.cityPinyin+".58.com","/"+t.cat_ename+"/pn"+t.pn+"/");
    opt.agent = false;
    console.log("[GET ] %s, %s, %s, %d",t.cityName,t.cat1_name,t.cat2_name,t.pn);
    helper.request_data(opt,null,function(data,args,res){
    	that.processList(data,args,res);
    },t);
}

Rent.prototype.processList = function(data,args,res){
    if(!data){
        console.log("data empty.");
        if(args[0].class == '1') {
            console.log("[DONE] Category: " + args[0].cat1_name);
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
        var end_flag = 0;

        $("div#infolist > table.small-tbimg tr").each(function(){
            if($(this).text().indexOf("以上本地信息更新较少") >= 0) {
                end_flag = 1;
                return false;
            }

            var td = $("td.t",this);
            var title = $("a.t",td).text().replace(/[\n\r,，]/g,";");
            var user = $("a.u",td).text().replace(/[\n\r,，]/g,";");
            var url_title = $("a.t",td).attr("href");
            var url_user = $("a.u",td).attr("href");
            var wlt = $("span[class^='wlt']",td);
            var member = 0;
            var pubDate = '';
            if(wlt.length>0){
                member = wlt.attr("class").replace(/wlt/,"");
            }
            if(member)
                memberCount++;
            var jing = $("span.jingpin",td).length;
            var top = $("span.ico.ding",td).length;
            //var personal = $("h1 span.qj-renttitgr",td).text();
            //personal = personal && personal.trim().replace(/[\(\)]/g,"");
            //var houseName = $("div.qj-listleft>a",td).text().trim().replace(/[\s]/g,"").replace(/[,，]/g,";");

            var div_text = $("td.t",this).text().trim().replace(/[\s]/g,"").replace(/[,，]/g,";");
            var exec_result = /\((今天|\d{1,2}分钟|\d{1,2}小时|\d{1,2}-\d{1,2})\)/.exec(div_text);
            if(exec_result)
                pubDate = exec_result[1];

            var record = [args[0].cityName,args[0].cat1_name,args[0].cat2_name,member,jing,top,pubDate,title,user,url_title,url_user,that.today,"\n"].join();
            fs.appendFileSync(that.resultDir+that.resultFile,record);
            //console.log("[DONE] %s",record);
        });

        if(args[0].class == '1') {
            console.log("[DONE] Category: " + args[0].cat1_name);
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 2 + 2) * 1000);
        } else {
            if ($("div#infolist > table.small-tbimg tr").length<10 || memberCount<4) {
                console.log("[DONE] less info,Category: " + args[0].cat2_name);
                setTimeout(function () {
                    that.wgetList();
                }, (Math.random() * 2 + 2) * 1000);
            } else if (data.search('pager') != -1 && args[0].pn < this.pagePerTask) {
                data = null;
                args[0].pn++;
                setTimeout(function () {
                    that.wgetList(args[0]);
                }, (Math.random() * 2 + 2) * 1000);
            } else {
                console.log("[DONE] Category: " + args[0].cat2_name);
                setTimeout(function () {
                    that.wgetList();
                }, (Math.random() * 2 + 2) * 1000);
            }
        }
    }
}

var instance = new Rent();
var that = instance;
that.start();
