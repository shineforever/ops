var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')
var logger = require("winston")
var moment = require('moment')
var env = process.env.NODE_ENV || "development"
logger.add(logger.transports.File, { filename: '../../log/58.ershouche.log' ,logstash:true,level:'info',handleExceptions:true});
logger.cli();

if(env==="production"){
    logger.remove(logger.transports.Console);
}

function Rent() {
    this.dataDir = '../../appdata/';
    this.resultDir = '../../result/auto/';
    this.cities = [];
    this.cityFile = '58.city.txt';
    this.services = [];
    this.serviceFile = "58.ershouche.txt";
    this.today = new Date().toString();
    //var strs = this.today.split('-');
    this.resultFile = '58_ershouche_'+this.today+'.txt';
    this.resultCountFile = '58_ershouche_count_'+this.today+'.txt';;
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
        return {"class": vals[0], "cat1_name": vals[1], "cat2_name": vals[2], "cat3_name": vals[3],"cat_ename": vals[4], };
    });

    //add service task
    this.tasks = [];
    for(var i=0; i< this.cities.length;i++){
        var city = this.cities[i];
        for(var j=0;j<this.services.length;j++){
            var service = this.services[j];
            if (!service) continue;
            var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"cat1_name":service.cat1_name,"cat2_name":service.cat2_name,"cat3_name":service.cat3_name,"cat_ename":service.cat_ename,"class":Number(service.class)};
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
    var opt = new helper.basic_options(t.cityPinyin+".58.com","/"+t.cat_ename+"/pn"+t.pn+"/");
    opt.agent = false;
    logger.info("%s, %s, %s, %s, %d",t.cityName,t.cat1_name,t.cat2_name,t.cat3_name,t.pn);
    helper.request_data(opt,null,function(data,args,res){
    	that.processList(data,args,res);
    },t);
}

Rent.prototype.processList = function(data,args,res){
    if(!data){
        logger.info("data empty.");
        if(args[0].class<3) {
            logger.info("Category: %s, %s", args[0].cat1_name, args[0].cat2_name);
            setTimeout(function () {
                that.wgetList();
            }, 3300);
        } else {
            args[0].pn++;
            setTimeout(function () {
                that.wgetList(args[0]);
            }, 3300);
        }
    } else {
        var $ = cheerio.load(data);
        var memberCount = 0;
        var end_flag = 0;
	
        $("div#infolist > table.tbimg tr").each(function(){
            if($(this).text().indexOf("以上本地信息更新较少") >= 0){
                end_flag = 1;
                return false;
            }
            if($(this).attr("logr") == undefined)
                return true;
	    var uptime = $("td.t > p",this).text().trim();
	    uptime = uptime && uptime.replace(/\s/g,"").split(/\//);
	    var year = uptime && uptime[0] || "无";
	    var km = uptime && uptime.length>1 && uptime[1] || "无";
            var td = $("td.t",this);
            var title = $("a.t",td).text().replace(/[\n\r,，]/g,";");
            var post_time = $("span.post_time",td).text();
            var url_title = $("a.t",td).attr("href");
            var wlt = $("span[class^='wlt']",td);
	    var personal = $(".shenfencon",td).length>0;
	    var price = $("td.tc",this).text();
	    price = price && price.replace(/\s/g,'');
            var member = 0;
            if(wlt.length>0){
                member = wlt.attr("class").replace(/wlt-ico wlt/,"");
            }
            if(member)
                memberCount++;
            var jing = $("span.jingpin",td).length;
            var top = $("a.ico.ding",td).length;
	    
            var record = [args[0].cityName,args[0].cat1_name,args[0].cat2_name,args[0].cat3_name,member,jing,top,title,post_time,km,year,personal?"Y":"N",price,url_title,that.today,"\n"].join();
            fs.appendFileSync(that.resultDir+that.resultFile,record);
        });
	
	if(args[0].pn==1){
	    var num = Number($(".filterbar table tr td label span.red").text());
	    fs.appendFileSync(this.resultDir+this.resultCountFile,[args[0].cityName,args[0].cat1_name,args[0].cat2_name,args[0].cat3_name,num,"\n"].join());
	}
        if(args[0].class<3) {
            logger.info("Category: %s, %s", args[0].cat1_name, args[0].cat2_name);
            setTimeout(function () {
                that.wgetList();
            }, 3300);
        } else {
            if (end_flag || $("div#infolist > table.tbimg tr").length<10 || memberCount<this.memberPerPage) {
                logger.info("less info,Category: " + args[0].cat3_name);
                setTimeout(function () {
                    that.wgetList();
                }, 3300);
            } else if (data.search('pager') != -1 && args[0].pn < this.pagePerTask) {
                data = null;
                args[0].pn++;
                setTimeout(function () {
                    that.wgetList(args[0]);
                }, 3300);
            } else {
                logger.info("Category: " + args[0].cat3_name);
                setTimeout(function () {
                    that.wgetList();
                }, 3300);
            }
        }
    }
}

var instance = new Rent();
var that = instance;
that.start();
