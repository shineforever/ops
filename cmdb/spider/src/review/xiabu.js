var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../../helpers/webhelper.js')
var moment = require("moment")

function Dp(){
    this.resultDir = "../../result/";
    this.dataDir = "../../appdata/";
    this.resultFile = "dp.xiabu_"+moment().format("YYYY-MM-DD")+".txt";
    this.reviewsFile = "dp.xiabu.reviews_"+moment().format("YYYY-MM-DD")+".txt";
    this.cities = [];
    this.taskQueue = [];
    this.interval = [2000,5000];
    this.doneItems = {};
    this.review = false;
    this.kws = ["呷哺呷哺"];
    //this.kws = ["肯德基","味千拉面","吉野家","真功夫","小肥羊","海底捞"];
}

Dp.prototype.init = function(){
    var doneCount = 0;
    var str = "北京	北京	2\n\
上海	上海	1\n\
天津	天津	10\n\
河北	石家庄	24\n\
河北	保定	29\n\
河北	张家口	30\n\
河北	秦皇岛	26\n\
河北	唐山	25\n\
河北	廊坊	33\n\
河北	沧州	32\n\
河北	衡水	34\n\
河北	邢台	28\n\
河北	邯郸	27\n\
河北	高碑店	29\n\
江苏	徐州	92\n\
江苏	扬州	12\n\
江苏	南京	5\n\
江苏	常州	93\n\
江苏	无锡	13\n\
江苏	苏州	6\n\
辽宁	辽阳	65\n\
辽宁	大连	19\n\
辽宁	沈阳	18\n\
辽宁	铁岭	67\n\
辽宁	葫芦岛	69\n\
山东	烟台	148\n\
山东	青岛	21\n\
山东	淄博	145\n\
山东	济南	22\n\
河南	郑州	160\n\
河南	驻马店	176\n\
山西	太原	35";
    var args = process.argv.slice(2);
    if(args.length>0){
	this.startIdx = args[0];
    }
    if(args.length>1){
	this.count = args[1];
    }
    if(args.length>2){
	this.review = !!args[2];
    }
    
    this.cities = str.split('\n').filter(function(line){
	return line;
    }).map(function(line){
	var vals = line.split('\t');
	console.log(vals);
	return {id:vals[2],p:vals[0],name:vals[1]};
    });
    console.log("[CITIES] %d",this.cities.length);
}

Dp.prototype.start = function(){
    this.init();
    for(var i=0;i<this.cities.length;i++){
	for(var j=0;j<this.kws.length;j++){
	    if(this.cities[i]){
		this.taskQueue.push({id:this.cities[i].id,p:this.cities[i].p,name:this.cities[i].name,kw:this.kws[j]});
	    }
	}
    }
    this.startIdx = Number(this.startIdx) || 0;
    this.count = Number(this.count) || this.taskQueue.length;
    this.taskQueue = this.taskQueue.slice(this.startIdx,this.startIdx+this.count);
    console.log("[TASKS] %d",this.taskQueue.length);
    this.wgetList();
}

Dp.prototype.wgetList = function(t){
    if(!t && this.taskQueue.length>0){
	t = this.taskQueue.shift();
	t.pageIdx = 1;
	t.shops = [];
	t.pageCount=-1;
    }
    if(!t){
	return;
    }
    var path = encodeURI('/search/keyword/'+t.id+'/10_'+t.kw+'/p'+t.pageIdx);
    var opt = new helper.basic_options('www.dianping.com',path);
    console.log(path);
    console.log("[GET] %s: %d",t.name,t.pageIdx);
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
    
    var $ = cheerio.load(data)
    , records = [""]
    ;
    $("#shop-all-list ul li div.txt").each(function(){
	var shop = {};
	shop.tit = $(".tit h4",this).text();
	shop.tit = shop.tit && shop.tit.replace(/\s/g,"");
	shop.path = $(".tit a",this).eq(0).attr("href");
	shop.star = $(".comment span",this).attr("title");
	shop.reviews = $(".review-num b",this).text().trim() || 0;
	shop.price = $("a.mean-price b",this).text().trim() || 0;
	shop.addr = $("span.addr",this).text();
	shop.points = $("span.comment-list span b",this).map(function(){
	    return $(this).text();
	});
	if(shop.points.length==0){
	    shop.points=[0,0,0];
	}
	if(that.review){
	    args[0].shops.push(shop);
	}
	records.push([args[0].p,args[0].name,shop.path,shop.tit,shop.reviews,shop.star,shop.price,shop.addr,shop.points[0],shop.points[1],shop.points[2]].join("\t"));
    });
    fs.appendFileSync(this.resultDir+this.resultFile,records.join('\n'));
    if(args[0].pageCount==-1){
	var nextBtn = $("div.page a.next");
	if(nextBtn.length>0){
	    args[0].pageCount = Number(nextBtn.prev().text());
	}else{
	    args[0].pageCount = 1;
	}
    }
    console.log("[DATA] %s, %s, %d",args[0].p,args[0].name,args[0].pageIdx);
    setTimeout(function(){
	that.wgetDetail(args[0]);
    },(Math.random()*(this.interval[1]-this.interval[0])+this.interval[0]));
}

Dp.prototype.wgetDetail = function(task,shop){
    if(!shop){
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
	}else{
	    shop = task.shops.shift();
	    shop.pageIdx = 1;
	}
    }
    
    var maxPage = Math.ceil(shop.reviews/20);
    var opt = new helper.basic_options("www.dianping.com",shop.path+"/review_more?pageno="+maxPage);
    console.log("[GET] %s",opt.path);
    helper.request_data(opt,null,function(data,args,res){
	that.processDetail(data,args,res);
    },[task,shop]);
}

Dp.prototype.processDetail = function(data,args){
    if(!data){
	console.log("detail data empty.");
	this.wgetDetail(args[0]);
	return;
    }
    var $ = cheerio.load(data)
    ,records=[""];
    
    if(typeof args[1].pageCount=="undefined"){
	var nextBtn = $("div.Pages a.NextPage");
	if(nextBtn.length>0){
	    args[1].pageCount=Number(nextBtn.prev().text());
	}else{
	    args[1].pageCount=1;
	}
    }
    var parse = function(){
	var starSpan = $("div.user-info > span.item-rank-rst",this);
	var star="";
	if(starSpan.length>0){
	    star = starSpan.attr("class").replace(/item\-rank\-rst/,"").replace(/irr\-star/,"");
	}
	
	var price="无";
	var priceSpan = $("div.user-info > span.comm-per",this);
	if(priceSpan.length>0){
	    price = priceSpan.text().trim();
	}
	var points=$("div.comment-rst >span.rst",this);
	var time = $("div.misc-info > span.time",this).text();
	records.push([args[1].path,args[1].tit,star,price,points.eq(0).text(),points.eq(1).text(),points.eq(2).text(),time].join("\t"));
    };
    
    //$("div.comment-list ul li div.content").each(parse);
    $("div.comment-list ul li div.content").last().each(parse);
    
    fs.appendFileSync(this.resultDir+this.reviewsFile,records.join("\n"));
    
    console.log("[DONE] %s, %d/%d",args[1].tit,args[1].pageIdx,args[1].pageCount);
    
    if(args[1].pageIdx<0){//args[1].pageCount){
	++args[1].pageIdx;
	setTimeout(function(){
	    that.wgetDetail(args[0],args[1]);
	},(Math.random()*(this.interval[1]-this.interval[0])+this.interval[0]));
    }else{
	setTimeout(function(){
	    that.wgetDetail(args[0]);
	},(Math.random()*(this.interval[1]-this.interval[0])+this.interval[0]));
    }
}

var instance = new Dp();
var that = instance;
instance.start();
