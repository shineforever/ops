var fs = require("fs")
var Crawler = require("node-webcrawler")
var entity = require("../../models/entity.js")

if(!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  };
}

function CtripFlight(){
    this.resultDir = "../../result/ota/";
    this.appDir = "../../appdata/";
    this.logDir = "../../log/";
    this.resultFile = "pc_ctrip_flight.txt";
    this.cityFile = "ctrip_flight_hot_city.txt";
    this.logFile = "pc_ctrip_flight_log.txt";
    this.doneFile = "pc_ctrip_done_flight.txt";
    this.departDate = '2015-07-20';
    this.skipFile = "invalidFlights.txt";
    this.cities = [];
    this.citySkip = {};
    this.doneCities = {};	
    this.crawler = new Crawler({
        maxConnections:1,
        userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36",
        // jar:true,
        forceUTF8:true
    });
}

CtripFlight.prototype.init = function(){
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
    console.log(this.todoFlights.length+" flights to do.");
}

CtripFlight.prototype.start = function(){
    this.init();
    this.run();
}

CtripFlight.prototype.run = function() {
	this.initCookie();
}

CtripFlight.prototype.initCookie = function() {
	this.crawler.queue({
		uri:'http://flights.ctrip.com/booking/BJS-SHA-day-1.html',
		jQuery:false,
		callback:function(error, result) {
			if(error) {
				console.log('[ERROR] error initializing cookie.\n[ERROR] Job done with error.');
				return;
			}
			that.wgetFlights();
		}
	})
}

CtripFlight.getAjaxUrl = function(html) {
    var urlReg = /var url = "(.*?)&CK=(.*?)";/g
    var randomReg = /Math\.random\(\)\*10\+'(\d)*?'/g;
    var rReg = /,'([\d\.]*?)'\)/g;
    var urlRegMatch = urlReg.exec(html);
    var url = urlRegMatch[1];
    var ck = urlRegMatch[2];
    var rk = Math.random()*10 + randomReg.exec(html)[1];
    var r = rReg.exec(html)[1];
    // console.log('[Before change]ck=' + ck);
    var funcReg = /var fn=\(function\(u,r,k,t\)\{(var ([\s\S]*?)=\d*,([\s\S]*?)=[\s\S]*?%10;)(?=\(function\(r,u,x,y,t,k\))/g;
    var match = funcReg.exec(html);
    var var1Str = match[2];
    var var2Str = match[3];
    var func = match[1];
    eval(func);
    var x = eval(var1Str);
    var y = eval(var2Str);
    // console.log(var1Str + ' = ' + x);
    // console.log(var2Str + ' = ' + y);
    var split = ck.split('');
    var charToShift = split.splice(y, 1);
    split.splice(x, 0, charToShift);
    ck = split.join('');
    // console.log('[After change]ck=' + ck);
    url = url + '&CK={0}&rk={1}&r={2}'.format(ck, rk, r);
    // url = url + '&CK={0}&rt={1}&r={2}'.format(ck, Math.random()*1000, r);
    // console.log(url);
    return url;
}

CtripFlight.getR = function(n) {
    var u, f, t, r, i, a;
    if (n.DDate1 = n.DDate1.replace(/\//g, "-"), u = Math.ceil(Math.random() * 9), f = n.CK.charCodeAt(u) % 10, f <= 0 && (f = 2), t = "", n.DDate1.length < 10) {
        for (r = n.DDate1.toString().split("-"), i = 0; i < r.length; i++) r[i] && r[i] != "" && (t += r[i].length == 1 ? "0" + r[i] : r[i]);
        t = parseInt(t)
    } else t = parseInt(n.DDate1.replace(/-/g, ""));
    var o = Math.ceil(Math.random() * 89999966 + 1e7),
        t = t * f ^ o,
        e = 6,
        s = t.toString().length;
    e > s && (e = s - 1);
    var h = Math.ceil(Math.random() * e),
        c = h ^ u,
        l = t.toString().split("");
    return l.splice(h, 0, o.toString().split("")), a = l.join("") + u.toString() + c.toString() + c.toString().length, "0." + Math.ceil(Math.random() * 9) + a.toString().replace(/\,/g, "")
}

CtripFlight.buildFormdata = function(query) {
	var result = [];
	Object.keys(query).forEach(function(key){
		result.push(key + "=" + query[key]);
	});
	return result.join("&")
}

CtripFlight.prototype.wgetFlights = function(){
    if(that.todoFlights.length == 0){
	    console.log("All flights done!");
	    return;
    }
    var cur = that.todoFlights.pop();
    that.crawler.queue({
    	uri:'http://flights.ctrip.com/booking/{0}-{1}-day-1.html'.format(cur.dep.code, cur.arr.code),
    	jQuery:false,
    	method:"POST",
    	form:{DDate1:that.departDate},
    	cur:cur,
    	callback:function(error, result) {
    		if(error) {
    			console.log('[ERROR] error getting ajax url for ', result.uri);
    			setTimeout(that.wgetFlights, (Math.random()*30+15)*1000);
    			return;
    		}
    		if(typeof result.body == 'string') {
    			try {
    				var url = CtripFlight.getAjaxUrl(result.body);
    			} catch(e) {
    				console.log('[ERROR] can\'t get ajax url from response hrml, access may be blocked.');
    				return;
    			}
    			that.crawler.queue({
    				uri:url,
    				headers:{
    					'Referer':result.uri,
    					"Cookie":"_bfa=1.{0}.2r3pvd.1.{0}.{0}.1.1; _bfs=1.1; _ga=GA1.2.242762060.{1};".format(new Date().getTime(), Math.ceil(new Date().getTime()/1000))
    				},
    				cur:result.options.cur,
    				callback:that.processFlights
    			});
    		}
    	}
    });
}

CtripFlight.prototype.processFlights = function(error, result, $){
	var cur = result.options.cur;
	if(error) {
		console.log('[ERROR] error getting flight info for {0}-{1}'.format(cur.dep.cname, cur.arr.cname));
		setTimeout(that.wgetFlights, (Math.random()*30+15)*1000);
		return;
	}
	if(typeof result.body == 'string') {
		try {
			var data = JSON.parse(result.body);
		} catch(e) {
			console.log('[ERROR] error parsing flight info for {0}-{1}'.format(cur.dep.cname, cur.arr.cname));
			setTimeout(that.wgetFlights, (Math.random()*30+15)*1000);
			return;
		}
		if(data.Error) {
			console.log('[ERROR] {0}-{1} '.format(cur.dep.cname, cur.arr.cname) + data.Error);
			setTimeout(that.wgetFlights, (Math.random()*30+15)*1000);
			console.log(result.body);
			return;
		}
		var flightResults = [];
		for(var i = 0; i < data.fis.length; i++){
			if(data.fis[i].axp != null) {
				continue;
			}
		    var flight = data.fis[i];
		    var fl = new entity.flight();
		    fl.dname = cur.dep.cname;
		    fl.aname = cur.arr.cname;
		    fl.dTime = flight.dt;
		    fl.aTime = flight.at;
		    fl.flightNo = flight.fn;
		    fl.planeType = flight.cf.c;
		    fl.planeType = fl.planeType && fl.planeType.replace(/[,，]/,';');
		    fl.puncRate = flight.pr+"%";
		    fl.oilFee = flight.of;
		    fl.tax = flight.tax;
		    if(flight.mpc == 0) {
		    	for(var j = 0; j < flight.scs.length; j++){
			        var cb = flight.scs[j];
			        var cabin={};
			        cabin.lv = 'N';
			        cabin.hui = 'N';
			        cabin.tCount = cb.mq==0?"充足":cb.mq;
			        cabin.qian = cb.tgq.edn;//签转条件
			        cabin.qian = cabin.qian && cabin.qian.replace(/[,，]/g,';');
			        cabin.tui = cb.tgq.rfn;//退票条件
			        cabin.tui = cabin.tui && cabin.tui.replace(/[,，]/g,';');
			        cabin.gai = cb.tgq.rrn;//更改条件
			        cabin.gai = cabin.gai && cabin.gai.replace(/[,，]/g,';');
			        cabin.discount = cb.rt;
			        cabin.price = cb.p;
			        cabin.ctype = cb.c=="F"?"头等舱":cb.c=="Y"?"经济舱":cb.c=="C"?"公务舱":"";
			        cabin.fan = cb.ra;
			        cabin.isSpec = cb.inp?"Y":"N";//网络专享价
			        cabin.isAgent = cb.ia?"Y":"N";
			        for(var k = 0; k < cb.ics.length; k++){
				        switch(cb.ics[k].IconType){
					        case "Package":
					            cabin.lv='Y';
					            break;
					        case "StrategyInsurance":
					            cabin.hui='Y';
					            break;
					        default:
					            break;
				        }
			        }
			        fl.cabins.push(cabin);
			    }
		    }
		    flightResults.push(fl);
	    }
	    var uri = result.uri;
	    var reg = /SearchFirstRouteFlights\?(.*)$/g;
	    uri = reg.exec(uri)[1];
	    var params = uri.split("&");
	    var queryStr = params.reduce(function(pre, cur) {
	    	if(cur) {
	    		if(cur.indexOf("rk=") == -1 && cur.indexOf("r=") == -1) {
	    			var split = cur.split("=");
	    			pre[split[0]] = split[1];
	    		}
	    	}
	    	return pre;
	    }, {});
	    queryStr.r = CtripFlight.getR(queryStr);
	    console.log('[INFO] {0}-{1} total flights: {2}'.format(cur.dep.cname, cur.arr.cname, flightResults.length));
	    // setTimeout(that.wgetFlights, (Math.random()*30+15)*1000);
	    // return;
	    that.fillCabins(cur, flightResults, 1, CtripFlight.buildFormdata(queryStr), result.uri);
	}
}

CtripFlight.prototype.fillCabins = function(cur, flightResults, index, queryStr, referer) {
	if(index > flightResults.length) {
		console.log("[INFO] all cabins filled.");
		for(var i = 0; i < flightResults.length; i++) {
			fs.appendFileSync(that.resultDir+that.resultFile, flightResults[i].toString("ctrip_pc"));
		}
		fs.appendFileSync(that.logDir+that.doneFile, cur.dep.cname+"-"+cur.arr.cname+'\n');
		console.log('[INFO] Done {0}-{1}'.format(cur.dep.cname, cur.arr.cname));
		setTimeout(that.wgetFlights, (Math.random()*30+15)*1000);
		return;
	}
	console.log("[INFO] trying to fill cabin for {0}-{1} {2}".format(cur.dep.cname, cur.arr.cname, index));
	if(flightResults[index-1].cabins.length > 0) {
		console.log("[INFO] fill cabin done {0}-{1} {2}".format(cur.dep.cname, cur.arr.cname, index));
		setTimeout(function(){that.fillCabins(cur, flightResults, index+1, queryStr, referer)}, 0);
		return;
	}
	that.crawler.queue({
		uri:"http://flights.ctrip.com/domesticsearch/search/GetFlightAllSubClasses/?" + queryStr,
		jQuery:false,
		method:"POST",
		form:{Flight1:flightResults[index-1].flightNo},
		headers:{'Referer':referer},
		cur:cur,
		flightResults:flightResults,
		index:index,
		queryStr:queryStr,
		referer:referer,
		callback:function(error, result) {
			var cur = result.options.cur;
			var flightResults = result.options.flightResults;
			var index = result.options.index;
			var queryStr = result.options.queryStr;
			var referer = result.options.referer;
			if(error) {
				console.log("[ERROR] error filling cabin for {0}-{1} {2}".format(cur.dep.cname, cur.arr.cname, index));
				setTimeout(function(){that.fillCabins(cur, flightResults, index+1, queryStr, referer)}, (Math.random()*30+15)*1000);
				return;
			}
			if(typeof result.body == "string") {
				try {
					var data = JSON.parse(result.body);
				} catch(e) {
					console.log("[ERROR] error pasring fillcabin result for {0}-{1} {2}".format(cur.dep.cname, cur.arr.cname, index));
					setTimeout(function(){that.fillCabins(cur, flightResults, index+1, queryStr, referer)}, (Math.random()*30+15)*1000);
					return;
				}
				if(data.SubClasses == undefined) {
					// console.log(data);
					setTimeout(function(){that.fillCabins(cur, flightResults, index+1, queryStr, referer)}, (Math.random()*30+15)*1000);
					console.log("[INFO] fill cabin done {0}-{1} {2}".format(cur.dep.cname, cur.arr.cname, index));
					return;
				}
				for(var i = 0; i < data.SubClasses.length; i++) {
					var cb = data.SubClasses[i];
			        var cabin={};
			        cabin.lv = 'N';
			        cabin.hui = 'N';
			        cabin.tCount = cb.mq==0?"充足":cb.mq;
			        cabin.qian = cb.tgq.edn;//签转条件
			        cabin.qian = cabin.qian && cabin.qian.replace(/[,，]/g,';');
			        cabin.tui = cb.tgq.rfn;//退票条件
			        cabin.tui = cabin.tui && cabin.tui.replace(/[,，]/g,';');
			        cabin.gai = cb.tgq.rrn;//更改条件
			        cabin.gai = cabin.gai && cabin.gai.replace(/[,，]/g,';');
			        cabin.discount = cb.rt;
			        cabin.price = cb.p;
			        cabin.ctype = cb.c=="F"?"头等舱":cb.c=="Y"?"经济舱":cb.c=="C"?"公务舱":"";
			        cabin.fan = cb.ra;
			        cabin.isSpec = cb.inp?"Y":"N";//网络专享价
			        cabin.isAgent = cb.ia?"Y":"N";
			        for(var k = 0; k < cb.ics.length; k++){
				        switch(cb.ics[k].IconType){
					        case "Package":
					            cabin.lv='Y';
					            break;
					        case "StrategyInsurance":
					            cabin.hui='Y';
					            break;
					        default:
					            break;
				        }
			        }
			        flightResults[index-1].cabins.push(cabin);
				}
				setTimeout(function(){that.fillCabins(cur, flightResults, index+1, queryStr, referer)}, (Math.random()*30+15)*1000);
				console.log("[INFO] fill cabin done {0}-{1} {2}".format(cur.dep.cname, cur.arr.cname, index));
			}
		}
	});
}

var ct = new CtripFlight();
var that  = ct;
ct.start();

// to judge air + train combination, use data.fis[0].axp is not null
// transfer info will be provided in data.tf
// data.fis[0].mpc !=0 means you have to unfold
// to unfold, post flightNo, and remove rk from ajaxurl query string

