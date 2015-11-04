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

if(!Date.prototype.toDateFormat) {
	Date.prototype.toDateFormat = function() {
		var year = this.getFullYear();
		var month = this.getMonth()*1 < 10 ? "0" + (this.getMonth()+1) : this.getMonth() + 1;
		var day = this.getDate();
		return "" + year + "-" + month + "-" + day;
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

var depDate = "2015-07-20";

// url = http://m.elong.com/flight/list?
function FlightQuery(task) {
	this.ver = "635616053946249161";
	this.departCityCode = task.dep.code;
	this.arrivalCityCode = task.arr.code;
	this.departDate = depDate;
	this.todayDate = new Date().toDateFormat();
	this.returnDate = depDate;
	this.ClassType = "";
	this.flyType = "1";
	this.IsReturn = "false";
}

// url = http://m.elong.com/Flight/beijing-shanghai-MU5108.html?
function CabinQuery(task, flight) {
	this.departDate = depDate;
	this.departCityCode = task.dep.code;
	this.arrivalCityCode = task.arr.code;
	this.todayDate = new Date().toDateFormat();
	this.classType = "null";
	this.flyType = "1";
	this.returnDate = depDate;
	this.isReturn = "false";
	this.flightNumbers = flight.flightNo;
}

function FlightEntity(task, flightJQuery) {
	this.dcname = task.dep.cname;
	this.acname = task.arr.cname;
	var ticket = flightJQuery.find(".ticket").text().trim().split(" ");
	this.flightNo = ticket[0].match(/[\w\d]+/)[0];
	this.dPort = flightJQuery.find(".start-station").text().trim();
	this.dTime = flightJQuery.find(".start-time").text().trim();
	this.aPort = flightJQuery.find(".end-station").text().trim();
	this.aTime = flightJQuery.find(".end-time").text().trim();
	this.corpName = ticket[0].match(/^.*?(?=[\w\d])/)[0];
	this.plane = ticket[1] || "null";
	this.cabins = [];
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
		buffer.push(this.dPort);
		buffer.push(this.dTime);
		buffer.push(this.aPort);
		buffer.push(this.aTime);
		buffer.push(this.cabins[i].name);
		buffer.push(this.cabins[i].totalPrice);
		buffer.push(this.cabins[i].price);
		buffer.push(this.cabins[i].tax);
		// buffer.push(this.cabins[i].discount);
		// buffer.push(this.cabins[i].ticketLeft);
		buffer.push(this.cabins[i].refundPolicy);
		buffer.push(this.cabins[i].changePolicy);
		result = result + buffer.join("\t") + "\n";
	}
	return result;
}

function ElongFlight() {
	this.resultDir = "../../result/ota/";
	this.resultFile = "app_elong_flight.txt";
	this.appDir = "../../appdata/";
	this.cityFile = "elong_flight_hot_city.txt";
	this.logDir = "../../log/";
	this.logFile = "app_elong_flight_log.txt";
	this.doneFile = "app_elong_done_flight.txt";
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
	var task = that.todoFlights.pop();
	console.log(task.dep.cname + "-" + task.arr.cname);
	that.crawler.queue({
		uri:"http://m.elong.com/flight/list/?" + serialize(new FlightQuery(task)),
		task:task,
		callback:function(error, result, $) {
			var task = result.options.task;
			if(error) {
				console.log("[ERROR] error getting flight info for {0}-{1}".format(task.dep.cname, task.arr.cname));
				setTimeout(that.wgetFlights, Math.random()*500+1000);
				return;
			}
			if(typeof result.body == "string") {
				var flights = [];
				try {
					var flightListJQuery = $(".flight-list ul.list li");
					for(var i = 0; i < flightListJQuery.length; i++) {
						flights.push(new FlightEntity(task, flightListJQuery.eq(i)));
					}
				} catch(e) {
					console.log("[ERROR] error parsing flight info, this may due to the change of Dom structure");
					setTimeout(that.wgetFlights, Math.random()*500+1000);
					return;
				}
				console.log("[INFO] {0}-{1} total flights: {2}".format(task.dep.cname, task.arr.cname, flights.length));
				that.fillCabins(task, flights, 1);
			}
		}
	});
}

ElongFlight.prototype.fillCabins = function(task, flights, index) {
	if(index > flights.length) {
		console.log("[INFO] all cabins filled for {0}-{1}".format(task.dep.cname, task.arr.cname));
		var toWrite = [];
		for(var i = 0; i < flights.length; i++) {
			toWrite.push(flights[i].toString());
		}
		fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join(""));
		fs.appendFileSync(that.logDir+that.doneFile, task.dep.cname + "-" + task.arr.cname + "\n");
		setTimeout(that.wgetFlights, Math.random()*500+1000);
		return;
	}
	that.crawler.queue({
		uri:"http://m.elong.com/flight/detail.html?" + serialize(new CabinQuery(task, flights[index-1])),
		task:task,
		flights:flights,
		index:index,
		callback:function(error, result, $) {
			var task = result.options.task;
			var flights = result.options.flights;
			var index = result.options.index;
			if(error) {
				console.log("[ERROR] error getting cabin info for {0}-{1} {2}".format(task.dep.cname, task.arr.cname, flights[index-1].flightNo));
				setTimeout(function(){that.fillCabins(task, flights, index+1)}, Math.random()*500+1000);
				return;
			}
			if(typeof result.body == "string") {
				try {
					var flightDetailListJQuery = $(".flight-detail li");
					for(var i = 0; i < flightDetailListJQuery.length; i++) {
						var cabin = {};
						var detail = flightDetailListJQuery.eq(i);
						cabin.name = detail.find(".cabin-name").text().trim();
						cabin.totalPrice = detail.find(".cabin-back.schedule").attr("totalprice").trim();
						cabin.price = detail.find(".cabin-back.schedule").attr("itemprice").trim();
						cabin.tax = detail.find(".cabin-back.schedule").attr("itemalltax").trim();
						// cabin.discount = detail.find(".order-place").attr("discount").trim();
						// cabin.ticketLeft = detail.find(".order-place").attr("ticketnum").trim();
						cabin.refundPolicy = detail.find(".cabin-back.schedule").attr("returnregulate").trim();
						cabin.changePolicy = detail.find(".cabin-back.schedule").attr("changeregulate").trim();
						flights[index-1].cabins.push(cabin);
					}
				} catch(e) {
					console.log("[ERROR] error parsing cabin info for {0}-{1} {2}".format(task.dep.cname, task.arr.cname, flights[index-1].flightNo));
					setTimeout(function(){that.fillCabins(task, flights, index+1)}, Math.random()*500+1000);
					return;
				}
				setTimeout(function(){that.fillCabins(task, flights, index+1)}, Math.random()*500+1000);
				console.log("[INFO] fill cabins done for {0}-{1} {2}".format(task.dep.cname, task.arr.cname, flights[index-1].flightNo));
			}
		}
	});
}

var that = new ElongFlight();
that.start();