var fs = require('fs')
var Crawler = require('node-webcrawler')
var moment = require('moment')

var today = moment().format('YYYY-MM-DD');
var c = new Crawler({
    maxConnections:1,
    debug:true,
    jar:true,
    rateLimits:1500,
    headers:{
	Cookie:'FDDKEEPINGID=j6yzlCVlzzbOUcgc; FDDSESSID=j6yzlCVlzzbOUcgc;'
    },
    userAgent:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36',
    callback:processDetail
})

function processList(err,result,$){
    if(err){
	console.log(err);
    }else{
	var urls = [];
	$("ul.list li.list-item a.pic").each(function(){
	    urls.push($(this).attr('href'));
	});
	console.log("[DATA] urls %d",urls.length);
	
	if(urls.length>0){
	    c.queue(urls);
	}
	var nextBtn = $('div.pagination a.next');
	
	if(nextBtn.length){
	    c.queue({uri:nextBtn.attr('href'),callback:processList});
	}
    }
}

function processDetail(err,result,$){
    if(err){
	console.log(err);
    }else{
	var tit = "'"+$('div.mod-hd h1.mod-title').text()+"'"
	,price = $('div.mod-hd span b').text()
	,fulladdr = $("div.mod-hd span").not('.mod-aside').contents().last().text()
	,matches = fulladdr.match(/地址：\[(.+)\s{2}(.+)\](.+)/)
	,award = $('.info-hd.highlight dl dd').eq(0).text().replace(/[,\s]/g,'')
	,cut = $('.info-hd.highlight dl dd').eq(1).text().replace(/[,\s]/g,'')
	,promo = $('dl.info-bd dd').text().replace(/[,\s]/g,'')
	,date = $('.info .info-ft p').first().text().replace('认购截止日：','')
	,city=''
	,region=''
	,addr='';
	
	if(matches){
	    if(matches.length>3){
		city = matches[1];
		region = matches[2];
		addr = matches[3].replace(/,/g,'');
	    }
	}
	var r = [result.uri,tit,price,award,cut,promo,date,city,region,addr,'\n'].join();
	console.log(r);
	fs.appendFileSync('../result/fdd_'+today+'.csv',r);
    }
}

function processCities(result){
    if(result.body){
	var obj = null;
	try{
	    obj = JSON.parse(result.body);
	}catch(e){
	    console.log(e);
	    return;
	}
	if(!obj.error){
	    var rst = JSON.parse(JSON.stringify(obj.data));
	    obj=null;
	    return rst;
	}else{
	    console.log('data error %s',obj.message);;
	}
    }
}

c.queue({
    uri:'http://e.fangdd.com/basic/city/listc',
    headers:{
	'Referer':'http://e.fangdd.com/project/projectnotice/list',
	'Origin':'http://e.fangdd.com',
	'X-Requested-With':'XMLHttpRequest'
    },
    method:'POST',
    jQuery:false,
    callback:function(err,result){
	if(err){
	    console.log(err);
	}else{
	    var cities = processCities(result);
	    console.log(cities);
	    cities.forEach(function(city){
		//var city = cities[0];
		c.queue({
		    uri:'http://e.fangdd.com/project/projectnotice/list',
		    qs:{
			city_id:city.city_id,
			region_id:'',
			k:'',
			p:1
		    },
		    callback:processList
		});
	    });
	}
    }
});
