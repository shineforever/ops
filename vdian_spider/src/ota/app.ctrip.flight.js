var fs = require("fs")
var util = require("util")
var Crawler = require("node-webcrawler")

var logger = require("winston")
var env = process.env.NODE_ENV || "development"
logger.add(logger.transports.File, { filename: '../../log/app.ctrip.flight.log' ,logstash:true,level:'info',handleExceptions:true});
logger.cli();
if(env==="production"){
    logger.remove(logger.transports.Console);
}

function FlightQuery(task) {
	var depEnCode = that.cityInfo[task.dep.cname].code;
	var arrEnCode = that.cityInfo[task.arr.cname].code;
	this.RequestId = CtripFlight.prototype.encryptString(depEnCode+"/"+arrEnCode+"/"+"2015/07/20").slice(0, -3);
	this._items = [{
		aAportCode:"",
		aCtyCode:arrEnCode,
		aCtyId:that.cityInfo[task.arr.cname].id,
		acityName:task.arr.cname,
		acityeName:that.cityInfo[task.arr.cname].ename,
		akey:that.cityInfo[task.arr.cname].key,
		dCtyCode:depEnCode,
		dCtyId:that.cityInfo[task.dep.cname].id,
		date:"2015/07/20",
		dcityName:task.dep.cname,
		dcityeName:task.dep.ename,
		dkey:that.cityInfo[task.dep.cname].key
	}];
	this.aScrollTop = "0";
	this.amode = "1";
	this["arrive-orderby"] = "asc";
	this["arrive-sorttype"] = "time";
	this.calendarendtime = "2015/11/23 10:40:00";
	this.class = "0";
	this.dScrollTop = "0";
	this["depart-orderby"] = "asc";
	this["depart-sorttype"] = "time";
	this.dmode = "1";
	this.extendinfo = "";
	this.flag = "0";
	this.fullCabin = "false";
	this.head = {
		auth:"",
		cid:"3c74f480-1fa1-e072-a5af-48f16b23af1b",
		ctok:"351858059049938",
		cver:"1.0",
		lang:"01",
		sid:"8888",
		syscode:"09"
	};
	this.items = [{
		aAportCode:"",
		aCtyCode:arrEnCode,
		aCtyId:that.cityInfo[task.arr.cname].id,
		acityName:task.arr.cname,
		acityeName:that.cityInfo[task.arr.cname].ename,
		akey:that.cityInfo[task.arr.cname].key,
		dCtyCode:depEnCode,
		dCtyId:that.cityInfo[task.dep.cname].id,
		dDportCode:"",
		date:"2015/07/20",
		dcityName:task.dep.cname,
		dcityeName:task.dep.ename,
		dkey:that.cityInfo[task.dep.cname].key
	}];
	this.pageIdx = "1";
	this.params = [];
	this.passengerType = "1";
	this.searchitem = [{
		accode:arrEnCode,
		dccode:depEnCode,
		dtime:"/Date(1438876800000-0000)/"
	}];
	this.seat = "0";
	this.submittime = new Date().getTime();
	this.tabtype = "1";
	this.ticketIssueCty = depEnCode;
	this.tofltintl = "0";
	this.tripType = "1";
	this.triptype = "1";
	this.trptpe = "1";
	this.ver = "0";
}

function PolicyQuery(policyItem) {
	this.flag = "0";
	this.head = {
		auth:"",
		cid:"3c74f480-1fa1-e072-a5af-48f16b23af1b",
		ctok:"351858059049938",
		cver:"1.0",
		lang:"01",
		sid:"8888",
		syscode:"09"
	};
	this.polid = "0";
	this.prdid = policyItem.pid;
	this.triptype = 1;
	this.ver = 0;
}

function FlightEntity(flightItem, task) {
	this.dcname = task.dep.cname;
	this.acname = task.arr.cname;
	this.flightNo = flightItem.mutilstn[0].basinfo.flgno;
	this.dPort = flightItem.mutilstn[0].dportinfo.aportsname + flightItem.mutilstn[0].dportinfo.bsname;
	this.dTime = flightItem.mutilstn[0].dateinfo.ddate;
	this.aPort = flightItem.mutilstn[0].aportinfo.aportsname + flightItem.mutilstn[0].aportinfo.bsname;
	this.aTime = flightItem.mutilstn[0].dateinfo.adate;
	this.corpName = flightItem.mutilstn[0].basinfo.airsname;
	this.plane = flightItem.mutilstn[0].craftinfo.cname + flightItem.mutilstn[0].craftinfo.craft;
	this.policyInfos = [];
	for(var i = 0; i < flightItem.policyinfo.length; i++) {
		var policy = flightItem.policyinfo[i];
		if(policy.flag == 1024) {
			continue;
		}
		var policyInfo = {};
		policyInfo.price = policy.tprice;
		policyInfo.pid = policy.pid;
		this.policyInfos.push(policyInfo);
	}
}

FlightEntity.prototype.toString = function() {
	var result = "";
	if(this.policyInfos.length <= 0) {
		console.log("[ERROR] toString failed: no policy found.");
		return;
	}
	for(var i = 0; i < this.policyInfos.length; i++) {
		if(!this.policyInfos[i].totalPrice) {
			continue;
		}
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
		buffer.push(this.policyInfos[i].totalPrice);
		buffer.push(this.policyInfos[i].price);
		buffer.push(this.policyInfos[i].tax);
		buffer.push(this.policyInfos[i].insurance);
		buffer.push(this.policyInfos[i].refund);
		buffer.push(this.policyInfos[i].changePolicy);
		buffer.push(this.policyInfos[i].alter);
		result = result + buffer.join("\t") + "\n";
	}
	return result;
}

function CtripFlight(){
    this.resultDir = "../../result/ota/";
    this.appDir = "../../appdata/";
    this.logDir = "../../log/";
    this.resultFile = "app_ctrip_flight.txt";
    this.cityFile = "ctrip_flight_hot_city.txt";
    this.cityInfoFile = "ctrip_app_flight_city_info.txt";
    this.logFile = "app_ctrip_flight_log.txt";
    this.doneFile = "app_ctrip_done_flight.txt";
    this.skipFile = "invalidFlights.txt";
    this.cities = [];
    this.citySkip = {};
    this.doneCities = {};
    this.cityInfo = {};
    this.crawler = new Crawler({
        maxConnections:1,
        userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36",
        jar:true,
        forceUTF8:true
    });
}

CtripFlight.prototype.generateGUID = function() {
	return (CtripFlight._S4() + CtripFlight._S4() + "-" + CtripFlight._S4() + "-" + CtripFlight._S4() + "-" + CtripFlight._S4() + "-" + CtripFlight._S4() + CtripFlight._S4() + CtripFlight._S4());
}

CtripFlight.prototype._S4 = function() {
	return (((1 + Math.random()) * 65536) | 0).toString(16).substring(1);
}

CtripFlight.prototype.encryptString = function(str, t) {
	void 0 === t && (t = 19901206);
    for (var n = str.length, r = new Array(n--), i = str.charCodeAt(0), s = ~t, o = 0; n >= o; o++)
        r[o] = String.fromCharCode(~((str.charCodeAt(o) & s | (o === n ? i : str.charCodeAt(o + 1)) & t) ^ ~(o + n)));
    return r.join("")
}

CtripFlight.prototype.init = function() {
	this.cities = fs.readFileSync(this.appDir + this.cityFile)
						.toString()
						.split('\n')
						.reduce(function(pre, cur){
							if(cur){
								cur = cur.replace('\r', '').split(' ');
								pre.push({code:cur[2],cname:cur[1]});
							}
							return pre;
						}, this.cities);
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
    var jsonObj = JSON.parse(fs.readFileSync(this.appDir+this.cityInfoFile).toString()).cities;
    for(var i = 0; i < jsonObj.length; i++) {
    	if(this.cityInfo[jsonObj[i].name] && jsonObj[i].weight == 9999) {
    		continue;
    	}
    	this.cityInfo[jsonObj[i].name] = jsonObj[i];
    }
    console.log(this.todoFlights.length+" flights to do.");
    if(!fs.existsSync(this.resultDir)) {
    	fs.mkdirSync(this.resultDir);
    }
}

CtripFlight.prototype.start = function(){
    this.init();
    this.run();
}

CtripFlight.prototype.run = function() {
	this.wgetFlights();
}

CtripFlight.prototype.wgetFlights = function() {
	if(that.todoFlights.length <= 0) {
		console.log('[INFO] All flights done.\nJob done!');
		return;
	}
	var task = that.todoFlights.pop();
	console.log(task.dep.cname + "-" + task.arr.cname);
	that.crawler.queue({
		uri:"http://m.ctrip.com/restapi/soa2/10400/Flight/Domestic/ListV2/Search",
		body:JSON.stringify(new FlightQuery(task)),
		method:"POST",
		jQuery:false,
		task:task,
		callback:function(error, result) {
			if(error) {
				logger.error("Error getting flight info for %s-%s", task.dep.cname, task.arr.cname);
				setTimeout(that.wgetFlights, (Math.random()*15 + 30)*1000);
				return;
			}
			if(typeof result.body == "string") {
				try {
					var data = JSON.parse(result.body);
				} catch(e) {
					logger.error("Error parsing flight info for %s-%s", task.dep.cname, task.arr.cname);
					setTimeout(that.wgetFlights, (Math.random()*15 + 30)*1000);
					return;
				}
				var flights = [];
				for(var i = 0; i < data.fltitem.length; i++) {
					flights.push(new FlightEntity(data.fltitem[i], task));
				}
				logger.info("%s-%s total flights: %s", task.dep.cname, task.arr.cname, flights.length);
				that.wgetPolicy(task, flights, 1);
			}
		}
	});
}

CtripFlight.prototype.wgetPolicy = function(task, flights, index) {
	if(index > flights.length) {
		logger.info("Policy info done for %s-%s", task.dep.cname, task.arr.cname);
		var toWrite = [];
		for(var i = 0; i < flights.length; i++) {
			toWrite.push(flights[i].toString());
		}
		toWrite = toWrite.join("");
		fs.appendFileSync(that.resultDir+that.resultFile, toWrite);
		fs.appendFileSync(that.logDir+that.doneFile, task.dep.cname+"-"+task.arr.cname+"\n");
		logger.info("%s-%s done.", task.dep.cname, task.arr.cname);
		setTimeout(that.wgetFlights, (Math.random()*15 + 30)*1000);
		return;
	}
	logger.info("%s-%s %s total number of policy info: %s", task.dep.cname, task.arr.cname, flights[index-1].flightNo, flights[index-1].policyInfos.length);
	that.fillPolicy(task, flights, index, 1);
}

CtripFlight.prototype.fillPolicy = function(task, flights, index, policyIndex) {
	if(policyIndex > flights[index-1].policyInfos.length) {
		logger.info("Policy info done for %s-%s %s", task.dep.cname, task.arr.cname, flights[index-1].flightNo);
		setTimeout(function(){that.wgetPolicy(task, flights, index+1)}, (Math.random()*15 + 30)*1000);
		return;
	}
	that.crawler.queue({
		uri:"http://m.ctrip.com/restapi/soa2/10400/Flight/Domestic/FlightDetailV2/Query",
		body:JSON.stringify(new PolicyQuery(flights[index-1].policyInfos[policyIndex-1])),
		method:"POST",
		jQuery:false,
		task:task,
		flights:flights,
		index:index,
		policyIndex:policyIndex,
		callback:function(error, result) {
			var task = result.options.task;
			var flights = result.options.flights;
			var index = result.options.index;
			var policyIndex = result.options.policyIndex;
			if(error) {
				logger.error("Error filling policy for %s-%s %s %s", task.dep.cname, task.arr.cname, flights[index-1].flightNo, policyIndex);
				setTimeout(function(){that.fillPolicy(task, flights, index, policyIndex+1)}, (Math.random()*5 + 5)*1000);
				return;
			}
			if(typeof result.body == "string") {
				try {
					var data = JSON.parse(result.body);
					flights[index-1].policyInfos[policyIndex-1].tax = data.pols[0].prices[0].tax || 50;
					flights[index-1].policyInfos[policyIndex-1].insurance = data.pols[0].pkginfo[0].price || 20;
					flights[index-1].policyInfos[policyIndex-1].totalPrice = flights[index-1].policyInfos[policyIndex-1].price + flights[index-1].policyInfos[policyIndex-1].tax + flights[index-1].policyInfos[policyIndex-1].insurance;
					flights[index-1].policyInfos[policyIndex-1].refund = data.pols[0].frinfo[0].refnote || "refundPolicy error";
					flights[index-1].policyInfos[policyIndex-1].changePolicy = data.pols[0].frinfo[0].rer || "modifyPolicy error";
					flights[index-1].policyInfos[policyIndex-1].alter = data.pols[0].frinfo[0].end || "alterPolicy error";
				} catch(e) {
					logger.error("Error parsing flight info for %s-%s %s %s", task.dep.cname, task.arr.cname, flights[index-1].flightNo, policyIndex);
					setTimeout(function(){that.fillPolicy(task, flights, index, policyIndex+1)}, (Math.random()*5 + 5)*1000);
					return;
				}
				logger.info("Done %s-%s %s %s", task.dep.cname, task.arr.cname, flights[index-1].flightNo, policyIndex);
				setTimeout(function(){that.fillPolicy(task, flights, index, policyIndex+1)}, (Math.random()*5 + 5)*1000);
			}
		}
	});
}

var that = new CtripFlight();
that.start();
