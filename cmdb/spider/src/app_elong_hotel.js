var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var entity = require('../models/entity.js')
var sprintf = require("sprintf-js").sprintf
var cheerio = require("cheerio")
//basic settings.
var checkindate = "2014-10-01";
var checkoutdate = "2014-10-02";


//get cities
var cities = helper.get_cities('../appdata/qunar_hot_city.txt');
var resultFile = "../result/app_elong_hotel.txt";
var doneFile = "../result/app_elong_done_hotel.txt";
//request data
for(var i=0;i<cities.length;i++){
    var c = cities[i];
    var req = sprintf('{"cityname":"%1$s","checkindate":"%2$s","checkoutdate":"%3$s","pageindex":%4$d}', c.cname, checkindate, checkoutdate,0);
    var query = {'getHotelListReq':req};
    var opt = new helper.basic_options('m.elong.com','/hotel/HotelListData','GET',true,false,query);
    helper.request_data(opt,null,process_hotel_list,c);
}

//process response
var hotels={};
function process_hotel_list(data,args){
    if(!data || data.IsError || !data.Items){
	console.log("error occured.");
	return;	
    }
    
    //get hotel list data
    for(var i=0;i<data.Items.length;i++){
	var item = data.Items[i];
	var h = new entity.hotel();
	h.id = item.HotelId;
	h.name = item.HotelName;
	h.name = h.name && h.name.replace(/[,]/g,";");
	h.city = data.CityName;
	h.star = item.StarCode;
	h.prate = item.GoodCommentPercent;
	h.zoneName = item.BusinessAreaName;
	h.commentCount = item.CommentCount;
	helper.request_data(
	    new helper.basic_options('m.elong.com','/hotel/'+args[0].pinyin+'/'+h.id+'/','GET',true,false,{'checkindate':checkindate,'checkoutdate':checkoutdate}),
	    null,
	    process_one_hotel,
	    [h,args[0]]
	);
    }
    //get next page.
    var c = args[0];
    if(!c.pageCount) c.pageCount = data.PageCount;
    if(!c.curPageIdx) c.curPageIdx = 0;
    if(!c.hotelCount) c.hotelCount=data.HotelCount;
    if(c.curHotelIdx==undefined) c.curHotelIdx=0;
    while(c.curPageIdx<c.pageCount-1){
	c.curPageIdx++;
	var req = sprintf('{"cityname":"%1$s","checkindate":"%2$s","checkoutdate":"%3$s","pageindex":%4$d}', c.cname, checkindate, checkoutdate,c.curPageIdx);
	var query = {'getHotelListReq':req};
	var opt = new helper.basic_options('m.elong.com','/hotel/HotelListData','GET',true,false,query);
	helper.request_data(opt,null,process_hotel_list,c);
    }
}

function process_one_hotel(data,args){
    console.log(args[1].cname+": "+(args[1].curPageIdx+1)+"/"+args[1].pageCount+", "+(++args[1].curHotelIdx)+"/"+args[1].hotelCount);
    var $ = cheerio.load(data);
    var rooms = $("ul.roomlist > li");
    if(rooms.length==0)
	return;
    // var commNode = doc.find('table.infotab tbody tr:first-child td section:last-child span:last-child');
    // if(commNode.length>0)
    // 	args.commentCount = Number(commNode[0].innerHTML.trim().match(/\d+/)[0]);
    var picNode = $('td.hotelpic div').text();
    picNode = picNode && picNode.replace(/[\s,，]/g,'');
    args[0].picCount = picNode?picNode.trim().match(/\d+/)[0]:0;
    //if(picNode.length>0)
    //args[0].picCount = Number(picNode[0].innerHTML.trim().match(/\d+/)[0]);
    
    rooms.each(function(idx,room){
	var r = new entity.room();
	var namenode = $('b',this).each(function(){
	    r.name = $(this).text();
	    r.name = r.name && r.name.replace(/[,，]/g,';').replace(/\s/g,'');
	});
	if($('span.spanPrepay_icon',this).length>0)
	    r.payType=0;
	if($('span.floatflag.sjzxflag',this).length>0)
	    r.sjzx = 'Y';
	if($('span.floatflag.xsqgflag',this).length>0)
	    r.xsqg='Y';
	if($('floatflag.jrtjflag',this).length>0)
	    r.jrtj='Y';
	
	var infos = $('table tr:nth-child(2) span',this);
	if(infos.length==2){
	    var breakfast = infos.eq(0).text();
	    r.breakfast = breakfast&&breakfast.replace(/\s/g,'');
	    var lan = infos.eq(1).text();
	    lan = lan && lan.replace(/\s/g,'');
	    if(lan=='宽带')
		r.lan = 'Y';
	    else r.lan='N';
	}
	
	r.price =  $('span.orange',this).text();
	r.price = r.price && r.price.replace(/\s/g,'');
	r.fan = $('div.orange',this).text();
	r.fan = r.fan && r.fan.replace(/\s/g,'');
	r.fan = r.fan?r.fan:"返￥0";
	args[0].rooms.push(r);
    });
    appendToFile(resultFile,args[0].toString("elong"));
}


//write file
function appendToFile(file,data){
    fs.appendFile(file,data,function(err){
	if(err)
	    console.log(err.message);
    });
}

function ElongHotel(){
    
}

ElongHotel.prototype.init = function(){
    
}

ElongHotel.prototype.start = function(){
    this.init();
}

ElongHotel.prototype.wgetDetail = function(){
    
}
