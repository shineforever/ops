var fs = require('fs')
var Crawler = require('node-webcrawler')
var _ = require("lodash")
var URL = require("url")
var logger = require("winston")
logger.add(logger.transports.File, { filename: '../../log/taobao.usedcar.log' });

var urls = ['http://s.taobao.com/search?spm=a2181.1742757.1998463631.2.PpfU0e&sort=price-asc&ppath=136152291%3A31020&initiative_id=tbindexz_20150327&tab=old&q=%E4%BA%8C%E6%89%8B%E8%BD%A6&cps=yes&fs=1&data-key=cat&data-value=50108585&data-action=add'
	    ,
 'http://s.taobao.com/search?spm=a2181.1742757.1998463631.2.PpfU0e&sort=price-asc&ppath=136152291%3A31020&initiative_id=tbindexz_20150327&tab=old&q=%E4%BA%8C%E6%89%8B%E8%BD%A6&cps=yes&fs=1&data-key=cat&data-value=55848014&data-action=add',
 'http://s.taobao.com/search?spm=a2181.1742757.1998463631.2.PpfU0e&sort=price-asc&ppath=136152291%3A31020&initiative_id=tbindexz_20150327&tab=old&q=%E4%BA%8C%E6%89%8B%E8%BD%A6&cps=yes&fs=1&data-key=cat&data-value=55830007&data-action=add',
 'http://s.taobao.com/search?spm=a2181.1742757.1998463631.2.PpfU0e&sort=price-asc&ppath=136152291%3A31020&initiative_id=tbindexz_20150327&tab=old&q=%E4%BA%8C%E6%89%8B%E8%BD%A6&cps=yes&fs=1&data-key=cat&data-value=55866008&data-action=add',
'http://s.taobao.com/search?spm=a2181.1742757.1998463631.2.PpfU0e&sort=price-asc&ppath=136152291%3A31020&initiative_id=tbindexz_20150327&tab=old&q=%E4%BA%8C%E6%89%8B%E8%BD%A6&cps=yes&fs=1&data-key=cat&data-value=55810011&data-action=add'
 ];


var c = new Crawler({
    maxConnections:1,
    rateLimits:5000,
    userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36",
    forceUTF8:true,
    jQuery:false,
    callback:function(err,result,$){
	if(err){
	    console.log(err);
	}else{
	    processList(result,$);
	}
    }
});

function processList(result){
    var records = [""];
    //console.log("data");
    //console.log($("title").text());
    var str = result.body.match(/g_page_config\s*=\s*.+/)[0];
    eval(str);

    var data = g_page_config.mods.itemlist.data;
    
    if(!data){
	console.log("empty");
	return;
    }
    
    var records = g_page_config.mods.itemlist.data.auctions.map(function(item){
	return _.toArray(_.pick(item,["raw_title","view_price","item_loc","view_sales","nick","nid"])).join();
    }).join('\n');
    
    fs.appendFileSync("../../result/auto/taobao.usedcar.csv","\n");
    fs.appendFileSync("../../result/auto/taobao.usedcar.csv",records);
    
    logger.info("%s done.",records.length);
    
    var p = g_page_config.mods.pager.data
    , len = g_page_config.mods.itemlist.data.auctions.length;

    if(!result.options.offset){
	result.options.offset=33;
    }
    
    result.options.offset+=len;
    
    if(p && p.currentPage < p.totalPage){
	var ou = URL.parse(result.uri,true);
	delete ou.search;
	ou.query.s = result.options.offset;
	logger.info(JSON.stringify(ou));
	var newUrl = URL.format(ou);
	logger.info("get next page. %s",newUrl);
	c.queue({
	    uri:newUrl,
	    offset:result.options.offset
	});
    }
}

c.queue(urls);

