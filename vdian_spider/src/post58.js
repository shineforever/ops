var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')
var arguments = process.argv.splice(2);
var originalFile = arguments[0];
var companyFile = arguments[1];
var companyOutFile = arguments[2];
var originalOutFile = arguments[3];

function Post58(){
    this.originalDic = [];
    this.companyDic={};
}

Post58.prototype.mergeToOriginal = function(){
    console.log(this.originalDic.length);
    for(var i=0;i<this.originalDic.length;i++){
	if(!this.originalDic[i][10]){
	    var id = this.originalDic[i][6];
	    if(id&&this.companyDic[id]){
		this.originalDic[i][10]=this.companyDic[id].member;
		this.originalDic[i][11]=this.companyDic[id].ind;
	    }
	}
	fs.appendFileSync(originalOutFile,this.originalDic[i].join(',')+'\r\n');
    }
    
}
Post58.prototype.nextUavaliable=function(){
    for(var k in this.companyDic){
	if(!k) continue;
	if(!this.companyDic[k].member||!this.companyDic[k].ind)
	    return this.companyDic[k];
    }
}

Post58.prototype.wget=function(){
    var r = this.nextUavaliable();
    if(!r) {
	console.log("All companys done.");
	return;
    }

    var url = "http://qy.58.com/"+r.id+'/';
    console.log('GET ' + url);
    var that = this;
    var fn=function(data,args){
	var $ = cheerio.load(data);
	$('.basicMsg table').each(function(){
	    var member = $('.yearIco i',this).text();
	    args[0].member = member?member:"否";
	    args[0].ind=$('.c33',this).text();
	});
	$=null;
	if(!args[0].member) args[0].member='N/A';
	if(!args[0].ind) args[0].ind='N/A';
	that.save(args[0]);
	setTimeout(function(){
	    that.wget();
	},(Math.random()*9+2)*1000);
    }
    helper.request_data(url,null,fn,r);
}
Post58.prototype.downLoadCompany=function(){

}
Post58.prototype.save=function(r){
    var sb = new helper.StringBuffer();
    sb.append(r.id);
    sb.append(',');
    sb.append(r.name);
    sb.append(',');
    sb.append(r.member);
    sb.append(',');
    sb.append(r.ind);
    sb.append('\r\n');
    fs.appendFileSync(companyOutFile,sb.toString());
    sb.clear();
    sb=null;
}
Post58.prototype.load = function(){
    if(!fs.existsSync(originalFile) || !fs.existsSync(companyFile)){
	console.log("File not found");
	return;
    }
    var lines = fs.readFileSync(originalFile).toString().split('\r\n');
    for(var i=0;i<lines.length;i++){
	if(!lines[i]) continue;
	this.originalDic.push(lines[i].split(','));
    }
    var companys = fs.readFileSync(companyFile).toString().split('\r\n');

    for(var j=0;j<companys.length;j++){
	if(!companys[j]) continue;
	var c = companys[j].split(',');
	if(!c[0]) continue;
	this.companyDic[c[0]]={id:c[0],name:c[1],member:c[2],ind:c[3]};
    }
    //output all companys when done.
    //for(var k in this.companyDic){
	//var c=this.companyDic[k];
	//fs.appendFileSync(companyOutFile,c.id+','+c.name+','+c.member+','+c.ind+'\r\n');
    //}
}

var ps = new Post58();
ps.load();
//ps.wget();
ps.mergeToOriginal();