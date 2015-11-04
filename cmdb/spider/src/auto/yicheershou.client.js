var logger = require("winston")
logger.add(logger.transports.File, { filename: '../../log/yicheershou.client.log',logstash:true,level:'info' });

var fs = require("fs")
var client = require("../../dist/client.js")
var moment = require("moment")

var app = {
    name:"yicheershou",
    seed:["http://www.taoche.com/buycar/pges2bxcdza/?onsale=1","http://www.taoche.com/buycar/pges1bxcdza/?onsale=1"],
    output:fs.createWriteStream("../../result/auto/yicheershou_"+moment().format("YYYY-MM-DD")+".csv"),
    onInit:function(done){
	this.output.write('\ufeff');
	this.output.write('url,标题,型号,配置,价格,里程,上牌,是否个人,城市\n');
	this.maxQueueSize = 12;
	done();
    },
    onData:function(data){
	this.output.write(data);
    }
}

client(app)
