var fs = require('fs')
var util = require("util")
var logger = require('winston')
var seenreq = require("seenreq")
var moment = require("moment")
var Crawler = require('node-webcrawler')

var env = process.env.NODE_ENV || "development"

//日志初始化
logger.cli();
if(env==="production"){
    logger.add(logger.transports.File, {filename:"../../log/gome_airconditioner.log", logstash:true, level:"info"});
    logger.remove(logger.transports.Console);
}

var c = new Crawler({
    	maxConnections:1,//\
 	callback:function(err,result,$){
		that.processList(err,result,$);
    	},
	//logger:logger,
	//forceUTF8:true,
    	//debug:env === "development",
    	userAgent:"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:35.0) Gecko/20100101 Firefox/35.0",
	jar:true,
	onDrain:function(){
		that.saveResult();
		logger.info("Job done.");
	},
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
	 this.resultFile = "kaola_"+moment().format("YYYY-MM-DD");
	 this.seen = new seenreq();
	 this.prdlist={};
	 this.brdlist={};
}

Dealer.prototype.init = function(){
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
}

// var alllist['my']={};
// alllist['mr']={};
// alllist['jj']={};
// alllist['ms']={};
// alllist['yy']={};
// alllist['zy']={};
Dealer.prototype.start = function(){
    	this.init();
	var type = 'my';
	this.addqueue(['http://www.kaola.com/activity/detail/3245.html'], type);
	type = 'mr';
	this.addqueue(['http://www.kaola.com/activity/detail/3219.html'], type);
	type = 'jj';
	this.addqueue(['http://www.kaola.com/activity/detail/3248.html'], type);
	type = 'ms';
	this.addqueue(['http://www.kaola.com/activity/detail/3246.html'], type);
	type = 'yy';
	this.addqueue(['http://www.kaola.com/activity/detail/3247.html'], type);
	type = 'zy';
	this.addqueue(['http://www.kaola.com/activity/detail/3252.html'], type);

	// type = 'test';
	// this.addqueue(['http://www.kaola.com'], type);
}

//拍重，将url加入到queue中
//使用C的默认callback, 即使用processList处理
Dealer.prototype.addqueue = function(urls, type){
    	urls.filter(
		function(url){
			return !this.seen.exists(url);
    		},this
	).forEach(
		function(url){
			logger.info("queue:%s", url);
			c.queue({uri:url, type:type, callback:function(err, result, $){
				that.processList(err, result, $);
			}});
		}
	);
}

//true: it is a link of the product.
function isProduct(linkstr){
	if (linkstr && typeof(linkstr)=='string') {
		var str = linkstr.match(/\/product\/\d+\.html/);
		if (str && str.length>0) {return str[0];} 
	} 
	return null;
}

function isActivity(linkstr){
	if (linkstr && typeof(linkstr)=='string') {
		var index = linkstr.search(/activity\/detail\/\d+\.html/)
		if (index!=-1) {return true;} 
	} 
	return false;
}

function isBrandId(linkstr){
	if (linkstr && typeof(linkstr)=='string') {
		var str = linkstr.match(/#zid_\d+/);
		if (str && str.length>0) {return str[0];} 
	} 
	return '';
}

function getbrdname(strbrd){
	if(strbrd && typeof(strbrd)=='string'){
		var brds = strbrd.match(/([A-Za-zü]+\s?)*[A-Za-z]/);
		if (brds && brds.length>0) {return brds[0];} 
	}
	return null;
}

//获取url列表, c的默认callback
Dealer.prototype.processList = function(err,result,$){
    if(err){
	logger.error(err);
    }else{
		if(!$){
			logger.error('$ is empty.');
		}
		logger.info("processList start");	
		// fs.writeFile("/home/zero/tmp.html", result.body, null);

		var type = result.options.type;
		var linklist = $("a").not('.bold.suggestitem');
		logger.info("link length:%d", linklist.length);
		for (var i = 0; i < linklist.length; i++) {
			var linkstr = linklist.eq(i).attr('href');
			//logger.info("link :%s", linkstr);
			var prd = isProduct(linkstr);
			if (prd) {
				//if(prd in this.prdlist) continue;
				this.prdlist[prd]=1;
				var  brdname = getbrdname(linklist.eq(i).attr('title'));
				if(brdname){
					this.brdlist[brdname]=1;
					if(brdname in alllist[type]){
						if(prd in alllist[type][brdname]){
							alllist[type][brdname][prd]++;
						}
						else{
							alllist[type][brdname][prd]=1;
						}
					}
					else{
						alllist[type][brdname] = {};
						alllist[type][brdname][prd]=1;
					}
				}
			} 
			else if(isActivity(linkstr)){
				//add c.queue
				// linkstr = linkstr.replace(/#zid_\d+/g, '');
				// linkstr = linkstr.replace(/\?navindex=\d/g, '');
				linkstr = linkstr.replace(/(\?navindex=\d)|(#.+$)|(\?from.*$)/g, '');
				if(linkstr.indexOf("http://www.kaola.com")==-1){
					linkstr = "http://www.kaola.com"+linkstr;
				}
				this.addqueue([linkstr], type);
			}
		}
	}
}



Dealer.prototype.saveResult=function(){
	// logger.info(this.brdlist);
	// logger.info(this.prdlist);
	// logger.info("brdlist length: %d, prdlist length: %d.", Object.keys(this.brdlist).length, Object.keys(this.prdlist).length);
	var statics = "brdlist length: " + Object.keys(this.brdlist).length +", prdlist length:"+Object.keys(this.prdlist).length;
	fs.appendFile(this.resultDir+this.resultFile+"_single.txt", JSON.stringify(this.brdlist), function(e){
		if(e){ logger.error(e);}
	});
	fs.appendFile(this.resultDir+this.resultFile+"_single.txt", JSON.stringify(this.prdlist), function(e){
		if(e){ logger.error(e);}
	});

	fs.appendFile(this.resultDir+this.resultFile+"_single.txt", statics, function(e){
		if(e){ logger.error(e);}
	});

	var detail='', tbstatics = '', bpstatics='';
	for(var tp in alllist){
		var tbrdlist = alllist[tp];
		var tbrdlen = Object.keys(tbrdlist).length;
		tbstatics = tbstatics + '\n' + tp + ","  + tbrdlen ;
		for(var brd in tbrdlist){
			var tprdlist = tbrdlist[brd];
			var tprdlen = Object.keys(tprdlist).length;
			bpstatics = bpstatics + '\n' + tp + "," + brd + "," + tprdlen ;
			for(var tprd in tprdlist){
				detail = detail + "\n" + tp + "," + brd + "," + tprd ;
			}
		}
	}

	fs.appendFile(this.resultDir+this.resultFile+"_type.txt", tbstatics, function(e){
		if(e){ logger.error(e);}
	});

	fs.appendFile(this.resultDir+this.resultFile+"_brd.txt", bpstatics, function(e){
		if(e){ logger.error(e);}
	});

	fs.appendFile(this.resultDir+this.resultFile+"_detail.txt", detail, function(e){
		if(e){ logger.error(e);}
	});
}


var alllist={};
alllist['my']={};
alllist['mr']={};
alllist['jj']={};
alllist['ms']={};
alllist['yy']={};
alllist['zy']={};

// alllist['test']={};
var that = new Dealer();
that.start();
