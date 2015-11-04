var fs = require("fs")
var Crawler = require("node-webcrawler")

if(!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) { 
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

Date.prototype.toString = function() {
    var year = this.getFullYear();
    var month = this.getMonth() + 1;
    var day = this.getDate();
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    return year + "-" + month + "-" + day;
}

function calculateTimeConsumed(start, end) {
    var seconds = Math.floor((end - start)/1000);
    var hour = Math.floor(seconds/3600);
    var minute = Math.floor(seconds/60) % 60;
    var second = seconds % 60;
    return hour + "h" + minute + "m" + second + "s";
}

function fileExists(path) {
	try {
		fs.readFileSync(path);
		return true;
	} catch(e) {
		return false;
	}
}

var appQueryDate = new Date();
appQueryDate.setDate(1);
appQueryDate = appQueryDate.toString();

var category_traffic_title = [
	"Category",
	"CategoryID",
	"Classification",
	"活跃人数(万)",
	"启动次数(万)",
	"使用时长(万小时)",
	"日均活跃人数(万)",
	"日均启动次数(万)",
	"日均访问时长(万小时)",
	"人均单日启动次数(次)",
	"人均单日访问时长(分钟)",
	"日期"
].join("\t") + "\n";

var app_traffic_title = [
	"AppName",
	"AppID",
	"Category",
	"CategoryID",
	"Classification",
	"活跃人数(万)",
	"启动次数(万)",
	"使用时长(万小时)",
	"日均活跃人数(万)",
	"日均启动次数(万)",
	"日均访问时长(万小时)",
	"人均单日启动次数(次)",
	"人均单日访问时长(分钟)",
	"装机量(万)",
	"激活率(%)",
	"渗透率(%)",
	"日期"
].join("\t") + "\n";

var attrMap = {
	item_cover_nums:"活跃人数",
	item_launch_nums:"启动次数",
	item_runtime:"使用时长",
	item_cover_avg_day:"日均活跃人数",
	item_launch_avg_day:"日均启动次数",
	item_runtime_avg_day:"日均访问时长",
	item_launch_avg_person:"人均单日启动次数",
	item_runtime_avg_person:"人均单日访问时长",
	item_install_nums:"装机量",
	item_activity_rate:"激活率",
	item_penetration_rate:"渗透率"
}

var monthList = [
	"2014-01","2014-02","2014-03","2014-04","2014-05","2014-06",
	"2014-07","2014-08","2014-09","2014-10","2014-11","2014-12",
	"2015-01","2015-02","2015-03","2015-04","2015-05","2015-06",
	"2015-07","2015-08","2015-09","2015-10","2015-11","2015-12"
]

var newestMonthSwitch = process.argv.splice(2)[0] || false;

function Eguan() {
	this.today = new Date().toString();
	this.startTime = new Date().getTime();
	this.resultDir = "../../result/eguan/";
	this.categoryResultFile = "eguan_m_category."+this.today+".txt";
	this.appResultFile = "eguan_m_app."+this.today+".txt";
	this.crawler = new Crawler({
		maxConnections:10,
		userAgent:"Mozilla/4.0",
		jar:true
	});
	// [{classification:"", category:"", categoryId:""}]
	this.categoryList = [];
	// [{classification:"", category:"", categoryId:"", appName:"",appId:""}]
	this.appList = [];
}

Eguan.prototype.init = function() {
	console.log("[INFO] initialisation starts.");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdir(this.resultDir);
	}
	if(fileExists(this.resultDir + this.categoryResultFile)) {
		var content = fs.readFileSync(this.resultDir + this.categoryResultFile).toString();
		if(!content) {
			fs.appendFileSync(this.resultDir + this.categoryResultFile, category_traffic_title);
		}
	} else {
		fs.appendFileSync(this.resultDir + this.categoryResultFile, category_traffic_title);
	}
	if(fileExists(this.resultDir + this.appResultFile)) {
		var content = fs.readFileSync(this.resultDir + this.appResultFile).toString();
		if(!content) {
			fs.appendFileSync(this.resultDir + this.appResultFile, app_traffic_title);
		}
	} else {
		fs.appendFileSync(this.resultDir + this.appResultFile, app_traffic_title);
	}
	console.log("[INFO] initialisation completes.");
}

Eguan.prototype.start = function() {
	this.init();
	// login process
	this.crawler.queue({
		uri:"http://124.193.174.219:88/index.php/client_interface/login",
		method:"POST",
		form:{
			ukey_token:"f0cee10d7f0e317ce19fe3958ac81a2fb059ba75",
			pc_token:"9c5e4b98208521fa141281482595bd49",
			password:"5af5c6b148a1d9b3d4fb6bef9397bbb2",
			version:1
		},
		jQuery:false,
		callback:function(error, result) {
			if(error) {
				console.log("[ERROR] login error.\n[INFO] Job done with error.");
				return;
			}
			try {
				var data = JSON.parse(result.body);
				if(!data.status) {
					throw "Error";
				}
			} catch(e) {
				console.log("[ERROR] login error parsing.\n[INFO] Job done with error.");
				return;
			}
			var url = data.return_url;
			that.crawler.queue({
				uri:url,
				jQuery:false,
				callback:function(error, result) {
					if(error) {
						console.log("[ERROR] client_login_ac error.\n[INFO] Job done with error.");
						return;
					}
					console.log("[INFO] login success.\n[INFO] proceed to scraping process.");
					setTimeout(that.run, 0);
				}
			});
		}
	});
}

Eguan.prototype.run = function() {
	that.crawler.queue({
		uri:"http://124.193.174.219:88/mobile",
		callback:function(error, result, $) {
			if(error || !$) {
				console.log("[ERROR] error getting category info.\n[INFO] Job done with error.");
				return;
			}
			try {
				var categoryList = $(".singleHotField");
			} catch(e) {
				console.log("[ERROR] error parsing category info.\n[INFO] Job done with error.");
				return;
			}
			for(var i = 0; i < categoryList.length; i++) {
				var subcategoryList = categoryList.eq(i).find("li");
				for(var j = 0; j < subcategoryList.length; j++) {
					var obj = {};
					obj.classification = categoryList.eq(i).find("span").text();
					obj.category = subcategoryList.eq(j).text();
					obj.categoryId = subcategoryList.eq(j).find("a").attr("href").match(/id=(\d*)/)[1];
					that.categoryList.push(obj);
				}
			}
			that.categoryList.push({classification:"补充", category:"传输工具", categoryId:"69"});
			that.categoryList.push({classification:"补充", category:"打车", categoryId:"70"});
			that.categoryList.push({classification:"补充", category:"驾照", categoryId:"71"});
			that.categoryList.push({classification:"补充", category:"外卖", categoryId:"72"});
			that.categoryList.push({classification:"补充", category:"违章查询", categoryId:"73"});
			that.categoryList.push({classification:"补充", category:"营业厅", categoryId:"74"});
			setTimeout(that.getAppIds, 0);
		}
	});
}

Eguan.prototype.getAppIds = function() {
	var category = that.categoryList.pop();
	if(!category) {
		console.log("[INFO] done getting AppIds.\n[INFO] proceed to get app details.");
		console.log("[INFO] total tasks: ", that.appList.length);
		setTimeout(function(){
			for(var i = 0; i < 10; i++) {
				that.getAppDetail();
			}
		}, 0);
		return;
	}
	that.crawler.queue({
		uri:"http://124.193.174.219:88/mobile/cate_detail?id=" + category.categoryId,
		category:category,
		callback:function(error, result, $) {
			var category = result.options.category;
			if(error || !$) {
				console.log("[ERROR] error getting AppIds: ", result.uri);
				setTimeout(that.getAppIds, 0);
				return;
			}
			var appIdDom = $("#seachList tbody tr");
			if(appIdDom.length == 0) {
				console.log("[ERROR] no appId found: ", result.uri);
				return;
			}
			for(var i = 0; i < appIdDom.length; i++) {
				that.appList.push({
					classification:category.classification,
					category:category.category,
					categoryId:category.categoryId,
					appName:appIdDom.eq(i).find("a").text(),
					appId:appIdDom.eq(i).find(".cancelbox").attr("oid")
				});
			}
			var category_traffic = {
				item_cover_nums:[],
				item_launch_nums:[],
				item_runtime:[],
				item_cover_avg_day:[],
				item_launch_avg_day:[],
				item_runtime_avg_day:[],
				item_launch_avg_person:[],
				item_runtime_avg_person:[]
			};
			var categoryMatch = result.body.match(/data: \[(.*?)]/);
			if(!categoryMatch) {
				console.log("[ERROR] 2015 {0} {1}: 活跃人数 Error.".format(category.classification, category.category));
				setTimeout(that.getAppIds, 0);
				return;
			}
			var data = categoryMatch[1].split(",");
			for(var i = data.length-1; i >= 0; i--) {
				category_traffic.item_cover_nums.push(data[i]);
			}
			console.log("[INFO] 2015 {0} {1}: 活跃人数 Got.".format(category.classification, category.category));
			setTimeout(function(){that.get2015CategoryAttr("item_launch_nums", category_traffic, category)}, 0);
		}
	});
}

Eguan.prototype.getAppDetail = function() {
	var app = that.appList.pop();
	if(!app) {
		console.log("[INFO] done getting AppDetails.\n[INFO] Job done.");
		return;
	}
	var app_traffic = {
		item_cover_nums:[],
		item_launch_nums:[],
		item_runtime:[],
		item_cover_avg_day:[],
		item_launch_avg_day:[],
		item_runtime_avg_day:[],
		item_launch_avg_person:[],
		item_runtime_avg_person:[],
		item_install_nums:[],
		item_activity_rate:[],
		item_penetration_rate:[]
	};
	setTimeout(function(){that.getAppAttr(2015, app, app_traffic, "item_cover_nums")}, 0);
}

Eguan.prototype.getAppAttr = function(year, app, app_traffic, attr) {
	if(attr == "done") {
		if(year == 2015) {
			setTimeout(function(){that.getAppAttr(--year, app, app_traffic, "item_cover_nums")}, 0);
			return;
		}
		if(year == 2014) {
			fs.appendFileSync(this.resultDir + this.appResultFile, Eguan.prototype.buidlAppTraffic(app, app_traffic));
			console.log("[INFO] {0}: done.".format(app.appName));
			console.log("[INFO] tasks left: ", that.appList.length);
			setTimeout(that.getAppDetail, 0);
			return;
		}
	}
	var url;
	switch (year) {
		case 2015:url="http://124.193.174.219:88/mobile/item_detail_ajax?id={0}&key={1}&date_type=month&date_value={2}&profile_type=0&profile_value=0&r=0.8572804365565052".format(app.appId, attr, appQueryDate);break;
		case 2014:url="http://124.193.174.219:88/mobile/item_detail_ajax?id={0}&key={1}&date_type=month&date_value=2014-12-01&profile_type=0&profile_value=0&r=0.2833227885286826".format(app.appId, attr);break;
	}
	that.crawler.queue({
		uri:url,
		jQuery:false,
		app:app,
		app_traffic:app_traffic,
		attr:attr,
		year:year,
		callback:function(error, result) {
			var app = result.options.app;
			var app_traffic = result.options.app_traffic;
			var attr = result.options.attr;
			var year = result.options.year;
			if(error) {
				console.log("[ERROR] {0} {1}: {2} Error.".format(year, app.appName, attrMap[attr]));
				setTimeout(that.getAppDetail, 0);
				return;
			}
			try {
				var data = JSON.parse(result.body);
				data = data.series_data[0].data;
			} catch(e) {
				console.log("[ERROR] {0} {1}: {2} parse Error.".format(year, app.appName, attrMap[attr]));
				setTimeout(that.getAppDetail, 0);
				return;
			}
			for(var i = data.length-1; i >= 0; i--) {
				app_traffic[attr].push(data[i]);
			}
			console.log("[INFO] {0} {1}: {2} Got.".format(year, app.appName, attrMap[attr]));
			var nextAttr;
			switch (attr) {
				case "item_cover_nums": nextAttr = "item_launch_nums";break;
				case "item_launch_nums": nextAttr = "item_runtime";break;
				case "item_runtime": nextAttr = "item_cover_avg_day";break;
				case "item_cover_avg_day": nextAttr = "item_launch_avg_day";break;
				case "item_launch_avg_day": nextAttr = "item_runtime_avg_day";break;
				case "item_runtime_avg_day": nextAttr = "item_launch_avg_person";break;
				case "item_launch_avg_person": nextAttr = "item_runtime_avg_person";break;
				case "item_runtime_avg_person": nextAttr = "item_install_nums";break;
				case "item_install_nums": nextAttr = "item_activity_rate";break;
				case "item_activity_rate": nextAttr = "item_penetration_rate";break;
				default: nextAttr = "done";break;
			}
			setTimeout(function(){that.getAppAttr(year, app, app_traffic, nextAttr)}, 0);
		}
	});
}

Eguan.prototype.get2015CategoryAttr = function(attr, category_traffic, category) {
	if(attr == "done") {
		setTimeout(function(){that.get2014CategoryAttr("item_cover_nums", category_traffic, category)}, 0);
		return;
	}
	that.crawler.queue({
		uri:"http://124.193.174.219:88/mobile/cate_detail?id={0}&type={1}".format(category.categoryId, attr),
		category:category,
		category_traffic:category_traffic,
		attr:attr,
		jQuery:false,
		callback:function(error, result) {
			var category = result.options.category;
			var attr = result.options.attr;
			var category_traffic = result.options.category_traffic;
			if(error) {
				console.log("[ERROR] 2015 {0} {1}: {2} Error.".format(category.classification, category.category, attrMap[attr]));
				setTimeout(that.getAppIds, 0);
				return;
			}
			var match = result.body.match(/data: \[(.*?)]/);
			if(!match) {
				console.log("[ERROR] 2015 {0} {1}: {2} Error.".format(category.classification, category.category, attrMap[attr]));
				setTimeout(that.getAppIds, 0);
				return;
			}
			var data = match[1].split(",");
			for(var i = data.length-1; i >= 0; i--) {
				category_traffic[attr].push(data[i]);
			}
			console.log("[INFO] 2015 {0} {1}: {2} Got.".format(category.classification, category.category, attrMap[attr]));
			var nextAttr;
			switch (attr) {
				case "item_launch_nums": nextAttr = "item_runtime";break;
				case "item_runtime": nextAttr = "item_cover_avg_day";break;
				case "item_cover_avg_day": nextAttr = "item_launch_avg_day";break;
				case "item_launch_avg_day": nextAttr = "item_runtime_avg_day";break;
				case "item_runtime_avg_day": nextAttr = "item_launch_avg_person";break;
				case "item_launch_avg_person": nextAttr = "item_runtime_avg_person";break;
				default: nextAttr = "done";break;
			}
			setTimeout(function(){that.get2015CategoryAttr(nextAttr, category_traffic, category)}, 0);
		}
	});
}

Eguan.prototype.get2014CategoryAttr = function(attr, category_traffic, category) {
	if(attr == "done") {
		fs.appendFileSync(that.resultDir + that.categoryResultFile, Eguan.prototype.buildCategoryTraffic(category, category_traffic));
		setTimeout(that.getAppIds, 0);
		return;
	}
	that.crawler.queue({
		uri:"http://124.193.174.219:88/mobile/cate_detail_ajax?id={0}&key={1}&date_type=month&date_value=2014-12-01&profile_type=0&profile_value=0&r=0.8949660206542678".format(category.categoryId, attr),
		category:category,
		category_traffic:category_traffic,
		attr:attr,
		jQuery:false,
		callback:function(error, result) {
			var category = result.options.category;
			var attr = result.options.attr;
			var category_traffic = result.options.category_traffic;
			if(error) {
				console.log("[ERROR] 2014 {0} {1}: {2} Error.".format(category.classification, category.category, attrMap[attr]));
				setTimeout(that.getAppIds, 0);
				return;
			}
			try {
				var data = JSON.parse(result.body);
				var data = data.series_data[0].data;
			} catch(e) {
				console.log("[ERROR] 2014 {0} {1}: {2} Error.".format(category.classification, category.category, attrMap[attr]));
				setTimeout(that.getAppIds, 0);
				return;
			}
			for(var i = data.length-1; i >= 0; i--) {
				category_traffic[attr].push(data[i]);
			}
			console.log("[INFO] 2014 {0} {1}: {2} Got.".format(category.classification, category.category, attrMap[attr]));
			var nextAttr;
			switch (attr) {
				case "item_cover_nums": nextAttr = "item_launch_nums";break;
				case "item_launch_nums": nextAttr = "item_runtime";break;
				case "item_runtime": nextAttr = "item_cover_avg_day";break;
				case "item_cover_avg_day": nextAttr = "item_launch_avg_day";break;
				case "item_launch_avg_day": nextAttr = "item_runtime_avg_day";break;
				case "item_runtime_avg_day": nextAttr = "item_launch_avg_person";break;
				case "item_launch_avg_person": nextAttr = "item_runtime_avg_person";break;
				default: nextAttr = "done";break;
			}
			setTimeout(function(){that.get2014CategoryAttr(nextAttr, category_traffic, category)}, 0);
		}
	});
}

Eguan.prototype.buildCategoryTraffic = function(category, category_traffic) {
	var result = [];
	var end = newestMonthSwitch ? 1 : category_traffic.item_cover_nums.length
	for(var i = 0; i < end; i++) {
		var temp = [];
		temp.push(category.category);
		temp.push(category.categoryId);
		temp.push(category.classification);
		temp.push(category_traffic.item_cover_nums[i]);
		temp.push(category_traffic.item_launch_nums[i]);
		temp.push(category_traffic.item_runtime[i]);
		temp.push(category_traffic.item_cover_avg_day[i]);
		temp.push(category_traffic.item_launch_avg_day[i]);
		temp.push(category_traffic.item_runtime_avg_day[i]);
		temp.push(category_traffic.item_launch_avg_person[i]);
		temp.push(category_traffic.item_runtime_avg_person[i]);
		temp.push(monthList[category_traffic.item_cover_nums.length-1-i]);
		result.push(temp.join("\t"));
	}
	return result.join("\n") + "\n";
}

Eguan.prototype.buidlAppTraffic = function(app, app_traffic) {
	var result = [];
	var end = newestMonthSwitch ? 1 : app_traffic.item_cover_nums.length;
	for(var i = 0; i < end; i++) {
		var temp = [];
		temp.push(app.appName);
		temp.push(app.appId);
		temp.push(app.category);
		temp.push(app.categoryId);
		temp.push(app.classification);
		temp.push(app_traffic.item_cover_nums[i]);
		temp.push(app_traffic.item_launch_nums[i]);
		temp.push(app_traffic.item_runtime[i]);
		temp.push(app_traffic.item_cover_avg_day[i]);
		temp.push(app_traffic.item_launch_avg_day[i]);
		temp.push(app_traffic.item_runtime_avg_day[i]);
		temp.push(app_traffic.item_launch_avg_person[i]);
		temp.push(app_traffic.item_runtime_avg_person[i]);
		temp.push(app_traffic.item_install_nums[i]);
		temp.push(app_traffic.item_activity_rate[i]);
		temp.push(app_traffic.item_penetration_rate[i]);
		temp.push(monthList[app_traffic.item_cover_nums.length-1-i]);
		result.push(temp.join("\t"));
	}
	return result.join("\n") + "\n";
}

Eguan.prototype.close = function() {
	that.crawler.queue({
		uri:"http://124.193.174.219:88/index.php/client_interface/close",
		jQuery:false,
		method:"POST",
		form:{
			ukey_token:"f0cee10d7f0e317ce19fe3958ac81a2fb059ba75",
			username:"bda_08",
			version:1
		},
		callback:function(error, result) {
			console.log("[INFO] log off success.\n [INFO] Job done.");
		}
	})
}

var that = new Eguan();
that.start();
