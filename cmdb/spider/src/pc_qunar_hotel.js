var fs = require('fs')
var cheerio = require('cheerio')
var entity = require('../models/entity.js')
var moment = require("moment")

var args = process.argv.splice(2);

function QunarHotel(){
    this.files=[];
    this.today = moment().format("YYYY-MM-DD");
    this.resultFile="pc_qunar_room_"+this.today+".txt";
    this.resultDir="../result/ota/";
    this.htmlDir = 'qunar_hotel/';
    this.doneFile = "pc_qunar_hotel_"+this.today+".txt";
}

QunarHotel.prototype.load=function(){
    if(!fs.existsSync(this.resultDir+this.htmlDir)){
	console.log("qunar_hotel dir not found");
	return;
    }
    
    this.files = fs.readdirSync(this.resultDir+this.htmlDir);
    console.log("file count: %d",this.files.length);
}

QunarHotel.prototype.filterData=function(){
    if(this.files.length==0) return;
    console.log(this.files.length + " files to do");
    for(var i=0;i<this.files.length;i++){
	var hotel = new entity.hotel();
	var names = this.files[i].split('-');
	hotel.city = names[0];
	hotel.id = names[1];
	var f = this.resultDir+this.htmlDir+this.files[i];
	
	var $ = cheerio.load(fs.readFileSync(f).toString());
	hotel.name = $("div.htl-info h2 span").text().trim();
	hotel.star = $("div.htl-info h2 em").attr("title");
	var href = $("link[rel$='canonical']").attr('href');
	var m = href && href.match(/([^\/]+\/[a-zA-Z\-\d]+)\/$/);
	//hotel.id = m && m[1];
	if(!hotel.id) continue;
	hotel.commentCount = $("a#jt_comments em").text().trim();
	hotel.points = $("div.score_mt span.score b").text().trim();
	
	if($('.room-item-inner table.tbl-room-quote > tbody > tr').length>0){
	    $('.room-item-inner table.tbl-room-quote > tbody > tr').each(function(){
		var r = new entity.room();
		r.name = $('td.d1 div.rtype h2',this).text().replace(/[\s,]/g,'');
		r.bedType = $('td.d1 div.rtype p.room-area cite.bed span',this).text().replace(/[\s,]/g,'')
		r.book = [];
		$("td.d2 div.room-type-default tr.lowest-price").each(function(){
		    var s={};
		    s.name = $('td.e1 img',this).attr('alt');
		    s.roomTitle = $('td.e2 div',this).text().replace(/[\s,]/g,'');
		    s.breakfast = $('td.e4',this).text().replace(/[\s,]/g,'');
		    s.price = $('td.e6 div.dprice.origin-price .sprice',this).text().replace(/[,\s]/g,'');
		    s.fan = $("td.e6 div.dprice.origin-price .tprice",this).text();
		    s.prePay = $('td.e8 .icon-advpayment',this).length;
		    s.lan = $("i.icon-broadband",this).attr('title');
		    r.book.push(s);
		});
		hotel.rooms.push(r);
	    });
	}
	else if($(".htl-type-list li").length>0){
	    $(".htl-type-list li").each(function(){
		var r = new entity.room();
		r.name = $("div.type-title table tr td span.type-name",this).text();
		r.name = r.name && r.name.trim().replace(/[,]/g,';');
		var cites = $("div.type-title table tr td p.faclity span cite",this);
		r.bedType = cites.eq(3).text().trim().replace(/,/g,';');
		//r.lan = cites.eq(4).text().trim()+";"+cites.eq(5).text().trim();
		r.book=[];
		$(".similar-type-agent-list .similar-type-agent-item table:first-child tr",this).each(function(){
		    var s = {};
		    s.name = $("td.c1 div.profile-tit",this).text();
		    s.name = s.name && s.name.replace(/[,]/g,';');
		    s.roomTitle = $("td.c3 div.js-order-detail",this).text().replace(/,/g,';');
		    s.prePay = $("td.c3 div.js-service-item span cite",this).text();
		    s.price = "¥"+$("td.c6 p.final-price b.pr",this).text();
		    s.fan = $("td.c6 span.fan",this).text();
		    s.lan = $("td.c5 .you-inter",this).text().trim();
		    s.breakfast = $("td.c4 .breakfast-yes",this).text().trim();
		    r.book.push(s);
		});
		hotel.rooms.push(r);
	    });
	}
	else if($("ul.e_prcDetail_ulist li").length>0){
	    $("ul.e_prcDetail_ulist li").each(function(){
		var r = new entity.room();
		r.name = $("span.enc2",this).text();
		r.name = r.name && r.name.trim().replace(/[,]/g,';');
		r.book=[];
		$(".e_prcDetail_item table:first-child",this).each(function(){
		    var s = {};
		    s.name = $(".td1 .profile_tips .prf_tit",this).text();
		    s.name=s.name&&s.name.replace(/[,]/g,';');
		    s.price = $(".td4 div.ht_prc p.h2_pirce",this).text();
		    //console.log($(ele).find(".td4 div.ht_prc p.h2_pirce b.pr").length);
		    //console.log(r.name+","+s.name+","+s.price);
		    s.fan = $(".td4 div.ht_prc a span.fan em.pr",this).text();
		    r.book.push(s);
		});
		hotel.rooms.push(r);
	    });
	}else{
	    $("ul.e_agentslist li").each(function(){
		var r = new entity.room();
		r.name = $("span.enc2",this).text();
		r.name = r.name && r.name.replace(/[,]/g,';');
		r.book = [];
		$(".e_prcDetail_item table:first-child",this).each(function(){
		    var s = {};
		    s.name = $(".td1 .profile_tips .prf_name",this).text();
		    s.name=s.name && s.name.replace(/[,]/g,';');
		    s.price = $(".td4 div.ht_prc p.h2_pirce",this).text();
		    s.fan = $(".td4 div.ht_prc a span.fan em.pr",this).text();
		    r.book.push(s);
		});
		hotel.rooms.push(r);
	    });
	}
	fs.appendFileSync(this.resultDir+this.doneFile,[hotel.city,hotel.id,hotel.name,hotel.star,hotel.commentCount,"\n"].join());
	fs.appendFileSync(this.resultDir+this.resultFile,hotel.toString("qunar_pc"));
	console.log("["+(i+1)+"].");
    }
}

var qunar = new QunarHotel();
qunar.load();
qunar.filterData();
