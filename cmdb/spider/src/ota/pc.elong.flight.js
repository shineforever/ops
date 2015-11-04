var fs = require("fs")
var Crawler = require("node-webcrawler")

if(!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != "undefined" ? args[number] : match;
    });
  };
}

if(!String.prototype.toElongDateFormat) {
	String.prototype.toElongDateFormat = function(dayToAdd) {
		var reg = /(\d{4})-(\d{2})-(\d{2})/g;
		var match = reg.exec(this);
		if(match) {
			var year = match[1];
			var month = match[2].charAt(0) == "0" ? match[2].charAt(1) : match[2];
			var day = match[3].charAt(0) == "0" ? match[3].charAt(1) : match[3];
			if(dayToAdd) {
				day = parseInt(day) + parseInt(dayToAdd);
			}
			return "{0}/{1}/{2} 0:00".format(year, month, day);
		} else {
			reg = /(\d{4})\/(\d*)\/(\d*)/g;
			match = reg.exec(this);
			var year = match[1];
			var month = match[2];
			var day = match[3];
			if(dayToAdd) {
				day = parseInt(day) + parseInt(dayToAdd);
			}
			return "{0}/{1}/{2} 0:00".format(year, month, day);
		}
	}
}

var serialize = function(obj) {
	var str = [];
	for(var key in obj) {
		if(obj.hasOwnProperty(key)) {
			str.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
		}
	}
	return str.join("&");
}

function Query(flight) {
	this._ = new Date().getTime().toString();
	this.PageName = "list";
	this.FlightType = "OneWay";
	this.DepartCity = flight.dep.code;
	this.DepartCityName = flight.dep.cname;
	this.DepartCityNameEn = flight.dep.ename;
	this.ArriveCity = flight.arr.code;
	this.ArriveCityName = flight.arr.cname;
	this.ArriveCityNameEn = flight.arr.ename;
	this.DepartDate = "2015/7/20 0:00";
	this.BackDate = "2015/7/23 0:00";
	this.DayCount = Math.ceil((new Date(this.DepartDate).getTime()-new Date().getTime())/86400000).toString();
	this.BackDayCount = Math.ceil((new Date(this.BackDate).getTime()-new Date().getTime())/86400000).toString();
	this.SeatLevel = "Y";
	this.IssueCity = flight.dep.code;
	this.OrderBy = "Price";
	this.OrderFromId = "50";
	this.AirCorp = "0";
	this.ElongMemberLevel = "Common";
	this.viewpath = "~/views/list/oneway.aspx";
}

function MoreCabinQuery(flightRequest, flightEntity) {
	this.flightNumber = flightEntity.flightNo;
	this.uniquekey = flightEntity.cabins[0].ukey;
	this.arrivecitynameen = flightRequest.arr.ename.toLowerCase();
	this.departcitynameen = flightRequest.dep.ename.toLowerCase();
	this.viewpath = "~/views/list/oneway.aspx";
	this.pagename = "list";
	this.departdate = flightEntity.dTime.toElongDateFormat();
	this["request.PageName"]= "list";
	this["request.FlightType"]= "OneWay";
	this["request.DepartCity"]= flightRequest.dep.code;
	this["request.DepartCityName"]= flightRequest.dep.cname;
	this["request.DepartCityNameEn"]= flightRequest.dep.ename;
	this["request.ArriveCity"]= flightRequest.arr.code;
	this["request.ArriveCityName"]= flightRequest.arr.cname;
	this["request.ArriveCityNameEn"]= flightRequest.arr.ename;
	this["request.DepartDate"]= this.departdate.toElongDateFormat();
	this["request.BackDate"]= this.departdate.toElongDateFormat(3);
	this["request.DayCount"]= Math.ceil((new Date(this["request.DepartDate"]).getTime()-new Date().getTime())/86400000).toString();
	this["request.BackDayCount"]= Math.ceil((new Date(this["request.BackDate"]).getTime()-new Date().getTime())/86400000).toString();
	this["request.SeatLevel"]= "Y";
	this["request.IssueCity"]= flightRequest.dep.code;
	this["request.OrderBy"]= "Price";
	this["request.OrderFromId"]= "50";
	this["request.AirCorp"]= "0";
	this["request.ElongMemberLevel"]= "Common";
	this["request.viewpath"]= "~/views/list/oneway.aspx";
}

function PolicyQuery(flightRequest, flattenedFlightEntity) {
	this.flightNumber = flattenedFlightEntity.flightNo;
	this.uniquekey = flattenedFlightEntity.cabin.ukey;
	this.index = "0";
	this.arrivecitynameen = flightRequest.arr.ename.toLowerCase();
	this.departcitynameen = flightRequest.dep.ename.toLowerCase();
	this.viewpath = "~/views/list/oneway.aspx";
	this.pagename = "list";
	this.departdate = flattenedFlightEntity.dTime.toElongDateFormat();
	this["request.PageName"]= "list";
	this["request.FlightType"]= "OneWay";
	this["request.DepartCity"]= flightRequest.dep.code;
	this["request.DepartCityName"]= flightRequest.dep.cname;
	this["request.DepartCityNameEn"]= flightRequest.dep.ename;
	this["request.ArriveCity"]= flightRequest.arr.code;
	this["request.ArriveCityName"]= flightRequest.arr.cname;
	this["request.ArriveCityNameEn"]= flightRequest.arr.ename;
	this["request.DepartDate"]= this.departdate.toElongDateFormat();
	this["request.BackDate"]= this.departdate.toElongDateFormat(3);
	this["request.DayCount"]= Math.ceil((new Date(this["request.DepartDate"]).getTime()-new Date().getTime())/86400000).toString();
	this["request.BackDayCount"]= Math.ceil((new Date(this["request.BackDate"]).getTime()-new Date().getTime())/86400000).toString();
	this["request.SeatLevel"]= "Y";
	this["request.IssueCity"]= flightRequest.dep.code;
	this["request.OrderBy"]= "Price";
	this["request.OrderFromId"]= "50";
	this["request.AirCorp"]= "0";
	this["request.ElongMemberLevel"]= "Common";
	this["request.viewpath"]= "~/views/list/oneway.aspx";
}

function FlightEntity(mainLeg, flight) {
	this.dcname = flight.dep.cname;
	this.acname = flight.arr.cname;
	this.flightNo = mainLeg.segs[0].fltno;
	this.dPort = mainLeg.segs[0].dport;
	this.dPortName = mainLeg.segs[0].dportn;
	this.dTime = mainLeg.segs[0].dtime;
	this.aPort = mainLeg.segs[0].aport;
	this.aPortName = mainLeg.segs[0].aportn;
	this.aTime = mainLeg.segs[0].atime;
	this.corp = mainLeg.segs[0].corp;
	this.corpName = mainLeg.segs[0].corpn;
	this.plane = mainLeg.segs[0].plane;
	this.fTime = mainLeg.segs[0].ftime;
	this.dTerminal = mainLeg.segs[0].dtml;
	this.aTerminal = mainLeg.segs[0].atml;
	this.tax = mainLeg.segs[0].tax;
	this.meal = mainLeg.segs[0].meat;
	this.cabins = [];
	for(var i = 0; i < mainLeg.cabs.length; i++) {
		var cabin = {};
		cabin.ukey = mainLeg.cabs[i].ukey;
		cabin.name = mainLeg.cabs[i].wname || mainLeg.cabs[i].cname;
		cabin.price = mainLeg.cabs[i].price;
		cabin.ticketLeft = mainLeg.cabs[i].tc == "99" ? "充足" : mainLeg.cabs[i].tc;
		cabin.mile = mainLeg.cabs[i].mil == "" ? "常旅客无里程累积" : "常旅客标准里程 ×{0}%".format(mainLeg.cabs[i].mil);
		cabin.promotion = mainLeg.cabs[i].opmt.length > 0 ? mainLeg.cabs[i].opmt[0].title : "无特殊优惠";
		cabin.promotionPid = mainLeg.cabs[i].opmt.length > 0 ? mainLeg.cabs[i].opmt[0].pid : "N/A";
		this.cabins.push(cabin);
	}
}

FlightEntity.prototype.toString = function() {
	var result = "";
	if(this.cabins.length <= 0) {
		console.log("[ERROR] toString failed: no cabins found.");
		return;
	}
	for(var i = 0; i < this.cabins.length; i++) {
		var buffer = [];
		buffer.push(this.dcname);
		buffer.push(this.acname);
		buffer.push(this.corpName);
		buffer.push(this.flightNo);
		buffer.push(this.plane);
		buffer.push(this.dPortName + this.dTerminal);
		buffer.push(this.dTime);
		buffer.push(this.aPortName + this.aTerminal);
		buffer.push(this.aTime);
		buffer.push(this.meal == "true" ? "有餐食" : "无餐食");
		buffer.push(this.cabins[i].name);
		buffer.push(this.cabins[i].price);
		buffer.push(this.tax);
		buffer.push(this.cabins[i].ticketLeft);
		buffer.push(this.cabins[i].promotion);
		buffer.push(this.cabins[i].mile);
		result = result + buffer.join("\t") + "\n";
	}
	return result;
}

function FlattenedFlightEntity() {
	this.dcname = "";
	this.acname = "";
	this.flightNo = "";
	this.dPort = "";
	this.dPortName = "";
	this.dTime = "";
	this.aPort = "";
	this.aPortName = "";
	this.aTime = "";
	this.corp = "";
	this.corpName = "";
	this.plane = "";
	this.fTime = "";
	this.dTerminal = "";
	this.aTerminal = "";
	this.tax = "";
	this.meal = "";
	this.cabin = {};
}

FlattenedFlightEntity.prototype.toString = function() {
	var result = "";
	var buffer = [];
	buffer.push(this.dcname);
	buffer.push(this.acname);
	buffer.push(this.corpName);
	buffer.push(this.flightNo);
	buffer.push(this.plane);
	buffer.push(this.dPortName + this.dTerminal);
	buffer.push(this.dTime);
	buffer.push(this.aPortName + this.aTerminal);
	buffer.push(this.aTime);
	buffer.push(this.meal == "true" ? "有餐食" : "无餐食");
	buffer.push(this.cabin.name);
	buffer.push(this.cabin.price);
	buffer.push(this.tax);
	buffer.push(this.cabin.ticketLeft);
	buffer.push(this.cabin.promotion);
	buffer.push(this.cabin.mile);
	buffer.push(this.cabin.refundPolicy ? this.cabin.refundPolicy : "Error");
	result = result + buffer.join("\t") + "\n";
	return result;
}

var flatten = function(flightResults) {
	var results = [];
	for(var i = 0; i < flightResults.length; i++) {
		for(var j = 0; j < flightResults[i].cabins.length; j++) {
			var toAdd = new FlattenedFlightEntity();
			toAdd.dcname = flightResults[i].dcname;
			toAdd.acname = flightResults[i].acname;
			toAdd.flightNo = flightResults[i].flightNo;
			toAdd.dPort = flightResults[i].dPort;
			toAdd.dPortName = flightResults[i].dPortName;
			toAdd.dTime = flightResults[i].dTime;
			toAdd.aPort = flightResults[i].aPort;
			toAdd.aPortName = flightResults[i].aPortName;
			toAdd.aTime = flightResults[i].aTime;
			toAdd.corp = flightResults[i].corp;
			toAdd.corpName = flightResults[i].corpName;
			toAdd.plane = flightResults[i].plane;
			toAdd.fTime = flightResults[i].fTime;
			toAdd.dTerminal = flightResults[i].dTerminal;
			toAdd.aTerminal = flightResults[i].aTerminal;
			toAdd.tax = flightResults[i].tax;
			toAdd.meal = flightResults[i].meal;
			toAdd.cabin = flightResults[i].cabins[j];
			results.push(toAdd);
		}
	}
	return results;
}

function ElongFlight() {
	this.resultDir = "../../result/ota/";
	this.resultFile = "pc_elong_flight.txt";
	this.appDir = "../../appdata/";
	this.cityFile = "elong_flight_hot_city.txt";
	this.logDir = "../../log/";
	this.logFile = "pc_elong_flight_log.txt";
	this.doneFile = "pc_elong_done_flight.txt";
	this.skipFile = "invalidFlights.txt";
	this.cities = [];
	this.citySkip = {};
	this.doneCities = {};
	this.Crawler = new Crawler({
		maxConnections:1,
        userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36",
        jar:true,
        forceUTF8:true
	});
}

ElongFlight.prototype.init = function() {
	// this.cities = {code:SHA, cname:上海, ename:Shanghai}
	this.cities = fs.readFileSync(this.appDir + this.cityFile)
						.toString()
						.split('\n')
						.reduce(function(pre, cur){
							if(cur){
								cur = cur.replace('\r', '').split(' ');
								pre.push({code:cur[2],cname:cur[1],ename:cur[0]});
							}
							return pre;
						}, this.cities);
	// this.doneCities = {'上海-北京':true}
	if(fs.existsSync(this.logDir + this.doneFile)){
		this.doneCities = fs.readFileSync(this.logDir + this.doneFile)
							.toString()
							.split('\n')
							.reduce(function(pre, cur){
								if(cur){
									pre[cur] = true;
								}
								return pre;
							}, this.doneCities);
	}
	// this.citySkip = {'上海-北京':true}
    if(fs.existsSync(this.appDir + this.skipFile)){
		fs.readFileSync(this.appDir + this.skipFile)
		    .toString()
		    .split('\n')
		    .reduce(function(pre,cur){
				if(cur){
				    cur = cur.replace('\r','');
				    pre[cur]=true;
				}
				return pre;
		    },this.citySkip);
    }
    var allFlights = [];
    for(var j = 0; j < this.cities.length; j++){
		var dep = this.cities[j];
		for(var k = 0; k < this.cities.length; k++){
	            var arr = this.cities[k];
	            if(k == j || this.doneCities[dep.cname+"-"+arr.cname] || this.citySkip[dep.cname+"-"+arr.cname]){
	            	continue;
	            }
		    allFlights.push({dep:dep,arr:arr});
		}
    }
    var arguments = process.argv.splice(2);
    switch(arguments.length) {
		case 2:
			var left = arguments[0] - 1;
			var right = arguments[1];
			allFlights = allFlights.slice(left, right);
			break;
		default:
			break;
	}
	this.todoFlights = [];
	for(var i = 0; i < allFlights.length; i++) {
		if(that.doneCities[allFlights[i].dep.cname+"-"+allFlights[i].arr.cname]) {
			continue;
		}
		this.todoFlights.push(allFlights[i]);
	}
    console.log(this.todoFlights.length+" flights to do.");
}

ElongFlight.prototype.start = function() {
	this.init();
	this.run();
}

ElongFlight.prototype.run = function() {
	this.wgetFlights();
}

ElongFlight.prototype.wgetFlights = function() {
	if(that.todoFlights.length <= 0) {
		console.log('[INFO] All flights done.\nJob done!');
		return;
	}
	var flight = that.todoFlights.pop();
	that.Crawler.queue({
		uri:"http://flight.elong.com/isajax/OneWay/S?" + serialize(new Query(flight)),
		jQuery:false,
		flight:flight,
		callback:function(error, result) {
			var flightRequest = result.options.flight;
			if(error) {
				console.log('[ERROR] error getting response for {0}-{1}'.format(flight.dep.cname, flight.arr.cname));
				setTimeout(that.wgetFlights, Math.random()*500+1000);
				return;
			}
			if(typeof result.body == 'string') {
				try {
					var data = JSON.parse(result.body);
				} catch(e) {
					console.log('[ERROR] error parsing result for {0}-{1}'.format(flight.dep.cname, flight.arr.cname));
					setTimeout(that.wgetFlights, Math.random()*500+1000);
					return;
				}
				if(!data.success || data.value.IsException) {
					console.log('[ERROR] get failed results for {0}-{1}'.format(flight.dep.cname, flight.arr.cname));
					setTimeout(that.wgetFlights, Math.random()*500+1000);
					return;
				}
				var mainLegs = data.value.MainLegs;
				var flightResults = mainLegs.reduce(function(pre,cur){
					if(cur){
						pre.push(new FlightEntity(cur, flight));
					}
					return pre;
				},[]);
				console.log("[INFO] {0}-{1} total flights: {2}".format(flight.dep.cname, flight.arr.cname, flightResults.length));
				that.fillCabins(flightRequest, flightResults, 1);
			}
		}
	});
}

ElongFlight.prototype.fillCabins = function(flightRequest, flightResults, index) {
	if(index > flightResults.length) {
		console.log("[INFO] all cabins are filled in.");
		flightResults = flatten(flightResults);
		console.log("[INFO] start to get refund policy.")
		console.log("[INFO] {0}-{1} total cabins: {2}".format(flightRequest.dep.cname, flightRequest.arr.cname, flightResults.length));
		setTimeout(function(){that.fillRefundPolicy(flightRequest, flightResults, 1)}, Math.random()*500+1000);
		return;
	}
	var cabinQuery = new MoreCabinQuery(flightRequest, flightResults[index-1]);
	that.Crawler.queue({
		uri:"http://flight.elong.com/isajax/OneWay/GetMorePrices",
		method:"POST",
		form:cabinQuery,
		jQuery:false,
		flightRequest:flightRequest,
		flightResults:flightResults,
		index:index,
		callback:function(error, result) {
			var flightRequest = result.options.flightRequest;
			var flightResults = result.options.flightResults;
			var index = result.options.index;
			if(error) {
				console.log("[ERROR] error filling cabin for {0}-{1} {2}".format(flightRequest.dep.cname, flightRequest.arr.cname, flightResults[index-1].flightNo));
				setTimeout(function(){that.fillCabins(flightRequest, flightResults, index+1)}, Math.random()*500+1000);
				return;
			}
			if(typeof result.body == "string") {
				try {
					var data = JSON.parse(result.body);
				} catch(e) {
					console.log("[ERROR] error parsing more cabin for {0}-{1} {2}".format(flightRequest.dep.cname, flightRequest.arr.cname, flightResults[index-1].flightNo));
					setTimeout(function(){that.fillCabins(flightRequest, flightResults, index+1)}, Math.random()*500+1000);
					return;
				}
				var cabins = data.value.FlightLegList.cabs;
				cabins.forEach(function(cabin){
					var cabinToAdd = {};
					cabinToAdd.ukey = cabin.ukey;
					cabinToAdd.name = cabin.wname || cabin.cname;
					cabinToAdd.price = cabin.price;
					cabinToAdd.ticketLeft = cabin.tc == "99" ? "充足" : cabin.tc;
					cabinToAdd.mile = cabin.mil == "" ? "常旅客无里程累积" : "常旅客标准里程 ×{0}%".format(cabin.mil);
					cabinToAdd.promotion = cabin.opmt.length > 0 ? cabin.opmt[0].title : "无特殊优惠";
					cabinToAdd.promotionPid = cabin.opmt.length > 0 ? cabin.opmt[0].pid : "N/A";
					flightResults[index-1].cabins.push(cabinToAdd);
				});
				setTimeout(function(){that.fillCabins(flightRequest, flightResults, index+1)}, Math.random()*500+1000);
				console.log("[INFO] fill cabin done {0}-{1} {2}".format(flightRequest.dep.cname, flightRequest.arr.cname, index));
			}
		}
	});
}

ElongFlight.prototype.fillRefundPolicy = function(flightRequest, flightResults, index) {
	if(index > flightResults.length) {
		console.log("[INFO] refund policy done.");
		var toWrite = [];
		for(var i = 0; i < flightResults.length; i++) {
			toWrite.push(flightResults[i].toString());
		}
		toWrite = toWrite.join("");
		fs.appendFileSync(that.resultDir+that.resultFile, toWrite);
		fs.appendFileSync(that.logDir+that.doneFile, flightRequest.dep.cname+"-"+flightRequest.arr.cname+"\n");
		setTimeout(that.wgetFlights, Math.random()*500+1000);
		return;
	}
	that.Crawler.queue({
		uri:"http://flight.elong.com/isajax/OneWay/RestrictionRule?" + serialize(new PolicyQuery(flightRequest, flightResults[index-1])),
		jQuery:false,
		flightRequest:flightRequest,
		flightResults:flightResults,
		index:index,
		callback:function(error, result) {
			var flightRequest = result.options.flightRequest;
			var flightResults = result.options.flightResults;
			var index = result.options.index;
			if(error) {
				console.log("[ERROR] error getting refund policy for {0}-{1} {2}".format(flightRequest.dep.cname, flightRequest.arr.cname, index));
				setTimeout(function(){that.fillRefundPolicy(flightRequest, flightResults, index+1)}, Math.random()*500+1000);
				return;
			}
			if(typeof result.body == "string") {
				try {
					var data = JSON.parse(result.body);
				} catch(e) {
					console.log("[ERROR] error parsing refund policy for {0}-{1} {2}".format(flightRequest.dep.cname, flightRequest.arr.cname, index));
					setTimeout(function(){that.fillRefundPolicy(flightRequest, flightResults, index+1)}, Math.random()*500+1000);
					return;
				}
				flightResults[index-1].cabin.refundPolicy = data.value.replace(/<.*?>/g, "").replace(/\s/g, "");
				setTimeout(function(){that.fillRefundPolicy(flightRequest, flightResults, index+1)}, Math.random()*500+1000);
				console.log("[INFO] get refund policy done {0}-{1} {2}".format(flightRequest.dep.cname, flightRequest.arr.cname, index));
			}
		}
	});
}

var that = new ElongFlight();
that.start();
