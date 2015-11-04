var fs = require('fs')
var Crawler = require('node-webcrawler')
var moment = require('moment')
var util = require('util')
var EventEmitter = require('events').EventEmitter

function WebCrawler() {
    EventEmitter.call(this);
    this.today = moment().format("YYYY-MM-DD");
    this.checkindate = moment().add(7, 'd').format('YYYY-MM-DD'); //"2015-04-25";
    this.checkoutdate = moment().add(8, 'd').format('YYYY-MM-DD'); //"2015-04-26";
    this.resultDir = "../../result/ota/";
    this.dataDir = "../../appdata/";
    this.resultRoomFile = "pc_qunar_room_" + this.today + ".txt";
    this.resultHotelFile = "pc_qunar_hotel_" + this.today + ".txt";
    this.invalidFile = "qunar_hotel_invalid.txt";
    this.cityFile = "qunar_hotel_city.txt";
    this.elongHotelFile = "elonghotels.txt";
    this.todoHotels = [];
    this.doneHotel = Object.create(null);
    this.invalidHotel = Object.create(null);
    this.cityMap = Object.create(null);
    this.c = new Crawler({
	maxConnections:1,
	rateLimits:3000,
	callback:function(err,result){
	    that.processSearchResult(err,result);
	},
	onDrain:function(){
	    console.log("[DONE] All done!");
	},
	userAgent:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36'
    });
}

util.inherits(WebCrawler,EventEmitter);

WebCrawler.prototype.start = function() {
    
}

WebCrawler.prototype.init = function() {
    var arguments = process.argv.splice(2);
    var start = Number(arguments[0]) || 0;
    var len = Number(arguments[1]) || 50000;

    if (!fs.existsSync(this.dataDir + this.elongHotelFile)) {
        throw "elong hotels file not found";
    }
    
    if(!fs.existsSync(this.dataDir+this.cityFile)){
	throw "elong city file not found";
    }
    
    fs.readFileSync(this.dataDir + this.cityFile)
	.toString()
	.split('\n')
	.reduce(function(pre,line){
	    line = line && line.trim();
	    if(line){
		var vals = line.split(' ');
		var pinyin = vals[0].match(/[a-z_]+/i)[0];
		var name = vals[1];
		pre[name] = {pinyin:pinyin,name:name};
	    }
	    return pre;
	},this.cityMap);
    
    
    if (fs.existsSync(this.resultDir + this.resultHotelFile)){
        fs.readFileSync(this.resultDir + this.resultHotelFile)
            .toString()
            .split('\n')
            .reduce(function(pre, line) {
                line = line && line.trim();
                if (line) {
                    var vals = line.split(',');
                    pre[vals[1]] = null;
                }
                return pre;
            }, this.doneHotel);
    }
    if (fs.existsSync(this.dataDir + this.invalidFile)) {
        fs.readFileSync(this.dataDir + this.invalidFile)
            .toString()
            .split('\n')
            .reduce(function(pre, line) {
                line = line && line.trim();
                if (line) {
                    pre[line.split(',')[1]] = null;
                }
                return pre;
            }, this.invalidHotel);
    }
    
    this.todoHotels = fs.readFileSync(this.dataDir + this.elongHotelFile)
        .toString()
        .split('\n')
        .slice(start, start + len)
        .filter(function(line) {
            line = line && line.trim();
            if (line) {
                var k = line.split(',')[1];
                return !(k in this.invalidHotel) && !(k in this.doneHotel);
            }
	    return false;
        }, this)
	.map(function(l){
	    var kvs = l.split(',');
	    var cityName = kvs[0];
	    var elongId = kvs[1];
	    var hotelName = kvs[2];
	    var elongStar = kvs[3];
	    return {cityName:cityName,hotelName:hotelName,elongId:elongId,elongStar:elongStar};
	});

    console.log("%d hotels to do",this.todoHotels.length);
}

WebCrawler.prototype.search = function() {
    var hotel = null;
    var q ={
	attrs:'0FA456A3,L0F4L3C1,ZO1FcGJH,J6TkcChI,HCEm2cI6,08F7hM4i,8dksuR_,YRHLp-jc,pl6clDL0,HFn32cI6,vf_x4Gjt,2XkzJryU,vNfnYBK6,TDoolO-H,pk4QaDyF,x0oSHP6u,z4VVfNJo,5_VrVbqO,VAuXapLv,U1ur4rJN,px3FxFdF,xaSZV4wU,ZZY89LZZ,ZYCXZYHIRU,sYWEvpo,er8Eevr,HGYGeXFY,ownT_WG6,0Ie44fNU,yYdMIL83,MMObDrW4,dDjWmcqr,Y0LTFGFh,6X7_yoo3,8F2RFLSO,U3rHP23d,cGlja1Vw,7b4bfd15,yamiYIN,6bf51de0',
	showAllCondition:1,
	showBrandInfo:0,
	showNonPrice:0,
	showFullRoom:0,
	showPromotion:0,
	showTopHotel:0,
	showGroupShop:0,
	output:'json1.1',
	v:0.9990942652802914,
	requestTime:new Date().getTime(),
	mixKey:'0e2ecf77a7bef8b10d142977764533111dwlufiG2OLyZH4XQL',
	requestor:'RT_HSLIST',
	cityurl:'',
	q:'',
	fromDate:'2015-04-30',
	toDate:'2015-05-01',
	limit:'0,1',
	filterid:'58716471-c67e-4335-ade8-9c7669b56902_A',
	__jscallback:'getResult'
    }
    
    while(hotel = this.todoHotels.shift()){
	var query = JSON.parse(JSON.stringify(q));
	query.q = hotel.hotelName;
	query.cityurl = this.cityMap[hotel.cityName].pinyin;
	//console.log(q);
	this.c.queue({
	    uri:'http://hotel.qunar.com/render/renderAPIList.jsp',
	    qs:query,
	    elongHotel:hotel
	});
    }
}

function getResult(obj){
    return obj;
}

WebCrawler.prototype.processSearchResult = function(err,result) {
    if(err){
	console.error(err);
	return;
    }else{
	var obj = null;
	try{
	    obj = eval(result.body);
	}catch(e){
	    console.log(e);
	    //console.log(result.body);
	    return;
	}
	if(!obj)
	    return;
	
	//console.log(Object.keys(obj));
	//fs.writeFileSync(this.resultDir+'qunar.2.json',JSON.stringify(obj));
	var hotel = null;
	if(obj.hotels && (hotel=obj.hotels.shift())){
	    if(!hotel.attrs){
		console.log("[WARN] no attributes in result");
	    }
	    var name = hotel.attrs.hotelName
	    ,buszone = hotel.attrs.tradingArea
	    ,addr = '"'+hotel.attrs.hotelAddress+'"'
	    ,commentCount = hotel.attrs.CommentCount
	    ,commentScore = hotel.attrs.CommentScore
	    ,hotelId = hotel.id
	    ,ehotel=result.options.elongHotel;
	    
	    console.log("[DATA] %s, %s",ehotel.cityName,name);
	    
	    fs.appendFile(this.resultDir+this.resultHotelFile,[ehotel.cityName,ehotel.elongId,ehotel.hotelName,hotelId,name,buszone,commentCount,commentScore,addr,"\n"].join(),function(){});
	}
    }
}

var that = new WebCrawler();
that.init();
that.search();
