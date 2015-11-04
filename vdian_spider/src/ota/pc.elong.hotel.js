var fs = require('fs')
var cheerio = require('cheerio')
var entity = require('../../models/entity.js')
var Crawler = require('node-webcrawler')
var moment = require('moment')

//basic settings.
var checkindate = "2015/07/30";//moment().add(7, 'd').format('YYYY/MM/DD');//
var checkoutdate = "2015/07/31";//moment().add(8, 'd').format('YYYY/MM/DD');//
var today = moment().format("YYYY-MM-DD");

var level = '';
var resultRoomFile = "../../result/ota/pc_elong_room_"+today+".txt";
var resultHotelFile = "../../result/ota/pc_elong_hotel_"+today+".txt";
var countOfHotelsPerCity=10;
var doneFile = "../../result/ota/pc_elong_done_hotel_"+today+".txt";
var proxyFile = "verified-2-25.txt";
var hotelInfoFile = "../../appdata/elonghotels.txt";

var crawler = new Crawler({
    maxConnections:1,
    rateLimits:1100,
    jar:true,
    userAgent:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36'
});

var pageSize=10;
var doneHotel = Object.create(null);
//get cities
var cityMap = Object.create(null);

fs.readFileSync("../../appdata/elong_hot_city.txt").toString().split('\n').forEach(function(line){
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
	    process.exit(1);
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
	    var roomType = $('dl.left dd a.rpname',this).text().replace(/\s/g,'').replace(/,/g,';')
	    ,wifi = $("dl.left dd.wifi",this).text().trim()||"无";
	    
	    var bedType = $("dl.left > dd",this).eq(1).text().trim();
	    bedType = bedType && bedType.match(/[\u4e00-\u9fa5]+床/);
	    bedType = bedType && bedType[0] || "N/A";
	    //console.log($("dl.right div.infoBox").length);
	    $("div.right div.infoBox").each(function(){
		var pkg = $("p.rpw1",this).text().replace(/\s/g,'').replace(/,/g,';')
		, dis = ''
		//, gift = !!$(' p.rpw1 span.iconLibao',this).length?'Y':'N'
		, breakfast = $(" p.rpw2",this).text().replace(/\s/g,'').replace('早','')
		, cancel = $(" p.rpw3",this).text().trim()
		, price = $(" p.rpw4 span.price",this).text().trim()
		, rebate = $("p.rpw5 span.iconFan",this).attr("data")
		, assurance = !!$(" p.rpw6 span.iconDanbao",this).length?'Y':'N'
		, prePay = !!$(" p.rpw6 span.iconYufu",this).length?'Y':'N'
		, tags = $("p.rpw1 > span",this).map(function(){
		    switch($(this).attr("method").trim()){
			case "gift":
			return "礼包";
			case "save":
			return "省";
			case "tejia":
			return "特价";
			case "flash":
			return (dis=$(this).text().trim())?dis+"折":"抢";
			default:
			return $(this).attr("method");
		    }
		}).get()
		, ratePlanId = $(this).attr("rpid");
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
		case "无":
		    breakfast = 0;
		    break;
		default:
		}
		records.push([cityName,hotelId,hotelName,roomType,wifi,pkg,bedType,breakfast,cancel,price,rebate,assurance,prePay,tags.join(";")].join());
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

function process_one_hotel_info(err,result,$){
    if(err){
	console.log(err);
    }else{
	var prate = $('#headCommentRate div.pertxt_num').data('rate')
	,commentCount = $(".hrela_comt_total a").text().trim()
	,buszone = '"'+$(".hdetail_main > p > span > a").text().trim()+'"'
	,addr = '"'+$(".hdetail_main > p > span").eq(0).contents().filter(function() {
	    return this.nodeType == 3;
	}).text().trim()+'"'
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

