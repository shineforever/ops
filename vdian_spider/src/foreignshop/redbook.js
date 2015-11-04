var fs = require('fs')
var util = require("util")
var logger = require('winston')
var seenreq = require("seenreq")
var moment = require("moment")
var Crawler = require('node-webcrawler')

var env = process.env.NODE_ENV || "development"

//日志初始化

var c = new Crawler({
    maxConnections:1,//\
 	callback:function(err,result,$){
	that.processList(err,result,$);
    },
//    logger:logger,
//    forceUTF8:true,
    //debug:env === "development",
    userAgent:"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:35.0) Gecko/20100101 Firefox/35.0",
	jar:true,
	onDrain:function(){logger.info("Job done.");},
	rateLimits:1000//时间间隔，毫秒单位

})

function dealstr(str){
    if(typeof(str)=='string'){
        var nodotstr = str.replace(/,/g, ' ');
        return nodotstr.replace(/\s+/g, ' ');
    }                                                                                                       
    else{
        return str;
    } 
}

function dealEmpty(value){
	if(typeof(value)=='number'){
		return value;
	}
	else{
		return (value?value:"N/A");
	}
}

var Dealer = function(){
    this.resultDir = "../../result/foreignshop/";
    this.resultFile = "redbook_"+moment().format("YYYY-MM-DD")+".txt";
    this.seen = new seenreq();
}

Dealer.prototype.init = function(){
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}	
}

Dealer.prototype.start = function(){
    this.init();
	c.queue({
		uri:"http://www.xiaohongshu.com/api/v2/store/specials?platform=pc",
		callback:function(err, result, $){
			that.processSkuList(err, result, $);
		}
	});	
}

Dealer.prototype.processSkuList=function(err, result, $){
	if(err){
		logger.error(err);
	}
	else{
		try{
			//fs.writeFile("/home/zero/tmp.html", result.body, null);
			var data = JSON.parse(result.body).data;
			//logger.info(data);
			logger.info("Got sku count: %d", data.length);
			
			for(var i=0; i<data.length; ++i){
				var link = "http://www.xiaohongshu.com/sale?type=now&oid=" + data[i].id;
				var detail = {title:data[i].title, desc:data[i].desc};
				//logger.info(link);
				c.queue({
					uri:link, detail:detail, callback:function(err, result, $){
						that.processList(err, result, $);
					}
				});
			}	
		}
		catch(e){
			logger.error("Error parsing page %s", result.uri);
			logger.error(e);
			return ;
		}
	}
}

//拍重，将url加入到queue中
//使用C的默认callback, 即使用processList处理
Dealer.prototype.addqueue = function(urls, cbfunc){
    urls.filter(
		function(url){
			return !this.seen.exists(url);
    	},this
	).forEach(
		function(url){
			c.queue({uri:url, callback:function(err, result, $){
				that.cbfunc(err, result, $);
			}});
		}
	);
}

function getSrcCountry(desc){
	if(desc && typeof(desc)=='string'){
		var mr = desc.match(/【([^【]+)·/);
		if(mr && mr.length>1){
			return mr[1];
		}
	}
	return 'N/A';
}

//获取item url列表
Dealer.prototype.processList = function(err,result,$){
    if(err){
		logger.error(err);
    }else{
		//logger.info("processList start");	
		
		try{
			//fs.writeFile("/home/zero/tmp.html", result.body, null);
			eval(result.body.match(/var data = {"popular_item":.*"}]};/)[0]);
		}catch(e){
			logger.error("Error match page %s", result.uri);
			logger.error(e);
			return ;
		}
		var itemlist = data.images_list;
		var detail = result.options.detail;
		var reclist=[];
		logger.info("Got item count: %d", itemlist.length);
		for(var i = 0; i<itemlist.length; ++i ){
			var rec =[];// {title:detail.title, desc:detail.desc};
			rec.push(dealEmpty(dealstr(detail.title)));
			rec.push(dealEmpty(dealstr(detail.desc)));
			rec.push(dealEmpty(itemlist[i].price));
			rec.push(dealEmpty(itemlist[i].discount));
			rec.push(dealEmpty(getSrcCountry(itemlist[i].desc)));
			rec.push(dealEmpty(dealstr(itemlist[i].desc)));
			rec.push(dealEmpty(itemlist[i].id));
			reclist.push(rec.join(','));
		}
//		logger.info(reclist);
		this.saveData(reclist);
	}
}

Dealer.prototype.saveData=function(reclist){
	
	var strdata = reclist.join('\n') + '\n';
	fs.appendFile(this.resultDir+this.resultFile, strdata, function(e){
		if(e){ logger.error(e);}
	});
}

var that = new Dealer();
that.start();
//c.queue("http://list.suning.com/0-431504-0-0-0-9017.html");
//c.queue("http://www.suning.com");



