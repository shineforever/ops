var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../../helpers/webhelper.js')
var qs = require("querystring")

function DD(){
    this.resultDir = "../../result/";
    this.dataDir = "../../appdata/";
    this.resultFile = "dd.txt";
    this.cityFile = "dd_city.txt";
    //this.categoryFile = "place_categories.txt";
    this.cities = [];
    
    //this.categories = [];
    this.taskQueue = [];
    this.interval = [0,500];
    this.doneItems = {};
    //could use pagination query parameters directly.
    this.query = function(ajax, offset, areaid, areaseo){
	//this.categoryId=296;
    this.ajax = ajax || 1;
    this.offset = offset || 10;
    this.areaid = areaid;
    this.areaseo = areaseo;
	this.sort = "";
    }
}

DD.prototype.init = function(){
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
	return {enname:vals[0],code:vals[1],seo:vals[2],name:vals[3]};
    });
    /*this.categories = fs.readFileSync(this.dataDir+this.categoryFile).toString().split('\n').filter(function(line){
	return line;
    }).map(function(line){
	var vals = line.split(',');
	return {code:vals[1],id:vals[2],enname:vals[0],name:vals[3]};
    });*/
    if(!fs.existsSync(this.resultDir+this.resultFile)){
	console.log("[DONE COUNT] %d",doneCount);
	return;
    }
    fs.readFileSync(this.resultDir+this.resultFile).toString().split('\n').map(function(line){
	if(line){
	    return line.split(',')[1];
	}
	return "";
    }).reduce(function(pre,cur){
	pre[cur]=true;
	++doneCount;
	return pre;
    },this.doneItems);
    //console.log(this.doneItems);
    console.log("[DONE COUNT] %d",doneCount);
    console.log("[CITIES] %d",this.cities.length);
    //console.log("[CATEGORIES] %d",this.categories.length);
}

DD.prototype.start = function(){
    this.init();
    for(var i=0;i<this.cities.length;i++){
	if(this.cities[i])
	    this.taskQueue.push({city:this.cities[i]});
    }
    this.startIdx = Number(this.startIdx) || 0;
    this.count = Number(this.count) || this.taskQueue.length;
    this.taskQueue = this.taskQueue.slice(this.startIdx,this.startIdx+this.count);
    console.log("[TASKS] %d",this.taskQueue.length);
    /*
    http.get("http://www.place.vn/",function(res){
	var key = "Set-Cookie";
	console.log(res[key]);
	if(res[key]){
	    var cookies = res[key].split(";");
	    that.cookie = cookies[0];
	}

    });*/
    that.wgetList();
}
DD.prototype.wgetList = function(t){
    if(!t){
	if(this.taskQueue.length>0){
	    t = this.taskQueue.shift();
	    t.offset = 0;
	    t.shopCount=-1;
	    t.reviews = 0;
	    t.shops = [];
	    t.photoCount = 0;
	}else{
	    console.log("job done.");
	    return;
	}
	
    }
    var q = new this.query(1, t.offset, t.city.code, t.city.seo);//I don't know the query parameters for pool network
    var queryBody = qs.stringify(q);
    var opt = new helper.basic_options('diadiemanuong.com',"/location/ajaxLoadMore/",'POST',false,true,queryBody);//path of url the same to query parameters.
    console.log(opt);
    console.log("[GET] %s: %d + (10 more)",t.city.enname,t.offset);
    helper.request_data(opt,queryBody,function(data,args,res){
	that.processList(data,args,res);
    },t);
}

DD.prototype.processList = function(data,args,res){
    if(res.statusCode==403){
	console.log("IP has been forbidden");
	return;
    }
    data = data.trim();
    if(!data){
	console.log("data empty");
	this.wgetList();
	return;
    }
    
    var $ = cheerio.load(data);
    var itemSelector;
    itemSelector = "li.detail-event-main-item";//shop item selector
    $(itemSelector).each(function(){
	var shop = {};
	//TODO: parse elements to shop.
	var item = $("div.desc h2.post-title a", this);
	shop.path = item.attr("href");
	shop.path = shop.path.replace("http://diadiemanuong.com", "");
	shop.name = item.attr("title");
	shop.star = Number(5);//always 5, so it's nonsense
	shop.like = Number($("div.desc p.place-action span.like-count", this).text());
	shop.reviews = Number($("div.desc p.place-action span.comment-count", this).text());
	if(!that.doneItems[shop.path]){
	    args[0].shops.push(shop);
	}
    });
    console.log("[DATA] %s, %d",args[0].city.enname,args[0].offset);
    //console.log(args);
    this.wgetDetail(args[0]);
}

DD.prototype.wgetDetail = function(task){
    if(task.shops.length==0){
	task.offset += 10;
	this.wgetList(task);
	return;
    }
    
    var shop = task.shops.shift();
    var opt = new helper.basic_options("diadiemanuong.com",shop.path);
    console.log("[GET] %s",shop.name);
    helper.request_data(opt,null,function(data,args,res){
	that.processDetail(data,args,res);
    },[task,shop]);
}

DD.prototype.processDetail = function(data,args){
    if(!data){
	console.log("detail data empty.");
    }
    var $ = cheerio.load(data);
    //TODO: photoCount and category info.
    //photoCount is on the bubble of top right.
    //category is on the right of the map which tag color is yellow.
    args[1].photoCount = $("div.review-widget-content div div.thread_image_list img").length;
    var category_item = $("div#place-detail-desc div.desc a");
    args[1].category = category_item.attr("title");
    
    var record = [args[0].city.enname,args[1].path,args[1].star,args[1].like,args[1].reviews,args[1].photoCount,args[1].category,'\n'].join();
    fs.appendFileSync(this.resultDir+this.resultFile,record);
    console.log("[DONE] %s",record);
    setTimeout(function(){
	that.wgetDetail(args[0]);
    },200);

}

var instance = new DD();
var that = instance;
instance.start();
