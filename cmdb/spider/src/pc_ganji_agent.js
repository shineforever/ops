var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')
var http = require('http')

function Agent() {
    this.resultDir = "../result/";

    this.dataDir = '../appdata/';
    this.cityFile = "ganji.city.txt";
    this.cities = {};

    this.done = {};
}

Agent.prototype.init = function () {
    var arguments = process.argv.splice(2);
    var start = Number(arguments[0]);
    var len = Number(arguments[1]);
    this.recordFile = arguments[2] || "ganji_rent.txt";
    this.agentFile = this.recordFile+"_agent.txt";
    
    if (fs.existsSync(this.resultDir + this.agentFile)) {
        fs.readFileSync(this.resultDir + this.agentFile).toString().split('\n').forEach(function (line) {
            if (!line || line=='\r') return;
            line = line.replace('\r', '');
            var vals = line.split(',');
            that.done[vals[0]] = true;
        });
    } else {
        console.log("[WARN] Agent File not found");
    }
    
    fs.readFileSync(this.dataDir + this.cityFile).toString().split('\n').reduce(function(pre,cur){
	if (cur) {
            cur = cur.replace('\r', '');
            var vals = cur.split(',');
            var obj = { name: vals[0], code: vals[1] };
            pre[obj.name] = obj;
        }
        return pre;
    },this.cities);
    
    console.log("init done.");
    this.tasks = [];
    fs.readFileSync(this.resultDir + this.recordFile).toString().split("\n").forEach(function (line) {
        if (!line) return;
        var fields = line.split(',');
	if(fields[5]>0){
	    var t =  { "postPath": fields[1], "member":fields[5],"city":fields[2]};
	    this.tasks.push(t);
	}
    },this);
    
    //前闭后开区间
    this.tasks = this.tasks.slice(start,start+len);
    
    console.log("[INFO] task count: %d",this.tasks.length);
}
Agent.prototype.wgetOneAgent = function () {
    if (this.tasks.length == 0) {
        console.log("[DONE] job done.");
        return;
    }
    var t = {};
    do{
	t = this.tasks.shift();
    }while(!t || (t&&this.done[t.postPath]))
    
    console.log("[GET ] %s",JSON.stringify(t));
    var code = this.cities[t.city].code;
    var opt = new helper.basic_options(code+'.ganji.com',t.postPath);
    opt.agent = new http.Agent();
    opt.agent.maxSockets=1;
    //opt.agent = false;
    helper.request_data(opt, null, function (data, args,res) {
        that.processOneAgent(data,args,res);
    }, t);
}

Agent.prototype.processOneAgent = function (data, args, res) {
    if(!data){
	console.log("[ERROR] no data.");
	setTimeout(function () {
            that.wgetOneAgent();
	}, (Math.random() * 3 + 4) * 1000);
	this.done[args[0].postPath] = true;
	fs.appendFileSync(this.resultDir + this.agentFile,args[0].postPath+"\n");
	return;

    }
    if(res.statusCode==404){
	console.log("[WARN] page not found");
	setTimeout(function () {
            that.wgetOneAgent();
	}, (Math.random() * 3 + 4) * 1000);
	this.done[args[0].postPath] = true;
	fs.appendFileSync(this.resultDir + this.agentFile,args[0].postPath+'\n');
	return;
    }
    if(data.search("您的访问速度太快了")>-1){
	console.log("[ERROR] IP banned.");
	return;
    }
    var $ = cheerio.load(data);
    
    var personUrl = $("div.person-name span a").attr("href");
    args[0].name = $("div.person-name span").text().trim();
    args[0].cmp = $("p.company-name").text().trim();
    args[0].url = personUrl;
    var matches = personUrl && personUrl.match(/fang_(\d+)/);
    if(matches && matches.length>1){
	args[0].id = matches[1];
    }
    
    var record = args[0].postPath+','+(args[0].id||"") + ','+args[0].city + ',' + args[0].name + ',' + (args[0].member) + ',' + args[0].cmp + '\n';
    fs.appendFileSync(this.resultDir + this.agentFile,record);
    this.done[args[0].postPath] = true;
    console.log("[DONE] %s",record);
    setTimeout(function () {
        that.wgetOneAgent();
    }, (Math.random() * 3 + 4) * 1000);
}

Agent.prototype.startEach = function () {
    console.log("[INFO] Start get each agent.");
    this.wgetOneAgent();
}
var worker = new Agent();
var that = worker;
worker.init();
worker.startEach();
