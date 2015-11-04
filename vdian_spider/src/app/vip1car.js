var fs = require('fs')
var crypto = require("crypto")
var ud = require('underscore')
var Crawler = require("node-webcrawler")
var qs = require("querystring")
var logger = require("winston")
var moment = require("moment")
var seenreq = require("seenreq")
var mysql      = require('mysql');

// var EventEmitter = require('events').EventEmitter
// var e = new EventEmitter();

var env = process.env.NODE_ENV || "development";
logger.add(logger.transports.File, {filename:"../../log/vip1car.log", logstash:true, level:"info"});
logger.cli();
if(env==="production"){
    logger.remove(logger.transports.Console);
}

var godotTransport = require("winston-godot")
var godot = require("godot")
var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"vip1car"});//service名称需要更改

function vip1car(){
    this.token = "g3IHlLyLYLQVzk8n1437471073";//每次登陆需要更新
    this.keys = "r0WobK7O1437471073151";//每次登陆需要更新
    this.resultDir = "../../result/appdata/";
    this.appDir = "../../appdata/";
    this.pointFile = "didipoints.txt";
    this.today = moment().format("YYYY-MM-DD");
    this.resultFile = "vip1car_";
    this.drIdlist = {};
    this.startindex = 0;
    this.citycount = 0;
    this.savetype = 1;
    this.conndb = null;
}

vip1car.prototype.init = function(){
    if(!fs.existsSync(this.resultDir)) {
        fs.mkdirSync(this.resultDir);
    }

    if (this.savetype) {
            //初始化数据库链接
        this.conndb = mysql.createPool({
              host     : '192.168.98.213',
              user     : 'root',
              password : 'xiaokang2015',
              // database : 'mytest',
              database : 'bdadata',
              connectionLimit:1
        });
    };

    this.crawler = new Crawler({
        maxConnections:1,
        rateLimits:500,
        jQuery:false,
        onDrain:function(){
            logger.info("Job done.");
            logger.remove(godotTransport);
            client.close();
        },
        callback:function(error,result){
            that.processData(error, result);
        },
        userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"
    });
}

vip1car.prototype.processData = function(error,result){
            if(error){
                logger.error(error);
                return;
            }
            // logger.info("process data");
            // fs.writeFileSync('/home/zero/tmp.dat', result.body);
            try{
                var obj=null;
                if(typeof result.body=="string"){
                    obj = JSON.parse(result.body);
                }else{
                    obj = result.body;
                }
            }
            catch(e){
                logger.error("parse result.body err.");
                logger.error(e);
            }

            if(obj.ret.code===0){
                try{
                    var data = null;
                    if(typeof obj.data == 'string'){
                        if(obj.data ) data = JSON.parse(obj.data);
                        else {logger.info("no data."); return;}
                    }
                    else{
                        data = obj.data;
                    }
                }catch(e){
                    logger.error("parse obj.data err.");
                    logger.error(e);
                }
                if (data.count ==0 ) {
                    return;
                };
                var date = moment().format("YYYY-MM-DD");
                var range = result.options.range;
                // logger.info("count : %s, cars : %s", typeof(data.count), typeof(data.cars));
                logger.info("Got %d drivers %s",data.count, result.options.city);
                var rst = data.cars
                    .filter(function isValid(item, index, arr){ 
                        if ((item.lng>range.lngmin && item.lng<range.lngmax) 
                            &&(item.lat>range.latmin && item.lat < range.latmax)) {
                                if ( !that.drIdlist['_'+item.driverId] ) {//不存在
                                    that.drIdlist['_'+item.driverId] =1;
                                    return true;
                                }                                
                        } 
                        return false;
                    })
                    .map(function(item){
                        return Object.keys(item).map(function(drkey){
                            return item[drkey];
                        }).join(",")+","+date+","+result.options.city;
                    }).join("\n");

                if (rst) {
                    this.saveData(rst);
                };

             }
             else{
                logger.error("code : %d, msg: %s", obj.ret.code, obj.ret.msg);
             }
}

vip1car.prototype.saveData = function(datastr){
    // logger.info("saveData: %d", this.savetype);
    if (this.savetype) {//db
        // if(datastr){
            var sqllist = datastr.replace(/,/g,'\',\'').split('\n');
            for (var i = 0; i < sqllist.length; i++) {
                var sql = "insert into vip1car(driverid, lng, lat, drivertype, uptm, pointsProvide, workingStatus, date, city) values ('"+sqllist[i] + "');";
                // logger.info(sql);
                try{
                    this.conndb.query(sql, function(err, results, rows) {
                            if(err && err.errno!=1062){  logger.error("sql:%s", sql);logger.error(err); return; }
                        }
                    );
                }
                catch(e){}
            } 
        // }
    } else{//file
        // if(datastr){
            fs.appendFile(this.resultDir+this.resultFile+this.startindex + "_"+this.citycount + "_" + this.today+".csv",  
                rst + "\n", function(e){
                    if(e){   logger.error(e);}          
                }
            );
        // }
    }
}

vip1car.prototype.start = function(){
    this.init();
    //  var range = {latmax:40.114814070, latmin:39.6466907558, 
    //         lngmax:116.7335826020, lngmin:116.1781410895};
    // this.nearbydrivers("116.4335826020","39.8466907558", '北京', range);
    // this.nearbydrivers("116.4335826020","39.8466907558", '北京', range);
    // return;
    var arguments = process.argv.splice(2);
    var start = Number(arguments[0]) || 0;//第一个参数
    var len = Number(arguments[1]) || 1000;//第二个参数
    var d = 2.828427124;//根号2

    if (arguments[2]) {
        this.token = arguments[2];
        logger.info("token: %s", this.token);
    };

    if (arguments[3]) {
        this.keys = arguments[3];
        logger.info("keys: %s", this.keys);
    };
    
    this.startindex = start;
    this.citycount = len;

    //读取文件中的点位
    if (!fs.existsSync(this.appDir+this.pointFile)) {
        logger.error("the vip1car points file not exist .");
        return;
    }
    
    this.points = [];
    fs.readFileSync(this.appDir+this.pointFile).toString().split("\n").slice(start,start+len).forEach(
        function(line){
            line = line && line.replace(/\r/g,'');
            if(!line) return;

            var vals = line.split("\t");
            //城市，top, bottom, x, y
            var lefttp = vals[1].split(",");
            var rightbtm = vals[2].split(",");
            var o = {c:vals[0], lefttop:lefttp, rightbottom:rightbtm, xd:(+vals[5]),yd:(+vals[6])};
            this.points.push(o);
        },this
    );

    this.points.forEach(function(t){
        var lngstep = (t.rightbottom[1]-t.lefttop[1])/(t.xd/d),
        latstep = (t.lefttop[0]-t.rightbottom[0])/(t.yd/d),
        stlng = +t.lefttop[1],
        endlng = +t.rightbottom[1],
        stlat = +t.rightbottom[0],
        endlat = +t.lefttop[0];

        // logger.info("lngstep: %s, latstep: %s",lngstep,latstep);
        var range = {latmax:Number(t.lefttop[0])+latstep, latmin:Number(t.rightbottom[0])-latstep, 
            lngmax:Number(t.rightbottom[1])+lngstep, lngmin:Number(t.lefttop[1])-lngstep};

        for(var i=stlng;i<endlng;i+=lngstep){
            for(var j=stlat;j<endlat;j+=latstep){
                // logger.info("%s,%s",i,j);
                // logger.info(range);
                this.nearbydrivers(i,j,t.c, range);
            }
        }
    },this);

    //for end
    this.crawler.queue({uri:"http://www.baidu.com", priority:8, callback:function(){
        logger.info("end db connect.");
        that.conndb.end();
    }});
}

vip1car.prototype.buildparams = function(lng,lat,c){
    var params = {};

    params['driverType']=1;
    params['num']=0;   
    params['sprodId']=0;
    params['prodId']=0;
    params['ver']='4.3.0';
    params['cityId']=5;

    params['token']=this.token; 

    params['nonce']=Number(moment());
    params['lng']=lng;
    params['lat']=lat;
    params["sig"]= this.generatesignature(params);

    return params;
}

vip1car.prototype.nearbydrivers = function(lng,lat,c, range){
    var params = this.buildparams(lng,lat);
    //logger.info(params.sig);
    // logger.info(qs.stringify(params));
    var uri = "http://223.6.254.51/vip/v4/customer/showCars";
    // logger.info(uri);
    this.crawler.queue({
        method:'POST',
        uri:uri,
        city:c,
        range: range, 
        form:params
    });
}

vip1car.prototype.generatesignature = function(params){
    var content = Object.keys(params)
            .sort()
            .map(function(key){
                return key+"="+params[key];
            })
            .reduce(function(pre,cur){
                return pre+"&"+cur;
            },this.keys);
    // logger.info("content len: %d", content.length);
    // logger.info(content);
    this.sha = crypto.createHash('md5');
    var sighex = this.sha.update(content, 'utf8').digest('hex');

    // logger.info('sg : %s, len : %d', sighex, sighex.length);

    var buf = new Buffer(sighex);
    return buf.toString('base64');
}
var that = new vip1car();
that.start();
