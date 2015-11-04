var fs = require('fs')
var helper = require('../../helpers/webhelper.js')

function Foody(){
    this.resultDir = "../../result/";
    this.dataDir = "../../appdata/";
    this.resultFile = "foody.txt";
    //this.doneFile = "yelp_done_item.txt";
    this.cityFile = "foody_city.txt";
    this.categoryFile = "foody_categories.txt";
    this.cities = [];
    
    this.searchQuery = function(pageIdx){
	this.vt = "row";
	this.st = 1;
	this.c = 11;
	this.page = pageIdx||0;
	this.provinceId = 217;
    }
    this.categories = [];
    this.taskQueue = [];
    this.interval = [20000,40000];
    this.doneItems = {};
}

Foody.prototype.init = function(){
    var doneCount = 0;

    var args = process.argv.slice(2);
    if(args.length>0){
	this.startIdx = args[0];
    }
    if(args.length>1){
	this.count = args[1];
    }
    this.startIdx = (this.startIdx&&Number(this.startIdx)) || 0;
    this.count = (this.count &&Number(this.count)) || 1000000;

    console.log(this.startIdx);
    console.log(this.count);
    
    this.cities = fs.readFileSync(this.dataDir+this.cityFile).toString().split('\n').slice(0,5);
    this.categories = fs.readFileSync(this.dataDir+this.categoryFile).toString().split('\n');
    if(!fs.existsSync(this.resultDir+this.resultFile)){
	console.log("[DONE COUNT] %d",doneCount);
	return;
    }
    fs.readFileSync(this.resultDir+this.resultFile).toString().split('\n').filter(function(line,i){
	if(i<that.startIdx ||i> that.startIdx+that.count)
	    return false;
	return true;
    }).map(function(line){
	if(line){
	    var vals = line.split(',');
	    return vals[0]+','+vals[1];
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
    //console.log(this.doneItems);
}

Foody.prototype.start = function(){
//    this.load();
    this.init();
    for(var i=0;i<this.cities.length;i++){
	for(var j=0;j<this.categories.length;j++){
	    if(!this.cities[i] || !this.categories[j]){
		continue;
	    }	
	    var vals = this.categories[j].split(',');
	    if(vals.length!=2 || !vals[0] || !vals[1])
		continue;
	    var category = {name:vals[0],val:vals[1]};
	    if(!this.doneItems[this.cities[i]+','+vals[0]]){
		this.taskQueue.push({city:this.cities[i],cate:category});
	    }
	}
    }
//    this.startIdx = Number(this.startIdx) || 0;
//    this.count = Number(this.count) || this.taskQueue.length;
    this.taskQueue = this.taskQueue.slice(this.startIdx,this.startIdx+this.count);
    console.log("[TASKS] %d",this.taskQueue.length);
    //console.log(this.taskQueue);
    this.wgetList();
//    this.todoFlights.forEach(function(f,i,a){
//	this.wgetList(f);
//    },this);
//    this.wgetList(this.todoFlights[0]);
}

Foody.prototype.processList = function(data,args,res){
    if(res.statusCode==403){
	console.log("IP has been forbidden");
	return;
    }
    if(!data){
	console.log("data empty");
	return;
    }
    console.log("[DATA] %s, %s, %d",args[0].city,args[0].cate.name,args[0].page);
    
    if(args[0].shopCount==-1){
	args[0].shopCount = data.totalResult;
    }else{
	if(data.totalResult==args[0].shopCount){
	    data["restaurants"].forEach(function(r){
		args[0].reviews+=r.TotalReview;
		args[0].photoCount+=r.PictureCount;
	    });
	    fs.appendFileSync(this.resultDir+this.resultFile,[args[0].city,args[0].cate.name,args[0].shopCount,args[0].reviews,args[0].photoCount,'\n'].join());
	}
	this.wgetList();
	return ;
    }
    var maxPageNo = Math.ceil(args[0].shopCount/12);
    if(maxPageNo>100) maxPageNo=100;
    args[0].page = maxPageNo;
    this.wgetList(args[0]);
}

Foody.prototype.wgetList = function(t){
    if(!t){
	if(this.taskQueue.length==0){
	    console.log("[ALL DONE]");
	    return;
	}
	t = this.taskQueue.shift();
	t.page = 1;
	t.reviews = 0;
	t.shops = [];
	t.NO = 0;
	t.shopCount = -1;
	t.photoCount = 0;
    }
    var query = new this.searchQuery(t.page);
    var opt = new helper.basic_options('www.foody.vn','/'+t.city+'/'+t.cate.val,'GET',false,true,query);
    //opt.agent=false;
    console.log("[GET] %s,%s: %d -- %d",t.city,t.cate.name,t.page,t.shopCount);
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    },t);
}

var instance = new Foody();
var that = instance;
instance.start();
