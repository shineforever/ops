// departureCity:北京
// arrivalCity:上海
// departureDate:2014-02-28
// returnDate:2014-02-28
// nextNDays:0
// searchType:OneWayFlight
// searchLangs:zh
// locale:zh
// from:qunarindex
// queryID:192.168.18.167:413d2612:1447332e72e:747e
// serverIP:l-tw34.f.cn1/192.168.18.167
// status:1393504645150
// _token:94378
var ref = "http://flight.qunar.com/site/oneway_list.htm?searchDepartureAirport=%E4%B8%8A%E6%B5%B7&searchArrivalAirport=%E5%A4%A7%E8%BF%9E&searchDepartureTime=2014-03-01&searchArrivalTime=2014-03-04&nextNDays=0&startSearch=true&from=fi_dom_search"
var x = {
	"http://www.travelco.com/searchArrivalAirport":"大连",
	"http://www.travelco.com/searchDepartureAirport":"上海",
	"http://www.travelco.com/searchDepartureTime":"2014-03-01",
	"http://www.travelco.com/searchReturnTime":"2014-03-01",
	"locale":"zh",
	"nextNDays":0,
	"searchLangs":"zh",
	"searchType":"OneWayFlight",
	"tags":1,
	"mergeFlag":0,
	"from":"fi_dom_search",
	"_token":90574	
}


var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('./helpers/webhelper.js')
var $ = require('jquery')
var entity = require('./models/entity.js')


//command args: 
var arguments = process.argv.splice(2);
var departDate = arguments[0] || '2014-03-01';
var resultFile = "pc_qunar_flight.txt";
var cityFile = 'qunar_flight_hot_city.txt';
var qunar_query = function(dcity,acity){
  this.departureCity=dcity.cname;
  this.arrivalCity=acity.cname;
  this.departureDate=departDate;
  this.searchType='OneWayFlight';
  this.searchLangs = "zh";
  this.locale = "zh";
  this.from = "qunarindex";
  this.queryID = "192.168.18.167:413d2612:1447332e72e:747e";
  this.serverIP = "l-tw34.f.cn1/192.168.18.167";
  this.status = 1393504645150;
  this._token = 94378;
};

var cities = helper.get_cities(cityFile);
var flights = {};
function start(){
    console.log("program start.");
    for(var i=0;i<cities.length;i++){
	var dep = cities[i];
	for(var j=0;j<cities.length;j++){
	    if(i==j) continue;

	    var arr = cities[j];
	    var q = new qunar_query(dep,arr);
	    var flightsOpt = new helper.basic_options("flight.qunar.com","/twell/flight/OneWayFlight_Info.jsp",'GET',false,true,q);
	    var priceOpt = new helper.basic_options("flight.qunar.com","/twell/flight/tags/deduceonewayflight_groupdata.jsp","GET",false,true,q);
	    flightsOpt.headers["referer"]=ref;
	    priceOpt.headers["referer"] = ref;
	    helper.request_data(flightsOpt,null,fls);
	    helper.request_data(priceOpt,null,groupdata);
	}
    }

}

function fls(data,args){
    if(!data || !data.flightInfo) {
	console.log(args[0].departureCity+"-"+args[0].arrivalCity+" :data of flights invalid.");
	return;
    }
    for(var k in data.flightInfo){
	var f = data.flightInfo[k];
	var fno = k.split('|')[0];
	var id = args[0].dname+args[0].aname+fno;
	var flight;
	if(!flights[id]){
	    flight = new entity.flight();
	    flights[id] = flight;
	}else{
	    flight = flights[id];
	}

	flight.flightNo = fno;
	flight.dTime = f.dt;
	flight.aTime = f.at;
	flight.dname = args[0].departureCity;
	flight.aname = args[0].arrivalCity;

	if(flight.price!==''){
	    fs.appendFile(resultFile,flight.toString("qunar_pc"),function(err){
		if(err) console.log(err.message);
		else{
		    //TODO:
		    console.log(flight.dname+"-"+flight.aname+" : "+flight.flightNo+" done.");
		}
	    });
	}
    }
}

function groupdata(data,args){
    if(!data){
	console.log(args[0].departureCity+"-"+args[0].arrivalCity+" :price of flights invalid.")
	return;
    }
    
    if (data.charAt(0, 1) == "{") {
	data = "(" + data + ")";
    }
    var obj = eval(data);
    
    if(obj&&obj.priceInfo){
	for(var k in obj.priceInfo){
	    var fno = k.split('|')[0];
	    var id = args[0].dname+args[0].aname+fno;
	    var fl = null;
	    if(!flights[id]){
		fl = new entity.flight();
	    }else{
		fl = flights[id];
	    }
	    fl.price = obj.priceInfo[k].lowpr;
	    if(fl.flightNo!==''){
		fs.appendFile(resultFile,fl.toString("qunar_pc"),function(err){
		    if(err) console.log(err.message);
		    else{
			console.log(fl.dname+'-'+fl.aname+" : "+fl.flightNo+" done.");
		    }
		});
	    }
	}
    }
}


start();