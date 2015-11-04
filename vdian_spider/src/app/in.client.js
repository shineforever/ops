var logger = require("winston")
logger.add(logger.transports.File, { filename: '../../log/in.client.log',logstash:true,level:'info',handleExceptions: true });

var fs = require("fs")
var client = require("../../dist/client.js")
//var _ = require("lodash")
var crypto = require("crypto")
var mysql = require("mysql")
var util = require('util')
var env = process.env.NODE_ENV || "development";
var config = require('../../config.json')[env].db;
config.connectionLimit = 1;

function INQuery(){
    this._token= 'e29624f317b77784bc0f6c906611cf34'
    this._ct = 1
    this._auth='da7946ef591401fd667396398c0ce222'
    this.wfmn = 'CCC'
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
    this.page = opt.page||1;
}

function UsersQuery(opt){
    INQuery.call(this);
}

function FansQuery(opt){
    INQuery.call(this);
    this.id = opt.id;
    this.page = opt.page||1;
}
function ProfileQuery(opt){
    INQuery.call(this);
    this.id = opt.id;
}

function setSign(q){
    var content = Object.keys(q)
	.sort()
    //.filter(function(key){
    //    return ud.indexOf(this.prefix,key)===-1;
    //},this)
	.map(function(key){
	    return key+'='+encodeURIComponent(q[key]);
	})
	.join('&');
    var tstamp = parseInt(new Date().getTime()/1000);
    var hasher = crypto.createHash('md5');
    var sig = hasher.update(content+tstamp);
    var h =  sig.digest('hex').slice(0,16);
    q.sign = '1.0' + h + '8e37d70c8c6dcf3b' + tstamp;
    return q;
}

var conn = mysql.createPool(config);

var appclient = {
    name:"in",
    seed:{uri:"http://in.itugo.com/app/user/typehot",qs:setSign(new HomeQuery({page:1}))},
    output:fs.createWriteStream("../../result/app/in.csv"),
    onInit:function(next){
	var self = this;
	conn.query("select `id` from `INAppUsers`",function(err,rows){
	    logger.info(rows.length);
	    rows.forEach(function(row){
		self.seen.exists({
		    uri:"http://in.itugo.com/app/user/profile",
		    qs:setSign(new ProfileQuery({id:row.id}))
		});
	    });
	    logger.info("loaded user id");
	    next();
	});
    },
    onData:function(data){
	data = JSON.parse(data.toString());
	data.createdAt = new Date();
	data.updatedAt = new Date();
	data.created_at = new Date(data.created_at*1000);
	var keys= ["id", "name", "address", "authed", "created_at", "gender", "level", "number", "updated_at", "desc", "fans_count", "photo_count", "watch_count", "zan_count","createdAt","updatedAt"];
	var arr = keys.map(function(k){
	    return data[k]
	});
	//data = _.pick(data,keys);
	arr.push(data.id);
	conn.query("INSERT INTO `INAppUsers` (`id`,`name`,`address`,`authed`,`created_at`,`gender`,`level`,`number`,`updated_at`,`desc`,`fans_count`,`photo_count`,`watch_count`,`zan_count`,`createdAt`,`updatedAt`) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? FROM dual WHERE NOT EXISTS (SELECT * FROM `INAppUsers` WHERE `id`=?)",arr,function(err){
	    if(err){
		logger.error(err);
	    }
	});
    },
    onComplete:function(res){
	
    }
}

util.inherits(HomeQuery,INQuery);
util.inherits(FansQuery,INQuery);
util.inherits(ProfileQuery,INQuery);

client(appclient)
