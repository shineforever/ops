var fs = require("fs")
var client = require("../../dist/client.js")
var moment = require("moment")
var logger = require("winston")

var _prgname  = "haocheganji";

logger.add(logger.transports.File, { filename: '../../log/'+_prgname+'.client.log',logstash:true,level:'info' });

var app = {
    name:_prgname,
    seed:["http://haoche.ganji.com/bj/buy"],// the seed
    output:fs.createWriteStream("../../result/auto/"+_prgname+"_"+moment().format("YYYY-MM-DD")+".csv"),
    onInit:function(run_callback){
	this.output.write('\ufeff');
	this.output.write('城市,标题,上牌时间,里程,价格,市场价,车牌,检测师姓名,检查时间,Url,抓取时间\n');
	this.maxQueueSize = 12;
	run_callback();
    },
    onData:function(data){
	this.output.write(data);
    }
}

client(app)
