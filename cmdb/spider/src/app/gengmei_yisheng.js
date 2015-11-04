var fs = require('fs')
var Crawler = require("node-webcrawler")

if(!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  };
}

var url = "http://www.wanmeizhensuo.com/api/experts/?platform=android&province_id=nationwide&lng=116.467429&order_by=0&version=4.2.1&os_version=4.3&app_name=gengmei&section_id=all&hybrid=true&model=Lenovo+S810t&start_num={0}&screen=720x1280&channel=benzhan&lat=39.919778&device_id=864178021678783";

function Gengmei() {
	this.resultFile = "../../result/app/gengmei_yisheng.txt";
	this.crawler = new Crawler({
		maxConnections:10,
		userAgent:"com.wanmeizhensuo.zhensuo/4.2.1 AsyncHttpClient/1.4.5 Android/4.3",
		jQuery:false,
		callback:this.processDoctorInfo,
		onDrain:function(){
			console.log("[INFO] Job done!");
		}
    });
}

Gengmei.prototype.processDoctorInfo = function(error, result) {
	var start_num = result.options.start_num;
	if(error) {
		console.log("[ERROR] error getting doctor info, start_num = ", start_num);
		that.doNext(start_num);
		return;
	}
	try {
		var data = JSON.parse(result.body);
	} catch(e) {
		console.log("[ERROR] error parsing doctor info, start_num = ", start_num);
		that.doNext(start_num);
		return;
	}
	var experts = data.data.experts;
	if(!experts || experts.length == 0) {
		console.log("[INFO] end of data.");
		return;
	}
	var doctors = [];
	experts.forEach(function(expert){
		doctors.push([
			expert.name,
			expert.title,
			expert.hospital.replace(/\s/g, ""),
			expert.department.replace(/\s/g, ""),
			expert.address.replace(/\s/g, ""),
			expert.good_at.replace(/\s/g, ""),
			expert.rate,
			expert.share_amount
			].join("\t"));
	});
	fs.appendFileSync(that.resultFile, doctors.join("\n") + "\n");
	console.log("[INFO] done start_num: ", start_num);
	that.doNext(start_num);
}

Gengmei.prototype.doNext = function(start_num) {
	var start_num = start_num + 100;
	that.crawler.queue({
		start_num:start_num,
		uri:url.format(start_num.toString())
	});
}

Gengmei.prototype.run = function() {
	for(var i = 0; i < 100; i = i + 10) {
		this.crawler.queue({
			start_num:i,
			uri:url.format(i.toString())
		});
	}
}

var that = new Gengmei();
that.run();