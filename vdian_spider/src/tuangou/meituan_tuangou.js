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
	this.resultFile = "meituan.tuangou." + this.today + ".txt";
	this.breakFile = "meituan.tuangou.break.txt";
	this.appDir = "../../appdata/";
	this.cityFile = "meituan.city.txt";
	this.categoryFile = "meituan.category.qc.txt";
	this.crawler = new Crawler({
		maxConnections:1,
		userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.101 Safari/537.36",
		jar:true
	});
	this.cityList = [];
	this.categoryList = [];
	this.tasks = [];
}

Meituan.prototype.init = function() {
	console.log("[INFO] Initialization starts.");
	if(fs.existsSync(this.resultDir+this.breakFile)) {
		this.tasks = JSON.parse(fs.readFileSync(this.resultDir+this.breakFile).toString());
	} else {
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
				if(split.length == 4 && split[3] == "list") {
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
	}
	console.log("[INFO] Initialization completes.");
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
		jQuery:false,
		callback:function(error, result) {
			try {
				var task = result.options.task;
			} catch(e) {
				console.log("[ERROR] Network error. Job quit.");
				fs.writeFileSync(that.resultDir+that.breakFile, JSON.stringify(that.tasks));
				return;
			}
			if(error) {
				console.log("[ERROR] ", result.uri);
				setTimeout(that.doList, (Math.random()*1+2)*1000);
				return;
			}
			if(result.body.length < 50) {
				console.log("[INFO] %s No such category: %s-%s", task.city, task.mainCategory, task.subCategory);
				setTimeout(that.doList, (Math.random()*1+2)*1000);
				return;
			}
			var match = result.body.match(/poiidList\\":\[(.*?)]/);
			var curpage = Number(task.url.match(/page(\d+)/)[1]);
			if(!match || match[1] == "") {
				console.log("[INFO] %s No shop found: %s-%s page %s", task.city, task.mainCategory, task.subCategory, curpage);
				if(result.body.match(/看不清楚/)) {
					console.log("[WARN] 验证码 needed.");
					fs.writeFileSync(that.resultDir+that.breakFile, JSON.stringify(that.tasks));
					return;
				}
				setTimeout(that.doList, (Math.random()*2+2)*1000);
				return;
			}
			var shopIds = match[1].split(",");
			var toWrite = [];
			shopIds.forEach(function(shopId){
				toWrite.push([task.city,task.mainCategory,task.subCategory,shopId].join("\t"));
			});
			fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join("\n")+"\n");
			console.log("[INFO] %s Found %s shops: %s-%s page %s", task.city, shopIds.length, task.mainCategory, task.subCategory, curpage);
			if(shopIds.length == 80) {
				++curpage;
				task.url = task.url.replace(/page\d+/, "page"+curpage);
				that.tasks.push(task);
			}
			setTimeout(that.doList, (Math.random()*2+2)*1000);
		}
	});
}

Meituan.prototype.start = function() {
	this.init();
	this.run();
}

var that = new Meituan();
that.start();

// The following is code for fetching category info for Meituan.
/**
this.crawler.queue({
		uri:"http://bj.meituan.com/index/navcatelistNew",
		jQuery:false,
		city:city,
		callback:function(error, result) {
			var city = result.options.city;
			if(error) {
				console.log("[ERROR] Error getting category info for ", city.name);
				return;
			}
			var data = JSON.parse(result.body).data;
			var $ = cheerio.load(data);
			var cats = ["美食","休闲娱乐","周边游","旅游","生活服务","购物","丽人"];
			var toWrite = [];
			$(".nav-level2-item").each(function(){
				var text = $(this).children().eq(0).text().trim();
				var index = cats.indexOf(text);
				if(index != -1) {
					console.log(text);
					var mainCategory = cats[index];
					var type;
					if(mainCategory == "周边游" || mainCategory == "旅游" || mainCategory == "购物") {
						type = "detail";
					} else {
						type = "list";
					}
					var hrefs = $("a", this);
					for(var i = 1; i < hrefs.length; i++) {
						var subCategoryEn = hrefs.eq(i).attr("href").match(/category\/(\w+)/)[1];
						var subCategoryCn = hrefs.eq(i).text().trim();
						toWrite.push([mainCategory,subCategoryCn,subCategoryEn,type].join(","));
					}
				}
			});
			fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join("\n"));
			console.log("[INFO] Got");
		}
	});
*/