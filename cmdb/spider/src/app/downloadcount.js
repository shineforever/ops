var urls = [{platform:1,name:"360\t微店-买家版",url:"http://zhushou.360.cn/detail/index/soft_id/2317375"},
	    {platform:2,name:"百度\t微店-买家版",url:"http://shouji.baidu.com/soft/item?docid=7237280"},
	    {platform:3,name:"应用宝\t微店-买家版",url:"http://android.myapp.com/myapp/detail.htm?apkName=com.koudai.weidian.buyer"},
	    {platform:4,name:"豌豆荚\t微店-买家版",url:"http://www.wandoujia.com/apps/com.koudai.weidian.buyer"},
	    {platform:5,name:"安智\t微店-买家版",url:"http://www.anzhi.com/soft_1936212.html"},
	    {platform:1,name:"360\t口袋购物",url:"http://zhushou.360.cn/detail/index/soft_id/54"},
	    {platform:2,name:"百度\t口袋购物",url:"http://shouji.baidu.com/soft/item?docid=7186575"},
	    {platform:3,name:"应用宝\t口袋购物",url:"http://android.myapp.com/myapp/detail.htm?apkName=com.geili.koudai"},
	    {platform:4,name:"豌豆荚\t口袋购物",url:"http://www.wandoujia.com/apps/com.geili.koudai"},
	    {platform:5,name:"安智\t口袋购物",url:"http://www.anzhi.com/soft_1936474.html"}
	   ];

var helper = require('../../helpers/webhelper.js')
var fs = require('fs')
var url = require('url')
var cheerio = require('cheerio')

function App(){
    this.resultDir = "../../result/";
    this.resultFile = "app.downcount.txt";
}

App.prototype.init = function(){
    this.today = new Date().toString();
}

App.prototype.start = function(){
    this.init();
    urls.forEach(function(obj){
	that.wget(obj);
    });
}

App.prototype.wget = function(obj){
    if(!obj){
	return;
    }
    var UrlObject = url.parse(obj.url);
    var opt = new helper.basic_options(UrlObject.host,UrlObject.path);
    helper.request_data(opt,null,function(data,args,res){
	that.process(data,args,res);
    },obj);
}
App.prototype.process = function(data,args,res){
    if(!data){
	console.log("data empty.");
	return;
    }

    switch(args[0].platform){
    case 1:
	that.process360(data,args,res);
	break;
    case 2:
	that.processBaidu(data,args,res);
	break;
    case 3:
	that.processQQ(data,args,res);
	break;
    case 4:
	that.processWdj(data,args,res);
	break;
    case 5:
	that.processAnzhi(data,args,res);
	break;
    }
}
App.prototype.process360 = function(data,args,res){
    var $ = cheerio.load(data);
    var countText = $("#app-info-panel div dl dd .pf span.s-3").text();
    var matches = countText && countText.match(/\d+/);
    var count = matches && matches[0];
    var rows = $("div.base-info table tr");
    if(rows.length>0){
	var date = $("td",rows.eq(0)).eq(1).text();
	date = date && date.replace(/更新时间：/,'');
    }
    if(rows.length>1){
	var version = $("td",rows.eq(1)).eq(0).text();
	version = version && version.replace("版本：",'');
    }
    var r = [this.today,args[0].name,version,count,date].join("\t");
    fs.appendFileSync(this.resultDir+this.resultFile,r+'\n');
}

App.prototype.processBaidu = function(data,args,res){
    if(data instanceof Buffer){
	data = data.toString();
    }
    var $ = cheerio.load(data);
    var version = $(".app-intro .detail span.version").text();
    version = version && version.replace("版本: ",'');
    var count = $(".app-intro .detail span.download-num").text();
    count = count && count.replace("下载次数: ",'');
    var r = [this.today,args[0].name,version,count,""].join('\t');
    fs.appendFileSync(this.resultDir+this.resultFile,r+'\n');
}

App.prototype.processQQ = function(data,args,res){
    var $ = cheerio.load(data);
    var count = $(".det-ins-data .det-insnum-line div.det-ins-num").text();
    count = count && count.replace("下载","");
    var version = $(".det-othinfo-container .det-othinfo-data").first().text();
    var ticks = $("#J_ApkPublishTime").attr("data-apkpublishtime");
    version = version && version.replace("V",'');
    var r = [this.today,args[0].name,version,count,new Date(ticks*1000).toString()].join('\t');
    fs.appendFileSync(this.resultDir+this.resultFile,r+"\n");
}

App.prototype.processWdj = function(data,args,res){
    var $ = cheerio.load(data);
    var countText = $(".detail-top .num-list .item i").attr('content');
    var count = countText && countText.replace(/UserDownloads\:/,'');
    var date = $(".infos-list dd").eq(2).text();
    var version = $(".infos-list dd").eq(3).text();
    var r = [this.today,args[0].name,version,count,date].join('\t');
    fs.appendFileSync(this.resultDir+this.resultFile,r+"\n");
}

App.prototype.processAnzhi=function(data,args,res){
    var $ = cheerio.load(data);
    var version = $(".detail_line .app_detail_version").text();
    version = version && version.replace(/[\(\)]/g,'');
    var count = $("#detail_line_ul li span.spaceleft").eq(0).text();
    count = count && count.replace("下载：",'');
    var date = $("#detail_line_ul li").eq(2).text();
    date = date && date.replace("时间：",'');
    var r = [this.today,args[0].name,version,count,date].join('\t');
    fs.appendFileSync(this.resultDir+this.resultFile,r+"\n");
}

var that = new App();
that.start();