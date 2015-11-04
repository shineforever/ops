var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../../helpers/webhelper.js')
var url = require('url')
//var utility = require("../../helpers/utility.js")

var lefeng = function(){
    this.resultDir = "../../result/vertical/";
    this.dataDir = "../../appdata/";
    this.categoryFile = "lefengCategories.txt";
    this.brandFile = "lefengBrands.txt";
    this.resultFile = "lefeng_sc.txt";
    //this.doneFile = "";
    this.categories = [];
    this.brands = {};
    this.tasks = [];
    this.today = new Date().toString();
    this.brandDictTree = {};
}

lefeng.prototype.start = function(){
    this.init();
}

lefeng.prototype.init = function(){
    if(!fs.existsSync(this.resultDir+this.resultFile)){
	fs.appendFileSync(this.resultDir+this.resultFile,['日期','分类','标题','商品编号','市场价','乐蜂价','购买人数','品牌','规格','\n'].join('\t'));
    };
    
    this.categories = fs.readFileSync(this.dataDir + this.categoryFile).toString().split("\n").filter(function(line){
	if(!line || !line.trim())
	    return false;
	return true;
    }).map(function(line){
	var vals = line.split(",");
	if(!vals[0] || !vals[1]) return;
	var category = {name:vals[1],url:vals[0]};
	return category;
    });
    var doneCount = 0;
    this.categories.forEach(function(category){
	if(!category) return;
	
	helper.request_data(category.url,null,function(data,args,res){
	    doneCount++;
	    console.log("[INFO] GOT category of %s",args[0].name);
	    var $ = cheerio.load(data);
	    $("#allBrands #emBrands span").each(function(){
		var brandid = $("input",this).val();
		var brand = $("a",this).attr('title');
		brand = brand && brand.replace(/[\(\)\d]/g,'');
		var url = $("a",this).attr('href');
		that.tasks.push({"brand":brand,"id":brandid,"url":url,"category":args[0].name});
	    });
	    if(that.categories.length==doneCount){
		setTimeout(function(){
		    that.wgetList();
		},0);
	    }
	},category);
    });
}

lefeng.prototype.wgetList = function(t){
    if(!t){
	while(!t && this.tasks.length>0){
	    t = this.tasks.shift();
	}
	if(!t){
	    console.log("[INFO] job done.");
	    return;
	}
	t.pageIdx = 1;
    }
    //var urlObj = url.parse(cur.url,true);
    //var opt = new helper.basic_options(urlObj.host,urlObj.pathname,'GET',false,false,urlObj.query);
    t.url = t.url.replace(/\d+\.html/,t.pageIdx+".html");
    console.log("[INFO] GET  %s, %d/%d",t.brand,t.pageIdx,t.pageCount);
    helper.request_data(t.url,null,function(data,args){
	that.processList(data,args);
    },t);
}

Date.prototype.str = function(){
    return this.getFullYear()+'-'+(this.getMonth()+1)+'-'+this.getDate();
}

lefeng.prototype.processList = function(data,args){
    if(!data){
	console.log("data empty");
	this.wgetList(args[0]);
	return;
    }
    
    //console.log("[INFO] GOT %s in %s, %d/%d",args[0].brand,args[0].category,args[0].pageIdx,args[0].pageCount);
    var $ = null;
    try{
	$ = cheerio.load(data);
    }catch(e){
	console.log("[ERROR] parse html error: %s",e.message);
	this.wgetList(args[0]);
	return;
    }
    
    $("div.pruwrap").each(function(){
	var id = $(this).attr("id");
	var title = $("dd.nam a",this).attr("title");
	
	var price = $("dd.pri img",this).attr("src") || $("dd.pri img",this).attr("src2");
	var mktPrice = $("dd.pri del.spri",this).text() || '无';
	
	title = title.replace(/^【[\u4e00-\u9fa5]*】/,'').replace(/\s/g,'');
	//var maxLen = utility.matchMaxWord(utility.tree,title);
        //var brand = title.slice(0, maxLen);
	    
        var m = title.match(/[\d一二三四五六七八九十两]+(\.\d)?(mg|g|ml|l|kg|个|块|张|片|包|袋|瓶|盒|对|只|支|抽|枚|根|回|件套|件|套|克|毫升|升|cc|粒)(\*\d)?/gi);
	var unit = m && m.join();
	m = $("dd.mess .buynum",this).text().trim().match(/\d+/);
	var buyer = m && m[0];
	var result = [that.today,args[0].category,title,id,mktPrice,price,buyer||0,args[0].brand,unit];
	
	fs.appendFile(that.resultDir+that.resultFile,result.join('\t')+"\n");
    });
    
    if(!args[0].pageCount){
	var lastLink = $("div.pages span a").last().prev();
	if(lastLink.length == 0){
	    args[0].pageCount=1;
	}else{
	    args[0].pageCount = Number(lastLink.text());
	    args[0].pageUrl = lastLink.attr("href");
	}
    }
    
    if(args[0].pageIdx<args[0].pageCount){
	++args[0].pageIdx;
	//args[0].url = $("div.pages span a").last();
	this.wgetList(args[0]);
    }else{
	console.log("[INFO] DONE %s",args[0].brand);
	setTimeout(function(){
	    that.wgetList();
	},0);
    }
}

var instance = new lefeng();
var that = instance;
instance.start();
