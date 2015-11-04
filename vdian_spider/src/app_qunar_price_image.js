var http = require('http')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var entity = require('../models/entity.js')
var proxy = new helper.proxy();
var proxyfile = "verified-2-25.txt";
//proxy.load(proxyfile);

var resultFile = "../result/ota/qunar_imgs/";
var doneFile = "../result/ota/qunar_imgs_done.txt";

var requestCount = 0;
var datafile = "../result/ota/app_qunar_flight.txt";
var arguments = process.argv.splice(2);
var start = Number(arguments[0])-1;
var end = Number(arguments[1]);

var done = {};

fs.readFileSync(doneFile).toString().split("\n").forEach(function(line){
	if(line && line != "") {
		done[line] = true;
	}
});

function downloadImg(filename){
	var lines = fs.readFileSync(filename).toString().split('\n');
	if(end) {
		lines = lines.slice(start, end);
	}
    console.log("%d lines.",lines.length);
	for(var i in lines){
		var vals = lines[i].split(",");
		var len = vals.length;
	    
		if(len!=7) continue;
		if(done[[vals[0],vals[1],vals[2],vals[3]].join(",")]) {console.log("already processed");continue;}
		//var addr = vals[len-1];
		getData(vals);
	}
}
downloadImg(datafile);
function getData(vals){
	//var p = getProxy();
	//http.get({"host":p.host,"port":p.port,"path":"http://m.qunar.com/"+vals[vals.length-1]},function(res){
	http.get("http://m.qunar.com/"+vals[vals.length-1],function(res){
		var chunks = [];
	    res.on('data',function(chunk){
	        chunks.push(chunk);
	    });
	    res.on('end',function(){
	        var buffer = Buffer.concat(chunks);
	        fs.writeFile(resultFile+vals[0]+","+vals[1]+","+vals[2]+","+vals[3].replace(":","-")+","+vals[4].replace(":","-")+","+vals[5]+","+".gif",buffer,function(err){
	        	if(err) {
	        		console.log(err.message);
	        	} else {
	        		fs.appendFileSync(doneFile, [vals[0],vals[1],vals[2],vals[3]].join(",")+"\n");
	        	}
	        });
	    });
	    res.on('error',function(e){
	        console.log(e.message);
	    });
	}).on('error',function(e){
		console.log(e.message);
	});
}
function getProxy(){
  requestCount++;
  if(requestCount==1){
    requestCount=0;
    return proxy.getNext();
  }else{
    requestCount++;
    return proxy.cur();
  }
}

function scanImageFiles(path){
    if(fs.existsSync(path)){
	return fs.readdirSync(path);
    }
    return [];
}
function outputHtmlTag(arr){
    if(!arr) return;
    for(var i=0;i<arr.length;i++){
	var file = arr[i];
	console.log("<img id=\""+file.replace(".gif",'')+"\" src=\""+file+"\" />\r\n");
    }
}

//outputHtmlTag(scanImageFiles("../result/qunar_imgs/"));
