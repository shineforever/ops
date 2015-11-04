var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')

function Rent() {
    this.dataDir = '../appdata/';
    this.resultDir = '../result/ganji/';
    this.cities = [];
    this.cityFile = 'ganji.city.txt';
    this.services = [];
    this.serviceFile = "ganji.service.txt";
    this.today = new Date().toString();
    var strs = this.today.split('-');
    this.resultFile = 'ganji_service_'+strs[0]+'-'+strs[1]+'.txt';
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
        return {"class":vals[0],"cat1_name": vals[1], "cat2_name": vals[2], "cat_ename": vals[3]};
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
    var opt = new helper.basic_options(t.cityPinyin+".ganji.com","/"+t.cat_ename+"/o"+t.pn+"/");
    opt.agent = false;
    console.log("[GET ] %s, %s, %s, %d",t.cityName,t.cat1_name,t.cat2_name,t.pn);
    helper.request_data(opt,null,function(data,args,res){
    	that.processList(data,args,res);
    },t);
}

Rent.prototype.processList = function(data,args,res){
    if(!data){
        console.log("data empty.");
        if(t.class== '1') {
            console.log("[DONE] Category: " + t.category);
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 4 + 2) * 1000);
        } else {
            t.pn++;
            setTimeout(function () {
                that.wgetList(t);
            }, (Math.random() * 4 + 2) * 1000);
        }
    } else {
        t = args[0]
        var $ = cheerio.load(data);

        $("div.leftBox div.list ul li.list-img").each(function(){
            var div = $("div.txt",this);

            var top = $("a em.ico-stick-yellow",div).length;
            var adTop = $("a em.ico-stick-red",div).length;
            var hot = $("span.ico-hot",this).length;
            var jing = $("span.ico-hot",this).length;
            var pub_date = $("span.fc9",div).eq(0).text().replace(/[\n\r,，]/g,";");
            var title = $("p.t a.f14",div).text().trim().replace(/[\n\r,，]/g,";");
            var user = $("p.p2 a.website",div).text().trim().replace(/[\n\r,，]/g,";");
            var url_title = $("p.t a.f14",div).attr("href");
            var url_user = $("p.p2 a.website",div).attr("href");
	    
            var record = [t.cityName,t.cat1_name,t.cat2_name,hot,jing,top,adTop,pub_date,title,user,url_title,url_user,that.today,"\n"].join();
            fs.appendFileSync(that.resultDir+that.resultFile,record);
        });

        if(t.class== '1') {
            console.log("[DONE] Category: " + t.cat1_name);
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 4 + 2) * 1000);
        } else {
            if ($("div.leftBox div.list ul li.list-img").length<10) {
                console.log("[DONE] less info,Category: " + t.cat2_name);
                setTimeout(function () {
                    that.wgetList();
                }, (Math.random() * 4 + 2) * 1000);
            } else if ($('.pageLink li a').last().attr("class") == "next" && t.pn < this.pagePerTask) {
                data = null;
                t.pn++;
                setTimeout(function () {
                    that.wgetList(t);
                }, (Math.random() * 4 + 2) * 1000);
            } else {
                console.log("[DONE] Category: " + t.cat2_name);
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
