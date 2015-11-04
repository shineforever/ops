var fs = require('fs')
var Crawler = require('node-webcrawler')
var mysql = require('mysql')
var crypto = require('crypto')
var godotTransport = require("winston-godot")
var godot = require("godot")
var seenreq = require("seenreq")
var URL = require("url")
var logger = require("winston")
var moment = require("moment")
var env = process.env.NODE_ENV || "development";
var config = require('../../config.json')[env].db;

var EventEmitter = require('events').EventEmitter
var e = new EventEmitter();

logger.add(logger.transports.File, { filename: '../../log/ganji.ershou.log',logstash:true,level:'info',handleExceptions:true});
if(env === 'production'){
    logger.remove(logger.transports.Console);
}

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"gj.ershoufang"});

function Rent() {
    this.dataDir = '../../appdata/';
    this.resultDir = '../result/ganji/';
    this.cities = [];
    this.cityFile = "ganji.regions.txt";
    this.pagePerTask = 100;
    this.records = [];
    this.counter = 0;
    this.factor = 0.06;
    this.seen = new seenreq();
    this.endTask = false;
    this.t = null;
    this.initDatabase();
    
    this.c = new Crawler({
	maxConnections:1,
	rateLimits:3500,
	callback:function(err,result,$){
	    if(err){
		logger.error(err.message);
		e.emit('job-page');
	    }else{
		that.processList(result,$);
	    }
	},
	debug:env==='development',
	userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"
    });
    
    e.on("job-done",function(){
	that.start();
    });
    
    e.on("db-data",function(rows,fields){
	that.onDbData(rows,fields);
    });
    e.on("job-page",function(){
	logger.info("New records: %d",that.records.length);
	if(that.records.length>0){
	    that.conn.query("INSERT INTO `ClassifiedsPosts` (`mid`,`mname`,`murl`,`mq`,`city`,`primary`,`secondary`,`tertius`,`turl`,`tt`,`tid`,`site`,`createdAt`,`updatedAt`) VALUES ?",[that.records],function(err){
		if(err) logger.error(err);
	    });
	}
	var t = that.t;
	
	that.endTask = that.endTask || that.memberRate > that.records.length;
	
	if (that.endTask) {
            logger.info("less info,Category: %s",t.regionName);
	    process.nextTick(function(){that.wgetList();});
	} else if (!that.lastPage && t.pn < that.pagePerTask) {
            t.pn++;
	    process.nextTick(function(){that.wgetList(t);});
	} else {
            logger.info("Category: %s",t.regionName);
	    process.nextTick(function(){that.wgetList();});
	}
    });
}

Rent.prototype.onDbData = function(rows,fields){
    if(rows && rows.length && rows[0].exists === 1){
	for(var i = 0;i<this.records.length;i++){
	    if(this.records[i][10]===rows[0].tid){
		this.records.splice(i,1);
		break;
	    }
	}
    }
    
    //how to figure out whether the work should stop? define a factor that is the ratio of same tid num per page.
    if(this.counter === 0){
	e.emit("job-page");
    }
}

Rent.prototype.initDatabase = function(){
    this.conn = mysql.createPool(config);
}

Rent.prototype.init = function(){
    this.cities = JSON.parse(fs.readFileSync(this.dataDir+this.cityFile).toString());
    this.tasks = [];
    for(var i=0; i< this.cities.length;i++){
	if(i>0) break;
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
    var start = Number(arguments[0]) || 0;
    var len = Number(arguments[1]) || this.tasks.length;
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
	    e.emit("job-done");
	    return;
	}
	t = this.tasks.shift();
	t.pn = 1;
	logger.info('task left: %d', this.tasks.length);
    }

    var opt = {t:t};
    
    if(t.class == '3') {
        var pinyin = t.regionPinyin;
        var name = t.regionName;
        opt.uri = "http://"+t.cityPinyin+".ganji.com/fang5/"+pinyin+"/o"+t.pn+"/";
    } else if(t.class == '2') {
        var pinyin = t.districtPinyin;
        var name = t.districtName;
        opt.uri = "http://"+t.cityPinyin+".ganji.com/fang5/"+pinyin+"/o"+t.pn+"/";
    } else {
        opt.uri = "http://"+t.cityPinyin+".ganji.com/fang5/o"+t.pn+'/';
    }
    
    this.t = t;
    this.memberRate = 0;
    this.records = [];
    this.lastPage = false;
    this.endTask = false;
    
    this.c.queue(opt);
    logger.info("%s, %s, %s, %d",t.cityName,t.districtName,t.regionName,t.pn);
}

Rent.prototype.processList = function(result,$){
    if(!$){
	e.emit("job-page");
	return;
    }
    
    var t = result.options.t
    ,timeRegexp = /[今天|小时|分钟]/
	,companyRegexp = /\/(\d+)\//
    ,memberCount = freeCount=topCount=hotCount=0
    ,len = $("ul.list-style1 > li").length
    ,host = URL.parse(result.uri).host
    ,curPage = $('ul.pageLink a.c.linkOn').text().trim();
    this.lastPage = !$('.pageLink li a').last().hasClass("next");
    
    $("ul.list-style1 li").each(function(){
	var link = $("div.list-mod2 div.info-title>a",this)
	, top = $("a em.ico-stick-yellow",link).length
	, adTop = $("a em.ico-stick-red",link).length
	, hot = $("span.ico-hot",this).length
	, jing = $("span.ico-jing",this).length
	, name = link.attr("title").trim().replace(/[\s,，]/g,"")
	, turl = link.attr("href")
	, personal = $("span.fc-red",link).text()
	, words = $("div.list-mod2 div.list-word span",this)
	, member = $("div.list-mod3 p.list-part span.ico-bang-new",this).length
	, fn = crypto.createHash("md5")
	, mid=mname=murl=null
	, mq = $("p.list-part i.ico-v").length
	, tt = member + (hot << 1) + (adTop <<2 ) + (top << 3);
	
	personal = personal && personal.replace(/[\s\(\)]/g,"");
	words = $("div.list-mod2 p.list-word",this).text().trim();
	words = words && words.split("/");
	var pubDate = words[words.length-1];
	
	if(tt===0){
	    ++freeCount;
	    return;
	}
	
	memberCount+=member;
	topCount += adTop+top;
	hotCount += hot+jing;
	that.endTask = !timeRegexp.test(pubDate);
        
	if(that.endTask)
	    return false;

	if(turl.indexOf("/") === 0){
	    turl = ["http://",host,turl].join("");
	}
	
	fn.update(that.seen.normalize(turl));
	var tid = fn.digest("hex");
	var record = [mid,mname,murl,mq,t.cityName,"二手房",t.districtName,t.regionName,turl,tt,tid,'gj',new Date(),new Date()];
	that.records.push(record);
	++that.counter;
	var query = "SELECT ? AS `tid`,(CASE WHEN EXISTS (SELECT * FROM `ClassifiedsPosts` WHERE `ClassifiedsPosts`.`tid`=? AND `ClassifiedsPosts`.`tt`=? AND `updatedAt` > ?) THEN 1 ELSE 0 END) AS `exists` "
	, inserts = [tid,tid,tt,moment().format("YYYY-MM-DD")];
	query = mysql.format(query,inserts)
	that.conn.query(query,function(err,rows,fields){
	    if(err) logger.error(err);
	    --that.counter;
	    e.emit("db-data",rows,fields);
	});
    });
    
    delete result.body;
    $=null;
        
    //fs.appendFile(this.resultDir+"test.ganji."+result.uri+".html",result.body,function(e){});
    logger.info("Page: %s, Free/Paid/Total: %d/%d/%d, Hot/Top/Member: %d/%d/%d",curPage,freeCount,this.records.length,len,hotCount,topCount,memberCount);
    
    this.endTask = this.endTask || len < 10 || memberCount<=4;
    this.memberRate = this.factor * len;
    
    if(this.records.length===0){
	e.emit("job-page");
    }
}

var instance = new Rent();
var that = instance;
that.start();
