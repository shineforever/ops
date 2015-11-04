var helper = require('../../helpers/webhelper.js')
var fs = require('fs')
var url = require('url')
var cheerio = require('cheerio')
var path = require('path')

function Worker(){
    this.resultDir = "../../result/vertical/";
    this.dataDir = '../../appdata/';
    this.resultFile = "jumei-other.txt";
    //this.progressFile = "bitadealer_progress_"+new Date().toString()+".txt";
    this.done = {};
    this.curPageIdx = 1;
    this.tasks = [];
    this.promos = [];
    this.today = new Date().toString();
    this.categories = [{
	"name":"服饰内衣",
	"path":"/dress_sport"
    },{
	"name":"鞋包配饰",
	"path":"/shoe_bag"
    },{
	"name":"居家母婴",
	"path":"/home_baby"
    }];
}

Worker.prototype.check = function(){
    if(!fs.existsSync(this.resultDir)){
	fs.mkdir(this.resultDir,function(error){
	    if(error){
		console.log(error);
		return false;
	    }
	});
    }
    return true;
}

Worker.prototype.init = function(){
    if(!this.check()){
	process.exit(1);
    }
    if(!fs.existsSync(this.resultDir+this.resultFile)){
	fs.appendFileSync(this.resultDir+this.resultFile,['deal_id','original_price','discounted_price','discount','buyer_number','start_time','end_time','hash_id','status','short_name','product_id','is_published_price','category_id','category_v3_1','image','crawler_date','type_name','type_id','brand_id','title','remark','column','brand','\n'].join('\t'));
    }
}

Worker.prototype.start = function(){
    this.init();
    this.wgetPromotion();
}

Worker.prototype.wgetPromotion = function(){
    this.categories.forEach(function(cate){
	var opt = new helper.basic_options("pop.jumei.com",cate.path);
	if(!that.promos[cate.name]){
	    that.promos[cate.name]=[];
	}
	helper.request_data(opt,null,function(data,args,res){
	    console.log("[INFO] %s got promotion: %s",new Date().toDatetime(),args[0].name);
	    var $ = cheerio.load(data);
	    var filter = function(){
		var link = $(this).attr('href');
		that.promos.push({name:args[0].name,link:link});
	    }
	    $("#pop_hot .pop_left_sorts > a").each(filter);
	    $("#pop_center_onsale .pop_left_sorts > a").each(filter);
	    that.categories.shift();
	    if(that.categories.length==0){
		setTimeout(function(){that.wgetList();},0);
	    }
	},cate);
    });
}

Worker.prototype.wgetList = function(t){
    if(!t){
	if(this.promos.length==0){
	    console.log("[INFO] job done.");
	    return;
	}
	t = this.promos.shift();
	t.pageIdx = 1;
    }
    var objUrl = url.parse(t.link);
    var matches = objUrl.pathname.match(/\d*_\d+_(\d+)/);
    var promoId = matches && matches.length>1 && matches[1];
    if(!promoId){
	console.log("[ERROR] %s cannot get promoId: %s",new Date().toDatetime(),t.link);
	wgetList(t);
    }
    console.log("[INFO] %s GET: %s,%d/%d",new Date().toDatetime(),t.name,t.pageIdx,t.total);
    var opt = new helper.basic_options("pop.jumei.com","/ajax_details-"+promoId+"-"+t.pageIdx+"-sales_desc-0-0.html","GET",false,true);
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    },t);
}

Worker.prototype.parseList = function(data,args){
    var records = [""];
    data.deals.forEach(function(deal){
	var r = Object.keys(deal).map(function(k){
	    if(k=="start_time" || k=="end_time")
		return new Date(deal[k]*1000).toString();
	    if(k=="short_name")
		return deal[k].replace(/\t/g,'');
	    return deal[k];
	});
	
	records.push(r.concat(that.today,data.type_name,data.type_id,data.brand_id,data.title,data.remark,args[0].name,args[0].brand).join('\t'));
    });
    
    fs.appendFileSync(this.resultDir+this.resultFile,records.join('\n'));
    console.log("[INFO] got %d/%d",data.page,data.page_total);
    if(data.page<data.page_total){
	++args[0].pageIdx;
	this.wgetList(args[0]);
    }else{
	console.log("[INFO] %s done.",args[0].brand);
	this.wgetList();
    }
}

Worker.prototype.processList = function(data,args,res){
    if(!data){
	console.log("[ERROR] %s data empty.",new Date().toDatetime());
	this.wgetList(args[0]);
    }
    if(typeof data =='string'){
	data = JSON.parse(data);
    }
    if(!args[0].total){
	args[0].total = data.page_total;
    }
    if(!args[0].brand){
	var opt = new helper.basic_options("pop.jumei.com","/i/deal/"+data.deals[0].hash_id+".html");
	helper.request_data(opt,null,function(page,args){
	    var $ = cheerio.load(page);
	    args[0].brand = $("#deal_special table tr").eq(1).find("td").text();
	    that.parseList(data,args);
	},args[0]);
    }else{
	that.parseList(data,args);
    }
}


var that = new Worker();
that.start();