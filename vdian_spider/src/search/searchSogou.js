var fs = require("fs");
var helper = require("../../helpers/webhelper.js");
var cheerio = require("cheerio");
var Crawler = require('node-webcrawler')

var searchSogou = function(){
    this.resultDir = "../../result/";
    this.resultFile = "linkcount.sogou_"+new Date().toString()+".txt";
    this.keywordFile = "../../appdata/5755.txt";
    this.done = {};
}

searchSogou.prototype.init = function(){
    var startIdx,len;
    var args = process.argv.slice(2);
    if(args.length>0){
	this.keywordFile = args[0];
    }
    if(args.length > 1){
	startIdx = Number(args[1]);
	len = Number(args[2]);
    }
    if(fs.existsSync(this.resultDir+this.resultFile)){
	fs.readFileSync(this.resultDir+this.resultFile).toString().split("\n").reduce(function(prev,cur){
	    prev[cur.split(',')[0]]=true;
	    return prev;
	},this.done);
    }
    if(fs.existsSync(this.keywordFile)){
	this.words = fs.readFileSync(this.keywordFile).toString().split("\n").filter(function(line,idx){
	    if(idx<startIdx || len+startIdx<=idx)
		return false;
	    if(!line||line=='\r'||line=='\n'){
		return false;
	    }
	    var w = line.replace('\r','').replace('\n','').split(',')[0];
	    return !that.done[w];
	}).map(function(line){
	    return line.replace('\r','').split(",")[0];
	});
    }

    this.c = new Crawler({
	maxConnections:1,
	rateLimits:1000,
	userAgent:"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:23.0) Gecko/20100101 Firefox/23.0",
	jar:true,
	callback:function(err,result,$){
	    if(err){
		console.log(err);
	    }else{
		that.process(result,$)
	    }
	}
    });
    
    console.log("total keywords: %d",this.words.length);
}

searchSogou.prototype.start = function(){
    this.init();
    this.wget();
}

searchSogou.prototype.wget = function(){
    if(this.words.length==0){
	console.log("job done");
	return;
    }
    
    for(var word=null;this.words.length>0;word=this.words.shift()){
	if(!word) continue;
	var query = {query:encodeURIComponent(word),ie:"utf8",_ast:parseInt(new Date().getTime()/1000),_asf:null,w:01029901,p:40040100,dp:1};
	this.c.queue({uri:'http://www.sogou.com/web',qs:query,kw:word});
    }
    
    /*
    var word = null;
    do{
	word = this.words.shift();
	
    }while(this.done[word] && this.words.length);
    */
    /*
    var opt  =new helper.basic_options('www.sogou.com','/web','GET',false,false,query);
    opt.agent = false;
    helper.request_data(opt,null,function(data,args){
	that.process(data,args);
    },word);*/
}

searchSogou.prototype.process = function(result,$){
    if(!$){
	console.log("data empty");
	return;
    }
    console.log(result.body);
//    console.log($(".business").length);
//    if($('.business ol li').length==0 &&  $(".atTrunk .b_rb").length==0){
//	console.log("none results");
//    }
//    fs.writeFileSync("result/testPage.txt",data);
//    return;
    for(var i=0;$("#ad_leftresult_"+i).length>0;i++);
    
    var leftCount = i;//$('.business ol li').length || 0;
    var rightCount = $(".bizr_rb").length;
    var record = [result.options.kw,leftCount,rightCount,"\n"];
    fs.appendFile(this.resultDir+this.resultFile,record.join(","));
    console.log("%s,%d,%d",result.options.kw,leftCount,rightCount);
}

var instance = new searchSogou();
var that = instance;
instance.start();
