var fs = require('fs')
var cheerio = require('cheerio')
var helper = require('../helpers/webhelper.js')
var entity = require('../models/entity.js')

function MElongFlight(){
    this.departDate = '2014-10-01';
    this.resultDir = "../result/";
    this.dataDir = "../appdata/";
    this.doneFile = "app_elong_done_flight.txt";
    this.skipFile = "invalidFlights.txt";
    this.cityFile = "qunar_flight_hot_city.txt";
    this.resultFile = "app_elong_flight.txt";
    this.citySkip = {};
    this.cities = [];
    this.doneFlights = {};
    this.todoFlights=[];
    this.elongQuery = function(dname,aname,pidx){
	this.DepartCityName=dname;
	this.ArrivalCityName=aname;
	this.DepartDate=that.departDate;
	this.IsReturn="false";
	this.PageIndex = pidx==undefined?0:pidx;
    };
}

MElongFlight.prototype.init = function(){
    this.cities = helper.get_cities(this.dataDir+this.cityFile);
    for(var i=0;i<this.cities.length;i++){
	for(var j=0;j<this.cities.length;j++){
	    if(i==j)
		continue;
	    var n = this.cities[i].cname+'-'+this.cities[j].cname;
	    if(!this.doneFlights[n] && !this.citySkip[n])
		this.todoFlights.push({
		    d:this.cities[i].cname,
		    a:this.cities[j].cname
		});
	}
    }
}

MElongFlight.prototype.load = function(){
    if(fs.existsSync(this.resultDir+this.doneFile)){
	fs.readFileSync(this.resultDir+this.doneFile)
	    .toString()
	    .split('\r\n')
	    .reduce(function(pre,cur){
		if(cur)
		    pre[cur]=true;
		return pre;
	    },this.doneFlights);
    }
    if(fs.existsSync(this.dataDir+this.skipFile)){
	fs.readFileSync(this.dataDir+this.skipFile)
	    .toString()
	    .split('\n')
	    .reduce(function(pre,cur){
		if(cur){
		    cur = cur.replace('\r','');
		    pre[cur]=true;
		}
		return pre;
	    },this.citySkip);
    }
}

MElongFlight.prototype.start = function(){
    this.load();
    this.init();
    console.log("%d flights todo.",this.todoFlights.length);
    this.todoFlights.forEach(function(f,i,a){
	this.wgetList(f);
    },this);
//    this.wgetList(this.todoFlights[0]);
}

MElongFlight.prototype.processList = function(data,args){
    var $ = cheerio.load(data);
    if(args[0].pageCount == undefined){
	$('div#uiPager > span').each(function(){
	    args[0].pageCount = Number($(this).text().match(/\d+/g)[1]);
	});
    }
    if(args[0].pageIdx == undefined){
	args[0].pageIdx=0;
    }
    $('ul.ui_list > li>a').each(function(){
	var fl = new entity.flight();
	var href = $(this).attr('href');
	var id = href.match(/\w+\-\w+-\w+/);
	fl.id=id[0];
	var spans = $('span',this);
	fl.price = spans.eq(1).text().replace(/\s/g,'');
	fl.cmpName = spans.eq(2).text().replace(/\s/g,'');
	fl.flightNo = spans.eq(3).text().replace(/\s/g,'');
	fl.planType = spans.eq(4).text().replace(/\s/g,'');
	fl.daname = spans.eq(5).text().replace(/\s/g,'');
	fl.aaname = spans.eq(6).text().replace(/\s/g,'');
	//tCount = spans[7].innerHTML.trim();
	fl.dTime = spans.eq(8).text().replace(/\s/g,'');
	fl.aTime = spans.eq(9).text().replace(/\s/g,'');
	fl.dname = args[0].d;
	fl.aname = args[0].a;
	that.wgetDetail(fl);
    });
    while(args[0].pageIdx<args[0].pageCount-1){
	args[0].pageIdx++;
	this.wgetList(args[0]);
    }
}

MElongFlight.prototype.wgetList = function(f){
    console.log("GET %s-%s: %d/%d",f.d,f.a,f.pageIdx,f.pageCount);
    var query = new this.elongQuery(f.d,f.a,f.pageIdx);
    var opt = new helper.basic_options('m.elong.com','/Flight/List','GET',true,false,query);
    helper.request_data(opt,null,function(data,args){
	that.processList(data,args);
    },f);
}

MElongFlight.prototype.wgetDetail = function(fl){
    var query = {DepartDate:this.departDate};
    var opt = new helper.basic_options('m.elong.com','/Flight/'+fl.id+'.html','GET',true,false,query);
    helper.request_data(opt,null,function(data,args){
	that.processDetail(data,args);
    },fl);
}

MElongFlight.prototype.processDetail = function(data,args){
    var $ = cheerio.load(data);
    $('div#ui_accordion1 label.ui_accordion_header').each(function(i,list){
	var cabin = {};
	var trs = $('tr',this);
	var tds = $('td',trs.eq(0));
	cabin.ctype = tds.eq(0).contents().first().text().replace(/\s/g,'');
	cabin.tCount = tds.eq(0).contents().eq(1).text().replace(/\s/g,'');
	cabin.price = $('span:first-child',trs.eq(1)).text();
	args[0].cabins.push(cabin);
    });
    $('div#ui_accordion1 div.ui_accordion_content').each(function(k,cnt){
	args[0].cabins[k].tui = $(this).contents().eq(2).text().replace(/[,，]/g,';').replace(/\s/g,'');
	args[0].cabins[k].gai = $(this).contents().eq(6).text().replace(/[,，]/g,';').replace(/\s/g,'');
    });
    
    fs.appendFileSync(this.resultDir+this.resultFile,args[0].toString());
    fs.appendFileSync(this.resultDir+this.doneFile,args[0].dname+"-"+args[0].aname+'\r\n');

}


var mef = new MElongFlight();
var that = mef;
mef.start();