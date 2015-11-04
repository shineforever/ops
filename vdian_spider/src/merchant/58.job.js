var fs = require('fs')
var Crawler = require('node-webcrawler')
var mysql = require('mysql')
var godotTransport = require("winston-godot")
var godot = require("godot")
var crypto = require('crypto')
var seenreq = require("seenreq")
var logger = require("winston")
var moment = require("moment")
var env = process.env.NODE_ENV || "development";
var config = require('../../config.json')[env].db;

var EventEmitter = require('events').EventEmitter
var e = new EventEmitter();

logger.add(logger.transports.File, { filename: '../../log/58.job.log',logstash:true,level:'info',handleExceptions:true });
if(env==="production"){
    logger.remove(logger.transports.Console);
}

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"58.job"});

function Rent() {
    this.dataDir = '../../appdata/';
    this.resultDir = '../result/58/';
    this.cities = [];
    this.cityFile = '58.city.txt';
    this.regionFile = "58.regions.txt";
    this.services = [];
    this.serviceFile = "58.job.txt";
    this.pagePerTask = 70;
    this.minInterval = 2;
    this.maxInterval = 3;
    this.records = [];
    this.counter = 0;
    this.factor = 0.06;
    this.seen = new seenreq();
    this.endTask = false;
    this.t = null;
    this.initDatabase();
    
    this.c = new Crawler({
	maxConnections:1,
	rateLimits:3000,
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
		//logger.info("Duplicate thread");
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
    // 	if(err.code ==='PROTOCOL_CONNECTION_LOST'){
    // 	    that.initDatabase();
    // 	    e.emit("job-done");
    // 	}
    // });
}

Rent.prototype.init = function(){
    //connect to mysql db. do not do this because when restart the program may run into fatal error!
    //this.conn.connect();
    
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
        return {"class": vals[0],"cat1_name": vals[1],"cat2_name": vals[2],"cat_enname": vals[3]};
    });
    this.regions = JSON.parse(fs.readFileSync(this.dataDir+this.regionFile).toString());
    //add service task
    this.tasks = [];
    for(var i=0; i< this.cities.length;i++){
        var city = this.cities[i];
	//var cityregion = this.regions.filter(function(r){return r.cname===city.cname;})[0];
	//cityregion.districts.push({pinyin:"",name:"全部"});
	//logger.info("Regions of city: %d",cityregion.districts.length);
	
        for(var j=0;j<this.services.length;j++){
            var service = this.services[j];
            if (!service) continue;
	    
	    /*if(!cityregion){
		logger.info("[ERROR] Cannot find city: %s",city.name);
	    }else{
		cityregion.districts.forEach(function(d){*/
		    var tmp = {"cityName":city.cname,
			       "cityPinyin":city.cen,
			       "cat1_name":service.cat1_name,
			       "cat2_name":service.cat2_name,
			       "cat_enname":service.cat_enname,
		//	       "region":d.pinyin,
		//	       "regionName":d.name,
			       "class":service.class};
		    this.tasks.push(tmp);
		//},this);
	    //}
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
    logger.info("Starting job...");
    this.init();
    this.wgetList();
}

Rent.prototype.wgetList = function(t){
    if(!t){
        if(this.tasks.length==0){
            logger.info("job done.");
	    //this.conn.end(); //should not close the connection since we are going on.
	    e.emit("job-done");
            return;
        }
        t = this.tasks.shift();
        t.pn = 1;
        logger.info('task left: %d', this.tasks.length);
    }

    var opt = {t:t};
    if(t.region){
	opt.uri = "http://"+t.cityPinyin+".58.com/"+t.region+"/"+t.cat_enname+"/pn"+t.pn+"/";
    }else{
	opt.uri = "http://"+t.cityPinyin+".58.com"+"/"+t.cat_enname+"/pn"+t.pn+"/";
    }
    
    this.t = t;
    this.memberRate = 0;
    this.records = [];
    this.lastPage = false;
    
    this.c.queue(opt);
    logger.info("%s, %s, %s, %d",t.cityName,t.cat1_name,t.cat2_name,t.pn);
}

function rd(){
    return (Math.random() * that.minInterval + that.maxInterval-that.minInterval) * 1000;
}

Rent.prototype.processList = function(result,$){
    if(!$){
	e.emit("job-page");
	return;
    }
    
    var t = this.t
    ,timeRegexp = /[今天|小时|分钟|精准|置顶]/
	, companyRegexp = /(mq)?\/(\d+)\/$/
	, membercount = 0
    , len = $("div#infolist dl").length
    , freecount=0
    , topcount=0
    , hotcount=0
    , curPage = $(".pager strong").text().trim();
    this.lastPage = $('.pager').length === 0;
    
    $("div#infolist dl").each(function(i){
        if($(this).text().indexOf("以上本地信息更新较少") >= 0) {
            that.endTask = true;
            return false;
        }
        if($(this).text().indexOf("新信息较少，我们为您推荐以下相关信息") >= 0) {
            that.endTask = true;
            return false;
        }
	
	var title = $("dt a.t",this).text().replace(/[\n\r,，]/g,";");
	//member = $("dd.w271 a.ico.yan",this).length
        var turl = $("dt a.t",this).attr("href")
	,fn = crypto.createHash("md5")
        ,mname = $("dd.w271 a.fl",this).text().replace(/[\n\r,，]/g,";")
        ,murl = $("dd.w271 a.fl",this).attr("href")
	,post_time = $("dd.w68",this).text().trim()
	,jing = post_time === '精准'
        ,top1 = post_time === '置顶'//$("a.ico.ding1",this).length
	,top2 = $("a.ico.ding2",this).length
	,mq = $("dd.w271 a.famousCompanyIcon",this).length
	,member = mq || $("dd.w271 span.wltIcon.wlt1",this).length //famous company must be a member
	,mid = null
	,tt = member + (jing << 1) + (top2 << 2) + (top1 << 3);
	
	membercount += member;
	if(tt===0){
	    ++freecount;
	    return;
	}
	topcount += top1+top2;
	hotcount += jing;
	
	if(companyRegexp.test(murl)){
	    mid = murl.match(companyRegexp)[2];
	}
	
	that.endTask = !timeRegexp.test(post_time);
	if(that.endTask)
	    return false;
	
	fn.update(that.seen.normalize(turl));
	var tid = fn.digest("hex");
        
	var record = [mid,mname,murl,mq,t.cityName,t.regionName,"招聘",t.cat1_name,t.cat2_name,turl,tt,tid,'58',new Date(),new Date()];
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
    
    logger.info("Page: %s, Free/Paid/Total: %d/%d/%d, Hot/Top/Member: %d/%d/%d",curPage,freecount,this.records.length,len,hotcount,topcount,membercount);
    this.endTask = this.endTask || membercount<5 || len<10;
    this.memberRate = this.factor * len;
    
    if(this.records.length===0){
	e.emit("job-page");
    }
}

var instance = new Rent();
var that = instance;
that.start();

