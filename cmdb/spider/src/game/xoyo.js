var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var Crawler = require('crawler')
var url = require('url')

var resultFile = "../../result/game/game.csv";
var forums =
    [/*{
	name:"剑5-官网-公会区",
	url:"http://jx3.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=7090&page=1"
    },{
	name:"剑3-官网-综合讨论区",
	url:"http://jx3.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=7101 "
	},*/
	{
	    name:"剑侠情缘-汴京早报",
	    url:"http://jx2.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=1549",
	}/*,{
	name:"剑侠世界-官网-煮酒江湖",
	url:"http://jxsj2.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=8921",
	callback:jxsj
    },{
	name:"剑侠世界-官网-华山论剑",
	url:"http://jxsj2.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=8922",
	callback:jxsj
    },{
	name:"剑侠世界-官网-江湖轶事",
	url:"http://jxsj2.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=8923 ",
	callback:jxsj
    },{
	name:"剑侠世界-官网-公会入驻",
	url:"http://jxsj2.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=8924",
	callback:jxsj
    },{
	name:"月影传说-官网-游戏交流区",
	url:"http://moon.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=7104"
    },{
	name:"月影传说-官网-公会区",
	url:"http://moon.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=7103"
    },{
	name:"剑1-官网-武功技能",
	url:"http://jx.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=234"
    },{
	name:"剑2-官网-图文杂谈",
	url:"http://jx.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=4"
    },{
	name:"反恐行动-官网-研发交流",
	url:"http://xd.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=7075"
    },{
	name:"反恐行动-官网-楼兰水城",
	url:"http://xd.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=7078"
    },{
	name:"热血战队-官网-研发交流区",
	url:"http://rt.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=8514"
    },{
	name:"热血战队-官网-战队竞技区",
	url:"http://rt.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=8522"
    },{
	name:"麻辣江湖-官网-综合交流",
	url:"http://mj.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=8599"
    },{
	name:"麻辣江湖-官网-公会入驻",
	url:"http://mj.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=8600"
    },{
	name:"九天神话-官网-综合讨论区",
	url:"http://9.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=8656 "
    },{
	name:"九天神话-官网-三宫六院",
	url:"http://9.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=8825"
    },{
	name:"春秋Q传-官网-经验交流",
	url:"http://cq.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=7064"
    },{
	name:"春秋Q传-官网-春秋大本营",
	url:"http://cq.bbs.xoyo.com/forum.php?mod=forumdisplay&fid=7065"
    }*/];

var c = new Crawler({
    maxConnections:10,
    callback:processList
});

function jxsj(error,result,$){
    if(error){
	console.log(error);
	return;
    }
    if(!$){
	console.log("empty");
	return;
    }
    var records = [""];
    $("#threadlisttableid tr").each(function(){
	var tit = $("th a.s.xst",this).text().trim();
	if(!tit) return;
	tit = tit && tit.replace(/[,，\s"]/g,";");
	var view = $("th a.views",this).text();
	var pubtime = $("th div.info em span span",this).text();
	var reply = $("th div.info em.replies",this).text();
	var usr = $("th div.info em",this).eq(1).find("a");
	var url = usr.attr('href');
	var matches = url.match(/uid=(\d+)/);
	var uid = matches && matches.length > 1 && matches[1];
	var name = usr.text().trim();
	name = name && name.replace(/[,，\s"]/g,";");
	var now = new Date().toDatetime();
	records.push([forum.name,tit,uid,name,pubtime,view,reply,now].join());
    });
    
    var r = records.join("\n");
    fs.appendFileSync(resultFile,r);
    console.log(r);
    var nextPageBtn = $("div.pg a.nxt");
    if(nextPageBtn.length>0){
	if(forum.callback){
	    c.queue({uri:result.request.uri.protocol+"//"+result.request.uri.host+"/"+nextPageBtn.attr('href'),callback:forum.callback});
	}else{
	    c.queue(result.request.uri.protocol+"//"+result.request.uri.host+"/"+nextPageBtn.attr('href'));
	}
    }else{
	if(forums.length>0){
	    forum = forums.shift();
	    if(forum.callback){
		c.queue({uri:forum.url,callback:forum.callback});
	    }else{
		c.queue(forum.url);    
	    }
	    //c.queue(forum.url);
	}else{
	    console.log("[DONE]");
	}
    }
}

function processList(error,result,$){
    if(error){
	console.log(error);
	return;
    }
    if(!$){
	console.log("empty");
	return;
    }
    
    var records = [""];
    $("#threadlisttableid tr").each(function(){
	var tit = $("th a.s.xst",this).text().trim();
	tit = tit && tit.replace(/[,，\s"]/g,";");
	var author = $("td.by",this).eq(0).find("cite a");
	var name = author.text();
	name = name && name.replace(/[,，\s"]/g,";");
	if(typeof author.attr('href') == "undefined"){
	    return;
	}
	var matches = author.attr('href').match(/uid=(\d+)/);
	var uid = matches && matches.length>1 && matches[1];
	var pubtime = $("td.by",this).eq(0).find("em>span").text();
	var now = new Date().toDatetime();
	var reply = $("td.num a",this).text();
	var view = $("td.num em",this).text();
	records.push([forum.name,tit,uid,name,pubtime,view,reply,now].join(","));
    });
    var r = records.join("\n");
    fs.appendFileSync(resultFile,r);
    console.log(r);
    var nextPageBtn = $("div.pg a.nxt");
    if(nextPageBtn.length>0){
	if(forum.callback){
	    c.queue({uri:result.request.uri.protocol+"//"+result.request.uri.host+"/"+nextPageBtn.attr('href'),callback:forum.callback});
	}else{
	    c.queue(result.request.uri.protocol+"//"+result.request.uri.host+"/"+nextPageBtn.attr('href'));
	}
	//c.queue(result.request.uri.protocol+"//"+result.request.uri.host+"/"+nextPageBtn.attr('href'));
    }else{
	if(forums.length>0){
	    forum = forums.shift();
	    if(forum.callback){
		c.queue({uri:forum.url,callback:forum.callback});
	    }else{
		c.queue(forum.url);    
	    }
	    //c.queue(forum.url);
	}else{
	    console.log("[DONE]");
	}
    }
}

var forum = forums.shift();
if(forum.callback){
    c.queue({uri:forum.url,callback:forum.callback});
}else{
    c.queue(forum.url);    
}
