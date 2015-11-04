var fs = require('fs')
var Crawler = require("node-webcrawler")
var mysql = require('mysql')
var godotTransport = require("winston-godot")
var godot = require("godot")
var crypto = require('crypto')
var EventEmitter = require('events').EventEmitter
var seenreq = require("seenreq")
var logger = require("winston")
var moment = require("moment")
var URL = require("url")
var env = process.env.NODE_ENV || "development";
var config = require('../../config.json')[env].db;

var e = new EventEmitter();

logger.add(logger.transports.File, { filename: '../../log/ganji.service.log' ,logstash:true,level:'info',handleExceptions:true});
if(env==='production'){
    logger.remove(logger.transports.Console);
}

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"gj.service"});

function Rent() {
    this.dataDir = '../../appdata/';
    this.resultDir = '../../result/ganji/';
    this.cities = [];
    this.cityFile = 'ganji.city.txt';
    this.services = [];
    this.serviceFile = "ganji.service.txt";
    
    this.pagePerTask = 100;
    this.minInterval = 2;
    this.maxInterval = 3;
    this.records = [];
    this.counter = 0;
    this.factor = 0.06;
    this.seen = new seenreq();
    this.endTask = false;
    this.conn = mysql.createConnection(config);
    this.t = null;
    this.uuid = 4760646088535574100214;
    this.c = new Crawler({
	maxConnections:1,
	rateLimits:2400,
	debug:env==='development',
	logger:logger,
	callback:function(err,result,$){
	    if(err){
		logger.error(err);
		e.emit('job-page');
	    }else{
		that.processList(result,$);
	    }
	},
	userAgent:require("../../ua.json").userAgents,
	rotateUA:true
    });
    
    this.conn.on('error',function(err){
	logger.error(err);
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
	    logger.info(that.memberRate);
	    logger.info(that.records.length);
	    
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
    var start = Number(arguments[0]) || 0;
    var len = Number(arguments[1]) || this.tasks.length;
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
    this.endTask = false;
    var opt = {uri:["http://",t.cityPinyin,".ganji.com/",t.cat_ename,"/o",t.pn,"/"].join(""),t:t/*,headers:{"Cookie":"ganji_uuid="+(++this.uuid)}*/};
    //var opt = {uri:["http://",t.cityPinyin,".ganji.com/"].join(""),t:t};
    this.c.queue(opt);
    logger.info("%s, %s, %s, %d",t.cityName,t.cat1_name,t.cat2_name,t.pn);
}

Rent.prototype.processList = function(result,$){
    if(!$){
	e.emit("job-page");
	return;
    }
    
    if($("title").text()=='机器人确认'){
	logger.error("IP forbidden");
    }

    if($("title").text().trim()==='您访问的网页不存在'){
	logger.error("Page not found");
	e.emit("job-page");
	return;
    }
    
    try{
	var strConfig = result.body.match(/PAGE_CONFIG = .{4,}/)[0];
	eval(strConfig);
    }catch(err){
	logger.error(err);
	e.emit("job-page");
	return;
    }
    
    var t = result.options.t
    ,timeRegexp = /[今天|小时|分钟|刚刚]/
    ,memberCount = freeCount=topCount=hotCount=outCount=0
    ,len = $("div.leftBox div.list ul > li").length
    ,host = URL.parse(result.uri).host
    ,curPage = $('ul.pageLink a.c.linkOn').text().trim()
    ,strIds = (PAGE_CONFIG.bang_post_ids||PAGE_CONFIG.fee_post_ids)
    ,memberIds = strIds?strIds.postIds.split(","):[];
    
    this.lastPage = !$('.pageLink li a').last().hasClass("next");
    
    $("div.list ul > li.list-noimg,div.list ul > li.list-img").each(function(){
        var div = $("div.txt",this)
	, top = $("a em.ico-stick-yellow",this).length
        , adTop = $("a em.ico-stick-red",this).length
	, hot = $("span.ico-hot",this).length
        , pub_date = $("span.fc9",this).eq(0).text()
        , title = $("p.t a.f14",this).text().trim().replace(/[\n\r,，]/g,";")
        , mname = $("p.p2 a.website",this).text().trim().replace(/[\n\r,，]/g,";")
        , turl = $("p.t a.list-info-title",this).attr("href")
        , murl = $("p.p2 a.website",this).attr("href")
	, fn = crypto.createHash("md5")
	, mid = $("span.f_c_b > span",this).eq(0).attr("name")
	, member = memberIds.indexOf(mid)>-1?1:0
	, tt = member + (hot << 1) + (adTop << 2) + (top << 3);
	
	if(tt===0){
	    ++freeCount;
	    return;
	}
	
	if(!turl) return;

	murl = murl?murl:' ';
	memberCount += member;
	topCount += adTop+top;
	hotCount += hot;
	var today = pub_date.trim() && timeRegexp.test(pub_date);
	
	if(!today){
	    ++outCount;
	    return;
	}
	
	// if(that.endTask){
	//     logger.info("not today");
	//     logger.info(pub_date);
	//     logger.info(mname);
	//     logger.info(result.uri);
	//     logger.info(turl);
	//     logger.info(title);
	//     return false;
	// }
	if(turl.indexOf("/") === 0){
	    turl = ["http://",host,turl].join("");
	}
	
	fn.update(that.seen.normalize(turl));
	var tid = fn.digest("hex");
	var record = [mid,mname,murl,0,t.cityName,"生活服务",t.cat1_name,t.cat2_name,turl,tt,tid,'gj',new Date(),new Date()];
	
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
    
    logger.info("Page: %s, Free/Paid/Total: %d/%d/%d, Hot/Top/Member: %d/%d/%d",curPage,freeCount,this.records.length,len,hotCount,topCount,memberCount);
    this.endTask = this.endTask || len < 10 || memberCount<0||outCount>5;
    
    if(this.endTask){
	logger.info(len);
	logger.info(memberCount);
    }
    this.memberRate = this.factor * len;
    
    if(this.records.length===0){
	e.emit("job-page");
    }
}

var instance = new Rent();
var that = instance;
that.start();
