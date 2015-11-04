var fs = require("fs")
var cheerio = require("cheerio")
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

function Meituan() {
	this.today = new Date().toString();
	this.resultDir = "../../result/";
	this.resultFile = "meituan.travel." + this.today + ".txt";
	this.breakFile = "meituan.travel.break.txt";
	this.appDir = "../../appdata/";
	this.cityFile = "meituan.city.txt";
	this.categoryFile = "meituan.category.qc.txt";
	this.crawler = new Crawler({
		maxConnections:1,
		userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.101 Safari/537.36"
	});
	this.cityList = [];
	this.categoryList = [];
	this.tasks = [];
}

Meituan.prototype.init = function() {
	console.log("[INFO] Initialization starts.");
	fs.readFileSync(this.appDir+this.cityFile).toString().split("\n").forEach(function(line){
		if(line) {
			var split = line.split(",");
			if(split.length == 2) {
				this.cityList.push({name:split[0],domain:split[1]});
			}
		}
	}, this);
	fs.readFileSync(this.appDir+this.categoryFile).toString().split("\n").forEach(function(line){
		if(line) {
			var split = line.split(",");
			if(split.length == 4 && split[3] == "detail" && split[0] != "购物") {
				this.categoryList.push({main:split[0],sub:split[1],code:split[2]});
			}
		}
	}, this);
	this.cityList.forEach(function(city){
		for(var i = 0; i < this.categoryList.length; i++) {
			var cat = this.categoryList[i];
			this.tasks.push({url:city.domain+"/category/"+cat.code+"/all/page1",mainCategory:cat.main,subCategory:cat.sub,city:city.name});
		}
	}, this);
	console.log("[INFO] Initialization completes.");
	// this.tasks = this.tasks.slice(247,248);
}

Meituan.prototype.run = function() {
	this.doList();
}

Meituan.prototype.doList = function() {
	var task = that.tasks.shift();
	if(!task) {
		console.log("[INFO] Job done.");
		return;
	}
	console.log("[INFO] Task left: ", that.tasks.length);
	that.crawler.queue({
		uri:task.url,
		task:task,
		callback:function(error, result, $) {
			try {
				var task = result.options.task;
			} catch(e) {
				console.log("[ERROR] Network error. Job quit.");
				fs.writeFileSync(that.resultDir+that.breakFile, JSON.stringify(that.tasks));
				return;
			}
			if(error || !$) {
				console.log("[ERROR] ", result.uri);
				setTimeout(that.doList, (Math.random()*1+2)*1000);
				return;
			}
			if(result.body.length < 50) {
				console.log("[INFO] %s No such category: %s-%s", task.city, task.mainCategory, task.subCategory);
				setTimeout(that.doList, (Math.random()*1+2)*1000);
				return;
			}
			var toWrite = [];
			$("div.deal-tile").each(function(){
				var dealId = $(this).children("a").attr("href").match(/deal\/(\d+)\.html/)[1];
				var title = $("h3 a", this).attr("title");
				var sales = $("span.sales strong", this).text();
				var price = $("span.price strong", this).text();
				toWrite.push([task.city,task.mainCategory,task.subCategory,dealId,title,price,sales].join("\t"));
			});
			if(toWrite.length == 0) {
				if(result.body.match(/看不清楚/)) {
					console.log("[WARN] 验证码 needed.");
					fs.writeFileSync(that.resultDir+that.breakFile, JSON.stringify(that.tasks));
				} else {
					setTimeout(that.doList, (Math.random()*3+3)*1000);
				}
				return;
			} else {
				fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join("\n")+"\n");
			}
			var curpage = Number(task.url.match(/page(\d+)/)[1]);
			var asyncIds = result.body.match(/"asyncPageviewData":\{"deals":"(.*?)"\}/)[1].split(",");
			var asyncParams = JSON.parse(result.body.match(/"data":(\{"params":.*?\})\}'/)[1]);
			if(asyncIds.length == 120) {
				++curpage;
				task.url = task.url.replace(/page\d+/, "page"+curpage);
				that.tasks.push(task);
				--curpage;
			}
			var ajaxCount = Math.ceil(asyncIds.length/36) - 1;
			if(ajaxCount > 0) {
				var ajaxTasks = [];
				var domain = task.url.match(/http:\/\/.*meituan\.com/)[0];
				for(var i = 0; i < ajaxCount; i++) {
					ajaxTasks.push({
						url:domain+"/index/deallist",
						formdata:{
							params:JSON.stringify(asyncParams.params),
							geotype:asyncParams.geotype,
							areaid:asyncParams.areaid,
							offset:(i+1)*36,
							dealids:asyncIds.slice((i+1)*36, (i+2)*36).join(",")
						},
						task:task,
						curpage:curpage,
						idcount:asyncIds.length
					});
				}
				setTimeout(function(){that.doAjax(ajaxTasks)}, (Math.random()*2+5)*1000);
				console.log("[INFO] %s %s-%s page %s: %s/%s", task.city, task.mainCategory, task.subCategory, curpage, 36, asyncIds.length);
			} else {
				console.log("[INFO] %s %s-%s page %s: %s/%s", task.city, task.mainCategory, task.subCategory, curpage, asyncIds.length, asyncIds.length);
				setTimeout(that.doList, (Math.random()*2+5)*1000);
			}
		}
	});
}

Meituan.prototype.doAjax = function(ajaxTasks) {
	var ajaxTask = ajaxTasks.shift();
	if(!ajaxTask) {
		setTimeout(that.doList, 0);
		return;
	}
	that.crawler.queue({
		uri:ajaxTask.url,
		method:"POST",
		headers:{
			"X-Requested-With":"XMLHttpRequest",
			"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"
		},
		form:ajaxTask.formdata,
		ajaxTasks:ajaxTasks,
		task:ajaxTask.task,
		curpage:ajaxTask.curpage,
		idcount:ajaxTask.idcount,
		jQeury:false,
		callback:function(error, result) {
			if(error) {
				setTimeout(that.doList, (Math.random()*3+3)*1000);
				return;
			}
			try {
				var task = result.options.task;
				var ajaxTasks = result.options.ajaxTasks;
				var idcount = result.options.idcount;
				var curpage = result.options.curpage;
			} catch(e) {
				console.log("[ERROR] Network error. Job quit.");
				fs.writeFileSync(that.resultDir+that.breakFile, JSON.stringify(that.tasks));
				return;
			}
			var $ = cheerio.load(JSON.parse(result.body).data);
			var toWrite = [];
			$("div.deal-tile").each(function(){
				var dealId = $(this).children("a").attr("href").match(/deal\/(\d+)\.html/)[1];
				var title = $("h3 a", this).attr("title");
				var sales = $("span.sales strong", this).text();
				var price = $("span.price strong", this).text();
				toWrite.push([task.city,task.mainCategory,task.subCategory,dealId,title,price,sales].join("\t"));
			});
			if(toWrite.length == 0) {
				if(result.body.match(/看不清楚/)) {
					console.log("[WARN] 验证码 needed.");
					fs.writeFileSync(that.resultDir+that.breakFile, JSON.stringify(that.tasks));
				} else {
					setTimeout(that.doList, (Math.random()*2+5)*1000);
				}
				return;
			} else {
				fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join("\n")+"\n");
			}
			setTimeout(function(){that.doAjax(ajaxTasks)}, (Math.random()*2+5)*1000);
			console.log("[INFO] %s %s-%s page %s: %s/%s", task.city, task.mainCategory, task.subCategory, curpage, Math.min((Math.ceil(idcount/36)-ajaxTasks.length)*36, idcount), idcount);
		}
	});
}

Meituan.prototype.start = function() {
	this.init();
	this.run();
}

var that = new Meituan();
that.start();
