var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var entity = require('../models/entity.js')

//command args: date,useproxy
var arguments = process.argv.splice(2);
var departDate = arguments[0] || '2014-10-01';
var useproxy = arguments[1]!=undefined;//flag to define if use proxy.
var resultFile = "../result/pc_elong_flight.txt";
var cityFile = '../appdata/qunar_flight_hot_city.txt';
var logFile = "../result/pc_elong_flight_log.txt";
var doneFile = "../result/pc_elong_flight_done.txt";
var cities = helper.get_cities(cityFile);
var doneCities={};
if(useproxy){
  var proxy = new helper.proxy();
  proxy.load("verified-2-25.txt");
  var requestCount=0;
}
//count request count.
function getProxy(){
    requestCount++;
    if(requestCount==5){
	requestCount=0;
	return proxy.getNext();
    }else{
	requestCount++;
	return proxy.cur();
    }
}
var elong_query = function(dcity,acity){
    this.DepartCityNameEn = dcity.pinyin;
    this.ArriveCityNameEn = acity.pinyin;
    this.DepartCityName=dcity.cname;
    this.ArrivalCityName=acity.cname;
    this.DepartCity = dcity.code;
    this.ArriveCity = acity.code;
    this.DepartDate=departDate;
    this.IsReturn="false";
    this.PageIndex = 0;
    this.FlightType='OneWay';
    this.PageName="list";
};

function init(){
    // var exists = fs.existsSync(resultFile);
    // if(exists)
    //   fs.unlinkSync(resultFile);
    doneCities = helper.syncDoneCities(doneFile);
}
var todo=[];
function start(){
    init();
    console.log("program start.")
    for(var j=0;j<cities.length;j++){
	var dep = cities[j];
	for(var k=0;k<cities.length;k++){
            var arr = cities[k];
            if(k==j || doneCities[dep.cname+"-"+arr.cname] || citySkip[dep.cname+'-'+arr.cname]) continue;
	    var eq = new elong_query(dep,arr);
	    var opt = new helper.basic_options('flight.elong.com','/isajax/OneWay/S','GET',false,true,eq);
	    //get flight data from elong.com
//	    opt.agent = false;
//	    helper.request_data(opt,null,elong_fls,[dep.cname,arr.cname]);
            todo.push({dep:dep,arr:arr});
	}
    }
    wget();
}

function wget(){
    if(todo.length==0) {
	console.log("DONE");
	return;
    }
    var cur = todo.pop();
    var dep = cur.dep;
    var arr = cur.arr;
    var eq = new elong_query(dep,arr);
    var opt = new helper.basic_options('flight.elong.com','/isajax/OneWay/S','GET',false,true,eq);
    //get flight data from elong.com
//    opt.agent = false;
    helper.request_data(opt,null,elong_fls,[dep.cname,arr.cname]);
}

var flights = {};
function filterFlightInfo(flightlist,reqQuery){
    for(var i=0;i<flightlist.length;i++){
	var flight = flightlist[i];
	var no = flight.SegmentList[0].FlightNumber;
	var fl=null;
	if(!flights[no]){
	    fl = new entity.flight();
	    fl.dname = reqQuery.DepartCityName;
	    fl.aname = reqQuery.ArrivalCityName;
	    fl.flightNo = no;
	    fl.price = flight.SalePrice;
	    var seg = flight.SegmentList[0];
	    fl.uid = "AirShopping" + seg.FlightNumber + seg.FlightClass + seg.FlightClassType + fl.price;
	    fl.dTime = new Date(Number(flight.SegmentList[0].DepartureTime.match(/\d+/)[0])).toString().match(/\d+:\d+:\d+/)[0];
	    fl.aTime = new Date(Number(flight.SegmentList[0].ArriveTime.match(/\d+/)[0])).toString().match(/\d+:\d+:\d+/)[0];

	    flights[no]=fl;
	} 
	else
	    fl = flights[no];
	
	var cabin = {};
	cabin.ctype = flight.ClassNameAuto;
	cabin.price = flight.SalePrice;
	cabin.tCount = flight.SegmentList[0].TicketCount;
	cabin.fan = flight.ItinerarySupportCoupon;
	cabin.tui = "";
	cabin.gai = "";
	cabin.qian = "";
	
	fl.cabins.push(cabin);

	//request to get tui,gai,qian data.
	/*var query = {
	    "uniqueKey":fl.uid,
	    "flightNums":no,
	    "channel":"AirShopping",
	    "flag":"channel1",
	    "fareid":0,
	    "promotionid":0,
	    "type":0,
	    "flighttype":0,
	    "pagename":"list",
	    "arrivecitynameen":reqQuery.ArriveCityNameEn,
	    "departcitynameen":reqQuery.DepartCityNameEn,
	    "legIndex":0-0,
	    "flightClassType":flight.SegmentList[0].FlightClass,
	    "viewpath":"~/views/list/oneway.aspx",
	    "seatlevel":"Y",
	    "request.PageName":"list",
	    "request.FlightType":"OneWay",
	    "request.DepartCity":reqQuery.DepartCity,
	    "request.DepartCityName":reqQuery.DepartCityName,
	    "request.DepartCityNameEn":reqQuery.DepartCityNameEn,
	    "request.ArriveCity":reqQuery.ArriveCity,
	    "request.ArriveCityName":reqQuery.ArriveCityName,
	    "request.ArriveCityNameEn":reqQuery.ArriveCityNameEn,
	    "request.DepartDate":reqQuery.DepartDate,
	    "request.DayCount":"41",
	    "request.BackDayCount":"0",
	    "request.SeatLevel":"Y",
	    "request.IssueCity":reqQuery.DepartCity,
	    "request.OrderBy":"Price",
	    "request.OrderFromId":"50",
	    "request.AirCorp":"0",
	    "request.ElongMemberLevel":"Common",
	    "request.language":"cn",
	    "request.viewpath":"~/views/list/oneway.aspx"
	};

	for(var k in reqQuery){
	    query['request.'+k]=reqQuery[k];
	}
	var opt = new helper.basic_options('flight.elong.com','/isajax/OneWay/RestrictionRule','GET',false,true,query);
//	opt.agent=false;
	opt.headers["referer"]="http://flight.elong.com/"+reqQuery.DepartCityNameEn+"-"+reqQuery.ArriveCityNameEn+"/cn_day3.html";
	//helper.request_data(opt,null,getRule,[fl,cabin]);
	console.log('GET Rule %s-%s',fl.dname,fl.aname);
	helper.request_data(opt,null,getRule,[fl,cabin]);
	*/
	saveFile([fl]);
    }
}

function saveFile(args){
    fs.appendFileSync(resultFile,args[0].toString("elong_pc",args[0].cabins[0]));
    var id = args[0].dname+"-"+args[0].aname;
    ++doneCities[id].cur;
    console.log(id+" : "+doneCities[id].cur+"/"+doneCities[id].total+" done.");
    if(doneCities[id].cur==doneCities[id].total){
	fs.appendFileSync(doneFile,id+"\r\n");
    }
}

function elong_fls(data,args){
    var id = args[0]+"-"+args[1];
    if(!data||!data.success){
	var info = "there is no data of: "+id;
	console.log(info);
	fs.appendFile(logFile,info+"\r\n",function(err){});
	return;
    }

    var AirCorpList = data.value.AirCorpList;
    var ArriveAirports = data.value.ArriveAirports;
    var DepartAirports = data.value.DepartAirports;
    var FlightLegList = data.value.FlightLegList;
    var RecommendLegList = data.value.RecommendLegList;
    if(!FlightLegList) return;
    if(!doneCities[id]){
	doneCities[id]={};
    }
    doneCities[id].total = FlightLegList.length+RecommendLegList.length;
    doneCities[id].cur = 0;
    console.log(id+" : "+doneCities[id].total);
    filterFlightInfo(FlightLegList,args[2]);
    filterFlightInfo(RecommendLegList,args[2]);
    setTimeout(function(){
	wget();
    },(Math.random()*1+5)*1000);
}

//function saveFile(args){
//    fs.appendFileSync(resultFile,args[0].toString("elong_pc",cabin));
//    var id = args[0].dname+"-"+args[0].aname;
//    ++doneCities[id].cur;
//    console.log(id+" : "+doneCities[id].cur+"/"+doneCities[id].total+" done.");
//    if(doneCities[id].cur==doneCities[id].total){
//        fs.appendFileSync(doneFile,id+"\r\n");
//    }
//}

function getRule(data,args){
    if(!data||!data.success||!data.value){
	console.log("GET Rule Failed.");
	return;
    }

    var vals = data.value.split("<br/>");
    var cabin = args[1];
    try{
	cabin.tui = vals[1]||'';
	cabin.gai = vals[3]||'';
	cabin.qian = vals[5]||'';
    }
    catch(e){
	console.log(e.message+":getRule 130");
    }
    
    fs.appendFile(resultFile,args[0].toString("elong_pc",cabin),function(err){
	if(err) console.log(err.message);
	else{
	    var id = args[0].dname+"-"+args[0].aname;
	    ++doneCities[id].cur;
	    console.log(id+" : "+doneCities[id].cur+"/"+doneCities[id].total+" done.");
	    if(doneCities[id].cur==doneCities[id].total){
		fs.appendFile(doneFile,id+"\r\n",function(err){});
//		wget();
	    }
	}
    });
}

var citySkip = {};
if(fs.existsSync('../appdata/invalidFlights.txt')){
    fs.readFileSync('../appdata/invalidFlights.txt')
	.toString()
	.split('\n')
	.reduce(function(pre,cur){
	    if(cur){
		cur = cur.replace('\r','');
		pre[cur]=true;
	    }
	    return pre;
	},citySkip);
}

start();
