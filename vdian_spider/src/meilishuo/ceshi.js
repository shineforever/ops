var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var cheerio = require('cheerio')

function Meilishuo() {
	this.resultDir = 'C:/Users/Cheng.Qu/Desktop/2015.03.23-03.27/meilishuo/';
	this.dealidFile = '';
	this.itemFile = '';
	this.shopFile = '';
}

Meilishuo.prototype.init = function() {
	var arguments = process.argv.splice(2);
    this.name = arguments[0];
    this.dealidFile = 'meilishuo.' + this.name + '.dealid.txt';
    this.itemFile = 'meilishuo.' + this.name + '.item.txt';
    this.shopFile = 'meilishuo.' + this.name + '.shop.txt';

    this.tasks = [];
    this.tasks.push({'dealid':3426084621});
    this.tasks.push({'dealid':3412271229});
    this.tasks.push({'dealid':3455701051});

    console.log("[INFO] task count: %d",this.tasks.length);
}

Meilishuo.prototype.start = function(){
    // this.init();
    // this.wgetItemHtml(this.tasks[0]);
    var a = {'dealid':123}
    a.data = 123
    console.log(a)
}

Meilishuo.prototype.wgetItemHtml = function(t){
    if(!t){
        if(this.tasks.length==0){
            console.log("job done.");
            return;
        }
        t = this.tasks.shift();
        console.log('task left: %d', this.tasks.length);
    }
    var opt = new helper.basic_options("www.meilishuo.com", "/share/item/" + t.dealid);
    opt.agent = false;
    console.log("[GET dealid:] %s", t.dealid);
    helper.request_data(opt,null,function(data,args,res){
    	// that.getFirstDealPage(data,args,res);
        // fs.appendFileSync(that.resultDir + that.itemFile, args + '\n\n\n')
        // fs.appendFileSync(that.resultDir + that.itemFile, data + '\n\n\n')
        // fs.appendFileSync(that.resultDir + that.itemFile, res + '\n\n\n')
        console.log(args[0].dealid)
    },t);
}

var instance = new Meilishuo();
var that = instance;
that.start();