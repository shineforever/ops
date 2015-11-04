var http = require('http')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')
var entity = require('../models/entity.js')
var Crawler = require('node-webcrawler')
var qs = require('querystring')
var moment = require('moment')

//basic settings.
var checkindate = moment().add(7, 'd').format('YYYY/MM/DD');//"2015/04/25";
var checkoutdate = moment().add(8, 'd').format('YYYY/MM/DD');//"2015/04/26";
var today = moment().format("YYYY-MM-DD");

var level = '';
var resultRoomFile = "../result/ota/pc_elong_room_"+today+".txt";
var resultHotelFile = "../result/ota/pc_elong_hotel_"+today+".txt";
var countOfHotelsPerCity=10;
var doneFile = "../result/ota/pc_elong_done_hotel_"+today+".txt";
var proxyFile = "verified-2-25.txt";
var hotelInfoFile = "../appdata/elonghotels.txt";

var crawler = new Crawler({
    maxConnections:1,
    rateLimits:800,
    jar:true,
    userAgent:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36'
});

var pageSize=10;
var doneHotel = Object.create(null);
//get cities
//var cities = helper.get_cities('../appdata/elong_hot_city.txt');
var cityMap = Object.create(null);

fs.readFileSync("../appdata/elong_hot_city.txt").toString().split('\n').forEach(function(line){
    if(line.trim()){
	var matches = line.match(/([a-z]+)(\d+)\s(.+)/);
	if(matches && matches.length>3){
	    cityMap[matches[3]]={pinyin:matches[1],id:matches[2],name:matches[3]};
	}
    }
})

if(fs.existsSync(resultHotelFile)){
    fs.readFileSync(resultHotelFile).toString().split('\n').reduce(function(pre,line){
	if(line && line.trim()){
	    pre[line.split(',')[1]]=true;
	}
	return pre;
    },doneHotel);
}

var arguments = process.argv.splice(2);
var start = Number(arguments[0])||0;
var len = Number(arguments[1])||38019;
//前闭后开区间
//console.log("[INFO] task count: %d",this.tasks.length);

fs.readFileSync(hotelInfoFile).toString()
    .split('\n')
    .slice(start,start+len)
    .forEach(function(line){
	if(line.trim()){
	    var vals = line.split(',');
	    var city= cityMap[vals[0]];
	    if(doneHotel[vals[1]]){//TODO:
		return;
	    }
	    var q = {
		hotelId:vals[1],
		cityNameEn:city.pinyin,
		viewpath:'~/views/HotelDetailC/HotelDetail.aspx',
		'requestInfo.RankType':0,
		'requestInfo.CityId':city.id,
		'requestInfo.CityName':city.name,
		'requestInfo.CheckInDate':checkindate,
		'requestInfo.CheckOutDate':checkoutdate
	    };
	    var hotelUrl = 'http://hotel.elong.com/'+city.pinyin+'/'+vals[1]+'/';
	    
	    crawler.queue({
		uri:'http://hotel.elong.com/isajax/HotelDetailNew/GetHotelRoomSetV4',
		headers:{'Referer':hotelUrl},
		method:'POST',
		qs:q,
		hotelName:vals[2],
		star:vals[3].trim(),
		city:city,
		jQuery:false,
		callback:process_rooms
	    });

	    crawler.queue({
		uri:hotelUrl,
		callback:process_one_hotel_info,
		hotelName:vals[2],
		hotelId:vals[1],
		star:vals[3].trim(),
		city : city
	    });
    }
    
});
console.log('program start.');
//request data http://hotel.elong.com/isajax/List/GetSimpleHotelRoomSet
//for(var i=0;i<cities.length;i++){
//    var c = cities[i]; 
    //var query = {'getHotelListReq':req};
//    var query = {
//	IsNotAcceptRecommend:false
//	Keywords:'汉庭酒店（上海外滩店）'
//	KeywordsType:999
//	aioIndex:-1
//	aioVal:'汉庭酒店（上海外滩店）'
//    };
    /*
    query["hsr.CheckInDate"]= checkindate;
    query["hsr.CheckOutDate"]= checkoutdate;
    query["hsr.CityId"]= c.id;
    query["hsr.PageIndex"]=1;
    query["hsr.StarLevels"]=level;
    query["hsr.PageSize"]=pageSize;*/
/*    
    var opt = null;
    if(useproxy){
	var p = getProxy();
	opt = new helper.basic_options(p.host,"http://hotel.elong.com/isajax/List/Search","GET",false,true,query,p.port);
    }else{
	opt = new helper.basic_options('hotel.elong.com',"/isajax/List/Search",'GET',false,true,query);
    }
    opt.headers["referer"] = "http://hotel.elong.com/";
    //console.log("starting get "+c.cname+" page:"+pageIdx);
    console.log(qs.stringify(query));
    crawler.queue({
	uri:"http://hotel.elong.com/search/list_cn_"+c.id+".html",
	qs:query,
	args:c,
	callback:process_hotel_list
    });*/
    //helper.request_data(opt,null,process_hotel_list,c);
//}

function process_rooms(err,result){
    if(err){
	console.log(err);
    }else{
	var obj = null;
	try{
	    obj = JSON.parse(result.body);
	}catch(e){
	    console.log(e);
	    console.log(result.body);
	    return;
	}
	if(!obj.success){
	    console.log("response data error: %s",obj.value);
	    return;
	}
	var $ = cheerio.load(obj.roomsHtml)
	,records = ['']
	,hotelName = result.options.hotelName
	,hotelId = result.options.qs.hotelId
	,cityName = result.options.city.name
	,tips = obj.HotelTipInfos;
	
	$("div.rpBox").each(function(){
	    var roomType = $('dl.left dd a.rpname',this).text().trim()
	    ,wifi = $("dl.left dd.wifi",this).text().trim();
	    
	    var bedType = $("dl.left > dd",this).eq(1).text().trim();
	    bedType = bedType && bedType.match(/[\u4e00-\u9fa5]+床/);
	    bedType = bedType && bedType[0] || "N/A";
	    //console.log($("dl.right div.infoBox").length);
	    $("div.right div.infoBox").each(function(){
		var pkg = $("p.rpw1",this).text().replace(/\s/g,'')
		,gift = !!$(' p.rpw1 span.iconLibao',this).length?'Y':'N'
		,breakfast = $(" p.rpw2",this).text().replace(/\s/g,'')
		,cancel = $(" p.rpw3",this).text().trim()
		,price = $(" p.rpw4 span.price",this).text().trim()
		,rebate = $(" p.rpw5 span.c9",this).text()||"无"
		,assurance = !!$(" p.rpw6 span.iconDanbao",this).length?'Y':'N'
		,prePay = !!$(" p.rpw6 span.iconYufu",this).length?'Y':'N'
		,ratePlanId = $(this).attr("rpid");
		
		records.push([cityName,hotelId,hotelName,roomType,wifi,pkg,gift,breakfast,cancel,price,rebate,assurance,prePay,bedType].join());
	    });
	});
	
	fs.appendFile(resultRoomFile,records.join('\n'),function(err){
	    if(err){
		console.log(err);
	    }
	});
	console.log("[DATA] %s, %s, Rooms",cityName,hotelName);
    }
}

//process response
var hotels={};
function process_hotel_list(err,result,$){
    if(err){
	console.log(err);
    }
    
    //get hotel list data
    //get next page.
    var c = result.options.args;
    if(!c.pageCount) c.pageCount = data.value.PageInfo.PageCount;
    if(!c.curPageIdx) c.curPageIdx = data.value.PageInfo.PageIndex;
    if(!c.hotelCount) c.hotelCount=data.value.PageInfo.TotalRow;
    if(c.curHotelIdx==undefined) c.curHotelIdx=0;
    
    for(var i=0;i<data.value.ListStaticInfos.length;i++){
	var item = data.value.ListStaticInfos[i];
	var h = new entity.hotel();
	h.id = item.HotelId+'';
	h.name = item.HotelNameCn;
	h.name = h.name && h.name.replace(/,/g,';');
	h.name = h.name && h.name.replace(/[\s]/g,'');
	h.city = c.cname;
	h.star = item.Star;
	h.prate = item.CommentGoodRate;
	h.zoneName = item.Commerical&&item.Commerical.HotelAreaName;
	h.zoneName = h.zoneName && h.zoneName.replace(/[,，]/g,';');
	h.commentCount = item.TotalComment;
	h.goodComment = 0;
	h.badComment = 0;
	var opt = null;
	var query = {'hsr.CheckInDate':checkindate,'hsr.CheckOutDate':checkoutdate,'hotelId':h.id,'hsr.CityId':c.id};
	if(useproxy){
	    var p = getProxy();
	    opt = new helper.basic_options(p.host,"http://hotel.elong.com/isajax/HotelDetailNew/GetHotelRoomset","GET",false,true,query,p.port);
	}else{
	    opt = new helper.basic_options('hotel.elong.com','/isajax/HotelDetailNew/GetHotelRoomset','GET',false,true,query);
	}
	
	opt.headers["referer"] = "http://hotel.elong.com/";
	
	crawler.queue({
	    uri:"http://hotel.elong.com/isajax/HotelDetailNew/GetHotelRoomset",
	    callback:process_one_hotel,
	    args:[h,c],
	    jQuery:false,
	    qs:query
	});
	//helper.request_data(opt,null,process_one_hotel,[h,c]);
    }
    //console.log("done "+args[0].cname+": "+args[1]["hsr.PageIndex"]+"/"+c.pageCount);
    while(c.curPageIdx<c.pageCount){
	c.curPageIdx++;
	//var query = {'getHotelListReq':req};
	var query = {};
	query["hsr.CheckInDate"]= checkindate;
	query["hsr.CheckOutDate"]= checkoutdate;
	query["hsr.CityId"]= c.id;
	query["hsr.PageIndex"]=c.curPageIdx;
	/*
	var opt = null;
	if(useproxy){
	    var p = getProxy();
	    opt = new helper.basic_options(p.host,'http://hotel.elong.com/isajax/List/Search',"GET",false,true,query,p.port);
	}else{
	    opt = new helper.basic_options('hotel.elong.com','/isajax/List/Search','GET',false,true,query);
	}
	*/
	//opt.headers["referer"] = "http://hotel.elong.com/";
	
	crawler.queue({
	    uri:'http://hotel.elong.com/isajax/List/Search',
	    callback:process_hotel_list,
	    qs:query,
	    args:c
	});
	//helper.request_data(opt,null,process_hotel_list,c);
    }
}

function process_one_hotel(err,result){
    var data = null;
    try{
	data = JSON.parse(result.body);
    }catch(e){
	console.log(e);
	return;
    }
    var args = result.options.args;
    if(!data||!data.success)
	return;
    if(!data.value.HotelRoomList) {
	console.log("hotel data unavaliable");
	return;
    }
    for(var i=0;i<data.value.HotelRoomList.length;i++){
	var room = data.value.HotelRoomList[i];
	var r = new entity.room();
	r.name = room.RoomName.replace(/,/g,'');
	r.bedType = room.Bed;
	r.plans=[];
	for(var j = 0;j<room.RatePlanList.length;j++){
	    var plan = room.RatePlanList[j];
	    var p={};
	    p.name = plan.RatePlanName;
	    p.name = p.name && p.name.replace(/[,，]/g,';');
	    p.price = plan.FavorablePrice;
	    p.timeLimit = plan.ProductType==16?'Y':'N';
	    p.breakfast = plan.Brkfast;
	    p.gift = plan.SupplierActivityList.replace(/<\/?[^>]*>/g,'').replace(/[ | ]*[\r\n]*/g,'').replace(/\s/g,'');
	    p.reduce = plan.ReduceAmount;
	    p.fan  =plan.CouponAmount;
	    p.payType = plan.IsPrepay?"Y":"N";
	    p.lan = room.Net;
	    p.lan = p.lan && p.lan.replace(/,/g,'');
	    p.hasWeifang = plan.HasWeifang?'Y':'N';//今日特价
	    p.needSurety = plan.NeedSurety?'Y':'N';//担保
	    r.plans.push(p);
	}
	args[0].rooms.push(r);
    }
    
    fs.appendFile(resultFile,args[0].toString("elong_pc"));
    //fs.appendFileSync(hotelInfoFile,args[0].city+','+args[0].id+','+args[0].name+','+args[0].star+'\r\n');
    console.log(args[1].cname+" : "+(++args[1].curHotelIdx)+"/"+args[1].hotelCount);
}
function process_one_hotel_info(err,result,$){
    if(err){
	console.log(err);
    }else{
	var prate = $('#rightCommentDiv .info span.num').text()
	,commentCount = $("#rightCommentDiv .info span.counts strong").text().trim()
	,buszone = $(".hotelName li.addr a.area").text().trim()
	,addr = '"'+$(".hotelName li.addr > span").attr("title")+'"'
	,hotelId = result.options.hotelId
	,star = result.options.star
	,hotelName = result.options.hotelName
	,city = result.options.city;
	
	fs.appendFile(resultHotelFile,[city.name,hotelId,hotelName,star,prate,commentCount,buszone,addr,'\n'].join(),function(err){
	    if(err){
		console.log(err);
	    }
	});
	
	console.log("[DATA] %s, %s, Hotel",city.name,hotelName);
    }
}

function elongHotel(){
    this.dataDir = '../appdata/';
    this.cityFile = 'elong_hot_city.txt';
    this.resultDir = '../result/';
    this.resultFile='pc_elong_hotel.txt';
    this.hotelInfoFile = "elonghotels.txt";
    this.level=[2,3,4,5];
    this.countOfHotelPerCity=10;
    this.pageSize=10;
}

elongHotel.prototype.init = function(){
    this.cities=helper.get_cities(this.dataDir+this.cityFile);
    //this.cities=[{pinyin:"taiyuan",id:"0601",cname:"太原"}];
}
elongHotel.prototype.wgetList = function(){
    if(this.cities.length==0 && this.curLevels && this.curLevels.length==0) {
	console.log("All cities done.");
	return;
    }
    
    if(this.curLevels==undefined || this.curLevels.length==0){
	this.curCity = this.cities.pop();
	this.curLevels = this.level.concat();
    }
    var level = this.curLevels.pop();
    var c = {cname:this.curCity.cname,code:this.curCity.code,id:this.curCity.id,pinyin:this.curCity.pinyin};
    var query = {};
    query["hsr.CheckInDate"]= checkindate;
    query["hsr.CheckOutDate"]= checkoutdate;
    query["hsr.CityId"]= c.id;
    query["hsr.PageIndex"]=1;
    query["hsr.StarLevels"]=level;
    query["hsr.PageSize"]=this.pageSize;
    //	query["hsr.IsNotReturnNoRoomHotel"]=true;
    query["hsr.HotelSort"]="ByDefault";
    opt = new helper.basic_options('hotel.elong.com',"/isajax/List/Search",'GET',false,true,query);
    c.level = level;
    opt.headers["referer"] = "http://hotel.elong.com/";
    console.log(c.cname+": "+"GET " + c.level+"-Star");
    helper.request_data(opt,null,function(data,args){that.processHotelList(data,args);},c);

    //var city = this.cities.pop();
    //var levels = this.level.concat();
    //for(var i=0;i<this.level.length;i++){
	
    //}
}
elongHotel.prototype.wgetDetail=function(){
    
}
elongHotel.prototype.onCityComplete=function(){
    this.wgetList();
}
elongHotel.prototype.processHotelList=function(data,args){
    if(!args[0].hotelCount){
	args[0].hotelCount=data.value.PageInfo.TotalRow;
	console.log(args[0].cname+": "+args[0].hotelCount+" "+args[0].level+"-Star");
    }
    if(args[0].doneHotelCount==undefined) args[0].doneHotelCount=0;
    if(args[1].idxOfPage!=undefined){
	var items = data.value.ListStaticInfos;
	
	items = items.filter(function(e,i){
	    return args[1].idxOfPage.indexOf(i)!=-1;
	});

	items.forEach(function(item,i){
	    if(!item) {
		console.log("failed: " + args);
		return;
	    }
	    var h = new entity.hotel();
	    h.id = item.HotelId+'';
	    h.name = item.HotelNameCn;
	    h.name = h.name && h.name.replace(/,/g,';');
	    h.name = h.name && h.name.replace(/[\s]/g,'');
	    h.city = args[0].cname;
	    h.star = item.Star;
	    h.prate = item.CommentGoodRate;
	    h.zoneName = item.Commerical&&item.Commerical.HotelAreaName;
	    h.zoneName = h.zoneName && h.zoneName.replace(/[,，]/g,';');
	    h.commentCount = item.TotalComment;
	    h.goodComment = 0;
	    h.badComment = 0;
	    var opt = null;

	    var query = {'hsr.CheckInDate':checkindate,'hsr.CheckOutDate':checkoutdate,'hotelId':h.id,'hsr.CityId':args[0].id};
	    if(useproxy){
		var p = getProxy();
		opt = new helper.basic_options(p.host,"http://hotel.elong.com/isajax/HotelDetailNew/GetHotelRoomset","GET",false,true,query,p.port);
	    }else{
		opt = new helper.basic_options('hotel.elong.com','/isajax/HotelDetailNew/GetHotelRoomset','GET',false,true,query);
	    }
	    
	    opt.headers["referer"] = "http://hotel.elong.com/";
	    //console.log("GET details "+i+"/"+args[1]["hsr.PageIndex"]);
	    helper.request_data(opt,null,function(data,args){that.processDetail(data,args);},[h,args[0]]);
	});
    }else{
	if(["北京","上海","广州","深圳"].indexOf(args[0].cname)!=-1){
	    args[0].todoCount=20;
	}else
	    args[0].todoCount=this.countOfHotelPerCity;
	var totalCount = 0;
	if(args[0].hotelCount<=20){
	    totalCount=args[0].hotelCount<=10?args[0].hotelCount:10;
	}else{
	    var delta = args[0].hotelCount - 20;
	    var lambda = 8;
	    totalCount=Math.round(delta/lambda)+10;
	}
	var result = helper.getrandoms(totalCount,args[0].todoCount,this.pageSize);
	//update todocount because there may not enough hotels.
	if(result.length==0){
	    console.log("No "+args[0].level+"-Star hotels of "+args[0].cname);
	    return;
	}else{
	    args[0].todoCount=result.length;
	}
	result.sort(function(a,b){return a.pageIdx-b.pageIdx;});
	var lstIdx=0;
	for(var j=1;j<result.length;j++){
	    if(result[j].pageIdx==result[lstIdx].pageIdx){
		result[lstIdx].idxOfPage = result[lstIdx].idxOfPage.concat(result[j].idxOfPage);
	    }else{
		result[++lstIdx] = result[j];
	    }
	}
	result.length=lstIdx+1;
	var hotelToGet = result;
	for(var x in hotelToGet){
	    var query = {};
	    query["hsr.CheckInDate"]= checkindate;
	    query["hsr.CheckOutDate"]= checkoutdate;
	    query["hsr.CityId"]= args[0].id;
	    query["hsr.PageIndex"]=hotelToGet[x].pageIdx;
	    query["hsr.StarLevels"]=args[0].level;
	    query["idxOfPage"] = hotelToGet[x].idxOfPage;
	    query["hsr.PageSize"]=this.pageSize;
//	    query["hsr.IsNotReturnNoRoomHotel"]=true;
	    query["hsr.HotelSort"]="ByDefault";
    	    var opt = null;
    	    if(useproxy){
    		var p = getProxy();
    		opt = new helper.basic_options(p.host,'http://hotel.elong.com/isajax/List/Search','GET',false,true,query,p.port);
    	    }else{
    		opt = new helper.basic_options('hotel.elong.com','/isajax/List/Search','GET',false,true,query);
    	    }
	    opt.headers["referer"] = "http://hotel.elong.com/";
//	    console.log("GET " +args[0].level +"-Star hotel page : "+hotelToGet[x].pageIdx);
	    helper.request_data(opt,null,function(data,args){that.processHotelList(data,args);},args[0]);
	}
    }
}
elongHotel.prototype.processDetail=function(data,args){
    if(!data||!data.success||!data.value.HotelRoomList){
	console.log(args[1].cname+": GET details failed: ",args[0].name,args[0].id);
	++args[1].doneHotelCount;
	if(args[1].doneHotelCount==args[1].todoCount){
	    console.log(args[1].cname+": "+args[1].level+"-Star done");
	    that.onCityComplete();
	}
	return;
    }
    /*
    if(!data.value.HotelRoomList) {
	console.log("hotel data unavaliable");
	console.log(args[0].name+","+args[0].id+','+args[1].level+'-Star');
	return;
    }*/
    for(var i=0;i<data.value.HotelRoomList.length;i++){
	var room = data.value.HotelRoomList[i];
	var r = new entity.room();
	r.name = room.RoomName.replace(/,/g,';');
	r.bedType = room.Bed;
	r.plans=[];
	for(var j = 0;j<room.RatePlanList.length;j++){
	    var plan = room.RatePlanList[j];
	    var p={};
	    p.name = plan.RatePlanName;
	    p.name = p.name && p.name.replace(/[,，]/g,';');
	    p.price = plan.FavorablePrice;
	    p.timeLimit = plan.ProductType==16?'Y':'N';
	    p.breakfast = plan.Brkfast;
	    p.gift = plan.SupplierActivityList.replace(/<\/?[^>]*>/g,'').replace(/[ | ]*[\r\n]*/g,'').replace(/[,\s]/g,'').replace(/，/g,';');
	    p.reduce = plan.ReduceAmount;
	    p.fan  =plan.CouponAmount;
	    p.payType = plan.IsPrepay?"Y":"N";
	    p.lan = room.Net;
	    p.lan = p.lan && p.lan.replace(/,/g,'');
	    p.hasWeifang = plan.HasWeifang?'Y':'N';//今日特价
	    p.needSurety = plan.NeedSurety?'Y':'N';//担保
	    r.plans.push(p);
	}
	args[0].rooms.push(r);
    }
    fs.appendFileSync(this.dataDir+this.hotelInfoFile,args[0].city+','+args[0].id+','+args[0].name+','+args[0].star+'\r\n');
    fs.appendFile(this.resultDir+this.resultFile,args[0].toString("elong_pc"),function(err){
	if(err){
	    console.log();
	}else{
//	    fs.appendFile(doneFile,args[0].id+'\r\n',function(){});
	    ++args[1].doneHotelCount;
	    if(args[1].doneHotelCount==args[1].todoCount){
		console.log(args[1].cname+": "+args[1].level+"-Star done");
		that.onCityComplete();
	    }
	}
    });
}
elongHotel.prototype.processExtra=function(){
    
}
elongHotel.prototype.start=function(){
    console.log("program start.");
    this.wgetList();
}
var instance = new elongHotel();
var that = instance;
