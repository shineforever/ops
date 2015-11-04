var request = require('request');
var iconv = require('iconv-lite');
var Crawler = require('crawler');
var fs = require('fs')

var list = ["/web/20141102020706/http://www.vip.com/",
	    "/web/20141102031111/http://vip.com/",
	    "/web/20141107022714/http://www.vip.com/",
	    "/web/20141107030317/http://vip.com/",
	    "/web/20141111023628/http://www.vip.com/",
	    "/web/20141111032349/http://www.vip.com/",
	    "/web/20141111061551/http://www.vip.com/",
	    "/web/20141112112331/http://www.vip.com/",
	    "/web/20141112120542/http://vip.com/",
	    "/web/20141112131900/http://www.vip.com/",
	    "/web/20141113201814/http://www.vip.com/",
	    "/web/20141113210551/http://vip.com/",
	    "/web/20141115061153/http://www.vip.com/",
	    "/web/20141115073850/http://vip.com/",
	    "/web/20141116160101/http://www.vip.com/",
	    "/web/20141116171815/http://vip.com/",
	    "/web/20141118001858/http://www.vip.com/",
	    "/web/20141118032410/http://www.vip.com/",
	    "/web/20141119093855/http://www.vip.com/",
	    "/web/20141119103818/http://vip.com/",
	    "/web/20141120194538/http://www.vip.com/",
	    "/web/20141120211224/http://vip.com/",
	    "/web/20141122044031/http://www.vip.com/",
	    "/web/20141122050106/http://vip.com/",
	    "/web/20141124031014/http://www.vip.com/",
	    "/web/20141124040555/http://vip.com/",
	    "/web/20141125035414/http://www.vip.com/",
	    "/web/20141125115819/http://www.vip.com/",
	    "/web/20141125121005/http://vip.com/",
	    "/web/20141126192723/http://www.vip.com/",
	    "/web/20141126202138/http://www.vip.com/",
	    "/web/20141128025025/http://www.vip.com/",
	    "/web/20141129094525/http://www.vip.com/",
	    "/web/20141130164453/http://www.vip.com/",
	    "/web/20141202020512/http://www.vip.com/",
	    "/web/20141203054443/http://www.vip.com/",
	    "/web/20141203110356/http://www.vip.com/",
	    "/web/20141204210050/http://www.vip.com/",
	    "/web/20141204220807/http://vip.com/",
	    "/web/20141206075117/http://www.vip.com/",
	    "/web/20141206093637/http://vip.com/",
	    "/web/20141207181307/http://www.vip.com/",
	    "/web/20141207192933/http://vip.com/",
	    "/web/20141209044507/http://www.vip.com/",
	    "/web/20141209053923/http://vip.com/",
	    "/web/20141210144144/http://www.vip.com/",
	    "/web/20141210155214/http://vip.com/",
	    "/web/20141212230947/http://www.vip.com/",
	    "/web/20141213091402/http://www.vip.com/",
	    "/web/20141214070000/http://www.vip.com/",
	    "/web/20141215092259/http://www.vip.com/",
	    "/web/20141215172115/http://www.vip.com/",
	    "/web/20141215185407/http://vip.com/",
	    "/web/20141217053507/http://www.vip.com/",
	    "/web/20141217065234/http://vip.com/",
	    "/web/20141217094605/http://www.vip.com/",
	    "/web/20141217162604/http://www.vip.com/",
	    "/web/20141217230426/http://www.vip.com/",
	    "/web/20141218090701/http://www.vip.com/",
	    "/web/20141218111115/http://www.vip.com/",
	    "/web/20141218122711/http://www.vip.com/",
	    "/web/20141218131500/http://www.vip.com/",
	    "/web/20141218142623/http://www.vip.com/",
	    "/web/20141218150616/http://www.vip.com/",
	    "/web/20141218200208/http://www.vip.com/",
	    "/web/20141219232728/http://www.vip.com/",
	    "/web/20141220013218/http://www.vip.com/",
	    "/web/20141221121923/http://www.vip.com/",
	    "/web/20141221131649/http://vip.com/",
	    "/web/20141222213848/http://www.vip.com/",
	    "/web/20141223142429/http://www.vip.com/",
	    "/web/20141225115436/http://www.vip.com/",
	    "/web/20141225134039/http://www.vip.com/",
	    "/web/20141225173031/http://www.vip.com/",
	    "/web/20141225192157/http://www.vip.com/",
	    "/web/20141226092224/http://www.vip.com/",
	    "/web/20141227005448/http://www.vip.com/",
	    "/web/20141227010247/http://www.vip.com/",
	    "/web/20141227021114/http://www.vip.com/",
	    "/web/20141227035528/http://www.vip.com/",
	    "/web/20141227225121/http://www.vip.com/",
	    "/web/20141227232856/http://www.vip.com/",
	    "/web/20141228004224/http://www.vip.com/",
	    "/web/20141228093039/http://www.vip.com/",
	    "/web/20141229153818/http://www.vip.com/",
	    "/web/20141229190441/http://www.vip.com/",
	    "/web/20141231024605/http://www.vip.com/",
	    "/web/20141231031715/http://vip.com/"
	   ];

var countItem = function(error,result,$){
    if(error) console.log(error);
    var tit = $("title").text().trim();
    var count = $("div.fr span.page_total").text().trim();
    var c = count && count.match(/\d+/)[0];
    var r = tit+"\t"+c+"\n";
    fs.appendFileSync("count.txt",r);
    console.log(r);
}

var c = new Crawler({
    maxConnections : 5,
    // This will be called for each crawled page
    callback : function (error, result, $) {
	if(error) console.log(error);
	//console.log(result);
	var matches = result.uri.match(/\/(\d{14})\//);
	var time = matches && matches[1];
	var records = [""];
	$("ul.shop_onsale li").each(function(){
	    var tit = $("div.s_pic p.s_name",this).attr("title").trim();
	    var url = $("div.s_pic a.J_to_list",this).attr("href");
	    c.queue({uri:"https://web.archive.org"+url,callback:countItem});
	    records.push(tit+"\t"+time);
	});
	var r  =records.join("\n");
	fs.appendFileSync("brands.txt",r);
	console.log(r);
	//$('a').each(function(index, a) {
	//    var toQueueUrl = $(a).attr('href');
	//    c.queue(toQueueUrl);
	//});
    }
});


list.forEach(function(l){
    c.queue("https://web.archive.org"+l);
});

