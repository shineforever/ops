var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('./helpers/webhelper.js')
var $ = require('jquery')
var entity = require('./models/entity.js')
var sprintf = require("sprintf-js").sprintf

//basic settings.
var checkindate = "2014-03-01";
var checkoutdate = "2014-03-02";
var app_qunar_done_city_file = "app_qunar_done_city_hotel.txt";
var app_qunar_done_hotel= "app_qunar_done_hotel-02-24.txt";

//prepare data
var proxy = new helper.proxy();
proxy.load('verified-2-24.txt');
var cities = helper.get_cities('qunar_hot_city.txt');
var doneCities = {};
var doneHotels = {};
var doneLines = [];
var requestCount = 0;

var arguments = process.argv.splice(2);
var level = arguments[0]||1;

var failedLines = fs.readFileSync("app_qunar_hotel_failed.txt").toString().split('\r\n');

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
	for(var j=0;j<failedLines.length;j++){

	}
	for(var i=0;i<cities.length;i++){
		var c = cities[i];
		if(doneCities[c.cname]) continue;
		
		var pageIdx = 1;
		
		var query = {"checkin":checkindate.replace(/\-/g,''),"days":1,"city":c.cname,"pageNum":pageIdx,"level":level};
		var p = getProxy();
		var opt = new helper.basic_options(p.host,'http://h.qunar.com/list.jsp','GET',true,false,query,p.port);
		//var opt = new helper.basic_options("h.qunar.com",'/list.jsp','GET',true,false,query,null);
		opt.headers["referer"] = "http://h.qunar.com/";
		console.log("starting get "+c.cname+" page:"+pageIdx);
		
		request_data(opt,null,process_hotel_list,c);
	}
}
start();
//count request count.
function getProxy(){
	requestCount++;
	if(requestCount==100){
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
			
			var p = getProxy();
			request_data(
			//new helper.basic_options(p.host,'http://h.qunar.com/preDetail.jsp','GET',true,false,{'seq':h.id,'checkin':checkindate.replace(/\-/g,''),'days':1,"city":args[0].cname,'pageNum':args[1].pageNum},p.port),
			new helper.basic_options("h.qunar.com",'/preDetail.jsp','GET',true,false,{'seq':h.id,'checkin':checkindate.replace(/\-/g,''),'days':1,"city":args[0].cname,'pageNum':args[1].pageNum},null),
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
		var hotelToGet = getrandoms(hotelCount);
		for(var x in hotelToGet){
			var query = {"checkin":checkindate.replace(/\-/g,''),"days":1,"city":c.cname,"pageNum":hotelToGet[x].pageIdx,"idxOfPage":hotelToGet[x].idxOfPage,"level":level};
			var p = getProxy();
			//var opt = new helper.basic_options(p.host,'http://h.qunar.com/list.jsp','GET',true,false,query,p.port);
			var opt = new helper.basic_options('h.qunar.com','/list.jsp','GET',true,false,query,null);
			request_data(opt,null,process_hotel_list,c);
		}
	}
}
function getrandoms(l){
	var result = [];
	if(l<=20){
		while(l){
			result.push(--l);
		}
		return result.map(function(i){
			var page = Math.ceil((i+1)/8);
			var idxOfPage = i%8;
			return {'pageIdx':page,'idxOfPage':idxOfPage};
		});
	}
	
	var i=0;
	var tempdic = {};
	while(i<20){
		var x = Math.floor((Math.random()*l)+0);
		if(!tempdic[x]){
			tempdic[x]=true;
			result.push(x);
			i++;
		}
	}
	return result.map(function(i){
			var page = Math.ceil((i+1)/8);
			var idxOfPage = i%8;
			return {'pageIdx':page,'idxOfPage':idxOfPage};
		});
}

var donehotelcount=0;
function process_one_hotel(data,args){
	console.log("got hotel page.");
	var doc = $(data);
	var starNode = doc.find("div.ct1 table tbody tr td:last-child");
	if(starNode.length>0){
		args[0].star = starNode[0].childNodes[2].value&&starNode[0].childNodes[2].value.trim();
	}

	var comm = data.match(/\d+条评论/);
	if(comm&&comm[0]){
		var matches = comm[0].match(/\d+/);
		args[0].commentCount = matches&&matches[0];
	}
		

	var roomNodes = doc.find("div.room");
	if(roomNodes.length==0) return;

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
	appendToFile("app_data/app_qunar_hotel-"+level+"-"+args[1].cname+".txt",args[0].toString("qunar"));
	console.log(args[1].cname+": "+(++args[1].curHotelIdx)+"/"+args[1].hotelCount);
	fs.appendFile(app_qunar_done_hotel,args[0].id+','+args[2].pageNum+','+args[1].id+'\r\n',function(err){
		if(err) console.log(err.message);
	});
	// if(args[1].curHotelIdx==args[1].hotelCount){
		// doneCities[args[1].cname] = true;
		// fs.appendFile(app_qunar_done_city_hotel,args[1].cname+'\r\n',function(err){
			// if(err) console.log(err.message);
		// });
	// }
	//var c = args[1];
	
}


//write file
function appendToFile(file,data){
	fs.appendFile(file,data,function(err){
		if(err)
			console.log(err.message);
	});
}



function request_data(opts,data,fn,args){
    if(!opts || !fn) throw "argument null 'opt' or 'data'";
    var strData = data && JSON.stringify(data);
    if(opts.method=='POST')
        opts.headers['Content-Length']=Buffer.byteLength(strData);
    
    var req = http.request(opts, function(res) {

    var chunks=[];
    res.on('data', function (chunk) {
            chunks.push(chunk);
    });
    res.on('end',function(){
            if(res.headers['content-encoding']=='gzip'){
        var buffer = Buffer.concat(chunks);
		if(buffer.length==157){
			console.log("current ip has been forbidden. retry...");
			request_data(opts,data,fn,args);
            //process.exit();
		}
        zlib.gunzip(buffer,function(err,decoded){
            if(decoded){
            try{
                var obj = decoded.toString();
                if(res.headers['content-type'].indexOf('application/json')!=-1)
                    obj =JSON.parse(decoded.toString());
				if(Array.isArray(args)){
					args.push(opts.data);
					fn(obj,args);
				}else{
					fn(obj,[args,opts.data]);
				}
                
            }
            catch(e){
                console.log(e.message);
                request_data(opts,data,fn,args);
            }
            }
        });
            }
            else if(res.headers['content-encoding']=='deflate'){
      var buffer = Buffer.concat(chunks);
      zlib.inflate(buffer,function(err,decoded){
        console.log(decoded&&decoded.toString());
      });
    }
    });
    });
    req.on('error', function(e) {
	if(opts.path && opts.path.indexOf('list.jsp')!=-1){
		console.log("page :"+opts.data.pageNum+"got error-"+e.message);
		fs.appendFile("app_qunar_hotel_failed.txt","p:"+ JSON.stringify(opts.data)+'\r\n');
	}else{
		console.log("page of hotel:"+opts.data.seq+" got error-"+e.message);
		fs.appendFile("app_qunar_hotel_failed.txt","h:"+JSON.stringify(opts.data)+'\r\n');
	}
    //console.log(e.message);
	//var proxy = exports.randomip(proxys);
    //            if(proxy.host&&proxy.port){
    //                opts.port = proxy.port;
    //                opts.host = proxy.host;    
    //            }
                
                //retry
                request_data(opts,data,fn,args);
    });
    if(opts.method=='POST')
        req.write(strData);
    req.end();
}