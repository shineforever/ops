var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')

function Car() {
    this.dataDir = '../appdata/';
    this.resultDir = '../result/auto/';
    this.host = '.58.com';
    this.lastSendTime = new Date();
    this.cities = [];
    this.cityFile = "58.city.all.txt";
    this.resultFile = '58_ershouchecount_'+new Date().toString()+'.txt';
    this.done={};
    //this.pagePerTask = 100;
}

Car.prototype.init = function(){
    this.cities = fs.readFileSync(this.dataDir+this.cityFile).toString().split('\n').map(function(line){
	if(!line){
	    return null;
	}
	var vals = line.split(',');
	return {name:vals[0],code:vals[1]};
    });
    var arguments = process.argv.splice(2);
    var start = Number(arguments[0]);
    var count = Number(arguments[1]);
    this.cities = this.cities.slice(start,start+count);
    console.log("[INFO] task count: %d",this.cities.length);
}

Car.prototype.start = function(){
    this.init();
    this.wgetList();
}

Car.prototype.wgetList = function(t){
    if(!t){
	var t = null;
	do{
	    t = this.cities.shift();
	}while(t && this.done[t.name] && this.cities.length);
	if(!t){
	    console.log("[DONE] job done.");
	    return;
	}
	t.done=0;
    }
    var path = "/ershouche/";
    if(t.done==1){
	path += "0/";
    }else if(t.done==2){
	path += "1/";
    }

    var opt = new helper.basic_options(t.code+this.host,path);
    console.log("[GET] %s, %s",t.name,opt.path);
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    },t);
}

Car.prototype.processList = function(data,args,res){
    if(!data){
	console.log();
	setTimeout(function(){
	    that.wgetList();
	},3000);
	return;
    }
    
    var $ = cheerio.load(data);
    var count = $(".car_tbfilter tr td .cancelhand .red").text();
    if(args[0].done==0){
	args[0].total = count;
    }else if(args[0].done==1){
	args[0].personal = count;
    }else{
	args[0].audit = count;
    }
    console.log("[DATA] %d",count);
    if(++args[0].done==3){
	fs.appendFileSync(this.resultDir+this.resultFile,[args[0].name,args[0].total,args[0].personal,args[0].audit].join('\t')+"\n");
	setTimeout(function(){
	    that.wgetList();
	},5000);
    }else{
	setTimeout(function(){
	    that.wgetList(args[0]);
	},3000);
    }
}

var instance = new Car();
var that = instance;
that.start();
