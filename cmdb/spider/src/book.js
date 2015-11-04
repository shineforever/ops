var http = require('http')
var jsdom = require("jsdom")
var helper = require('./helpers/webhelper.js')
var $ = require("jquery")
var fs = require('fs')



var host = "www.booking.com";

function process(cont,args){
if(!cont){
	    console.log('no data');
	    return;
	}

    var $cont = $(cont);
    var pageSize=20;
    var paginationLink = $cont.find("div.results-paging ul.x-list li:last-child a");
    var paginationUrl = paginationLink.attr('href');
    var pageCount = Number(paginationLink.text());
    //var header = $cont.find("sr_header h1").text();
    //if(!header){
	//console.log("header is empty");
	//return;
    //}
    //var mNum = header.match(/\d+/);
    //var totalRows=0;
    //if(mNum.length==2){
	//totalRows = mNum[1];
    //}
    var rowIdx = (pageCount-1)*pageSize;

    for(var idx=args[0].pidx;idx<=rowIdx;idx+=20){
	paginationUrl = paginationUrl.replace(/offset=\d+/,"offset="+idx);
	var opt = new helper.basic_options(host,paginationUrl);
	args[0].pidx=idx;
	helper.request_data(opt,null,process,args[0]);
    }
    
    var items = $cont.find("div.sr_item_content");
    if(items.length==0){
	console.log("no items in content");
	return;
    }

    items.each(function(i,e){
	var link = $(e).find('h3 a');
	var href = link.attr('href');
	var opt = new helper.basic_options(host,href);
	helper.request_data(opt,null,process_one,link.text());
    });
}

function process_one(data,args){
    if(data){
	console.log(args[0]);
	fs.writeFileSync("./book.com/htmls/"+args[0]+".html",data);

    }else{
	console.log('hotel error');
    }
}



var path = "/searchresults.html?src=index&dcid=1&si=ai%2Cco%2Cci%2Cre%2Cdi&ss=%E5%8C%97%E4%BA%AC&checkin_year_month=2014-4&checkin_monthday=1&checkout_year_month=2014-4&checkout_monthday=2&interval_of_time=any&flex_checkin_year_month=any&sb_predefined_group_options_value=2&no_rooms=1&group_adults=2&group_children=0&dest_type=city&dest_id=-1898541"

var opt = new helper.basic_options(host,path);
helper.request_data(opt,null,process,{'pidx':20});
