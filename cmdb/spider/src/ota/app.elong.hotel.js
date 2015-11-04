var fs = require('fs')
var moment = require('moment')
var util = require('util')
var EventEmitter = require('events').EventEmitter
var Crawler = require('node-webcrawler')

function ElongHotel(){
    this.today = moment().format("YYYY-MM-DD");
    this.checkindate ="2015-07-30"; //moment().add(7, 'd').format('YYYYMMDD'); 
    this.checkoutdate = "2015-07-31";//moment().add(8, 'd').format('YYYYMMDD'); 
    this.resultDir = "../../result/ota/";
    this.dataDir = "../../appdata/";
    this.cityFile = "elong_hot_city.txt";
    this.resultRoomFile = "app_elong_room_" + this.today + ".txt";
    this.resultHotelFile = "app_elong_hotel_" + this.today + ".txt";
    this.hotelInfoFile = "elonghotels.txt";
    this.todoHotels = [];
    this.doneHotel = Object.create(null);
    this.cityMap = Object.create(null);
    this.c = new Crawler({
	maxConnections:1,
	rateLimits:50,
	callback:function(err,result){
	    that.processSearchResult(err,result);
	},
	onDrain:function(){
	    console.log("[DONE] All done!");
	},
	userAgent:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36'
    });
}

ElongHotel.prototype.init = function(){
    if(!fs.existsSync(this.dataDir + this.cityFile)){
	throw "[ERROR] City file not found!";
    }
    fs.readFileSync(this.dataDir + this.cityFile)
	.toString()
	.split('\n')
	.forEach(function(line){
	    if(line.trim()){
		var matches = line.match(/([a-z]+)(\d+)\s(.+)/);
		if(matches && matches.length>3){
		    this.cityMap[matches[3]]={pinyin:matches[1],id:matches[2],name:matches[3]};
		}
	    }
	},this);

    if(fs.existsSync(this.resultDir + this.resultHotelFile)){
	fs.readFileSync(this.resultDir + this.resultHotelFile).toString().split('\n').reduce(function(pre,line){
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
	    return vals.length===4 && {cityName:vals[0],id:vals[1],name:vals[2],star:vals[3]};
	})
	.filter(function(hotel){
	    if(hotel){
		if(hotel.id in this.doneHotel){
		    return false;
		}
	    }
	    //var city= cityMap[vals[0]];
	    return true;
	},this);
    console.log("[INFO] Hotels to do: %d",this.todoHotel.length);
}

ElongHotel.prototype.start = function(){
    this.init();
    
    this.todoHotel.forEach(function(hotel){
	this.c.queue({
	    uri:'http://m.elong.com/hotel/'+this.cityMap[hotel.cityName]+'/'+hotel.id+'/?checkindate='+this.checkindate+'&checkoutdate='+this.checkoutdate,
	    //headers:{'Referer':hotelUrl},
	    //qs:q,
	    hotel:hotel,
	    callback:function(){
		that.processRoom.apply(that,arguments);
	    }
	});
    },this);

}

ElongHotel.prototype.processRoom = function(err,result,$){
    if(err){
	console.log(err);
	return;
    }else{
	//console.log(result.uri);
	//console.log(result.body);
	if(!$){
	    console.log("[ERROR] Page parse error.");
	    return ;
	}
	var records = ['']
	, hotel = result.options.hotel;
	$("ul.roomlist > li").each(function(){
	    var roomType = $('b.roomname',this).text().trim().replace(/,/g,';')
	    , bf = $("table.addition_info tr",this).eq(2).text().replace(/[\s早含]/g,'')
	    , matches = bf && bf.match(/[\u4e00-\u9fa5]*/)
	    , breakfast = bf && bf[0]
	    , lan = $("table.addition_info tr",this).eq(5).text().replace(/\s/g,'')
	    , bedType = $("table.addition_info tr",this).eq(3).find("span").eq(0).text().replace(/\s/g,'')
	    , prev = $('b.roomname',this).prev('span')
	    , tags = []
	    , priceInfo = $('span.orange',this)
	    , price = priceInfo.contents().not('span.orihotel_price').text().replace(/\s/g,'')
	    , rebate = $('div.orange',this).text().replace(/\s/g,'');
	    
	    while(prev.length){
		var t = prev.text().trim();
		tags.push(t);
		prev = prev.prev("span");
	    }
	    var idx = tags.indexOf('预付');
	    var prepay = (idx>-1&& tags.splice(idx,1) && 'Y') || 'N';
	    
	    idx = tags.indexOf('担保');
	    var assurance = (idx>-1 && tags.splice(idx,1) && 'Y') || 'N';
	    
	    switch(breakfast){
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
	    case "不":
		breakfast = 0;
	    default:
	    }
	    
	    records.push([hotel.cityName,hotel.id,hotel.name,roomType,breakfast,lan,bedType,price,rebate,prepay,assurance,tags.join(';')].join());
	});
	
	fs.appendFileSync(this.resultDir+this.resultRoomFile,records.join('\n'));
	console.log("[DATA] %s, %s", hotel.cityName,hotel.name);
	fs.appendFileSync(this.resultDir + this.resultHotelFile,[hotel.cityName,hotel.id,hotel.name,hotel.star,'\n'].join());
    }
}

var that = new ElongHotel();
that.start();
