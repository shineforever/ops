var fs = require('fs')
var moment = require('moment')
var util = require('util')
var EventEmitter = require('events').EventEmitter
var Crawler = require('node-webcrawler')

function WebCrawler(){
    this.today = moment().format("YYYY-MM-DD");
    this.checkindate ="2015-07-30"; //moment().add(7, 'd').format('YYYYMMDD'); 
    this.checkoutdate = "2015-07-31";//moment().add(8, 'd').format('YYYYMMDD'); 
    this.resultDir = "../../result/ota/";
    this.dataDir = "../../appdata/";
    //this.cityFile = "";
    this.resultRoomFile = "app_ctrip_room_" + this.today + ".txt";
    this.resultHotelFile = "app_ctrip_hotel_" + this.today + ".txt";
    this.hotelInfoFile = "ctriphotels.txt";
    this.todoHotels = [];
    this.doneHotel = Object.create(null);
    this.cityMap = Object.create(null);
    this.c = new Crawler({
	maxConnections:1,
	rateLimits:1500,
	callback:function(err,result){
	    that.processDetail(err,result);
	},
	onDrain:function(){
	    console.log("[DONE] All done!");
	},
	userAgent:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36'
    });
}

WebCrawler.prototype.init = function(){
    if(fs.existsSync(this.resultDir + this.resultHotelFile)){
	fs.readFileSync(this.resultDir + this.resultHotelFile)
	    .toString()
	    .split('\n')
	    .reduce(function(pre,line){
		if(line && line.trim()){
		    pre[line.split(',')[1]]=null;
		}
		return pre;
	    },this.doneHotel);
    }
    
    var arguments = process.argv.splice(2);
    var start = Number(arguments[0])||0;
    var len = Number(arguments[1])||38019;
    //前闭后开区间

    this.todoHotel = fs.readFileSync(this.dataDir + this.hotelInfoFile)
	.toString()
	.split('\n')
	.slice(start,start+len)
	.map(function(line){
	    var vals = line.trim().split(',');
	    return {
		cityName:vals[0],
		elongId:vals[1],
		elongName:vals[2],
		elongStar:vals[3],
		ctripId:vals[4],
		ctripName:vals[5],
		ctripStar:vals[6],
		ctripPoints:vals[7],
		ctripComment:vals[8],
		ctripAddress:vals[9]
	    };
	})
	.filter(function(hotel){
	    return hotel && !(hotel.elongId in this.doneHotel);
	},this);
    console.log("[INFO] Hotels to do: %d",this.todoHotel.length);
}

WebCrawler.prototype.start = function(){
    this.init();
    this.todoHotel.forEach(function(hotel){
	var q = {"ver":0,
		 "id":hotel.ctripId,
		 "inDay":this.checkindate,
		 "outDay":this.checkoutdate,
		 "contrl":8,
		 "num":1,
		 "flag":512,
		 "sf":2,
		 "pay":0,
		 "membertype":"",
		 "anony":true,
		 "grpInfo":{"code":0},
		 "head":{"cid":"09031061310014703314",
			 "ctok":"",
			 "cver":"1.0",
			 "lang":"01",
			 "sid":"8888",
			 "syscode":"09",
			 "auth":null
			},
		 "contentType":"json"
		};
	
	this.c.queue({
	    uri:'http://m.ctrip.com/restapi/soa2/10324/hotel/product/roomgetv2?_fxpcqlniredt=09031061310014703314',
	    method:'POST',
	    body:JSON.stringify(q),
	    hotel:hotel,
	    jQuery:false
	});
    },this);
    
}

WebCrawler.prototype.processDetail = function(err,result){
    if(err){
	console.log(err);
	return;
    }else{
	if(!result.body){
	    console.log("[ERROR] Content is empty!");
	    return;
	}
	var obj = null;
	try{
	    obj=JSON.parse(result.body);
	}catch(e){
	    console.log('[ERROR] Parsing JSON Object error: %s',e.message);
	    return;
	}
	
	if(obj.ResponseStatus.Errors.length>0){
	    var e = null;
	    while(e = obj.ResponseStatus.Errors.shift()){
		console.log(e);
	    }
	    return ;
	}
	var records = ['']
	, hotel = result.options.hotel;
	obj.rooms.forEach(function(room){
	    var roomName = room.bname.replace(/,/g,';')
	    , bedType = ""
	    , breakfast = ''
	    , lan = "无"
	    , cancel=''
	    , tags=[]
	    , assurance = room.guarantee && room.guarantee.type===1
	    , prePay = room.guarantee && room.guarantee.way===5
	    , price = room.coninfo.conmark?room.coninfo.conprice:room.totalprice[0].amount
	    , rebate = room.coninfo.rcash;
	    
	    //价格是已经计算返现后的
	    room.basicinfos.forEach(function(info){
		switch(info.type){
		case 1:
		    switch(info.value.replace(/\s/g,'').replace('早','')){
		    case "单":
			breakfast = 1;
			break;
		    case "双":
			breakfast = 2;
			break;
		    case "三":
			breakfast = 3;
			break;
		    case "四":
			breakfast = 4;
			break;
		    case "五":
			breakfast = 5;
			break;
		    case "六":
			breakfast = 6;
			break;
		    case "七":
			breakfast = 7;
			break;
		    case "八":
			breakfast = 8;
			break;
		    case "九":
			breakfast = 9;
			break;
		    case "十":
			breakfast = 10;
			break;
		    case "无":
			breakfast = 0;
			break;
		    default:
		    }
		    break;
		case 2:
		    bedType = info.value;
		    break;
		case 3:
		    cancel = info.value;
		    break;
		case 23:
		    lan = info.value;
		    break;
		case 15:
		case 16:
		case 25:
		    tags.push(info.title);
		    break;
		default:
		}
	    });
	    
	    if(room.vendor>0)
		tags.push("代理");
	    
	    records.push([hotel.cityName,hotel.ctripId,hotel.ctripName,roomName,bedType,breakfast,lan,cancel,price,rebate,prePay?'Y':'N',assurance?'Y':'N',tags.join(';')].join());
	},this);
	
	fs.appendFileSync(this.resultDir + this.resultRoomFile, records.join("\n"));
	fs.appendFileSync(this.resultDir + this.resultHotelFile,Object.keys(hotel).map(function(k){return hotel[k];}).join()+'\n');
	console.log("[DATA] %s, %s",hotel.cityName,hotel.ctripName);
    }
}

var that = new WebCrawler();
that.start();
