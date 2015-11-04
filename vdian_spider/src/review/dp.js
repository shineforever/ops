var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../../helpers/webhelper.js')

function Dp(){
    this.resultDir = "../../result/";
    this.dataDir = "../../appdata/";
    this.resultFile = "dp.txt";
    //this.doneFile = "yelp_done_item.txt";
    this.cityFile = "dp_city.txt";
    this.categoryFile = "dp_categories.txt";
    this.cities = [];
    
    this.categories = [];
    this.taskQueue = [];
    this.interval = [0,500];
    this.doneItems = {};
}

Dp.prototype.init = function(){
    var doneCount = 0;

    var args = process.argv.slice(2);
    if(args.length>0){
	this.startIdx = args[0];
    }
    if(args.length>1){
	this.count = args[1];
    }
    
    this.cities = fs.readFileSync(this.dataDir+this.cityFile).toString().split('\n').filter(function(line){
	return line;
    }).map(function(line){
	var vals = line.split(',');
	return {id:vals[0],name:vals[1],code:vals[2]};
    });
    this.categories = fs.readFileSync(this.dataDir+this.categoryFile).toString().split('\n').filter(function(line){
	return line;
    }).map(function(line){
	var vals = line.split(',');
	return {id:vals[0],name:vals[1]};
    });
    if(!fs.existsSync(this.resultDir+this.resultFile)){
	console.log("[DONE COUNT] %d",doneCount);
	return;
    }
    fs.readFileSync(this.resultDir+this.resultFile).toString().split('\n').map(function(line){
	if(line){
	    return line.split(',')[3];
	}
	return "";
    }).reduce(function(pre,cur){
	pre[cur]=true;
	++doneCount;
	return pre;
    },this.doneItems);
    console.log("[DONE COUNT] %d",doneCount);
    console.log("[CITIES] %d",this.cities.length);
    console.log("[CATEGORIES] %d",this.categories.length);
}

Dp.prototype.start = function(){
    this.init();
    for(var i=0;i<this.cities.length;i++){
	for(var j=0;j<this.categories.length;j++){
	    if(this.cities[i] && this.categories[j])
		this.taskQueue.push({city:this.cities[i],cate:this.categories[j]});
	}
    }
    this.startIdx = Number(this.startIdx) || 0;
    this.count = Number(this.count) || this.taskQueue.length;
    this.taskQueue = this.taskQueue.slice(this.startIdx,this.startIdx+this.count);
    console.log("[TASKS] %d",this.taskQueue.length);
    
    this.wgetList();
}
Dp.prototype.wgetList = function(t){
    if(!t){
	t = this.taskQueue.shift();
	t.pageIdx = 1;
	t.shopCount=-1;
	t.reviews = 0;
	t.shops = [];
	t.photoCount = 0;
    }
    var id = t.cate.id;
    t.onlyList = id==55||id==70||id==90;
    t.isHotel = id==60;
    var path = '/search/category/'+t.city.id+'/'+t.cate.id+'/p'+t.pageIdx;
    if(t.isHotel){
	path = "/"+t.city.code+"/hotel/p"+t.pageIdx;
    }
    var opt = new helper.basic_options('www.dianping.com',path);
    console.log(opt);
    console.log("[GET] %s,%s: %d/%d",t.city.name,t.cate.name,t.pageIdx,Math.ceil(t.shopCount/15));
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    },t);
}

Dp.prototype.processList = function(data,args,res){
    if(res.statusCode==403){
	console.log("IP has been forbidden");
	return;
    }
    if(!data){
	console.log("data empty");
	return;
    }

    var $ = cheerio.load(data);
    if(args[0].shopCount==-1){
	var m;
	if(args[0].onlyList){
	    if(args[0].cate.id!=55){
		m = Number($("div.searchNav div.guide span.Color7").text().trim().match(/\d+/)[0]);
	    }else{
		m=0;
		$("ul.navBlock li ul.current li ul li a span.num").each(function(){
		    var match = $(this).text().match(/\d+/);
		    if(match && match[0]){
			m += Number(match[0]);
		    }
		});
	    }
	    //console.log($("div.searchNav div.guide").html());
	    //m = Number($("div.Pages a.PageLink").last().attr('title'));
	}else if(args[0].isHotel){
	    m = Number($(".search-wrap .section .inner .tit span").text().match(/\d+/)[0]);
	}else{
	    //console.log($("div.bread").html());
	    m = Number($("div.bread span.num").text().trim().match(/\d+/)[0]);
	}
	
	args[0].shopCount = m;
	args[0].pageCount = Math.min(Math.ceil(m/15),50);
    }
    var itemSelector;
    if(args[0].onlyList){
	itemSelector = "div.searchList dl dd ul.remark";
	$("div.searchList dl dd").each(function(){
	    var links = $("ul.remark li a",this);
	    var shop = {};
	    if(links.length>0){
		var m = links.eq(0).text().match(/\d+/);
		if(m && m[0]){
		    shop.reviews = Number(m[0]);
		}else{
		    shop.reviews = 0;
		}
	    }
	    if(links.length>1){
		var m = links.eq(1).text().match(/\d+/);
		if(m && m[0]){
		    shop.photoCount = Number(m[0]);
		}else{
		    shop.photoCount = 0;
		}
	    }
	    shop.path = $("ul.detail li.shopname a").attr("href");
	    if(!that.doneItems[shop.path]){
		var record = [args[0].city.name,args[0].cate.name,args[0].shopCount,shop.path,shop.reviews,shop.photoCount,'\n'].join();
		fs.appendFileSync(that.resultDir+that.resultFile,record);
		console.log("[DONE] ",record);
	    }
	    args[0].reviews+=shop.reviews;
	    args[0].photoCount+=shop.photoCount;
	    args[0].shops.push(shop);
	});
    }else if(args[0].isHotel){
	$("#searchList .h-list-box ul li").each(function(){
	    var shop={};
	    shop.path = $("div.tit h4 a",this).attr("href");
	    var m = $(".hotel-remark .remark a",this).text().match(/\d+/);
	    if(m && m[0]){
		shop.reviews = Number(m[0]);
	    }else{
		shop.reviews = 0;
	    }
	    if(!that.doneItems[shop.path])
		args[0].shops.push(shop);
	});
    }else{
	$("ul.shop-list li div.info").each(function(){
	    var link = $("p.title a",this);
	    var path = link.attr('href');
	    var name = link.attr("title");
	    var shop = {"path":path,"name":name};
	    
	    var m = $("p.remark span a",this).text().trim().match(/\d+/);
	    if(m && m[0]){
		shop.reviews = Number(m[0]);
	    }
	    if(!that.doneItems[path])
		args[0].shops.push(shop);
	});
    }
    console.log("[DATA] %s, %s, %d, %d",args[0].city.name,args[0].cate.name,args[0].pageIdx,args[0].shopCount);

    if(args[0].onlyList){//different page structure which just parse list page.
	if(args[0].pageIdx<args[0].pageCount){
	    args[0].pageIdx++;
	    setTimeout(function(){
		that.wgetList(args[0]);
	    },1000);
	}else{
	    setTimeout(function(){
		that.wgetList();
	    },1000);
	}
    }
    else{
	this.wgetDetail(args[0]);
    }
}

Dp.prototype.wgetDetail = function(task){
    if(task.shops.length==0){
	if(task.pageIdx < task.pageCount){
	    ++task.pageIdx;
	    setTimeout(function(){
		that.wgetList(task);
	    },(Math.random()*(this.interval[1]-this.interval[0])+this.interval[0]));
	}else{
	    setTimeout(function(){
		that.wgetList();
	    },(Math.random()*(this.interval[1]-this.interval[0])+this.interval[0]));
	}
	return;
    }
    
    var shop = task.shops.shift();
    var opt = new helper.basic_options("www.dianping.com",shop.path);
    console.log("[GET] %s",shop.path);
    helper.request_data(opt,null,function(data,args,res){
	that.processDetail(data,args,res);
    },[task,shop]);
}

Dp.prototype.processDetail = function(data,args){
    if(!data){
	console.log("detail data empty.");
    }
    var $ = cheerio.load(data);
    var photoText;
    if(args[0].isHotel){
	photoText = $("span.photos-count").text();
    }else{
	photoText = $("#pic-count").text().trim();
    }
    var m = photoText.match(/\d+/g);
    if(m && m[0]){
	args[1].photoCount = Number(m[0]);
    }
    args[1].photoCount = args[1].photoCount || 0;
    
    var record = [args[0].city.name,args[0].cate.name,args[0].shopCount,args[1].path,args[1].reviews,args[1].photoCount,'\n'].join();
    fs.appendFileSync(this.resultDir+this.resultFile,record);
    console.log("[DONE] %s",record);
    setTimeout(function(){
	that.wgetDetail(args[0]);
    },(Math.random()*(this.interval[1]-this.interval[0])+this.interval[0]));
}


var instance = new Dp();
var that = instance;
instance.start();
