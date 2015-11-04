var fs = require('fs')
var cheerio = require("cheerio")
var helper = require('../../helpers/webhelper.js')
var url = require('url')

var lefeng = function(){
    this.resultDir = "../../result/vertical/";
    this.dataDir = "../../appdata/";
    this.categoryFile = "lefengCategories.txt";
    this.brandFile = "lefengbrand.txt";
    this.resultFile = "lefeng-tuan.txt";
    this.categories = [];
    this.tasks = [];
    this.today = new Date().toString();
    this.brandDictTree = {};
}

lefeng.prototype.start = function(){
    this.init();
    this.wgetList();
}

lefeng.prototype.init = function(){
    this.tasks = fs.readFileSync(this.dataDir+this.brandFile).toString().split('\n').map(function(line){
	var vals = line.split(/\t/);
	return {id:vals[0],name:vals[1]};
    });
    if(!fs.existsSync(this.resultDir+this.resultFile)){
	fs.appendFileSync(this.resultDir+this.resultFile,['日期','标题','结束日期','价格','市场价','购买人数','是否结束','品牌','商品编号','规格'].join('\t'));
    }
}

lefeng.prototype.wgetList=function(t){
    if(!t && this.tasks.length>0){
	t = this.tasks.shift();
    }

    if(!t){
	console.log("[INFO] job done.");
	return;
    }
    console.log("[INFO] GET  %s",t.name);
    var opts = new helper.basic_options("tuan.lefeng.com","/bjsy/brand/"+t.id+".html");
    helper.request_data(opts,null,function(data,args,res){
	that.processList(data,args,res);
    },t);
}

lefeng.prototype.processList = function(data,args,res){
    if(!data){
	console.log("[ERROR] data empty.");
	this.wgetList(args[0]);
	return
    }
    
    var $ = cheerio.load(data);
    var records = [""];
    $("div.c-l > dl").each(function(){
	var title = $("dd h4 a",this).text().trim();
	var m = title.match(/[\d一二三四五六七八九十两]+(\.\d)?(mg|g|ml|l|kg|个|块|张|片|包|袋|瓶|盒|对|只|支|抽|枚|根|回|件套|件|套|克|毫升|升|cc|粒)(\*\d)?/gi);
	var unit = m && m.join();
	
	title = title && title.replace(/\s/g,'');
	var c = $("dd div",this).first().attr("class");
	var time = null;
	if(c){
	    var m = c.match(/d(\d+)/);
	    time = m && m[1];
	}
	var end = true;
	if(!time){
	    time = $("dd div",this).first().text().trim().replace("抢光于",'');
	}else{
	    time = new Date(time*1000);
	    if(new Date()<time){
		end = false;
	    }
	}
	
	var price = $("dd .t_price_L img",this).attr("src");
	var marketprice = $("dd .t_price_tips span",this).text();
	var buyer = $("dd .t_buy_pople b",this).text();
	m = price.match(/(\d+)\_\d+\_\d+/);
	var pid = m && m[1];
	
	records.push([that.today,title,time,price,marketprice,buyer,(end?"Y":"N"),args[0].name,pid,unit].join('\t'));
    });
    fs.appendFileSync(this.resultDir+this.resultFile,records.join("\n"));
    console.log("[INFO] DONE %s",args[0].name);
    this.wgetList();
}

var that = new lefeng();
that.start();