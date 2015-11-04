var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require("cheerio")
var entity = require('../models/entity.js')

var dirPath = "../result/qunar_flight/";
var resultFile = "../result/pc_qunar_flight.txt";
//var data = fs.readFileSync("北京,上海,2014-3-2,3.html").toString();


function start(){
    var files = scanFiles(dirPath);
    for(var i=0;i<files.length;i++){
	var data = fs.readFileSync(dirPath+files[i]).toString();
	var args = files[i].split(',');
	args.splice(1,1,args[1].match(/[^\d]+/)[0]);

	console.log("["+(i+1)+"]load file: "+args[0]+"-"+args[1]);

	var flightsPath = "#hdivResultPanel div.avt_column div.b_avt_lst ";
	var $ = cheerio.load(data);
	$(flightsPath).each(function(i,item){
	    if($("div.avt_trans",this).length>0) return;
	    var fl = new entity.flight();
	    fl.dname = args[0];
	    fl.aname = args[1];
	    fl.daname = $(" div.c3 div.a_lacal_dep",this).text();
	    fl.aaname = $(" div.c3 div.a_local_arv",this).text();
	    fl.flightNo = $(" div.c1 div.a_name strong",this).text();
	    var priceNodes = $("div.c6 div.a_low_prc span.prc_wp em.prc b",this);
	    fl.price = handlePrice(priceNodes,$);
	    fl.dTime = $(" div.c2 div.a_tm_dep",this).text();
	    fl.aTime = $(" div.c2 div.a_tm_arv",this).text();

	    fs.appendFileSync(resultFile,fl.toString("qunar_pc"));
	});
    }
}

function handlePrice(priceNodes,fn){
    var num = [];
    for(var i=0;i<priceNodes.length;i++){
	var st = fn(priceNodes[i]).attr("style");
	var offset = st.match(/left:-(\d{2})px/)[1];
	var val = fn(priceNodes[i]).text();
	offset = Number(offset)/11*-1;
	if(i==0){
	    num = val.split("");
	}else{
	    num.splice(offset,1,val);
	}
    }
    return num.join('');
}

function scanFiles(path){
    if(fs.existsSync(path)){
	return fs.readdirSync(path);
    }
    return [];
}

start();