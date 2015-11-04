var fs = require('fs')
var Crawler = require("node-webcrawler")
var URL = require('url')
var logger = require("winston")
var moment = require("moment")
var env = process.env.NODE_ENV || "development;"
//var Iconv = require('iconv').Iconv

logger.add(logger.transports.File, { filename: '../log/sofang_ershou.log',logstash:true });
if(env==="production"){
    logger.remove(logger.transports.Console);
}


var c = new Crawler({
    maxConnections:1,
    rateLimits:800,
    userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36",
    forceUTF8:true,
    timeout:15000,
    callback:processDetail,
    retries:1,
    logger: logger,
    debug:env === "development",
    onDrain:function(){
	logger.info("Job Done!");
    }
});

var today = moment().format("YYYY-MM-DD");
var done = {};
//var converter = new Iconv('UTF-8//TRANSLIT//IGNORE','GBK')

function processList(error,result){
    if(error){
	logger.error(error);
	// should append task to continue;
	return ;
    }
    
    var matches = result.body.match(/共(\d+)页/);
    var maxIdx = Number(matches && matches.length>1 && matches[1]);
    if(maxIdx===0){
	logger.warn("max page index empty or no records found: %s",result.uri);
    }
    
    var curIdx = Number(result.uri.match(/i3(\d+)/)[1]);
    
    var uriobj = URL.parse(result.uri);
    matches = result.uri.match(/.*?-j3100/);
    var prefix = matches &&  matches[0];
    var next = prefix+'-i3'+(curIdx+1)+queryOptions;
    
    var reg = /\/chushou\/[\d_]+\.htm/g;
    var urls = result.body.match(reg);
    if(urls && urls.length>0){
    	urls = urls.filter(function(url,i){
    	    return i&1==1 && !done["http://"+uriobj.host+url];
    	}).map(function(url){
    	    return "http://"+uriobj.host+url;
    	});
    }
    
    logger.info("page: %d/%d, urls: %d, %s",curIdx,maxIdx,urls&&urls.length||0,result.uri);
    c.queue(urls);
    if(curIdx < maxIdx){
	c.queue({uri:next,callback:processList,jQuery:false});
    }
}

function processDetail(error,result,$){
    if(error){
	logger.error(error);
	return;
    }
    if(!$){
	logger.error("jquery $ is undefined");
	return;
    }
    
    var imgQuantity = $("#thumbnail ul > li").length
    , tit = $("h1").text().trim()
    , txt = $("div.title p span.mr10").text().trim()
    , no = txt && txt.replace(/房源编号：/,"") || "";
    
    tit = tit && tit.replace(/\s/g,'').replace(/,/g,';');
    if(!tit || !no){
	logger.error("empty: %s",result.uri);
	return;
    }
    
    txt = $("div.title p > span").last().text();
    
    var pubtime = txt && txt.replace(/发布时间：/,'').replace(/\s/g,'')
    , city = $(".s2 .s4Box a").text().trim()
    , addr = result.uri
    , agent = $(".card dl dt strong a").text().trim()
    , agentid = $(".card dl dt strong a").attr("href")
    , bread = $(".bread").text().replace(/[\s,]/g,'').replace(/二手房/g,'')
    , createdAt = moment().format("YYYY-MM-DD HH:mm:ss")
    , tag = false;

    city = city || bread.split(">")[1];
    agent = agent && agent.replace(/,/g,';');
    var personal = !agent;
    var agents = [""];
    if(!personal){
	agents.push([no,agentid,agent,"N/A",city,pubtime,addr,1,createdAt].join());
    }
    
    $(".list").each(function(){
	var a = $("dl dd a",this);
	var c = $("dl dd.mt5 p",this).eq(1).text().trim() || "N/A";
	var t = $("div.txt p",this).last().text().trim().replace(/ 更新/,'').trim();
	
	if(a.attr("href") && t)
	    agents.push([no,a.attr("href"),a.text().trim(),c,city,t,addr,2,createdAt].join());
    });
    
    //other contacts
    $("#ulmain li div.mt5.txt").each(function(){
	var agentUrl = $("p a",this).attr("href")
	, name = $("p a",this).text().trim()
	, c = $("p",this).eq(1).text().trim() || "N/A";
	
	agents.push([no,agentUrl, name, c,city,"N/A",addr,3,createdAt].join());
    });
    
    if($(".adBox div.free h3").text().trim()==="佣金0.5%"){
	tag = true;
    }
    
    var rstHouses = [tit,no,bread,pubtime,personal?"Y":"N",city,addr,imgQuantity,tag?"Y":"N",createdAt,"\n"].join()
    , rstAgents = agents.join("\n")
    /*, bufHouse
    , bufAgent
    , fdHouseFile = fs.openSync(resultFile,"a")
    , fdAgentFile = fs.openSync(resultAgentFile,"a");*/
    
    /*try{
	bufHouse = converter.convert(rstHouses)
	bufAgent = converter.convert(rstAgents)
    }catch(e){
	logger.error(e.message);
	return;
    }
    
    fs.writeSync(fdHouseFile,bufHouse,0,bufHouse.length);
    fs.writeSync(fdAgentFile,bufAgent,0,bufAgent.length);
    
    fs.closeSync(fdHouseFile);
    fs.closeSync(fdAgentFile);
    */
    fs.appendFile(resultFile,rstHouses,function(err){
	if(err){
	    logger.error(err);
	}
    });
    fs.appendFile(resultAgentFile,rstAgents,function(err){
	if(err){
	    logger.error(err);
	}
    });
    logger.info("%s, agents: %d",bread,agents.length-1);
}

function processRegions(error,result,$){
    if(error){
	logger.error(error);
	return;
    }
    var uriobj = URL.parse(result.uri);
    //logger.info($("title"));
    $(".content a").each(function(i){
	var path = $(this).attr("href");
	uriobj.pathname = path+'a21-i31'+queryOptions;
	logger.info(URL.format(uriobj));
	c.queue({uri:URL.format(uriobj),callback:processList,jQuery:false});
	//return false;
	//logger.info("[Queued] %s, %s",$(this).text().trim(),region);
    });
}

function processPrice(error,result,$){
    if(error){
	logger.error(error);
	return;
    }
    
    if(!$){
	logger.error("cheerio $ is undefined or null.");
	return;
    }
    
    var domain = result.uri.match(/.*?(?=\/house)/)
    , urlListByPrice = []
    , alist = $("#list_39 p.floatl a");
    
    var getUrlByPrice = function(url) {
	var result = [];
	if(!cityPriceStepMap[url]) {
	    result.push(url.slice(0, url.length-1)+"-i31"+queryOptions);
	    return result;
	}
	
	var step = cityPriceStepMap[url];
	var domain = url.match(/.*?(?=\/house)/);
	var lowprice = url.match(/-c2(\d+)-/);
	var highprice = url.match(/-d2(\d+)-/)[1];
	lowprice = lowprice ? parseInt(lowprice[1]) : 0;
	var low = lowprice, high;
	while(low < highprice) {
	    high = low + step > highprice ? highprice : low + step;
	    result.push(domain+"/house/a21-c2"+low+"-d2"+high+"-j3100-i31"+queryOptions);
	    low = high;
	}
	return result;
    };
    for(var i = 0; i < alist.length; i++) {
    	if(alist.eq(i).text() != "不限") {
    	    getUrlByPrice(domain + alist.eq(i).attr("href")).forEach(function(url){
		logger.info(url);
		c.queue({uri:url,callback:processList,jQuery:false});
    		//urlListByPrice.push(url);
    	    });
    	}
    }
}

var cityPriceStepMap = {
	"http://esf.fang.com/house/a21-d2100-j3100/":70,
	"http://esf.fang.com/house/a21-c2100-d2150-j3100/":25,
	"http://esf.fang.com/house/a21-c2150-d2200-j3100/":25,
	"http://esf.fang.com/house/a21-c2200-d2250-j3100/":25,
	"http://esf.fang.com/house/a21-c2250-d2300-j3100/":25,
	"http://esf.fang.com/house/a21-c2300-d2500-j3100/":50,
	"http://esf.sjz.fang.com/house/a21-c250-d280-j3100/":15,
	"http://esf.dl.fang.com/house/a21-c250-d280-j3100/":15,
	"http://esf.dl.fang.com/house/a21-d250-j3100/":40,
	"http://esf.sy.fang.com/house/a21-d250-j3100/":40,
	"http://esf.changchun.fang.com/house/a21-c250-d280-j3100/":15,
	"http://esf.changchun.fang.com/house/a21-d250-j3100/":20,
	"http://esf.suzhou.fang.com/house/a21-c250-d280-j3100/":15,
	"http://esf.sz.fang.com/house/a21-d2100-j3100/":50,
	"http://esf.sh.fang.com/house/a21-c2300-d2500-j3100/":75,
	"http://esf.sh.fang.com/house/a21-c2200-d2300-j3100/":25,
	"http://esf.sh.fang.com/house/a21-c2150-d2200-j3100/":25,
	"http://esf.sh.fang.com/house/a21-c2100-d2150-j3100/":25,
	"http://esf.tj.fang.com/house/a21-c280-d2100-j3100/":10,
	"http://esf.tj.fang.com/house/a21-c260-d280-j3100/":10,
	"http://esf.tj.fang.com/house/a21-c240-d260-j3100/":10,
	"http://esf.jn.fang.com/house/a21-c250-d280-j3100/":15,
	"http://esf.cd.fang.com/house/a21-c2100-d2150-j3100/":25,
	"http://esf.cd.fang.com/house/a21-c280-d2100-j3100/":10,
	"http://esf.cd.fang.com/house/a21-c250-d280-j3100/":8,
	"http://esf.cd.fang.com/house/a21-c230-d250-j3100/":7,
	"http://esf.cq.fang.com/house/a21-c280-d2100-j3100/":10,
	"http://esf.cq.fang.com/house/a21-c250-d280-j3100/":5,
	"http://esf.cq.fang.com/house/a21-c230-d250-j3100/":4,
	"http://esf.xian.fang.com/house/a21-c250-d280-j3100/":15,
	"http://esf.wuhan.fang.com/house/a21-c250-d280-j3100/":15
};
var cityurls = [
    'http://esf.fang.com',
    'http://esf.bd.fang.com',
    'http://esf.hs.fang.com',
    'http://esf.lf.fang.com',
    'http://esf.qhd.fang.com',
    'http://esf.sjz.fang.com',
    'http://esf.ts.fang.com',
    'http://esf.taiyuan.fang.com',
    'http://esf.nm.fang.com',
    'http://esf.anshan.fang.com',
    'http://esf.dl.fang.com',
    'http://esf.sy.fang.com',
    'http://esf.changchun.fang.com',
    'http://esf.suzhou.fang.com',
    'http://esf.jl.fang.com',
    'http://esf.daqing.fang.com',
    'http://esf.hrb.fang.com',
    'http://esf.changshu.fang.com',
    'http://esf.cz.fang.com',
    'http://esf.huaian.fang.com',
    'http://esf.jy.fang.com',
    'http://esf.ks.fang.com',
    'http://esf.lyg.fang.com',
    'http://esf.nt.fang.com',
    'http://esf.taizhou.fang.com',
    'http://esf.wuxi.fang.com',
    'http://esf.wj.fang.com',
    'http://esf.sz.fang.com',
    'http://esf.xz.fang.com',
    'http://esf.yancheng.fang.com',
    'http://esf.yz.fang.com',
    'http://esf.zhenjiang.fang.com',
    'http://esf.huzhou.fang.com',
    'http://esf.jx.fang.com',
    'http://esf.jh.fang.com',
    'http://esf.nb.fang.com',
    'http://esf.shaoxing.fang.com',
    'http://esf.wz.fang.com',
    'http://esf.zhoushan.fang.com',
    'http://esf.bengbu.fang.com',
    'http://esf.hf.fang.com',
    'http://esf.huainan.fang.com',
    'http://esf.mas.fang.com',
    'http://esf.wuhu.fang.com',
    'http://esf.fz.fang.com',
    'http://esf.sh.fang.com',
    'http://esf.putian.fang.com',
    'http://esf.qz.fang.com',
    'http://esf.xm.fang.com',
    'http://esf.zhangzhou.fang.com',
    'http://esf.ganzhou.fang.com',
    'http://esf.jiujiang.fang.com',
    'http://esf.nc.fang.com',
    'http://esf.binzhou.fang.com',
    'http://esf.tj.fang.com/',
    'http://esf.jn.fang.com',
    'http://esf.qd.fang.com',
    'http://esf.weihai.fang.com',
    'http://esf.wf.fang.com',
    'http://esf.yt.fang.com',
    'http://esf.ly.fang.com',
    'http://esf.zz.fang.com',
    'http://esf.huangshi.fang.com',
    'http://esf.hz.fang.com',
    'http://esf.xiangyang.fang.com',
    'http://esf.yc.fang.com',
    'http://esf.cs.fang.com',
    'http://esf.changde.fang.com',
    'http://esf.hengyang.fang.com',
    'http://esf.xt.fang.com',
    'http://esf.yueyang.fang.com',
    'http://esf.nanjing.fang.com',
    'http://esf.zhuzhou.fang.com',
    'http://esf.dg.fang.com',
    'http://esf.fs.fang.com',
    'http://esf.huizhou.fang.com',
    'http://esf.jm.fang.com',
    'http://esf.maoming.fang.com',
    'http://esf.meizhou.fang.com',
    'http://esf.qingyuan.fang.com',
    'http://esf.cd.fang.com',
    'http://esf.st.fang.com',
    'http://esf.yangjiang.fang.com',
    'http://esf.zj.fang.com',
    'http://esf.zhaoqing.fang.com',
    'http://esf.zs.fang.com',
    'http://esf.zh.fang.com',
    'http://esf.bh.fang.com',
    'http://esf.fangchenggang.fang.com',
    'http://esf.guigang.fang.com',
    'http://esf.guilin.fang.com',
    'http://esf.liuzhou.fang.com',
    'http://esf.nn.fang.com',
    'http://esf.gz.fang.com',
    'http://esf.cqchangshou.fang.com',
    'http://esf.cqjiangjin.fang.com',
    'http://esf.yongchuan.fang.com',
    'http://esf.cq.fang.com',
    'http://esf.deyang.fang.com',
    'http://esf.leshan.fang.com',
    'http://esf.luzhou.fang.com',
    'http://esf.meishan.fang.com',
    'http://esf.mianyang.fang.com',
    'http://esf.neijiang.fang.com',
    'http://esf.nanchong.fang.com',
    'http://esf.suining.fang.com',
    'http://esf.cq.fang.com',
    'http://esf.gy.fang.com',
    'http://esf.km.fang.com',
    'http://esf.lijiang.fang.com',
    'http://esf.qujing.fang.com',
    'http://esf.hn.fang.com',
    'http://esf.sanya.fang.com',
    'http://esf.baoji.fang.com',
    'http://esf.xian.fang.com',
    'http://esf.wuhan.fang.com',
    'http://esf.xianyang.fang.com',
    'http://esf.Lz.fang.com',
    'http://esf.qingyang.fang.com',
    'http://esf.yinchuan.fang.com',
    'http://esf.xn.fang.com',
    'http://esf.akesu.fang.com',
    'http://esf.bazhou.fang.com',
    'http://esf.changji.fang.com',
    'http://esf.shihezi.fang.com',
    'http://esf.xj.fang.com',
    'http://esf.yili.fang.com'
];

var arguments = process.argv.splice(2);
var start = Number(arguments[0])||0;
var len = Number(arguments[1])||cityurls.length;
var threeDaySwitch = arguments[2] == undefined ? true : JSON.parse(arguments[2])
var queryOptions = threeDaySwitch ? '-w33/' : '/'
var resultFile = "../result/sofang/sfershou_"+today+"_"+start+".csv";

if(!fs.existsSync(resultFile)){
    fs.writeFileSync(resultFile,'\ufeff');
}

var resultAgentFile = "../result/sofang/sfershou_agent_"+today+"_"+start+".csv";
if(fs.existsSync("../result/sofang/existing.csv")){
    fs.readFileSync("../result/sofang/existing.csv").toString().split("\n").forEach(function(line){
	if(line){
	    var vals = line.split("\t");
	    if(vals && vals.length==6){
		if(!done[vals[6]]){
		    done[vals[6]]=true;
		}
	    }
	}
    });
    logger.info(Object.keys(done).length);
}

cityurls.slice(start,start+len).forEach(function(u){
    u = u+'/house/a21-j3100/';
    c.queue({uri:u,callback:processPrice});
});
