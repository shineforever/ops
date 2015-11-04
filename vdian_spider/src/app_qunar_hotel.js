var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')
var entity = require('../models/entity.js')

//basic settings.
var checkindate = "2015-04-30";
var checkoutdate = "2015-05-01";
var app_qunar_done_city_file = "../result/app_qunar_done_city_hotel.txt";
var app_qunar_done_hotel= "../result/app_qunar_done_hotel.txt";
var countOfHotelsPerCity = 20;


//prepare data
var proxy = new helper.proxy();
proxy.load('verified-03-02.txt');
var cities = helper.get_cities('../appdata/qunar_hotel_city.txt');
var doneCities = {};
var doneHotels = {};
var doneLines = [];
var requestCount = 0;
var pageSize=8;
var arguments = process.argv.splice(2);
var level = '';
var useProxy = arguments[0]!=undefined&&arguments[0]!=0;
function syncDoneCities(){
    console.log("sync done cities...");
    if(!fs.existsSync(app_qunar_done_city_file)) return;
    var lines = fs.readFileSync(app_qunar_done_city_file).toString().split('\r\n');
    for(var i=0;i<lines.length;i++){
	doneCities[lines[i]] = true;
    }
    console.log("load "+lines.length+" cities done");
}
function syncDoneHotels(){
    if(!fs.existsSync(app_qunar_done_hotel)) return;
    var lines = fs.readFileSync(app_qunar_done_hotel).toString().split('\r\n');
    for(var i=0;i<lines.length;i++){
	if(!lines[i]) continue;
	var l = lines[i].split(',');
	var id = Number(l[0]);
	var pidx = Number(l[1]);
	var cid = Number(l[2]);
	doneHotels[id] = true;
	doneLines.push({'hid':id,'pidx':pidx,'cid':cid});
    }
    doneLines.sort(function(a,b){
	return a.pidx - b.pidx;
    });
    console.log(doneLines.length+" hotels done.");
}
//application start.
function start(){
    console.log('program start.');
    syncDoneCities();
    syncDoneHotels();
    //request data   http://h.qunar.com/list.jsp?checkin=20140223&days=1&city=北京&pageNum=1
    for(var i=0;i<cities.length;i++){
	var c = cities[i];
	if(doneCities[c.cname]) continue;
	var pageIdx = 1;
	var query = {"checkin":checkindate.replace(/\-/g,''),"days":1,"city":c.cname,"pageNum":pageIdx,"level":level};
	var opt = null;
	if(useProxy){
	    var p = getProxy();
	    opt = new helper.basic_options(p.host,'http://h.qunar.com/list.jsp','GET',true,false,query,p.port);
	}else{
	    opt = new helper.basic_options("h.qunar.com",'/list.jsp','GET',true,false,query,null);
	}
	
	opt.headers["referer"] = "http://h.qunar.com/";
	console.log("starting get "+c.cname+" page:"+pageIdx);
	helper.request_data(opt,null,process_hotel_list,c);
    }
}
//start();
//count request count.
function getProxy(){
    requestCount++;
    if(requestCount==1){
	requestCount=0;
	return proxy.getNext();
    }else{
	requestCount++;
	return proxy.cur();
    }
}

//count hotels done of page
function doneHotelsOfPage(pageIdx,cityId){
    var arr = doneLines;
    var s=0,e=arr.length,mid,left=-1,right=-1;
    var result=0;
    while(s<=e){
	mid = parseInt((e-s)/2 + s);
	if(arr[mid].pidx==pageIdx){
	    left=right=mid;
	    while(left>=0 && arr[left].pidx==pageIdx) {
		if(arr[left].cid==cityId) result++;
		left--;
	    }
	    while(right < arr.length && arr[right].pidx==pageIdx){
		if(arr[right].cid==cityId) result++;
		right++;	
	    } 
	    break;
	}
	if(pageIdx < arr[mid].pidx){
	    e=mid-1;
	}
	else
	    s=mid+1;
    }
    if(s>e) return 0;
    return result;
}

//process response

function process_hotel_list(data,args){
    //get hotel list data
    console.log("done got "+args[0].cname+" page:"+ args[1].pageNum);
    if(!data || data.IsError)
	return;
    var doc = $(data);
    var items = doc.find('table.fl tr td:first-child');
    if(items.length==0) return;
    console.log("available "+args[0].cname+" page:"+args[1].pageNum);
    if(args[1].idxOfPage!=undefined){
	items.each(function(idx,td){
	    if(idx!=args[1].idxOfPage) return;
	    //if(idx==1||idx==5||idx==3) return;
	    var a = td.childNodes[1];
	    if(!a||!a.innerHTML) return;

	    var name = a.innerHTML&&a.innerHTML.trim();
	    var href = a.getAttribute('href');
	    var matches = href&&href.match(/seq=\w+/);
	    var id = matches&&matches[0].split('=')[1];;
	    if(!id) return;
	    if(doneHotels[id]) {
		if(args[0].curHotelIdx==undefined)
		    args[0].curHotelIdx=1;
		else
		    args[0].curHotelIdx++;
		//donehotelcount++;
		return;
	    }
	    var h = new entity.hotel();
	    h.city = args[0].cname;
	    h.id = id;
	    h.name = name;
	    var pointsAndZone = td.childNodes[4].value&&td.childNodes[4].value.trim();
	    if(pointsAndZone){
		var matches = pointsAndZone.match(/\d*\.\d*/);
		h.points = matches&&matches[0];
		h.zoneName = pointsAndZone.split(' ')[1];
	    }
	    var opt = null;
	    if(useProxy){
		var p = getProxy();
		opt = new helper.basic_options(p.host,'http://h.qunar.com/preDetail.jsp','GET',true,false,{'seq':h.id,'checkin':checkindate.replace(/\-/g,''),'days':1,"city":args[0].cname,'pageNum':args[1].pageNum},p.port);
	    }else{
		opt = new helper.basic_options("h.qunar.com",'/preDetail.jsp','GET',true,false,{'seq':h.id,'checkin':checkindate.replace(/\-/g,''),'days':1,"city":args[0].cname,'pageNum':args[1].pageNum},null);
	    }
	    
	    helper.request_data(
		opt,
		null,
		process_one_hotel,
		[h,args[0]]
	    );
	});
    }
    else{
	//get next page.
	var matches = data.match(/\d+\/\d+/g);
	var pageCount = matches&&matches[0].split('/')[1];
	var p = doc.find("div.ct p:first-child");
	var hotelCount = 0;
	if(p.length>0){
	    var matches=p[0].childNodes && p[0].childNodes[2].value&&p[0].childNodes[2].value.trim().match(/\d+/);
	    hotelCount=matches&&matches[0];
	}
	var c = args[0];
	if(!c.pageCount) c.pageCount = pageCount;
	if(!c.curPageIdx) c.curPageIdx = 1;
	if(!c.hotelCount&&hotelCount>0) c.hotelCount=hotelCount;
	if(c.curHotelIdx==undefined) c.curHotelIdx=0;
	var hotelToGet = helper.getrandoms(hotelCount,countOfHotelsPerCity,pageSize);
	for(var x in hotelToGet){
	    var query = {"checkin":checkindate.replace(/\-/g,''),"days":1,"city":c.cname,"pageNum":hotelToGet[x].pageIdx,"idxOfPage":hotelToGet[x].idxOfPage,"level":level};
	    var opt = null;
	    if(useProxy){
		var p = getProxy();
		opt = opt = new helper.basic_options(p.host,'http://h.qunar.com/list.jsp','GET',true,false,query,p.port);
	    }else{
		opt = opt = new helper.basic_options('h.qunar.com','/list.jsp','GET',true,false,query,null);
	    }
	    
	    helper.request_data(opt,null,process_hotel_list,c);
	}
    }
}


var donehotelcount=0;
function process_one_hotel(data,args){
    var $ = cheerio.load(data);

    var infoNode = $("div.ct1 table tr td:last-child").contents();
    args[0].star = infoNode.eq(2).text();
    args[0].star = args[0].star && args[0].star.replace(/\s/g,'');
    var comm = data.match(/(\d+)条评论/);
    if(comm&&comm[1]){
	args[0].commentCount = comm[1];
    }
    var roomNodes = $("div.room").each(function(i,e){
	if(i==0) return;
	var r = new entity.room();
	r.sites=[];
	r.name = $("div.t",this).text();
	r.name = r.name && r.name.replace('房型：','');
	r.name = r.name && r.name.replace(/[,，]/g,';');
	$('p',this).each(function(i,e){
	    var contents =$(this).contents();
	    var site = contents.eq(0).text().replace(/[\s\d\.]/g,'');
	    if(site.indexOf("报价")>-1)
		return;
	    var pName = contents.eq(2).text().replace(/\s/g,'').replace(/[,，]/g,';');
	    pName = pName?pName:r.name;
	    var tuan = "N";
	    if(site.indexOf('团购')>-1)
		tuan = "Y";
	    var price = $('span.hl',this).text();
	    price = price && price.replace(/\s/g,'');
	    r.sites.push({"site":site,"price":price,"tuan":tuan,"pkg":pName});
	});
//	var paraNodes = e.getElementsByTagName('p');
//	if(paraNodes.length>0){
//	    for(var j=0;j<paraNodes.length;j++){
//		var site = paraNodes[j].childNodes&&paraNodes[j].childNodes[0]&&paraNodes[j].childNodes[0].value&&paraNodes[j].childNodes[0].value.trim();
//		var tuan='N';
//		if(site && site.indexOf("团购")!=-1)
//		    tuan = 'Y';

//		var price = paraNodes[j].childNodes[5]&&paraNodes[j].childNodes[5].innerHTML&&paraNodes[j].childNodes[5].innerHTML.trim().replace(/\s/g,'');
//		if(site&&price)
///		    r.sites.push({"site":site,"price":price,"tuan":tuan});
//	    }
//	}
	args[0].rooms.push(r);
    });
	/*    
    for(var i=1;i<roomNodes.length;i++){
	var r = new entity.room();
	r.sites=[];
	r.name = roomNodes[i].children&&roomNodes[i].children[0].innerHTML&&roomNodes[i].children[0].innerHTML.trim().replace('房型：','');
	var paraNodes = roomNodes[i].getElementsByTagName('p');
	if(paraNodes.length>0){
	    for(var j=0;j<paraNodes.length;j++){
		var site = paraNodes[j].childNodes&&paraNodes[j].childNodes[0]&&paraNodes[j].childNodes[0].value&&paraNodes[j].childNodes[0].value.trim();
		var tuan='N';
		if(site && site.indexOf("团购")!=-1)
		    tuan = 'Y';

		var price = paraNodes[j].childNodes[5]&&paraNodes[j].childNodes[5].innerHTML&&paraNodes[j].childNodes[5].innerHTML.trim().replace(/\s/g,'');
		if(site&&price)
		    r.sites.push({"site":site,"price":price,"tuan":tuan});
	    }
	}
	args[0].rooms.push(r);
    }
    */
    // if(++donehotelcount==8){
    // 	donehotelcount=0;
    // 	while(c.curPageIdx<c.pageCount-1 && doneHotelsOfPage(c.curPageIdx,c.id)>4){
    // 		c.curPageIdx++;
    // 	}
    // 	var p = getProxy();
    // 	var query = {"checkin":checkindate.replace(/\-/g,''),"days":1,"city":c.cname,"pageNum":c.curPageIdx};
    // 	//var opt = new helper.basic_options(p.host,'http://h.qunar.com/list.jsp','GET',true,false,query,p.port);
    // 	var opt = new helper.basic_options("h.qunar.com",'/list.jsp','GET',true,false,query,null);
    
    // 	helper.request_data(opt,null,process_hotel_list,c);
    
    // }
    fs.appendFileSync("../result/app_qunar_hotel.txt",args[0].toString("qunar"));
    setTimeout(function(){
	var r = todo.shift();
	getSpecifyHotel(r);
    },(Math.random()*9+2)*1000);
    //console.log(args[1].cname+": "+(++args[1].curHotelIdx)+"/"+args[1].hotelCount);
    fs.appendFileSync(doneHotelFile,args[1].city.cname+','+args[1].elongId+','+args[1].elongName+','+args[0].id+','+args[0].name+'\r\n');
    console.log(args[0].city+','+args[0].name);
    
    // if(args[1].curHotelIdx==args[1].hotelCount){
    // doneCities[args[1].cname] = true;
    // fs.appendFile(app_qunar_done_city_hotel,args[1].cname+'\r\n',function(err){
    // if(err) console.log(err.message);
    // });
    // }
    //var c = args[1];
	
}


var doneHotelFile = "../result/app_qunar_hotel_done.txt";
var doneHotels2 = {};
var cs={};
var todo;
function begin(){
    for(var j=0;j<cities.length;j++){
	cs[cities[j].cname]=cities[j];
    }
    if(fs.existsSync(doneHotelFile)){
	var dones = fs.readFileSync(doneHotelFile).toString().split("\r\n");
	for(var k=0;k<dones.length;k++){
	    if(!dones[k]) continue;
	    var eid = dones[k].split(',')[1];
	    doneHotels2[eid] = true;
	}
    }
    
    todo = fs.readFileSync("../appdata/ctriphotels.txt").toString().split("\n").filter(function(line){
	if(!line || line=='\r') return false;
	line = line.replace('\r','');
	var vals = line.split(',');
	if(doneHotels2[vals[1]])
	   return false;
	return true;
    }).map(function(line){
	line = line.replace('\r','');
	var vals = line.split(',');
	return {city:cs[vals[0]],elongId:vals[1],elongName:vals[2]};
    });
    var r=null;
    while(!r && todo.length>0){
	r = todo.shift();
    }
    getSpecifyHotel(r);
}

function getSpecifyHotel(record){
    if(!record)
	return;
    var city = record.city,hotelName = record.elongName;
    var query = {"checkin":checkindate.replace(/\-/g,''),"days":1,"city":city.cname,"level":0,"priceRange":0,"queryKey":hotelName};
    var opt = null;
    if(useProxy){
	var p = getProxy();
	opt = new helper.basic_options(p.host,"http://h.qunar.com/list.jsp",'GET',true,false,query,p.port);
    }else{
	opt = new helper.basic_options("h.qunar.com",'/list.jsp','GET',true,false,query,null);
    }
    opt.agent = false;
    console.log("GET %s,%s",city.cname,hotelName);
    helper.request_data(opt,null,getFirstHotelOfPage,[city,record]);
}
function getFirstHotelOfPage(data,args){
    //console.log("done got "+args[0].cname+" page:"+ args[1].pageNum);
    if(!data || data.IsError){
	console.log("Failed");
	return;
   }
    var $ = cheerio.load(data);
    var h = new entity.hotel();
    $('table.fl tr:first-child td:first-child').each(function(i,e){
	h.city = args[0].cname;
	h.name = $('a',this).text();
	h.name = h.name && h.name.replace(/,/g,";");
	var href=$('a',this).attr('href');
	var matches = href&&href.match(/seq=(\w+)/);
	var id = matches&&matches[1];
	h.id = id;
	var pointsNode = e.children.filter(function(child){
	    return child.type=='text' && (typeof child.data=="string") && child.data.indexOf('评分')!=-1;
	});
	if(pointsNode.length>0)
	    var pointsAndZone = pointsNode[0].data.replace(/[\s]/g,'');
	if(pointsAndZone){
	    var matches = pointsAndZone.match(/\d*\.\d*/);
	    h.points = matches&&matches[0];
	    h.zoneName = pointsAndZone.split('&nbsp;')[1];
	}
    });
   /* if(items.length==0){
	console.log(data);
	return;
    }
    console.log("available "+args[0].cname+" page:"+args[1].pageNum);
    
    var td = items[0];
    var a = td.childNodes[1];
    if(!a||!a.innerHTML) return;

    var name = a.innerHTML&&a.innerHTML.trim();
    var href = a.getAttribute('href');
    var matches = href&&href.match(/seq=\w+/);
    var id = matches&&matches[0].split('=')[1];
    if(!id) return;
    if(doneHotels[id]) {
	if(args[0].curHotelIdx==undefined)
	    args[0].curHotelIdx=1;
	else
	    args[0].curHotelIdx++;
	//donehotelcount++;
	return;
    }
    var h = new entity.hotel();
    h.city = args[0].cname;
    h.id = id;
    h.name = name;
    */
//    var pointsAndZone = td.childNodes[4].value&&td.childNodes[4].value.trim();
//    if(pointsAndZone){
//	var matches = pointsAndZone.match(/\d*\.\d*/);
//	h.points = matches&&matches[0];
//	h.zoneName = pointsAndZone.split(' ')[1];
//    }
    var opt = null;
    if(useProxy){
	var p = getProxy();
	opt = new helper.basic_options(p.host,'http://h.qunar.com/preDetail.jsp','GET',true,false,{'seq':h.id,'checkin':checkindate.replace(/\-/g,''),'days':1,"city":args[0].cname,'pageNum':args[1].pageNum},p.port);
    }else{
	opt = new helper.basic_options("h.qunar.com",'/preDetail.jsp','GET',true,false,{'seq':h.id,'checkin':checkindate.replace(/\-/g,''),'days':1,"city":args[0].cname,'pageNum':args[1].pageNum},null);
    }
    opt.agent=false;
    helper.request_data(opt,null,process_one_hotel,[h,args[1]]);
}

begin();
