var fs = require("fs")
var util = require("util")
var moment = require("moment")
var Crawler = require("node-webcrawler")

var logger = require("winston")
var godotTransport = require("winston-godot")
var godot = require("godot")
var env = process.env.NODE_ENV || "development"

var godotServer = require("../../config.json")[env].godotServer;
var client = godot.createClient(godotServer);
client.connect(godotServer.port);
logger.add(godotTransport, {godot:client, service:"58daojia.yuesao"});

logger.add(logger.transports.File, { filename: '../../log/daojia.yuesao.log' ,logstash:true,level:'info',handleExceptions:true});
logger.cli();

if(env==="production"){
    logger.remove(logger.transports.Console);
}

// Cities where yuesao service is available
var cities = [
    {name:"Beijing",id:"1",localid:"1202"}
    // {name:"Hangzhou",id:"79",localid:"79"},
    // {name:"Chengdu",id:"102",localid:"102"},
    // {name:"Changsha",id:"414",localid:"414"},
    // {name:"Chongqing",id:"37",localid:"37"},
    // {name:"Tianjin",id:"18",localid:"18"},
    // {name:"Xi'an",id:"483",localid:"483"},
    // {name:"Shenzhen",id:"4",localid:"4"},
    // {name:"Guangzhou",id:"3",localid:"3"},
    // {name:"Harbin",id:"202",localid:"202"},
    // {name:"Jinan",id:"265",localid:"265"},
    // {name:"Fuzhou",id:"304",localid:"304"},
    // {name:"Wuhan",id:"158",localid:"158"},
    // {name:"Taiyuan",id:"740",localid:"740"},
    // {name:"Shijiazhuang",id:"241",localid:"241"},
    // {name:"Nanchang",id:"669",localid:"669"},
    // {name:"Shenyang",id:"188",localid:"188"},
    // {name:"Nanjing",id:"172",localid:"172"},
    // {name:"Hefei",id:"837",localid:"837"},
    // {name:"Shanghai",id:"2",localid:"2"}
];

var workermap = {};

function App() {
	this.today = moment().format("YYYY-MM-DD");
	this.orderDate = moment().add(30, "d").format("YYYY-MM-DD")
	this.resultDir = "../../result/app/58daojia.yuesao/";
    this.resultFile = "58daojia.yuesao." + this.today + ".csv";
    this.crawler = new Crawler({
    	maxConnections:5,
        userAgent:"58daojiaandroid",
        jQuery:false
    });
    this.cityLock = 0;
}

App.prototype.init = function() {
	logger.info("Initialization starts.");
	if(!fs.existsSync(this.resultDir)) {
		fs.mkdirSync(this.resultDir);
	}
	fs.writeFileSync(this.resultDir+this.resultFile, "\ufeff城市,姓名,年龄,地域,价格,链接\n");
	logger.info("Initialization completes.");
}

App.prototype.run = function() {
	if(cities.length < 5) {
		for(var i = 0; i < cities.length; i++) {
			++this.cityLock;
			this.doCity(1);
		}
	} else {
		for(var i = 0; i < 5; i++) {
			++this.cityLock;
			this.doCity(1);
		}
	}
}

App.prototype.doCity = function(page, city) {
	if(city == undefined) {
		city = cities.shift();
	}
	if(!city) {
		--that.cityLock;
		if(that.cityLock == 0) {
			logger.info("Job done.");
			client.close();
		}
		return;
	}
	that.crawler.queue({
		uri:"http://jzt2.58.com/api/v24/yuesao/reload",
		city:city,
		page:page,
		form:{
			cityid:city.id,
			page:page,
			price:-1,
			age:-1,
			province:-1,
			servicetime:that.orderDate,
			days:42
		},
		method:"POST",
		callback:function(error, result) {
			var city = result.options.city;
			var page = result.options.page;
			if(error) {
				logger.error("Got error in response, city=%s page=%s", city.name, page);
				setTimeout(function(){
					that.doCity(page, city);
				}, 0);
				return;
			}
			if(result.body.length < 10) {
				logger.info("All pages done for city=", city.name);
				setTimeout(function(){
					that.doCity(1);
				}, 0);
				return;
			}
			var toWrite = [];
			var regex = /<li\s+onclick="chuancanshu\('\d+','.*?','(.*?)','(.*?)','(.*?)','(.*?)','(.*?)'\s,'(.*?)'\)/g;
			var match;
			while(match = regex.exec(result.body)) {
				var name = match[1];
				var price = match[2];
				var age = match[3];
				var area = match[4];
				var unit = match[5];
				var url = decodeURIComponent(match[6]);
				if(workermap[url]) {
					continue;
				} else {
					workermap[url] = true;
					toWrite.push([city.name,name,age,area,price+"/"+unit+"分钟",url].join()+"\n");
				}
			}
			fs.appendFileSync(that.resultDir+that.resultFile, toWrite.join(""));
			logger.info("Got page=%s for city=%s", page, city.name);
			setTimeout(function(){
				that.doCity(page+1, city);
			}, 0);
		}
	});
}

App.prototype.start = function() {
	this.init();
	this.run();
}

var that = new App();
that.start();
