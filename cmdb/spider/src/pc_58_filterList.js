var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var jsdom = require('jsdom').jsdom
var cheerio = require('cheerio')

function filterList(){
    this.files=[];
    this.resultDir="../result/58job/real/";
    this.listFile='58.list.txt';
}
filterList.prototype.processList=function(fileName){
    if(!fs.existsSync(this.resultDir+fileName)){
	console.log('File not found: ' + fileName);
	return;
    }
    var data = fs.readFileSync(this.resultDir+fileName);
    var $ = cheerio.load(data);
    var that=this;
    $('#infolist dl').each(function(i,e){
	var record={};
	record.top=$('a.ding1',this).length==1?"是":"否";
	record.jing=$('a.jingpin',this).length==1?"是":"否";
	record.cmpName=$('a.fl',this).attr('title');
	record.cmpUrl = $('a.fl',this).attr('href');
	record.time = $('dd.w68',this).text();
	record.fileName = fileName;
	record.name=$('a.t',this).text();
	var line = record.fileName+','+record.name+','+record.cmpName+','+record.time+','+record.jing+','+record.top+','+record.cmpUrl+'\n';
	fs.appendFileSync('../result/'+that.listFile,line);
    });
}
filterList.prototype.start=function(){
    this.files = fs.readdirSync(this.resultDir);
    for(var i=0;i<this.files.length;i++){
	this.processList(this.files[i]);
    }
}
var f = new filterList();
f.start();