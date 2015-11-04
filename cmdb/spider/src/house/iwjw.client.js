var fs = require("fs")
var client = require("../../dist/client.js")
var _ = require("lodash")
var moment = require("moment")

var set = ["http://www.iwjw.com/sale/guangzhou/",
	     "http://www.iwjw.com/sale/beijing/",
	     "http://www.iwjw.com/sale/shenzhen/",
	     "http://www.iwjw.com/sale/shanghai/",
	   "http://www.iwjw.com/sale/tianjin/",
	   "http://www.iwjw.com/sale/hangzhou/"
	    ];
var appclient = {
    name:"iwjw",
    seed:_.flatten(set.map(function(t){
	var urls = [];
	for(var sp=0,ep=2;sp<=1000;sp=ep+1,ep+=3){
	    var url = t+"p1/?sp="+sp;
	    if(ep<1000){
		url += "&ep="+ep;
	    }
	    urls.push(url);
	}
	return urls;
    })),
    output:fs.createWriteStream("../../result/iwjw_"+moment().format("YYYY-MM-DD")+".csv"),
    onInit:function(done){
	this.output.write('\ufeffURL,城市,地址,小区名,图片数,视频\n');
	done();
    },
    onData:function(data){
	appclient.output.write(data);
    },
    onEnd:function(){
	this.output.end();
    }
}

client(appclient)
