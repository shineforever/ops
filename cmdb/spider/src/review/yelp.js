var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../../helpers/webhelper.js')
var entity = require('../../models/entity.js')

function Yelp(){
    this.resultDir = "../../result/";
    this.dataDir = "../../appdata/";
    this.resultFile = "yelp.txt";
    //this.doneFile = "yelp_done_item.txt";
    this.cityFile = "yelp_city.txt";
    this.categoryFile = "yelp_categories.txt";
    this.cities = [];
    
    this.searchQuery = function(city,category,startIdx){
	this.find_loc = encodeURIComponent(city);
	this.cflt = category;
	this.start = startIdx==undefined?0:startIdx;
    }
    this.categories = [];
    this.taskQueue = [];
    this.interval = [10000,10000];
    this.doneItems = {};
}

Yelp.prototype.init = function(){
    var doneCount = 0;

    var args = process.argv.slice(2);
    if(args.length>0){
	this.startIdx = args[0];
    }
    if(args.length>1){
	this.count = args[1];
    }
    
    this.cities = fs.readFileSync(this.dataDir+this.cityFile).toString().split('\n').slice(0,5);
    this.categories = fs.readFileSync(this.dataDir+this.categoryFile).toString().split('\n');
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

Yelp.prototype.start = function(){
//    this.load();
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

Yelp.prototype.processList = function(data,args,res){
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
	args[0].shopCount = Number($("span.pagination-results-window").text().trim().match(/\d+$/)[0]);
    }
    $("ul.ylist li div.main-attributes div.media-story").each(function(){
	var path = $("a.biz-name",this).attr("href");
	var shop = {"path":path};
	var txt = $("span.review-count",this).text();
	var m = txt && txt.match(/\d+/);
	if(m && m[0]){
	    shop.reviews = Number(m[0]);
	}
	if(!that.doneItems[path]){
	    var record = [args[0].city,args[0].cate,args[0].shopCount,shop.path,shop.reviews,shop.photoCount,'\n'].join();
	    fs.appendFileSync(that.resultDir+that.resultFile,record);
	    console.log(record);
	    args[0].shops.push(shop);
	}
	
    });
    console.log("[DATA] %s, %s, %d, %d",args[0].city,args[0].cate,args[0].start,args[0].shops.length);
    
    var pageOfPages = $('div.page-of-pages').text().trim();
    var m = pageOfPages && pageOfPages.match(/\d+/g);
    var totalPages = m && m[1];
    args[0].maxStartIdx = (totalPages-1)*10;
    if(args[0].start < args[0].maxStartIdx){
	args[0].start+=10;
	setTimeout(function(){
	    that.wgetList(args[0]);
	},(Math.random()*(this.interval[1]-this.interval[0])+this.interval[0]));
	//this.wgetList(args[0]);	
    }else{
	setTimeout(function(){
	    that.wgetList();
	},(Math.random()*(this.interval[1]-this.interval[0])+this.interval[0]));
	//this.wgetList();
    }
    //this.wgetDetail(args[0]);
}

Yelp.prototype.wgetDetail = function(task){
    if(task.shops.length==0){
	if(task.start < task.maxStartIdx){
	    task.start += 10;
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
    var opt = new helper.basic_options("www.yelp.com",shop.path);
    console.log("[GET] %s",shop.path);
    helper.request_data(opt,null,function(data,args){
	that.processDetail(data,args);
    },[task,shop]);
}

Yelp.prototype.processDetail = function(data,args){
    if(!data){
	console.log("detail data empty.");
    }
    var $ = cheerio.load(data);
    var photoText = $("a.see-more").text().trim();
    var m = photoText.match(/\d+/g);
    if(m && m[0]){
	args[1].photoCount = Number(m[0]);
    }
    args[1].photoCount = args[1].photoCount || 0;
    var record = [args[0].city,args[0].cate,args[0].shopCount,args[1].path,args[1].reviews,args[1].photoCount,'\n'].join();
    fs.appendFileSync(this.resultDir+this.resultFile,record);
    console.log("[DONE] %s",record);
    setTimeout(function(){
	that.wgetDetail(args[0]);
    },(Math.random()*(this.interval[1]-this.interval[0])+this.interval[0]));
}

Yelp.prototype.wgetList = function(t){
    if(!t){
	t = this.taskQueue.shift();
	t.start = 0;
	t.shopCount=-1;
	t.reviews = 0;
	t.shops = [];
	t.NO = 0;
    }
    var query = new this.searchQuery(t.city,t.cate,t.start);
    var opt = new helper.basic_options('www.yelp.com','/search','GET',false,false,query);
    //opt.agent=false;
    console.log("[GET] %s,%s: %d/%d",t.city,t.cate,t.start,t.maxStartIdx);
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    },t);
}

var instance = new Yelp();
var that = instance;
instance.start();
