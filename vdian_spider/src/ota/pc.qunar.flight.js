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

if(!String.prototype.nextDay) {
	String.prototype.nextDay = function() {
		var array = this.split("-");
		var day = parseInt(array.pop()) + 1;
		day = day < 10 ? "0" + day : day;
		array.push(day);
		return array.join("-");
	}
}

if(!String.prototype.extractNum) {
	String.prototype.extractNum = function() {
		var reg = /\d+/;
		var match = this.match(reg);
		return match[0];
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

var searchDate = "2015-07-20";

function FlightQuery(task) {
	this["http://www.travelco.com/searchArrivalAirport"] = task.arr.cname;
	this["http://www.travelco.com/searchDepartureAirport"] = task.dep.cname;
	this["http://www.travelco.com/searchDepartureTime"] = searchDate;
	this["http://www.travelco.com/searchReturnTime"] = searchDate;
	this.locale = "zh";
	this.nextNDays = "0";
	this.searchLangs = "zh";
	this.searchType = "OneWayFlight";
	this.tags = "1";
	this.mergeFlag = "0";
	this.xd = "f" + new Date().getTime();
	this.from = "fi_re_search";
	this._token = parseInt(Math.random()*100000);
}

function VendorQuery(task, flightNo) {
	this["http://www.travelco.com/searchArrivalAirport"] = task.arr.cname;
	this["http://www.travelco.com/searchDepartureAirport"] = task.dep.cname;
	this["http://www.travelco.com/searchDepartureTime"] = searchDate;
	this["http://www.travelco.com/searchReturnTime"] = searchDate;
	this.locale = "zh";
	this.nextNDays = "0";
	this.searchLangs = "zh";
	this.searchType = "OneWayFlight";
	this.source = "detail";
	this.flightCode = flightNo + "|" + searchDate;
	this.label = "all";
	this.tags = "1";
	this.mergeFlag = "0";
	this.xd = "f" + new Date().getTime();
	this.from = "fi_re_search";
	this._token = parseInt(Math.random()*100000);
}

function FlightEntity(task, flightInfo, carrierInfo, planeInfo, airportInfo) {
	this.dcname = task.dep.cname;
	this.acname = task.arr.cname;
	this.corpname = carrierInfo[flightInfo.ca] || "null";
	this.flightno = flightInfo.co || "null";
	this.planetype = planeInfo[flightInfo.pt] || "null";
	this.dport = airportInfo[flightInfo.da] || "null";
	this.dterminal = flightInfo.t || "null";
	this.ddate = flightInfo.dd || "2015-07-20";
	this.dtime = flightInfo.dt || "00:00";
	this.aport = airportInfo[flightInfo.aa] || "null";
	this.aterminal = flightInfo.arrtower || "null";
	this.atime = flightInfo.at || "00:00";
	this.adate = (this.atime.replace(":","")-this.dtime.replace(":",""))*1<0 ? this.ddate.nextDay() : this.ddate;
	this.vendors = [];
}

FlightEntity.prototype.toString = function() {
	var str = "";
	for(var i = 0; i < this.vendors.length; i++) {
		var result = [];
		result.push(this.dcname);
		result.push(this.acname);
		result.push(this.corpname);
		result.push(this.flightno);
		result.push(this.planetype);
		result.push(this.dport);
		result.push(this.dterminal);
		result.push(this.ddate);
		result.push(this.dtime);
		result.push(this.aport);
		result.push(this.aterminal);
		result.push(this.adate);
		result.push(this.atime);
		result.push(this.vendors[i].name);
		result.push(this.vendors[i].star);
		result.push(this.vendors[i].cabin);
		result.push(this.vendors[i].price);
		result.push(this.vendors[i].tax);
		result.push(this.vendors[i].insurance);
		result.push(this.vendors[i].refundPolicy);
		str = str + result.join("\t") + "\n";
	}
	return str;
}

function QunarFlight() {
	this.resultDir = "../../result/ota/";
	this.resultFile = "pc_qunar_flight.txt";
	this.appDir = "../../appdata/";
	this.cityFile = "elong_flight_hot_city.txt";
	this.logDir = "../../log/";
	this.doneFile = "pc_qunar_done_flight.txt";
	this.skipFile = "invalidFlights.txt";
	this.cities = [];
	this.citySkip = {};
	this.doneCities = {};
	this.crawler = new Crawler({
		maxConnections:1,
        userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36",
        forceUTF8:true
	});
}

QunarFlight.prototype.init = function() {
	// this.cities = {code:SHA, cname:上海, ename:Shanghai}
	fs.readFileSync(this.appDir + this.cityFile)
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
		fs.readFileSync(this.logDir + this.doneFile)
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
	            if(k == j || this.citySkip[dep.cname+"-"+arr.cname]){
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

QunarFlight.getQueryID = function(e) {
	var t = e;
	var n = t.indexOf(":");
	var r = t.substr(0, n + 1);
	var i = t.substring(n + 1).split("");
	var s = [];
	i.forEach(function(e) {
	    s.push(String.fromCharCode(e.charCodeAt(0) - 1))
	})
	s.reverse();
	return r + s.join("")
}

QunarFlight.prototype.start = function() {
	this.init();
	this.run();
}

QunarFlight.prototype.run = function() {
	this.wgetFlights();
}

QunarFlight.prototype.wgetFlights = function() {
	if(that.todoFlights.length <= 0) {
		console.log('[INFO] All flights done.\nJob done!');
		return;
	}
	var task = that.todoFlights.pop();
	that.crawler.queue({
		uri:"http://flight.qunar.com/twell/longwell?&" + serialize(new FlightQuery(task)),
		jQuery:false,
		task:task,
		callback:function(error, result) {
			if(error) {
				console.log("[ERROR] error getting flight info for {0}-{1}".format(task.dep.cname, task.arr.cname));
				setTimeout(that.wgetFlights, (Math.random()*5+3)*1000);
				return;
			}
			if(typeof result.body == "string") {
				var task = result.options.task;
				try {
					var data = JSON.parse(result.body.slice(1,-1));
				} catch(e) {
					console.log("[ERROR] error parsing flight info for {0}-{1}".format(task.dep.cname, task.arr.cname));
					setTimeout(that.wgetFlights, (Math.random()*5+3)*1000);
					return;
				}
				var carrierInfo = Object.keys(data.oneway_data.carrierInfo)
										.reduce(function(pre, cur) {
											if(cur) {
												pre[cur] = data.oneway_data.carrierInfo[cur].full;
											}
											return pre;
										}, {});
				var planeInfo = Object.keys(data.oneway_data.planeInfo)
										.reduce(function(pre, cur) {
											if(cur) {
												pre[cur] = data.oneway_data.planeInfo[cur].full;
											}
											return pre;
										}, {});
				var airportInfo = Object.keys(data.airportInfo)
										.reduce(function(pre, cur) {
											if(cur) {
												Object.keys(data.airportInfo[cur]).forEach(function(key){
													pre[key] = data.airportInfo[cur][key].full;
												});
											}
											return pre;
										}, {});
				var flights = [];
				Object.keys(data.oneway_data.flightInfo).forEach(function(key){
					var flightEntity = new FlightEntity(task, data.oneway_data.flightInfo[key], carrierInfo, planeInfo, airportInfo);
					flights.push(flightEntity);
				});
				console.log("[INFO] {0}-{1} total flights: {2}".format(task.dep.cname, task.arr.cname, flights.length));
				if(flights.length == 0) {
					setTimeout(that.wgetFlights, (Math.random()*5+3)*1000);
					return;	
				}
				that.wgetVendors(task, flights, 1);
			}
		}
	});
}

QunarFlight.prototype.wgetVendors = function(task, flights, index) {
	if(index > flights.length) {
		console.log("[INFO] done with getting vendors for all flights {0}-{1}".format(task.dep.cname, task.arr.cname));
		for(var i = 0; i < flights.length; i++) {
			fs.appendFileSync(that.resultDir+that.resultFile, flights[i].toString());
		}
		fs.appendFileSync(that.logDir+that.doneFile, task.dep.cname+"-"+task.arr.cname+"\n");
		console.log("[INFO] {0}-{1} done".format(task.dep.cname, task.arr.cname));
		setTimeout(that.wgetFlights, (Math.random()*5+3)*1000);
		return;
	}
	that.crawler.queue({
		uri:"http://flight.qunar.com/twell/longwell?&" + serialize(new VendorQuery(task, flights[index-1].flightno)),
		jQuery:false,
		task:task,
		flights:flights,
		index:index,
		callback:function(error, result) {
			var task = result.options.task;
			var flights = result.options.flights;
			var index = result.options.index;
			if(error) {
				console.log("[ERROR] error getting vender info for {0}-{1} {2}".format(task.dep.cname, task.arr.cname, flights[index-1].flightno));
				setTimeout(function(){that.wgetVendors(task, flights, index+1)}, (Math.random()*5+3)*1000);
				return;
			}
			if(typeof result.body == "string") {
				try {
					var data = JSON.parse(result.body.slice(1,-1));
				} catch(e) {
					console.log("[ERROR] error parsing vendor info for {0}-{1} {2}".format(task.dep.cname, task.arr.cname, flights[index-1].flightno));
					setTimeout(function(){that.wgetVendors(task, flights, index+1)}, (Math.random()*5+3)*1000);
					return;
				}
				var vendorInfo = data.vendors;
				var vendorData = data.oneway_data.priceData[Object.keys(data.oneway_data.priceData)[0]];
				var vendors = [];
				Object.keys(vendorData).forEach(function(key){
					try {
						var vendor = {};
						vendor.name = vendorInfo[vendorData[key].wrid].name || "null";
						vendor.star = vendorInfo[vendorData[key].wrid].recommend.star || "null";
						vendor.cabin = vendorData[key].tc || "经济舱";
						var pr = vendorData[key].pr == 0 ? 99999 : vendorData[key].pr;
						var bpr = vendorData[key].bpr == 0 ? 99999 : vendorData[key].bpr;
						var npr = vendorData[key].npr == 0 ? 99999 : vendorData[key].npr;
						vendor.price = Math.min(pr, bpr, npr) || "N/A";
						vendor.tax = vendorData[key].tax || "50";
						vendor.insurance = (vendorData[key].insuranceType == "" ? "0" : vendorData[key].insuranceType.extractNum()) || "null";
						vendor.refundPolicy = vendorData[key].tgq || "退改签规则以航空公司最新规定为准，可咨询客服电话（010-89678151）";
						flights[index-1].vendors.push(vendor);
					} catch(e) {
						
					}
				});
				console.log("[INFO] get vendors done for {0}-{1} {2}".format(task.dep.cname, task.arr.cname, flights[index-1].flightno));
				setTimeout(function(){that.wgetVendors(task, flights, index+1)}, (Math.random()*5+3)*1000);
			}
		}
	});
}

var that = new QunarFlight();
that.start();
