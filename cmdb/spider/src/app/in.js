var fs = require('fs')
var Crawler = require('node-webcrawler')
var crypto = require("crypto")
var Emitter = require('events').EventEmitter
var util = require('util')
var moment = require('moment')
var mysql = require('mysql')
var logger = require("winston")
require('heapdump')

var env = process.env.NODE_ENV || "development";
var config = require('../../config.json')[env];
logger.add(logger.transports.File, { filename: '../../log/in.log' });
if(env==="production"){
    logger.remove(logger.transports.Console);
}

function INApp(){
    Emitter.call(this);
    
    this.host = 'in.itugo.com';
    this.hotPath = '/app/home/hot';
    this.profilePath = '/app/user/profile';
    this.likePath = '/app/photo/zanlist';
    this.resultDir = "../../result/";
    this.rstInfoFile = 'in.info.txt';
    this.rstUsrFile = 'in.user.txt';
    this.rstCountFile = 'in.count.txt';
    this.users = {};
    this.messages = {};
    this.cppLike = 20;// count per page of like
    this.defaultCountLike = 7;
    this.needTotalPage = 34;
    
    this.c = new Crawler({
	maxConnections:20,
	//rateLimits:2000,
	userAgent : '',//'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36',
	jQuery:false,
	jar:true,
	headers:{
	    //Cookie: 'PHPSESSID=r1ucerf5dll7heukngmij179k1; AK=1b1fa8f0d09ae76fdcd790274952a209; tg_auth=e29624f317b77784bc0f6c906611cf34; tg_id=45110189',
	    //Cookie2: '$Version=1'
	    'Accept-Encoding':'gzip'
	},
	debug:env==='development',
	callback:function(err,result){
	    that.processor(err,result);
	}
    });
    this.conn = mysql.createPool(config);
    this.on('processedHome',this.wget);
    this.on('processedUsers',this.wgetUsers);
    this.on('start',this.wget);
    this.on('getLikeUsers',this.wgetUsers);
    this.on('getUserProfile',this.wgetProfile);
}

util.inherits(INApp,Emitter);
function INQuery(){
    this._token= 'e29624f317b77784bc0f6c906611cf34'
    this._uiid= '059bac18b525dc33fd6a2b2cbf212356'
    this._version= '1.9.1'
    this._promotion_channel= 'itugo'
    this._net='WIFI'
    this._platform='Lenovo S810t'
    this._uuid= '5816a9afc1214a68'
    this._req_from= 'java'
    this.action_gps='116.460438,39.914056'
    this.wfm= '70:72:0d:c7:8f:c6'
    this._source='android'
}

function HomeQuery(opt){
    INQuery.call(this);
    this.page = opt.page;
    var self = this;
    if(typeof opt.breakpoints !== 'undefined'){
	Object.keys(opt.breakpoints).reduce(function(opt,key){
	    self[key]=opt.breakpoints[key];
	    return opt;
	},opt);
	delete opt.breakpoints;
    }
}

function UsersQuery(opt){
    INQuery.call(this);
    this.photo_id = opt.photo_id;
    this.page = opt.page;
}

function ProfileQuery(opt){
    INQuery.call(this);
    this.id = opt.id;
    //this._ht = opt.ht;
}

INApp.prototype.init = function(){
    if(fs.existsSync(this.resultDir+this.rstUsrFile)){
	fs.readFileSync(this.resultDir+this.rstUsrFile).toString().split('\n').forEach(function(line){
	    if(!line.trim())
		return;
	    this.users[line.split(',')[0]]=null;
	},this);
	logger.info("[INFO] done users: %d",Object.keys(this.users).length);
    }
    
    if(fs.existsSync(this.resultDir+this.rstInfoFile)){
	fs.readFileSync(this.resultDir+this.rstInfoFile).toString().split("\n").forEach(function(line){
	    if(!line)
		return;
	    this.messages[line.split(',')[0]]=null;
	},this);
	logger.info("[INFO] done photos: %d",Object.keys(this.messages).length);
    }
}

INApp.prototype.start = function(){
    this.init();
    //this.wgetProfile({id:'45302524'});
    //this.wget({page:1});
    this.emit('start',{page:1});
}

INApp.prototype.genSign = function(q){
    var content = Object.keys(q)
	.sort()
	//.filter(function(key){
	//    return ud.indexOf(this.prefix,key)===-1;
	//},this)
	.map(function(key){
	    return key+'='+encodeURIComponent(q[key]);
	})
	.join('&');
    //logger.info(q);
    //logger.info(content);
    var tstamp = parseInt(new Date().getTime()/1000);
    var hasher = crypto.createHash('md5');
    //tstamp = '1428406961';
    var sig = hasher.update(content+tstamp);
    var h =  sig.digest('hex').slice(0,16);
    //logger.info(h);
    return '1.0' + h + '8e37d70c8c6dcf3b' + tstamp;
}

INApp.prototype.login = function(){
    
}

INApp.prototype.wgetUsers = function(opt){
    // TODO: finish getting user list.
    var q = new UsersQuery(opt);
    var sign = this.genSign(q);
    q.sign = sign;
    logger.info('[GET ] Users, Photo: %s, Page: %d',opt.photo_id,opt.page);
    this.c.queue({
	uri:'http://'+this.host+this.likePath,
	qs:q,
	processor:"processUsers"
    });
}

INApp.prototype.wgetProfile = function(opt){
    //TODO: finish getting user info
    var q = new ProfileQuery(opt);
    var sign = this.genSign(q);
    q.sign = sign;
    logger.info("[GET ] Profile: %s",opt.id);
    this.c.queue({
	uri:'http://'+this.host+this.profilePath,
	qs:q,
	processor:"processProfile"
    });
}

INApp.prototype.wget = function(opt){
    var q = new HomeQuery(opt);
    var sign = this.genSign(q);
    q.sign = sign;
    logger.info('[GET ] Home, page: %d',q.page);
    //logger.info(q);
    this.c.queue({
	uri:'http://' + this.host + this.hotPath,
	qs:q,
	processor:"processHome"
    });
}

INApp.prototype.processor = function(err,result){
    if(err){
	logger.info(err);
    }else{
	if(this.preProcess(result)){
	    var args = {opt:result.options.qs,data:result.body.data};
	    switch(result.options.processor){
	    case "processProfile":
		this.processProfile(args);
		break;
	    case "processHome":
		this.processHome(args);
		break;
	    case "processUsers":
		this.processUsers(args);
		break;
	    default:
		throw "not implement yet.";
		break;
	    }
	}
    }
}

INApp.prototype.preProcess = function(result){
    if(!result || !result.body){
	logger.info("[Error] data empty");
	return false;
    }
    var opt = result.options.qs
    ,obj = null;
    try{
	obj = JSON.parse(result.body);
	result.body = obj;
    }catch(err){
	logger.info(err);
	result.body = null;
	return false;
    }
    if(!obj.succ)
	logger.info("[ERROR] %s",obj.data.msg);
    
    return obj.succ;
}

INApp.prototype.processProfile = function(result){
    var opt = result.opt
    ,d = result.data;
    
    logger.info("[GOT ] Profile: %s ",d.name);
    var id = d.id
    ,name = d.name.replace(/[,，\s]/g,';')
    ,no = d.number
    ,level = d.level
    ,desc = d.desc.replace(/[,，\s]/g,';')
    ,photoCount = d.photo_count
    ,watchCount = d.watch_count
    ,fansCount = d.fans_count
    ,likeCount = d.zan_count
    ,addr = d.address.replace(/[,，\s]/g,';')
    ,createdAt = moment(Number(d.created_at)*1000,"x")
    ,gender = d.gender;
    
    var r = [id,name,no,level,desc,photoCount,watchCount,fansCount,likeCount,addr,createdAt.format("YYYY-MM-DD"),gender,'\n'].join();
    logger.info(r);
    fs.appendFileSync(this.resultDir+this.rstUsrFile,r);
    this.users[id] = null;
}

INApp.prototype.processUsers = function(result){
    var opt =result.opt
    ,data = result.data;
    
    var records = [''];
    var i = 0;
    data.filter(function(item){
	var photoId = opt.photo_id || result.photoId;
	/*
	this.conn.query('INSERT INTO `INAppUsers` (`photoid`,`userid`,`updatedAt`,`createdAt`)  SELECT ?,?,?,? FROM DUAL WHERE NOT EXISTS (SELECT * FROM `INAppUsers` WHERE `photoid`=? AND `userid`=?)',[photoId,item.id,new Date(),new Date(),photoId,item.id],function(err){
	    if(err){
		logger.info(err);
	    }
	});*/
	//this.users[item.id]+= 0+exists;
	records.push([photoId,item.id].join());
	return !(item.id in this.users);
    },this).forEach(function(item){
	i++;
	this.emit('getUserProfile',{id:item.id});
	//that.wgetProfile({id:item.id});
    },this);
    logger.info("users %d",i);
    fs.appendFileSync(this.resultDir+this.rstCountFile,records.join("\n"));
    
    if(typeof result.total !== 'undefined'
       && result.total<=this.defaultCountLike){
	//nothing to do.
	
    }else if(data.length === this.cppLike){
	++opt.page;
	this.emit('processedUsers',opt);
    }
}

INApp.prototype.processHome = function(result){
    //logger.info(result.options.qs);
    var opt = result.opt
    ,data = result.data
    ,newCount = 0;
    
    var records = [['']];
    data.items.forEach(function(item){
	var i = item.photo_info
	,uid = i.user_id
	,name = i.user_name
	,level = i.level||0
	,updatedAt = i.updated_at
	,no = i.number
	,photoCount = item.photo_count||0
	,likeCount = i.zan_count
	,commentCount = item.comment_info && item.comment_info.comment_count || 0;
	
	if(!uid){
	    return;
	}
	
	newCount+= 0 + (i.id in this.messages);
	
	records.push([i.id,uid,name,level,updatedAt,no,photoCount,likeCount,commentCount,moment().format('YYYY-MM-DD')]);
	if(likeCount>this.defaultCountLike){
	    this.emit('getLikeUsers',{photo_id:i.id,page:1});
	}else{
	    if(data.zan_info && data.zan_info.zan_items){
		this.processUsers({obj:data.zan_info.zan_items,opt:opt,total:likeCount,photoId:i.id});
	    }
	}
    },this);
    logger.info("[GOT ] New Messages %d",newCount);
    
    var rst = records
	.filter(function(record){
	    return !(record[0] in this.messages);
	},this)
	.map(function(record){
	    return record.join();
	})
	.join('\n');
    
    fs.appendFileSync(this.resultDir+this.rstInfoFile,rst);
    opt.breakpoints = JSON.parse(JSON.stringify(data.breakpoints));
    if(opt.page < this.needTotalPage){
	++opt.page;
	this.emit('processedHome',opt);
    }
}

util.inherits(HomeQuery,INQuery);
util.inherits(UsersQuery,INQuery);
util.inherits(ProfileQuery,INQuery);

var that = new INApp();
that.start();
