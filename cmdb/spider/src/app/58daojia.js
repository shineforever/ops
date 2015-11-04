var helper = require('../../helpers/webhelper.js')
var fs = require('fs')
var url = require('url')
var crypto = require('crypto')
var qs = require('querystring')
var moment = require("moment")
var util = require("util")

var logger = require("winston")
var godotTransport = require("winston-godot")
var godot = require("godot")
var env = process.env.NODE_ENV || "development"

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"58daojia.ayi"});

logger.add(logger.transports.File, { filename: '../../log/daojia.ayi.log' ,logstash:true,level:'info',handleExceptions:true});
logger.cli();

if(env==="production"){
    logger.remove(logger.transports.Console);
}
function App(){
	this.today = moment().format("YYYY-MM-DD");
    this.resultDir = "../../result/app/58daojia.ayi/";
    this.resultFile = util.format("58daojia.ayi.%s.csv", this.today);
    this.dataDir = "../../appdata/";
    this.cityFile = "58daojia.txt";
    this.datepointFile = "58daojia.datepoint.txt";
    this.tasks = [];
    this.host = "jzt.58.com";
}

App.prototype.init = function(){
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	fs.writeFileSync(this.resultDir+this.resultFile, "\ufeff地址,年龄,评论数,本月评论数,距离,距离(单位),注册时间,好评率,身份证,手机号,姓名,图片链接,籍贯,服务次数,本月服务次数,性别,星级,ID,是否可预约,工龄,工作时间,城市,抓取日期,预约时间\n")
    var ticks = new Date(this.today).getTime()+7200000+86400000;
    var datepoints = [ticks];
    for(var i=1;i<=7;i++){
	datepoints[i]=datepoints[i-1]+86400000;
    }
    
    var addrpoints = fs.readFileSync(this.dataDir+this.cityFile).toString().split('\n').filter(function(line){return line.trim();});
    for(var i=datepoints.length-1;i<datepoints.length;i++){
	for(var j=0;j<addrpoints.length;j++){
	    var vals = addrpoints[j].split('\t');
	    this.tasks.push({city:vals[0],category:vals[1],addr:vals[2],lng:vals[3],lat:vals[4],region:vals[5],direction:vals[6],cityid:vals[7],appointment:datepoints[i]});
	}
    }
}

/*
{ date: '2014-12-15 13:00:00',
  lng: '116.658112',
  cityid: '1',
  page: '1',
  type: '1',
  pagesize: '10',
  r: '0.20097687607282344',
  address: 'GUJIN 古今 12',
  duration: '3',
  lat: '40.136514' }
  */
App.prototype.hash = function(obj,salt){
    var keys = Object.keys(obj);
    keys.sort(function(a,b){
	for(;a.length<5;a+='`');
	for(;b.length<5;b+='`');
	return that.crypto(a).localeCompare(that.crypto(b));
    });
    //logger.info(keys);
    var str = '';
    for(var i=0;i<keys.length;i++){
	if(str==''){
	    str=keys[i]+"="+obj[keys[i]];
	}else{
	    str += "&"+keys[i]+"="+obj[keys[i]];
	}
    }
    //logger.info(str);
    
    return this.crypto(str+salt);
}

App.prototype.crypto = function(str){
    var hasher = crypto.createHash('md5');
    hasher.update(str,'utf8');
    var digest = hasher.digest('hex');
    return digest;
}

App.prototype.start = function(){
    this.init();
    this.wget();
}

App.prototype.wget = function(t){
    var path = "/api/guest/workersnearby";
    if(!t){
	while(this.tasks.length && !t){
	    t = this.tasks.shift();
	}
	if(this.tasks.length==0){
	    logger.info("done.");
	    client.close();
	    return;
	}
	t.page = 1;
    }
    
    var q = {r:0.5888942128016578,pagesize:10,duration:2,address:'长寿路89号',page:t.page,lng:t.lng,type:1,date:new Date(t.appointment).toDatetime(),lat:t.lat,cityid:t.cityid};
    
    var opt = new helper.basic_options(this.host,path,'GET',false,false,q);
    
    opt.headers["c"] = this.hash(q,"~!@#$%^&*");
    logger.info(opt.headers["c"]);
    opt.headers["i"]=1;
    opt.headers["imei"]=862108021735160;
    opt.headers["useid"]='';
    opt.headers["mobile"]='';
    opt.headers["mobile_version"]="4.2.1";
    opt.headers["mobile_board"]="U707T";
    opt.headers["modle"]='';
    opt.headers["User-Agent"]="58daojiaandroid";
    opt.agent = false;
    logger.info("GET %s,%s,%s",t.city,t.region,t.direction);
    //logger.info(opt);
    
    helper.request_data(opt,null,function(data,args,res){
	that.process(data,args,res);
    },t);
}
App.prototype.process = function(data,args,res){
    if(!data){
	logger.error("data empty.");
	this.wget(args[0]);
	return;
    }
    if(typeof data == 'string'){
	data = JSON.parse(data);
    }
    var records = [""];
    logger.info("GOT %s",args[0].city);
    if(data.code!=0){
	logger.error(data);
	setTimeout(function(){
	    that.wget();
	},3000);
	return;
    }
    var len = data.data.length;
    logger.info("found workers: ", len);
    if(len>0){
	records = records.concat(data.data.map(function(item){
	    var r = [];
	    /*var vals = Object.keys(item).map(function(k){
		if(k=="address")
		    return item[k].replace(/\s/g,'');
		return item[k];
	    });*/
	    item.address = item.address && item.address.replace(/\s/g,'');
	    r.push(item.address);
	    r.push(item.age);
	    // r.push(item.comment);
	    r.push(item.commentcount);
	    r.push(item.commentcountofthismonth);
	    r.push(item.distance);
	    r.push(item.distance_with_unit);
	    r.push(item.entrytime);
	    r.push(item.goodrate);
	    r.push(item.idcard);
	    // r.push(item.infoid);
	    r.push(item.mobile);
	    // r.push(item.mobile2);
	    r.push(item.name);
	    r.push(item.pic);
	    r.push(item.province);
	    r.push(item.servicecount);
	    r.push(item.servicecountofthismonth);
	    r.push(item.sex);
	    // r.push(item.star);
	    r.push(item.starV21);
	    // r.push(item.type);
	    r.push(item.uid);
	    r.push(item.valid);
	    // r.push(item.vin);
	    r.push(item.workage);
	    r.push(item.worktime);
	    r.push(args[0].city);
	    // r.push(args[0].category);
	    // r.push(args[0].addr);
	    // r.push(args[0].region);
	    // r.push(args[0].direction);
	    r.push(that.today);
	    r.push(new Date(args[0].appointment).toDatetime());
	    return r.join();
	}));
	fs.appendFileSync(this.resultDir+this.resultFile,records.join("\n"));
	logger.info("saved to file.");
	// if(len>0 && len<args[1].pagesize){
	//     setTimeout(function(){
	// 	that.wget();
	//     },3000);
	// }else{
	//     ++args[0].page;
	//     setTimeout(function(){
	// 	that.wget(args[0]);
	//     },3000);
	// }
	++args[0].page;
    setTimeout(function(){
	that.wget(args[0]);
    },3000);
    }else{
	setTimeout(function(){
	    that.wget();
	},1000);
    }
}

var that = new App();
that.start();

//str+="~!@#$%^&*";
//logger.info(str);
//that.crypto(str);
//that.crypto("date=2014-12-15 13:00:00&lng=116.658112&cityid=1&page=1&type=1&pagesize=10&r=0.20097687607282344&address=GUJIN 古今 12&duration=3&lat=40.136514~!@#$%^&*");
//that.crypto("date=2014-12-14 16:35:12&lng=116.658112&cityid=1&type=1&r=0.46667775068186634&address=GUJIN 古今 12&duration=3.0&lat=40.136514~!@#$%^&*");



//that.crypto("date=2014-12-15 13:00:00&lng=116.658112&cityid=1&page=1&type=1&pagesize=10&r=0.20097687607282344&address=GUJIN 古今 12&duration=3&lat=40.136514~!@#$%^&*");

