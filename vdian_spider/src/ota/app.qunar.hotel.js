var fs = require('fs')
var moment = require('moment')
var util = require('util')
var EventEmitter = require('events').EventEmitter
var Crawler = require('node-webcrawler')

function WebCrawler(){
    this.today = moment().format("YYYY-MM-DD");
    this.checkindate ="2015-04-30"; //moment().add(7, 'd').format('YYYYMMDD'); 
    this.checkoutdate = "2015-05-01";//moment().add(8, 'd').format('YYYYMMDD'); 
    this.resultDir = "../../result/ota/";
    this.dataDir = "../../appdata/";
    //this.cityFile = "";
    this.resultRoomFile = "app_qunar_room_" + this.today + ".txt";
    this.resultHotelFile = "app_qunar_hotel_" + this.today + ".txt";
    this.hotelInfoFile = "qunarhotels.txt";
    this.todoHotel = [];
    this.doneHotel = Object.create(null);
    this.cityMap = Object.create(null);
    this.c = new Crawler({
	maxConnections:1,
	rateLimits:5000,
	callback:function(err,result,$){
	    that.processDetail(err,result,$);
	},
	onDrain:function(){
	    process.nextTick(function(){that.wgetDetail();});
	},
	jar:true,
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
		qunarId:vals[3],
		qunarName:vals[4],
		qunarZone:vals[5],
		qunarComment:vals[6],
		qunarPoints:vals[7],
		qunarAddress:vals[8]
	    };
	})
	.filter(function(hotel){
	    return hotel && !(hotel.elongId in this.doneHotel);
	},this);
    console.log("[INFO] Hotels to do: %d",this.todoHotel.length);
}

WebCrawler.prototype.start = function(){
    this.init();
    this.wgetDetail();
}

WebCrawler.prototype.wgetDetail = function(){
    var hotel = this.todoHotel.shift();
    if(!hotel){
	console.log("[DONE] All done!");
	return;
    }
    var q = {
	bd_source:'',
	action:'view',
	keywords:'',
	city:hotel.cityName,
	checkInDate:this.checkindate,
	checkOutDate:this.checkoutdate,
	seq:hotel.qunarId,
	location:'',
	type:0,
	isLM:0,
	clickNum:0,
	extra:'%257B%257D'
    }
    this.c.queue({
	uri:'http://touch.qunar.com/h5/hotel/hoteldetail',
	hotel:hotel,
	qs:q
    });
}

WebCrawler.prototype.processDetail = function(err,result,$){
    if(err){
	console.log(err);
	return;
    }else{
	var hotel = result.options.hotel;
	console.log("[DATA] %s, %s", hotel.cityName,hotel.qunarName);
	$("div.roomlist ul > li").each(function(){
	    var q = {
		bd_source:'',
		action:'view',
		keywords:'',
		city:hotel.cityName,
		checkInDate:that.checkindate,
		checkOutDate:that.checkoutdate,
		seq:hotel.qunarId,
		location:'',
		type:0,
		isLM:0,
		clickNum:$("div.li",this).attr("data-click"),
		extra:'%257B%257D',
		lmKey:$("div.li",this).attr("data-key"),
		tpl:'hotel.hotelPriceTpl',
		num:5,
		key:'',
		room:$("div.li",this).attr("data-room"),
		_:new Date().getTime()
	    };
	    //console.log(JSON.stringify(q));
	    that.c.queue({
		uri:'http://touch.qunar.com/h5/hotel/hotelprice',
		callback:function(err,result,$){that.processRoom(err,result,$);},
		qs:q,
		hotel:hotel,
		headers:{
		    "Referer":result.uri
		}
	    });
	});
    }
}

WebCrawler.prototype.processRoom = function(err,result,$){
    var hotel = result.options.hotel
    if(this.c.queueItemSize ===1){
	fs.appendFileSync(this.resultDir+this.resultHotelFile,Object.keys(hotel).map(function(k){return hotel[k];}).join()+"\n");
    }
    if(err){
	console.log(err);
	return;
    }else{
	if($('title').text().indexOf("验证码")){
	    console.log("输入验证码: %s",result.uri);
	}
	var qs = result.options.qs
	, records=[''];
	
	$("ul > li").each(function(){
	    var otaName = $("div.name p span.otaName",this).attr("data-otaname")
	    , price = $(this).attr("data-price")
	    , rebate = $(this).attr("data-oprice")
	    , pay = $("div.op div.tag",this).text().trim().replace(/,/g,'')
	    , pkg = $("div.name p.roomName",this).attr("data-room") && $("div.name p.roomName",this).attr("data-room").trim().replace(/,/g,';');
	    
	    records.push([hotel.cityName,hotel.qunarId,hotel.qunarName,qs.room,otaName,pkg,price,rebate,pay].join());
	});
	
	fs.appendFileSync(this.resultDir+this.resultRoomFile,records.join('\n'));
	console.log("[DATA] %s, %s, %s",hotel.cityName,hotel.qunarName,qs.room);
    }
}

var that = new WebCrawler();
that.start();
