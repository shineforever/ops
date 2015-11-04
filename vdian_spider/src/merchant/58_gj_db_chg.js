var fs = require('fs')
var qs = require("querystring")
var logger = require("winston")
var moment = require("moment")
var mysql      = require('mysql');
var util = require("util")

var EventEmitter = require('events').EventEmitter
var e = new EventEmitter();

var env = process.env.NODE_ENV || "development";
logger.cli();
if(env==="production"){
    logger.add(logger.transports.File, {filename:"../../log/gj_58_db.log", logstash:true, level:"info"});
    logger.remove(logger.transports.Console);
}

function Gj58Db(){
    this.connection;
    this.count ;
    this.pos = 0;
    this.offset = 50000;
    this.startuid = 0;
    this.uidflag = 1;
    this.done = 1;

    e.on("slice-start",function(){
        that.sliceData();
    });
}

Gj58Db.prototype.init=function(){
    // this.connection = mysql.createConnection({
    //       host     : 'localhost',
    //       user     : 'root',
    //       password : '12345678',
    //       database : 'internetcompanies'
    //       // database : 'mytest'
    // });
    //参数初始化
    var arguments = process.argv.splice(2);
    if (arguments[0]) {
        this.uidflag = 0;
        this.startuid = Number(arguments[0]) ;
    };
    // this.startuid = Number(arguments[0]) || 0;
    this.offset = Number(arguments[1]) || 50000;

    logger.info("params : startuid=>%d, offset=>%d", this.startuid, this.offset);
    // return 1;

    //初始化数据库链接
    this.connection = mysql.createPool({
          host     : 'localhost',
          user     : 'root',
          password : '12345678',
          // database : 'mytest',
          database : 'internetcompanies',
          connectionLimit:40
    });
    return 0;
}

Gj58Db.prototype.start=function(){
    if (this.init()) {
        return;
    }

    //get uid 
    if (this.uidflag) {
        this.connection.query('SELECT uid FROM classifiedsposts order by uid limit 1', function(err, results, rows) {
            that.getMinUid(err, results, rows);
        });
    };


    //get count
    this.connection.query('SELECT count(uid) as count FROM classifiedsposts', function(err, results, rows) {
        that.getCount(err, results, rows);
    });
}

Gj58Db.prototype.getMinUid=function(err, results, rows){
    if (err) {
        logger.error(err);
        return;
    }
    if(results.length==0) {
        logger.error("the table is empty.");
        return ;
    }
    this.startuid=results[0].uid-1;
    logger.info("startuid:%d", this.startuid);
}

Gj58Db.prototype.getCount=function(err, results, rows){
    if (err) {
        logger.error(err);
        return;
    }
    this.count = results[0].count;
    logger.info("count:%d", this.count);
    e.emit('slice-start');
}

Gj58Db.prototype.sliceData=function(){
        logger.info("<%s>\tfinished %d/%d, startid %d", moment().format("YYYY-MM-DD HH:mm:ss"), this.pos, this.count, this.startuid);
        var len = this.offset;
        if (this.done) {
            this.done = 0;
            len = (this.pos+len)>this.count?(this.count-this.pos):len;
            var sql = util.format("select * from classifiedsposts where uid>%d order by uid asc limit %d", this.startuid, len);
            // logger.info(sql);
            this.connection.query(sql, function(err, results, rows) {
                that.insertOtData(err, results, rows);
            });
            this.pos = this.pos+len;
        }
        else{//finished
            // pool.end(function (err) {
            //         // all connections in the pool have ended
            //         if(err) logger.error(err);
            // });
        }
}

function buildValues(recobj){
    var recarr=[recobj.uid, recobj.mid||'null', recobj.mname||'null', recobj.murl||'null', recobj.mq, recobj.city||'null', 
                      recobj.district||'null', recobj.primary||'null', recobj.secondary||'null', recobj.tertius||'null', recobj.turl||'null', 
                      recobj.tt, recobj.tid||'null', recobj.site||'null',//recobj.createdAt, recobj.updatedAt];
                      moment(recobj.createdAt).format("YYYY-MM-DD HH:mm:ss"), 
                      moment(recobj.updatedAt).format("YYYY-MM-DD HH:mm:ss")];
    return recarr.join("','");
}

Gj58Db.prototype.insertOtData=function(err, results, rows){
    if (err) {
        logger.error(err);
        return;
    }

    logger.info("slice length: %d", results.length);

    var reclist = {};
    reclist['58']={};
    reclist['58']['zp']=[];
    reclist['58']['fw']=[];
    reclist['58']['zf']=[];
    reclist['58']['2fs']=[];
    reclist['58']['2car']=[];
    reclist['gj']={};
    reclist['gj']['zp']=[];
    reclist['gj']['fw']=[];
    reclist['gj']['zf']=[];
    reclist['gj']['2fs']=[];
    reclist['gj']['2car']=[];
    for (var i = 0; i < results.length; i++) {
        // logger.info(results[i] );
        // logger.info("rec: %s, ", results[i].site, results[i].primary);
        if (results[i].site!='58' && results[i].site!='gj') {
            continue;
        } 

        if (this.startuid<results[i].uid) {
            this.startuid=results[i].uid;
            this.done = 1;
        };

        var type ;
        switch(results[i].primary){
            case '招聘':
                type = 'zp';
                break;
             case '生活服务':
                type='fw';
                break;  
            case '二手车':
                type='2car';
                break;
            case '租房':
                type='zf';
                break;
            case '二手房':
                type='2fs';
                break;
            default:
                logger.error("primary err: %s", results[i].primary);
                continue;
        }
        var date = moment(results[i].createdAt).format("YYYY-MM-DD");
        // logger.info("insert into %s_%s  set ？, date=%s", results[i].site, type, results[i] ,date);
        // var sql = util.format("insert into %s_%s set ", '58', 'zp');
        // var sql = util.format("insert into %s_%s set ", results[i].site, type );
        // logger.info(query.sql);
        var sql = util.format("('%s', '%s')", buildValues(results[i]), date );
        // logger.info("sql values: %s", sql);
        reclist[results[i].site][type].push(sql);
        if(reclist[results[i].site][type].length>1000){
            var tmpsql = util.format("insert into %s_%s values %s", results[i].site, type, reclist[results[i].site][type].join(',') );
            // logger.info(tmpsql);
            var query = this.connection.query(tmpsql, 
                function(err, results, rows) {
                    if(err){    logger.error(err); return; }
                }
            )
            reclist[results[i].site][type] = [];
        }
        // logger.info(sql);
    }

        // var query = this.connection.query(sql+"?, date=?", [results[i], date ], 
        //     function(err, results, rows) {
        //         if(err){    logger.error(err); return; }
        //     }
        // );
    for(var site in reclist){
        for(var tp in reclist[site]){
            // logger.info(reclist[site][tp]);
            if(reclist[site][tp].length==0) continue;
            var tmpsql = util.format("insert into %s_%s values %s", site, tp, reclist[site][tp].join(',') );
            // logger.info(tmpsql);
            var query = this.connection.query(tmpsql, 
                function(err, results, rows) {
                    if(err){    logger.error(err); return; }
                }
            );
            // logger.info(query.sql);
        }
    }
    e.emit('slice-start');
}

var that = new Gj58Db();
that.start();
