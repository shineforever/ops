var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var jsdom = require('jsdom').jsdom

function Company(){
    console.log('Company worker starting');
    this.doneCount=0;
    this.todoCount=0;
    this.failedCount=0;
    this.pretodoCount=0;
    this.predoneCount=0;
    this.company={};
    this.cmpDir="../result/ganjicompany/";
    this.resultDir="../result/";
    this.records=[];
    this.preRecords=[];
    this.cmpHost="www.ganji.com/gongsi";
    this.originalFile = "ganji.original.txt";
    this.companyFile = "ganji.company.txt";
    this.failedFile = "ganji.company.txt";
}
/*
{ name: '酒店诚聘男女服务员包食宿',
  jing: '否',
  top: '否',
  cmpName: '北京酷乐嘉华休闲健身娱乐有限公司',
  time: '今天',
  cmpUrl: 'http://qy.58.com/15278344077830/',
  fileName: '生活 | 服务业,餐饮,服务员,北京,1.html'
};
*/
Company.prototype.init=function(){
    var that = this;
    if(fs.existsSync(this.resultDir+this.companyFile)){
	fs.readFileSync(this.resultDir+this.companyFile).toString().split('\r\n').forEach(function(line){
	    if(!line) return;
	    var vals = line.split(',');
	    that.company[vals[0]] = {cmpId:vals[0],cmpName:vals[1],member:vals[2],ind:vals[3],site:vals[4]};
	});
    }
    
    process.on('message',function(msg){
	that.records=msg;
	that.todoCount = that.records.length;
	that.wget();
    });
}
Company.prototype.wget=function(){
    if(this.records.length==0) return;
    var r = null;
    while(this.records.length>0){
	var r=this.records.pop();
	var m = r.cmpUrl.match(/\/(\d+)\//);
	if(m){
	    r.cmpId = m[1];
	    if(this.company[r.cmpId]){
		r.ind = this.company[r.cmpId].ind;
		this.save(r);
		r=null;
	    }
	    else{
		console.log("GET "+r.cmpUrl);
		var that = this;
		helper.request_data(r.cmpUrl,null,function(data,args){
		    that.process(data,args);
		},r);
	    }
	}
    }
}

Company.prototype.process = function(data,args){
//    console.log("Processing "+args[0].cmpName);
    //fs.writeFileSync(this.cmpDir+args[0].cmpId+".html",data);
    var match = data.match(/公司行业：([^l]+)/);
    if(!match){
	console.log('Page unavaliable: ',args[0]);
	fs.appendFileSync(this.resultDir+this.failedFile,args[0].cmpUrl+'\r\n');
	this.failedCount++;
	return;
    }
    args[0].ind = match[1].replace(/[<\/\em,>\s]/g,'');
    this.save(args[0]);
}
Company.prototype.save=function(r){
    var sb = new helper.StringBuffer();
    sb.append(r.fileName.replace(/,\d+\.html/,''));
    sb.append(',');
    sb.append(r.name);
    sb.append(',');
    sb.append(r.cmpName);
    sb.append(',');
    sb.append(r.cmpId);
    sb.append(',');
    sb.append(r.time);
    sb.append(',');
    sb.append(r.hot);
    sb.append(',');
    sb.append(r.top);
    sb.append(',');
    sb.append(r.adTop);
    sb.append(',');
    sb.append(r.member);
    sb.append(',');
    sb.append(r.ind);
    sb.append(',');
    sb.append(r.cmpUrl);
    sb.append('\r\n');

    fs.appendFileSync(this.resultDir+this.originalFile,sb.toString());

    sb.clear();
    if(!this.company[r.cmpId]){
	this.company[r.cmpId] = {cmpId:r.cmpId,cmpName:r.cmpName,member:r.member,ind:r.ind,site:r.cmpUrl};
	sb.append(r.cmpId);
	sb.append(',');
	sb.append(r.cmpName);
	sb.append(',');
	sb.append(r.member);
	sb.append(',');
	sb.append(r.ind);
	sb.append(',');
	sb.append(r.cmpUrl);
	sb.append('\r\n');
	fs.appendFileSync(this.resultDir+this.companyFile,sb.toString());
	sb.clear();
	sb=null;
    }
    this.doneCount++;
    console.log(this.doneCount+" of "+this.todoCount+' done');
    if(this.doneCount+this.failedCount==this.todoCount)
	this.onCompleted();
}
Company.prototype.onCompleted=function(){
    console.log("Worker done, exit");
    process.exit();
}

var worker = new Company();
worker.init();
