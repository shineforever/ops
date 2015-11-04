var fs = require('fs')
var http = require('http')
var url = require('url')
function downloadImg(filename){
    var lines = fs.readFileSync(filename).toString().split('\n');
    for(var i in lines){
	var vals = lines[i].split(",");
	//var len = vals.length;
	//if(len!=6) continue;
	//var addr = vals[len-1];
	getData(vals);
    }
}
downloadImg("../result/pc_lefeng_sc.txt");
function getData(vals){
    if(!vals[5]) return;
    http.get(vals[5],function(res){
	var chunks = [];
	res.on('data',function(chunk){
	    chunks.push(chunk);
	});
	res.on('end',function(){
	    var buffer = Buffer.concat(chunks);
	    fs.writeFile("../result/lefengPrice/"+vals[3]+".png",buffer,function(err){
	        if(err) console.log(err.message);
	    });
	});
	res.on('error',function(e){
	    console.log(e.message);
	});
    }).on('error',function(e){
	console.log(e.message);
    });
}
