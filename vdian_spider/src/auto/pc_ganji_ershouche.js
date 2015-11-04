var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')
var logger = require("winston")
var moment = require('moment')
var env = process.env.NODE_ENV || "development"
logger.add(logger.transports.File, { filename: '../../log/gj.ershouche.log' ,logstash:true,level:'info',handleExceptions:true});
logger.cli();

if(env==="production"){
    logger.remove(logger.transports.Console);
}

function Rent() {
    this.dataDir = '../../appdata/';
    this.resultDir = '../../result/auto/';
    this.cities = [];
    this.cityFile = 'ganji.city.txt';
    this.services = [];
    this.serviceFile = "ganji.ershouche.txt";
    this.today = new Date().toString();
    //var strs = this.today.split('-');
    this.resultFile = 'ganji_ershouche_'+this.today+'.txt';
    this.resultCountFile = 'ganji_ershouche_count_'+this.today+'.txt';
    this.pagePerTask = 100;
    this.memberPerPage = 0;
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
        return {"class":vals[0],"cat1_name":vals[1],"cat1_ename":vals[2],"cat2_name":vals[3],"cat3_name":vals[4],"cat_ename": vals[5]};
    });

    //add service task
    this.tasks = [];
    for(var i=0; i< this.cities.length;i++){
        var city = this.cities[i];
        for(var j=0;j<this.services.length;j++){
            var service = this.services[j];
            if (!service) continue;
            var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"cat1_name":service.cat1_name,"cat1_ename":service.cat1_ename,"cat2_name":service.cat2_name,"cat3_name":service.cat3_name,"cat_ename":service.cat_ename,"class":Number(service.class)};
            this.tasks.push(tmp);
        }
    }
    var arguments = process.argv.splice(2);
    var start = Number(arguments[0]);
    var len = Number(arguments[1]);
    //前闭后开区间
    this.tasks = this.tasks.slice(start,start+len);
    logger.info("task count: %d",this.tasks.length);
}

Rent.prototype.start = function(){
    this.init();
    this.wgetList();
}

Rent.prototype.wgetList = function(t){
    if(!t){
        if(this.tasks.length==0){
            logger.info("job done.");
            return;
        }
        t = this.tasks.shift();
        t.pn = 1;
        logger.info('task left: %d', this.tasks.length);
    }
    var pinyin = t.regionPinyin || t.districtPinyin;
    var name = t.regionName || t.districtName;
    if(t.class == 3)
        var opt = new helper.basic_options(t.cityPinyin+".ganji.com","/"+t.cat_ename+"/o"+t.pn+t.cat1_ename+"/");
    else
        var opt = new helper.basic_options(t.cityPinyin+".ganji.com",t.cat_ename);
    opt.agent = false;
    logger.info("%s, %s, %s, %s, %d",t.cityName,t.cat1_name,t.cat2_name,t.cat3_name,t.pn);
    helper.request_data(opt,null,function(data,args,res){
        that.processList(data,args,res);
    },t);
}

Rent.prototype.processList = function(data,args,res){
    if(!data) {
        logger.info("data empty.");
        if(args[0].class<3) {
            logger.info("Category: %s, %s", args[0].cat1_name, args[0].cat2_name);
            setTimeout(function () {
                that.wgetList();
            }, 3800);
        } else {
            args[0].pn++;
            setTimeout(function () {
                that.wgetList(args[0]);
            }, 3800);
        }
    }
    else {
        t = args[0];
        var $ = cheerio.load(data);
        var memberCount = 0;

        $("div.leftBox div.layoutlist dl.list-pic").each(function(){
            var div = $("div.infor",this);

            var top = $("a em.ico-stick-yellow",div).length;
            var adTop = $("a em.ico-stick-red",div).length;
            var hot = $("span.ico-hot",div).length;
            var pub_date = $("span.gray",div).eq(0).text().replace(/[\n\r,，]/g,";");
            var title = $("a.infor-title",div).text().trim().replace(/[\n\r,，]/g,";");
            var user = $("a.fc-999",div).text().trim().replace(/[\n\r,，]/g,";");
            var url_title = $("a.infor-title",div).attr("href");
            var url_user = $("a.fc-999",div).attr("href");
            var member = $('span.ico-bang-new',this).first().text() || 0;
	    var personal = $("p.infor-gs em",div).text();
	    personal = personal && personal.indexOf("个人")>-1;
	    personal = !!personal;
	    var price = $("dd div.v-Price",this).text().trim();
	    var uptime = $("div.infor>p.infor-dep",this).text().replace(/\s/g,'').split('|');
	    var year = uptime && uptime[0];
	    var km = uptime && uptime.length>1 && uptime[1];
            if(member)
                memberCount++;
            var record = [t.cityName,t.cat1_name,t.cat2_name,t.cat3_name,member,hot,top,adTop,pub_date,km,year,title,user,url_title,url_user,personal?"Y":"N",price,that.today,"\n"].join();
            fs.appendFileSync(that.resultDir+that.resultFile,record);
        });
	if(args[0].pn==1){
	    var num = $(".crumbs span.fr strong.fc-org").text();
	    fs.appendFileSync(this.resultDir+this.resultCountFile,[t.cityName,t.cat1_name,t.cat2_name,t.cat3_name,num,"\n"].join());
	}
	
        if(args[0].class<3) {
            logger.info("Category: %s, %s", args[0].cat1_name, args[0].cat2_name);
            setTimeout(function () {
                that.wgetList();
            }, 3800);
        } else {
            if (!data || $("div.leftBox div.layoutlist dl.list-pic").length<10 || memberCount<=this.memberPerPage) {
                logger.info("less info,Category: " + t.cat3_name);
                setTimeout(function () {
                    that.wgetList();
                }, 3800);
            } else if ($('.pageLink li a').last().attr("class") == "next" && t.pn < this.pagePerTask) {
                data = null;
                t.pn++;
                setTimeout(function () {
                    that.wgetList(t);
                }, 3800);
            } else {
                logger.info("Category: " + t.cat3_name);
                setTimeout(function () {
                    that.wgetList();
                }, 3800);
            }
        }
    }
}

var instance = new Rent();
var that = instance;
that.start();
