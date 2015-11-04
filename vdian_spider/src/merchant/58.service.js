var fs = require('fs')
var Crawler = require('node-webcrawler')
var godotTransport = require("winston-godot")
var godot = require("godot")
var mysql = require('mysql')
var crypto = require('crypto')
var seenreq = require("seenreq")
var logger = require("winston")
var moment = require("moment")

var env = process.env.NODE_ENV || "development";
var config = require('../../config.json')[env].db;

var EventEmitter = require('events').EventEmitter
var e = new EventEmitter();

logger.add(logger.transports.File, { filename: '../../log/58.service.log' ,logstash:true,level:'info',handleExceptions:true});
if(env === 'production'){
    logger.remove(logger.transports.Console);
}

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"58.service"});

function Rent() {
    this.dataDir = '../../appdata/';
    this.resultDir = '../../result/58/';
    this.cities = [];
    this.cityFile = '58.city.txt';
    this.services = [];
    this.serviceFile = "58.service.txt";
    this.today = new Date().toString();
    
    this.pagePerTask = 70;
    this.factor = 0.06;
    this.seen = new seenreq();
    this.minInterval = 2;
    this.maxInterval = 3;
    this.records = [];
    this.counter = 0
    this.endTask = false;
    this.t = null;
    this.initDatabase();
    
    this.c = new Crawler({
	maxConnections:1,
	rateLimits:3100,
	callback:function(err,result,$){
	    if(err){
		logger.error(err.message);
		e.emit('job-page');
	    }else{
		that.processList(result,$);
	    }
	},
	userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"
    });
    e.on("job-done",function(){
	that.start();
    });
    
    e.on("db-data",function(rows,fields){
	that.onDbData(rows,fields);
    });
    
    e.on("job-page",function(){
	logger.info("New records : %d",that.records.length);
	if(that.records.length>0){
	    that.conn.query("INSERT INTO `ClassifiedsPosts` (`mid`,`mname`,`murl`,`mq`,`city`,`district`,`primary`,`secondary`,`tertius`,`turl`,`tt`,`tid`,`site`,`createdAt`,`updatedAt`) VALUES ?",[that.records],function(err){
		if(err) logger.error(err);
	    });
	}
	var t = that.t;
	that.endTask = that.endTask || that.memberRate > that.records.length;
        if (that.endTask) {
	    logger.info("less info,Category: %s",t.cat2_name);
	    process.nextTick(function(){that.wgetList();});
        } else if (!that.lastPage && t.pn < that.pagePerTask) {
	    t.pn++;
	    process.nextTick(function(){that.wgetList(t);});
        } else {
	    logger.info("Category: %s",t.cat2_name);
	    process.nextTick(function(){that.wgetList();});
        }
    });
}

Rent.prototype.onDbData = function(rows,fields){
    if(rows && rows.length && rows[0].exists === 1){
	for(var i = 0;i<this.records.length;i++){
	    if(this.records[i][11]===rows[0].tid){
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
    // this.conn.on('error',function(err){
    // 	logger.error(err);
    // 	if(err.code === 'PROTOCOL_CONNECTION_LOST'){
    // 	    that.initDatabase();
    // 	    e.emit("job-done");
    // 	}
    // });
}

Rent.prototype.init = function(){
    //load city from file
    this.cities = fs.readFileSync(this.dataDir+this.cityFile).toString().split('\n').filter(function (line,i) {
        if (i > 0) return false;
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
    var start = Number(arguments[0])||0;
    var len = Number(arguments[1])||this.tasks.length;
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
	    e.emit("job-done");
            return;
        }
        t = this.tasks.shift();
        t.pn = 1;
        logger.info('task left: %d', this.tasks.length);
    }
    this.t = t;
    this.memberRate = 0;
    this.records = [];
    this.lastPage = false;
    
    var opt = {uri:["http://",t.cityPinyin,".58.com/",t.cat_ename,"/pn",t.pn,"/"].join(""),t:t}
    this.c.queue(opt);
    logger.info("%s, %s, %s, %d",t.cityName,t.cat1_name,t.cat2_name,t.pn);
}

Rent.prototype.processList = function(result,$){
    if(!$){
	e.emit("job-page");
	return;
    }
    var t = result.options.t
    , memberCount = freeCount = topCount =  hotCount = 0
    , len = $("div#infolist > table.small-tbimg tr").length
    , timeRegexp = /[今天|小时|分钟]/
    , companyRegexp = /\/\/(.+)(?=\.5858)/
    , curPage = $("div.pager strong").text().trim();
    this.lastPage = !$(".pager").length;
    $("div#infolist > table.small-tbimg tr").each(function(){
        if($(this).text().indexOf("以上本地信息更新较少") >= 0) {
            that.endTask = true;
            return false;
        }
	
        var td = $("td.t",this)
	, title = $("a.t",td).text().replace(/[\n\r,，]/g,";")
	, mname = $("a.u",td).text().replace(/[\n\r,，]/g,";")
        , turl = $("a.t",td).attr("href")
        , murl = $("a.u",td).attr("href")
	, mid = null
        , member = $("span[class^='wlt']",td).length
	, jing = $("span.jingpin",td).length
        , top1 = $("span.ico.ding",td).length
	, top2 = 0
        , txt = $("td.t",this).text()
	, fn = crypto.createHash("md5")
	, tt = member + (jing<<1) + (top2<<2) + (top1<<3);
	
	murl = murl ? murl:" ";
        memberCount += member;
	topCount += top1;
	hotCount += jing;
	if(tt===0){
	    ++freeCount;
	    return;
	}
	
	if(companyRegexp.test(murl)){
	    mid = murl.match(companyRegexp)[1];
	}
	
	that.endTask = !jing && !top1 && !timeRegexp.test(txt);

	fn.update(that.seen.normalize(turl));
	var tid = fn.digest("hex");
	
        var record = [mid,mname,murl,0,t.cityName,t.regionName,"生活服务",t.cat1_name,t.cat2_name,turl,tt,tid,'58',new Date(),new Date()];
	that.records.push(record);
	++that.counter;
	that.conn.query("SELECT ? AS `tid`, (CASE WHEN EXISTS (SELECT * FROM `ClassifiedsPosts` WHERE `ClassifiedsPosts`.`tid`=? AND tt=? AND updatedAt > ?) THEN 1 ELSE 0 END) AS `exists` ",[tid,tid,tt,moment().format("YYYY-MM-DD")],function(err,rows,fields){
	    if(err) logger.error(err);
	    --that.counter;
	    e.emit("db-data",rows,fields);
	});
    });
    
    delete result.body;
    $ = null;
    
    logger.info("Page: %s, Free/Paid/Total: %d/%d/%d, Hot/Top/Member: %d/%d/%d",curPage,freeCount,this.records.length,len,hotCount,topCount,memberCount);
    
    this.endTask = this.endTask || memberCount<4 || len<10;
    this.memberRate = this.factor * len;
    
    if(this.records.length===0){
	e.emit("job-page");
    }
}

var instance = new Rent();
var that = instance;
that.start();
