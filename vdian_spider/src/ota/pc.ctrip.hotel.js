var fs = require('fs')
var cheerio = require('cheerio')
var helper = require('../../helpers/webhelper.js')
var entity = require('../../models/entity.js')
var moment = require('moment')

//get cities
var cities = helper.get_cities("../../appdata/ctrip_hotel_city.txt");
console.log('program start.');
var cs = {};
//request data http://hotel.elong.com/isajax/List/GetSimpleHotelRoomSet
for(var i=0;i<cities.length;i++){
	var c = cities[i];
	cs[c.cname]=c;

    //var req = sprintf('{"cityname":"%1$s","checkindate":"%2$s","checkoutdate":"%3$s","pageindex":%4$d}', c.cname, checkindate, checkoutdate,0);
    //var query = {'getHotelListReq':req};
}

function CtripHotel(){
    this.today = moment().format("YYYY-MM-DD");
    this.checkindate = "2015-07-30";//moment().add(7,'d').format('YYYY-MM-DD');
    this.checkoutdate = "2015-07-31";//moment().add(8,'d').format('YYYY-MM-DD');
    this.resultDir = "../../result/ota/";
    this.dataDir = "../../appdata/";
    this.resultRoomFile = "pc_ctrip_room_"+this.today+".txt";
    this.countOfHotelsPerCity=6;
    this.resultHotelFile = "pc_ctrip_hotel_"+this.today+".txt";
    this.proxyFile = "verified-03-02.txt";
    this.failedFile = "pc_ctrip_failed_hotel.txt";
    //this.cityFile = "qunar_hot_city.txt";
    this.invalidFile = "ctrip_hotel_invalid.txt";
    this.invalidHotel=Object.create(null);
    this.invalidHotel.count=0;
    this.doneHotel = Object.create(null);
    this.doneHotel.count=0;
    this.doneHotelsDic={};
    this.todoHotels=[];
}

CtripHotel.prototype.init = function(){
    var arguments = process.argv.splice(2);
    var start = Number(arguments[0]) || 0;
    var len = Number(arguments[1]) || 50000;
    //前闭后开区间
    
    if(fs.existsSync(this.dataDir + this.invalidFile)){
	fs.readFileSync(this.dataDir+this.invalidFile)
	    .toString().split('\n').reduce(function(pre,l){
		if(!l || !l.trim()) return pre;
		eid = l.replace('\r','').split(',')[1];
		pre[eid]=true;
		pre.count++;
		return pre;
	    },this.invalidHotel);
    }
    
    if(fs.existsSync(this.resultDir + this.resultHotelFile)){
	fs.readFileSync(this.resultDir+this.resultHotelFile).toString().split('\n').reduce(function(pre,l){
	    if(!l) return pre;
	    var eid = l.replace('\r','').split(',')[1];
	    pre[eid]=true;
	    pre.count++;
	    return pre;
	},this.doneHotel);
    }
    
    this.todoHotels = fs.readFileSync(this.dataDir+"elonghotels.txt")
	.toString()
	.split('\n')
	.slice(start,start+len)
	.filter(function(l){
	    if(!l || l=='\r')
		return false;
	    var kvs = l.split(',');
	    var cityName = kvs[0];
	    var elongId = kvs[1];
	    var hotelName = kvs[2];
	    var elongStar = kvs[3].replace('\r',"").replace('\n',"");
	    return !this.doneHotel[elongId]&&!this.invalidHotel[elongId];
	},this)
	.map(function(l){
	    var kvs = l.split(',');
	    var cityName = kvs[0];
	    var elongId = kvs[1];
	    var hotelName = kvs[2];
	    var elongStar = kvs[3].replace('\r',"").replace('\n',"");
	    return {cityName:cityName,hotelName:hotelName,elongId:elongId,elongStar:elongStar};
	},this);
    console.log("%d hotels to do",this.todoHotels.length);
}

CtripHotel.prototype.start = function(){
    this.init();
    this.search();
}

CtripHotel.prototype.search = function(){
    if(this.todoHotels.length==0)
	return;
    
    var cur = this.todoHotels.shift();
    var c = cs[cur.cityName];
    var query = {
	StartDate : this.checkindate,
	DepDate : this.checkoutdate,
	cityId : c.id,
	star : 0
    };
    if(c.id==1024){
	c.pinyin = "ma'anshan";
    }
    var path = "/hotel/"+c.pinyin+c.id+"/k1"+encodeURI(cur.hotelName);
    var opt = new helper.basic_options('hotels.ctrip.com',path,'POST',false,false,query);
    
    opt.headers["referer"] = "http://hotels.ctrip.com/";
    console.log("[GET ] %s",cur.hotelName);
    helper.request_data(opt,query,function(data,args){
	that.filterFromResult(data,args);
    },[c,cur]);
}

CtripHotel.prototype.filterFromResult = function(data,args){
    if(!data){
	console.log("no search result");
	setTimeout(function(){
	    that.search();
	},0);

	return;
    }
    var $=cheerio.load(data);
    var c = args[0];
 //    if(!c.pageCount) {
	// var pageCount = $("div.c_page_list a:last-child").text();
	// if(pageCount){
	//     try{
	// 	pageCount = Number(pageCount);
	// 	c.pageCount = pageCount;
	//     }catch(e){
	// 	console.log(e.message);
	// 	return;
	//     }
	// }else{
	//     setTimeout(function(){
	// 	that.search();	
	//     },0);
	    
	//     return;
	// }
 //    }
 //    if(!c.curPageIdx) {
	// c.curPageIdx = 1;
 //    }
 //    if(!c.hotelCount) {
	// var total = $("#B1").text();
	// if(total){
	//     try{
	// 	total = Number(total);
	// 	c.hotelCount=total;
	//     }catch(e){
	// 	console.log(e.message);
	// 	return;
	//     }
	// }else{
	//     //this.search();
	//     //return;
	// }
 //    }
    if(c.curHotelIdx==undefined) c.curHotelIdx=0;
    var cnf = data.match(/allRoom.+/);
    if(cnf&&cnf.length>0)
	cnf = cnf[0];
    else{
//	fs.appendFileSync(failedFile,args[1].cityName+","+args[1].hotelName+'\r\n');
	this.search();
	return;
    }
    var url = cnf.split(':')[1].replace(/[\',\s]*/g,'');
    var hotelList = $("#hotel_list div.searchresult_list");
    
    if(hotelList.length==0){
	setTimeout(function(){
	    that.search();
	},1000);
	return;
    }
    
    if(Number($("div.total_htl_amount b").text().trim())===0){
	var item = [c.cname,args[1].elongId,args[1].hotelName,'\n'].join();
	console.log("[WARN] Hotel not exists: %s",item);
	if(!this.invalidHotel[args[1].elongId]){
	    fs.appendFileSync(this.dataDir+this.invalidFile,item);
	}
	
	setTimeout(function(){
	    that.search();
	},(Math.random()*9+2)*1000);
	return;
    }
    
    var item = $("#hotel_list div.searchresult_list").eq(0);
    var h = new entity.hotel();
    h.name = $("ul.searchresult_info li.searchresult_info_name h2.searchresult_name a",item).attr("title");
    h.id = $("ul.searchresult_info li.searchresult_info_name h2.searchresult_name",item).attr("data-id");
    h.city = args[0].cname;
    h.star = $("ul.searchresult_info li.searchresult_info_name p.medal_list span",item).attr("title");
    h.points = $("ul.searchresult_info li.searchresult_info_judge div.searchresult_judge_box a.hotel_judge span.hotel_value",item).text();
    h.commentCount = $("ul.searchresult_info li.searchresult_info_judge div.searchresult_judge_box a.hotel_judge span.hotel_judgement",item).text();
    h.commentCount = h.commentCount && h.commentCount.match(/\d+/)[0];
    h.address = '"'+$('p.searchresult_htladdress',item).text()+'"';
    var r = [args[0].cname,args[1].elongId,args[1].hotelName,args[1].elongStar,h.id,h.name,h.star,h.points,h.commentCount,h.address,"\n"].join();
    fs.appendFile(this.resultDir+this.resultHotelFile,r);
    url="http://hotels.ctrip.com"+url+'hotel='+h.id+'&startDate='+that.checkindate+'&depDate='+that.checkoutdate+'&OrderBy=ctrip&OrderType=ASC&index=1&page=1&rs=1';
    // console.log(url);
    helper.request_data(url,null,function(data,args){
	that.processDetail(data,args);
    },[h,c,args[1]]);
}

CtripHotel.prototype.processDetail = function(data,args){
    if(!data) {
	console.log("[ERROR] No room data: %s",args[2].hotelName);
	//fs.appendFileSync(this.dataDir+this.invalidFile,args[2].hotelName+'\n');
	//setTimeout(function(){
	//    that.search();
	//},(Math.random()*5+2)*1000);
	
	setTimeout(function(){
	    that.search();
	},0);
	return;
    }
    
    var $ = cheerio.load(data);
    var h = args[0];
    var c = args[1];
    
    $("tr.t").each(function(){
	if($('td',this).length==1){
	    var roomName = $('td a.hotel_room_name',this).text();
	    var nextRow = $(this).next();
	    while(nextRow.attr('class')=='unexpanded'){
		var room = new entity.room();
		room.name = roomName;
		room.name=room.name && room.name.replace(/[,，]/g,';');
		var roomNode = $("td.hotel_room div.child_room_box span.hotel_room_style",nextRow);
		room.pkg = roomNode.text();
		room.tags = [];
		roomNode = roomNode.next("span")
		while(roomNode.length){
		    room.tags.push(roomNode.text());
		    roomNode = roomNode.next("span");
		}
		var tds = $('td',nextRow);
		room.bedType = $('span',tds.eq(1)).text();
		room.breakfast = $(tds.eq(2)).text();
		room.lan = $(tds.eq(3)).text();
		room.price = $(tds.eq(5)).text();
		room.fan = $('span',tds.eq(6)).text();
		room.prePay = $('span.icon_prepay',tds.eq(7)).length;
		room.assurance = $("span.ico_vouch",tds.eq(7)).length;
		h.rooms.push(room);
		nextRow = nextRow.next();
	    }
	}else{
	    var room = new entity.room();
	    var tds = $("td",this);
	    if(tds.length==0) return;
	    room.name = $("a.hotel_room_name",tds.eq(0)).text();
	    room.name=room.name && room.name.replace(/[,]/g,';');
	    room.pkg = $('span.hotel_room_text',tds.eq(0)).text().replace(/,/g,';');
	    room.tags=[];
	    room.bedType = $("span",tds.eq(1)).text().replace(/,/g,'');
	    room.breakfast = $("span",tds.eq(2)).text();
	    room.lan = tds.eq(3)&&$('span:first-child',tds.eq(3)).text().trim();
	    room.price = $(tds.eq(5)).text();
	    room.fan = $("span",tds.eq(6)).text();
	    room.prePay = $('span.icon_prepay',tds.eq(7)).length;
	    room.assurance = $("span.ico_vouch",tds.eq(7)).length;
	    h.rooms.push(room);
	    tds=null;
	}
    });
    
    fs.appendFile(this.resultDir + this.resultRoomFile,h.toString("ctrip_pc"),function(e){
	if(e)
	    console.log(e.message);
	else{
	    
	}
    });

    c.curHotelIdx++;
    console.log("[DATA] "+c.cname+" : "+c.curHotelIdx);
    $=null;
    data=null;
    setTimeout(function(){
	that.search();
    },(Math.random()*9+2)*1000);
}

var instance = new CtripHotel();
var that = instance;
instance.start();
