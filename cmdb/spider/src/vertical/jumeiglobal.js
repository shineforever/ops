var fs = require('fs')
var Crawler = require('node-webcrawler')
var URL = require('url')
var seenreq = require('seenreq')
var moment = require('moment')
var logger = require('winston')

var env = "development"
logger.add(logger.transports.File, { filename: '../../log/jumeiglobal.log' ,logstash:true,level:'info',handleExceptions:true});//
logger.cli();

if(env==="production"){
    logger.remove(logger.transports.Console);
}else{
    logger.transports.Console.level = 'verbose';
}

var debug = env==='development';
var index = 0;
var pagesize=50;
var d = moment().format('YYYY-MM-DD');
var resultFile = "../../result/vertical/jumeiglobal_"+d+".csv";
var resultCountFile = "../../result/vertical/jumeiglobal_count_"+d+".csv";

fs.writeFile(resultFile,'\ufeff日期,标题,原文标题,国外价,人民币,大陆参考价,折扣,品牌,商品ID\n',function(e){if(e) logger.error(e);});
fs.writeFile(resultCountFile,'\ufeff',function(e){if(e) logger.error(e);});

var c = new Crawler({
    maxConnections:2,
    callback:function(error,result,$){
	var num = $("span.get_people > em").text();
	var id = $("#hid_hashid").val();
	if(!id){
	    try{
		id=URL.parse(result.uri,true).query.hash_id;
		id = id || URL.parse(result.uri).pathname.match(/(\w+)\.html/)[1];
	    }catch(e){
		logger.error(e);
	    }
	}
	var r = [d,id,num].join();
	logger.info(r);
	fs.appendFile(resultCountFile,r+'\n',function(e){if(e) logger.error(e);});
    }
});

function wgetList(idx,type){
    var q = {"type":type,"pagesize":pagesize,"index":idx};
    logger.info("page: %d, type: %s",idx,type);
    c.queue({
	uri:"http://www.jumeiglobal.com/ajax_new/getDealsByPage",
	qs:q,
	callback:process,
	jQuery:false,
	type:type,
	index:idx
    });
}

function process(error,result){
    if(error){
	logger.error(error);
	return;
    }
    var data;
    try{
	data = JSON.parse(result.body);
    }catch(e){
	logger.error(e);
    }
    
    if(data.message!="success"){
	logger.error(data.message);
	return;
    }
    
    logger.info("list count: %d",data.list.length);
    var records=[];
    
    data.list.forEach(function(li){
	var r = [d,li.pro_stitle,li.pro_foreign_name,li.area_name.currency_symbol+""+li.price_foreign,li.price_home,li.price_ref,li.discount,li.brand_id,li.hash_id];
	r = r.map(function(v){return (typeof v=='string' && v.replace(/[,\s]/g,'')) || v}).join();
	c.queue(li.url);
	if(debug)
	    logger.info(li.url);
	records.push(r);
    });
    
    fs.appendFile(resultFile,records.join("\n"),function(e){if(e) logger.error(e);});
    if(!data.end){
	wgetList(result.options.index+pagesize);
    }
}

wgetList(0,"new");
wgetList(0,"old");
