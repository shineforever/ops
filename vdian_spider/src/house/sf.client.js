var fs = require("fs")
var client = require("../../dist/client.js")
var _ = require("lodash")
var moment = require("moment")

var appclient = {
    name:"sofang",
    seed:{
	uri:'http://esf.fang.com/newsecond/esfcities.aspx',
	publish:process.argv.slice(2)[1]//发布时间，默认抓取所有历史数据
    },
    output:[fs.createWriteStream("../../result/sofang/sfershou_"+moment().format("YYYY-MM-DD")+".csv"),fs.createWriteStream("../../result/sofang/sfershou_agent_"+moment().format("YYYY-MM-DD")+".csv")],
    onInit:function(done){
	this.output.forEach(function(out){
	    out.write('\ufeff标题,房源编号,区域,发布时间,是否业主发布,城市,链接地址,图片数量,是否有0.5%标签,抓取时间');
	});
	
	done();
    },
    onData:function(data){
	var self = this;
	data.toString().split('\r\n').forEach(function(rst,idx){
	    self.output[idx].write(rst);
	});
    },
    onEnd:function(){
	this.output.forEach(function(out){
	    out.end();
	});
    }
}

client(appclient)
