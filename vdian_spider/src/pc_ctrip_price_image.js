var http = require('http')
var zlib = require('zlib')
var fs = require('fs')
var helper = require('./helpers/webhelper.js')
var $ = require('jquery')
var entity = require('./models/entity.js')

function ctripPriceImageProcessor(path){
    this.htmlPath = path;
    this.htmlFiles = [];
    this.doneCssFiles = {};
    this.doneImgFiles = {};
 }

ctripPriceImageProcessor.prototype.scanHtmlFiles=function(){
    if(fs.existsSync(this.htmlPath)){
	return fs.readdirSync(this.htmlPath);
    }
}
ctripPriceImageProcessor.prototype.scanCssFiles = function(){
    this.cssPath = this.htmlPath+"/css";
    if(fs.existsSync(this.cssPath)){
	return fs.readdirSync(this.cssPath);
    }
}
ctripPriceImageProcessor.prototype.filterCssAddr=function(html){
    var addr = '';
    try{
	$(html).find("link[rel|=stylesheet]").each(function(idx,style){
	    var link = $(this).attr("href");
	    if(link.search(/h57/i)==-1)
		return;
	    else{
		addr = link;
	    }
	});
    }
    catch(e){
	console.log(e.message);
    }
    return addr;
}
ctripPriceImageProcessor.prototype.filterImgAddr=function(content){
    if(!content) return;
    var matches = content.match(/http:\/\/[\w\.\-\/]+/);
    return matches&&matches[0];
}

ctripPriceImageProcessor.prototype.downloadImg=function(addr,id){
    if(!addr||!id) return;
    var path = this.htmlPath;
    var doneImgFiles = this.doneImgFiles;
    http.get(addr,function(res){
	var chunks = [];
	res.on('data',function(chunk){
	    chunks.push(chunk);
	});
	res.on('end',function(){
	    var buffer = Buffer.concat(chunks);
	    fs.writeFile(path+"/img/"+id+".gif",buffer,function(err){
		if(err)
		    console.log(err.message);
		else{
		    doneImgFiles[id]=true;
		    console.log("done img: "+id);
		    fs.appendFile(path+"/doneImgFiles.txt",id+"\r\n",function(err){
			if(err)
			    console.log(err.message);
		    });
		}
	    });
	});
    }).on("error",function(e){
	console.log(e.message);
    });

}
ctripPriceImageProcessor.prototype.downloadCss=function(addr,id){
    if(!addr||!id) return;
    var that = this;
    http.get(addr,function(res){
	var chunks = [];
	res.on('data',function(chunk){
	    chunks.push(chunk);
	});
	res.on('end',function(){
	    var buffer = Buffer.concat(chunks);
	    fs.writeFile(that.htmlPath+"/css/"+id+".css",buffer,function(err){
		if(err)	console.log(err.message);
		else{
		    that.doneCssFiles[id]=true;
		    fs.appendFile(that.htmlPath+"/doneCssFiles.txt",id+"\r\n",function(err){});
		    console.log("done css: "+id);
		}
	    });
	});

    }).on("error",function(e){
	console.log(e.message);
    });
}

ctripPriceImageProcessor.prototype.loadImgDoneFiles = function(){
    var filename = this.htmlPath+"/doneImgFiles.txt";
    if(!fs.existsSync(filename)){
	return;
    }
    var lines = fs.readFileSync(filename).toString().split("\r\n");
    var that = this;
    lines.forEach(function(ele,idx,arr){
	if(!ele) return;
	that.doneImgFiles[ele]=true;
    });
}

ctripPriceImageProcessor.prototype.loadCssDoneFiles=function(){
    var filename= this.htmlPath+"/doneCssFiles.txt";
    if(!fs.existsSync(filename))
	return;
    var lines = fs.readFileSync(filename).toString().split("\r\n");
    var that = this;
    lines.forEach(function(ele,idx,arr){
	if(!ele) return;
	that.doneCssFiles[ele]=true;
    });
}

ctripPriceImageProcessor.prototype.start = function(){
    this.loadCssDoneFiles();
    this.htmlFiles = this.scanHtmlFiles();
    var that = this;
    var counter = 0;
    this.htmlFiles.forEach(function(element, index, array){
	if(!element||element.indexOf(".html")==-1)
	    return;
	var id = element.replace(".html",'');
	if(that.doneCssFiles[id])
	    return;
	counter++;
	if(counter>500) return;
	var content = fs.readFileSync(that.htmlPath+"/"+element).toString();
	//var url = that.filterCssAddr(content);
	var url = content;
	that.downloadCss(url,id);
    });
}

ctripPriceImageProcessor.prototype.startImg = function(){
    this.loadImgDoneFiles();
    this.cssFiles = this.scanCssFiles();
    var that = this;
    var counter=0;
    this.cssFiles.forEach(function(ele,idx,arr){
	if(!ele||ele.indexOf(".css")==-1)
	    return;
	var id = ele.replace(".css",'');
	if(that.doneImgFiles[id])
	    return;
	counter++
	if(counter>1000) return;
	var content = fs.readFileSync(that.cssPath+"/"+ele).toString();
	var url = that.filterImgAddr(content);

	that.downloadImg(url,id);
    });
    
}
var processor = new ctripPriceImageProcessor("htmlfiles");
//processor.start();
processor.startImg();
