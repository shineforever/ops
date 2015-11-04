var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')
var http = require("http");
var qs = require("querystring");
var EventEmitter = require('events').EventEmitter;
var Crawler = require('crawler');
var emitter = new EventEmitter();

var Mall = function(){
    this.resultDir = "../../result/auto/";
    this.dataDir = '../../appdata/';
    this.resultFile = "yichemall_"+new Date().toString()+".txt";
    this.resultCityFile = "yichemall_city.txt";
    this.resultItemsFile = "yichemall_items_"+new Date().toString()+".txt";
    this.processFile = "yichemall_progress.txt";
    this.done = {};
    this.curPageIdx = 1;
    this.tasks = [];
    this.items = null;
    this.doneCount = 0;
}

Mall.prototype.init = function(){
    if(fs.existsSync(this.resultDir+this.processFile)){
	//this.curPageIdx = fs.readFileSync(this.resultDir+this.processFile).toString().split('\n');
    }
    //console.log("[INFO] Last page index: %d",this.curPageIdx);
    emitter.on("detaildone",function(){
	that.wgetCities();
    });
}

Mall.prototype.start = function(){
    this.init();
    var arguments = process.argv.splice(2);
    if(arguments[0]=="fromfile"){
	this.wgetDetail();
    }else{
	this.getMaxPage(this.wgetList);
    }
    //this.c.queue("http://www.yichemall.com/car/list");
//    emitter.emit("detaildone");
}

Mall.prototype.getMaxPage = function(fn){
    var host = "www.yichemall.com";
    var path = "/car/list";
    
    var opt = new helper.basic_options(host,path);
    opt.agent = false;
    console.log("[GET ] max page idx...");/*
    helper.request_data(opt,null,function(data,args,res){
	if(!data){
	    console.log("[ERROR] data empty.");
	    return;
	}
	var $ = cheerio.load(data);
	that.maxPage = Number($(".pagin a").last().text());
	
	console.log("[DATA] max page: %d",that.maxPage);
	
    });*/
    this.maxPage = 12;
    for(var i=1;i<=that.maxPage;i++){
	fn.call(that,i);
    }
}

Mall.prototype.wgetList = function(p){
    var host = "www.yichemall.com";
    var path = "/car/list";
    
    var opt = new helper.basic_options(host,path,"GET",false,false,{"p":p});
    opt.agent = myAgent;
    console.log("[GET ] page: %d",p);
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    },p);
}

Mall.prototype.processList = function(data,args,res){
    if(!data){
	console.log("[ERROR] data empty");
	setTimeout(function(){
	    that.wgetList(args[0]);
	},3000);
	return;
    }
    console.log("[DATA] page: %d",args[0]);
    
    var $ = cheerio.load(data);
    $(".list_page ul.pro_main li.mod div.mod-wrap > a").each(function(){
	that.tasks.push($(this).attr("href"));
    });
    this.maxPage--;
    console.log(this.tasks.length);
    if(this.maxPage==0){
	console.log("[DONE] %d items got.",this.tasks.length);
	setTimeout(function(){
	    that.listEnd();
	});
    }
}
var myAgent = new http.Agent();
myAgent.maxSockets = 10000;
Mall.prototype.listEnd = function(){
    this.tasks.map(function(path){
	if(path){
	    return path.match(/\d+/)[0];
	}
    }).forEach(function(id){
	var q=qs.stringify({"modelId": id});
	var opt = new helper.basic_options("www.yichemall.com","/SingleProduct/GetProductList","POST",false,true,q);
	opt.agent = false;//myAgent;
	
	helper.request_data(opt,q,function(data,args){
	    data.Product.forEach(function(item){
		var path = '/car/detail/c_' + item.CarId + '_' + item.CarName;
		fs.appendFileSync(that.resultDir+that.resultItemsFile,path+'\t'+item.CarId+'\t'+item.CarName+'\n');
	    });
	    that.tasks.pop();
	    if(that.tasks.length==0){
		that.wgetDetail();
	    }
	});
    });
}

Mall.prototype.wgetDetail = function(t){
    if(this.items==null){
	this.items=fs.readFileSync(this.resultDir+this.resultItemsFile).toString().split('\n').map(function(line){
	    var vals = line.split('\t');
	    if(vals.length==1){
		var m = vals[0].match(/c_(\d+)_(.+)/);
		if(m){
		    return {path:encodeURIComponent(vals[0]),carid:m[1],carname:m[2]};
		}
	    }else{
		return {path:encodeURIComponent(vals[0]),carid:vals[1],carname:vals[2]};
	    }
	});
	console.log("[INFO] total items: %d",this.items.length);
    }
    if(!t){
	var t = null;
	do{
	    t = this.items.shift();
	}
	while(this.items.length>0 && !t);
	
	if(!t){
	    console.log("[DONE] all detailed pages done.");
	    emitter.emit("detaildone");
	    return;
	}
    }
    
    var opt = new helper.basic_options("www.yichemall.com",t.path);
    opt.agent = myAgent;
    // console.log(opt);
    helper.request_data(opt,null,function(data,args,res){
	that.processDetail(data,args,res);
    },t);
}

Mall.prototype.processDetail = function(data,args,res){
    if(!data){
	console.log("[ERROR] data empty");
	this.wgetDetail();
	return;
    }
    var $ = cheerio.load(data);
    var title = $("h2").attr("title");
    var words = title && title.split(/\s+/);
    var brand,model;
    if(words && words.length>0)
	brand = words[0];
    if(words && words.length>1)
	model = words[1];
    //$("div.mai_infor div.button_orange")
    var config = $("#ProductName").val();
    var sale = $("strong#jinrong0").text().trim();
    sale = sale && sale.replace(/\s*/g,'');
    var mallPrice = $("#MallPrice").text().trim();
    mallPrice = mallPrice && mallPrice.replace(/\s*/g,'');
    var factoryPrice = $("#FactoryPrice").text().trim();
    factoryPrice = factoryPrice && factoryPrice.replace(/\s*/g,'');
    var city = $("#currentCity").text().trim();
    var subtitle = $("#subtitle").text().trim();
    subtitle = subtitle && subtitle.replace(/\s/g,'');
    var r = [args[0].carid,args[0].path,brand,model,config,sale,mallPrice,factoryPrice,subtitle,city].join("\t");
    fs.appendFileSync(this.resultDir+this.resultFile,r+'\n');
    this.doneCount++;
    console.log(this.doneCount);
    this.wgetDetail();
}

Mall.prototype.wgetCities = function(c){
    if(typeof this.listings=='undefined'){
	this.listings = fs.readFileSync(this.resultDir+this.resultFile).toString().split('\n').map(function(line){
	    return line.split("\t")[0];
	});
    }
    if(!c){
	while(this.listings.length>0 && !c){
	    c = this.listings.shift();
	}
	
	if(!c){
	    console.log("job done");
	    return;
	}
    }
    
    var opt = new helper.basic_options("www.yichemall.com","/SingleProduct/GetProvinceByCarId","POST",false,true);
    console.log("[GET] %d",c);
    helper.request_data(opt,"carId="+c,function(data,args,res){
	if(!data){
	    conosle.log("data empty");
	    that.wgetCities(args[0]);
	    return;
	}
	if(typeof data=="string"){
	    data = JSON.parse(data);
	}
	var len = data.Provinces.length;
	var cities=[];
	data.Provinces.forEach(function(province){
	    var o = new helper.basic_options("www.yichemall.com","/SingleProduct/GetCitysByCarIdAndProvinceId","POST",false,true);
	    o.agent = myAgent;
	    helper.request_data(o,qs.stringify({"carId":args[0],"provinceId":province.ProvinceId}),function(data,p){
		--len;
		if(!data){
		    console.log("data empty");
		}else{
		    cities = cities.concat(data.Citys);
		}
		if(len==0){
		    fs.appendFileSync(that.resultDir+that.resultCityFile,p[0]+"\t"+cities.map(function(city){return city.CityName;}).join()+"\n");
		    that.wgetCities();
		}
	    },args[0]);
	});
    },c);
}

var instance = new Mall();
var that = instance;
instance.start();
