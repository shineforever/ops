var http = require('http')
var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')

function Company() {
    console.log('Company worker starting');
    this.doneCount = 0;
    this.todoCount = 0;
    this.failedCount = 0;
    this.pretodoCount = 0;
    this.predoneCount = 0;
    this.company = {};
    this.cmpDir = "../result/58company/";
    this.resultDir = "../result/";
    this.records = [];
    this.preRecords = [];
    this.cmpHost = "http://qy.58.com";
    this.originalFile = "58.original.txt";
    this.companyFile = "58_company.txt";
    this.listFile = '58.list.txt';
    this.ban = false;
    this.files = [];
    this.retry = 0;
    this.dataDir = '../appdata/';
    this.companyDoneFile = "58cmpout.txt";
    this.cityFile = "58.city.txt";
    this.cities = [];
    this.gotCompanys = {};
    this.gotIds = {};
    this.cmpIdFile = "58cmpId.txt";
    this.jobsFile = "58_jobs.txt";
    this.ind = ["244","251","276","277","262","253","255","258","261","269","272","278","3527","245","246","247","248","249","250","252","254","256","257","259","260","263","264","265","266","267","268","270","271","273","274","275","279","280","281","282","283","284","285","286","287"];
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
Company.prototype.init = function () {
    if (fs.existsSync(this.dataDir + this.companyFile)) {
        fs.readFileSync(this.dataDir + this.companyFile).toString().split('\n').forEach(function (line) {
            if (!line || line=='\r') return;
            line = line.replace('\r', '');
            var vals = line.split(',');
            that.company[vals[0]] = { cmpId: vals[0], cmpName: vals[1], member: vals[2], ind: vals[3] };
        });
    } else {
        console.log("Company File not found");
    }
    
    //load done company file
    var cmps = this.doneCompanys = {};
    if (fs.existsSync(this.resultDir + this.companyFile)) {
        fs.readFileSync(this.resultDir + this.companyFile).toString().split("\n").forEach(function (line) {
            if (!line || line == '\r') return;
            line = line.replace('\r', '');
            var vals = line.split(',');
            cmps[vals[0]] = { id: vals[0], name: vals[1], member: vals[2], ind: vals[3] };
        });
    }
    
    console.log("company load done.");
    //load cities from file
    /*
    this.cities = fs.readFileSync(this.dataDir + this.cityFile).toString().split('\n').map(function (line) {
        if (!line) return;
        line = line.replace('\r', '');
        var vals = line.split(',');
        return { cname: vals[0], cen: vals[1] };
    });*/
    console.log("city load done.");
    //load companys that has id and name from cmpIdFile
    /*
    if (fs.existsSync(this.resultDir + this.cmpIdFile)) {
        fs.readFileSync(this.resultDir + this.cmpIdFile).toString().split('\n').reduce(function (pre, cur) {
            if (cur) {
                cur = cur.replace('\r', '');
                var vals = cur.split(',');
                var obj = { id: vals[0], name: vals[1] };
                pre[cur.split(',')[0]] = obj;
            }
            return pre;
        }, this.gotIds);
    }
    */
    console.log("init done.");
    this.cmpOfJobs = {};
    fs.readFileSync(this.resultDir + this.jobsFile).toString().split("\n").forEach(function (line) {
        if (!line) return;
        var fields = line.split(',');
        var url = fields[6];
        var matches = url && url.match(/\/(\d+)\//);
        if (matches && matches.length > 1) {
            var id = matches[1];
            if (!this.doneCompanys[id] && !this.cmpOfJobs[id]) {
                this.cmpOfJobs[id] = { "url": url, "id": Number(id), "name": fields[2],"city":fields[0] };
            }
        }
    },this);
}
Company.prototype.preProcess = function () {
    this.todoCount = this.records.length;
    this.preRecords = [];
    this.records.forEach(function (e) {
        if (e.jing == '是') {
            that.preRecords.push(e);
        }
    });
    this.pretodoCount = this.preRecords.length;
    console.log(this.pretodoCount + " of " + this.todoCount + " item need preprocess");
    
    if (this.preRecords.length > 0) {
        var r = this.preRecords.pop();
        helper.request_data(r.cmpUrl, null, function (data, args) {
            that.filterCmpUrl(data, args);
        }, r);
    } else {
        this.onPreProcessed();
    }
}
Company.prototype.filterCmpUrl = function (data, args) {
    if (data.search('对不起...你的访问过于频繁，请输入验证码继续访问') > -1) {
        this.ban = true;
        this.preRecords.push(args[0]);
        console.log("IP is forbidden");
        this.retry++;
        setTimeout(function () {
            helper.request_data(args[0].cmpUrl, null, function (data, args) {
                setTimeout(function () {
                    that.filterCmpUrl(data, args);
                }, (Math.random() * 9 + 2) * 1000);
            }, r);
        }, 180000 * this.retry);
        return;
    } else {
        this.retry = 0;
        console.log('Preprocessing ' 
		    + (this.predoneCount + 1) 
		    + ' of ' 
		    + this.pretodoCount
);
        var $ = cheerio.load(data);
        args[0].cmpUrl = $('div.company a').attr('href');
        this.predoneCount++;
        if (this.pretodoCount == this.predoneCount) {
            this.onPreProcessed();
        }
        if (this.preRecords.length == 0) {
            this.onPreProcessed();
            return;
        }
        var r = this.preRecords.pop();
        helper.request_data(r.cmpUrl, null, function (data, args) {
            setTimeout(function () {
                that.filterCmpUrl(data, args);
            }, (Math.random() * 9 + 2) * 1000);
        }, r);
    }
}
Company.prototype.onPreProcessed = function () {
    console.log('Preprocess done.');
    this.wget();
}
Company.prototype.wget = function () {
    if (this.records.length == 0) {
        this.onCompleted();
        return;
    }
    var r = null;
    while (this.records.length > 0) {
        var r = this.records.pop();
        if (!r.cmpUrl) continue;
        var m = r.cmpUrl.match(/\/(\d+)\//);
        if (m) {
            r.cmpId = m[1];
            if (this.company[r.cmpId]) {
                r.cmpUrl = this.company[r.cmpId].cmpUrl;
                r.member = this.company[r.cmpId].member;
                r.ind = this.company[r.cmpId].ind;
                r.site = this.company[r.cmpId].site;
                this.save(r);
                r = null;
            }
            else {
                r.cmpUrl = this.cmpHost + "/" + r.cmpId + "/";
                break;
            }
        }
    }
    if (r == null) {
        this.onCompleted();
        return;
    }
    console.log('GET ' + r.cmpUrl);
    helper.request_data(r.cmpUrl, null, function (data, args) {
        that.process(data, args);
    }, r);
}
Company.prototype.process = function (data, args) {
    //fs.writeFileSync(this.cmpDir+args[0].cmpId+".html",data);
    if (data.search('对不起...你的访问过于频繁，请输入验证码继续访问') > -1) {
        this.ban = true;
        console.log("IP is forbidden");
        setTimeout(function () {
            helper.request_data(args[0].cmpUrl, null, function (data, args) {
                setTimeout(function () {
                    that.filterCmpUrl(data, args);
                }, (Math.random() * 9 + 2) * 1000);
            }, r);
        }, 180000 * this.retry);
        return;
    }
    this.retry = 0;
    var $ = cheerio.load(data);
    $('.basicMsg table').each(function () {
        var member = $('.yearIco i', this).text();
        args[0].member = member?member:"否";
        args[0].ind = $('.c33', this).text();
        args[0].site = args[0].cmpUrl;
    });
    this.save(args[0]);
    var wait = (Math.random() * 9 + 2) * 1000;
    setTimeout(function () {
        that.wget();
    }, wait);
}
Company.prototype.save = function (r) {
    var sb = new helper.StringBuffer();
    sb.append(r.cl1);
    sb.append(',');
    sb.append(r.cl2);
    sb.append(',');
    sb.append(r.cl3);
    sb.append(',');
    sb.append(r.city);
    sb.append(',');
    sb.append(r.name);
    sb.append(',');
    sb.append(r.cmpName);
    sb.append(',');
    sb.append(r.cmpId);
    sb.append(',');
    sb.append(r.time);
    sb.append(',');
    sb.append(r.jing);
    sb.append(',');
    sb.append(r.top);
    sb.append(',');
    sb.append(r.member);
    sb.append(',');
    sb.append(r.ind && r.ind.replace(/,/g, ''));
    //    sb.append(',');
    //    sb.append(r.site);
    sb.append('\r\n');
    
    fs.appendFileSync(this.resultDir + this.originalFile, sb.toString());
    
    sb.clear();
    if (!this.company[r.cmpId]) {
        sb.append(r.cmpId);
        sb.append(',');
        sb.append(r.cmpName);
        sb.append(',');
        sb.append(r.member);
        sb.append(',');
        sb.append(r.ind);
        sb.append(',');
        sb.append(r.site);
        sb.append('\r\n');
        fs.appendFileSync(this.dataDir + this.companyFile, sb.toString());
        sb.clear();
        sb = null;
    }
    
    this.doneCount++;
    console.log(this.doneCount + " of " + this.todoCount + ' done');
    if (this.doneCount + this.failedCount == this.todoCount)
        this.onCompleted();
}
Company.prototype.onCompleted = function () {
    //    console.log("next file");
    //    process.send('done');
    //    process.disconnect();
    //    process.exit();
    //    if(this.files.length>0){
    //	this.processList(this.files.pop());
    //    }
    console.log('Work done.');
}
Company.prototype.processList = function (fileName) {
    if (!fs.existsSync(this.resultDir + '58job/' + fileName)) {
        console.log('File not found: ' + fileName);
        return;
    }
    var data = fs.readFileSync(this.resultDir + '58job/' + fileName);
    var $ = cheerio.load(data);
    //    this.records=null;
    //    var records = [];
    $('#infolist dl').each(function (i, e) {
        var record = {};
        record.top = $('a.ding1', this).length == 1?"是":"否";
        record.jing = $('a.jingpin', this).length == 1?"是":"否";
        record.cmpName = $('a.fl', this).attr('title');
        record.cmpUrl = $('a.fl', this).attr('href');
        record.time = $('dd.w68', this).text();
        record.fileName = fileName;
        record.name = $('a.t', this).text();
        var line = record.fileName + ',' + record.name + ',' + record.cmpName + ',' + record.time + ',' + record.jing + ',' + record.top + ',' + record.cmpUrl + '\n';
        fs.appendFileSync(that.dataDir + that.listFile, line);
	//records.push(record);
    });
    
//    this.records=records;
//    this.onRecordsReady();
//    this.lastSendTime=new Date();
//    records=null;
}
Company.prototype.onRecordsReady = function () {
    this.preProcess();
}
var arguments = process.argv.splice(2);
var start = arguments[0];
var len = arguments[1];
Company.prototype.start = function () {
    //    this.files = fs.readdirSync('../result/58job/');
    //    for(var i=0;i<this.files.length;i++){
    //	this.processList(this.files[i]);
    //    }
    //    if(this.files.length>0){
    //	this.processList(this.files.pop());
    //    }
    var records = fs.readFileSync(this.dataDir + this.listFile).toString().split('\n').map(function (line) {
        var vals = line.split(',');
        var record = {};
        record.cl1 = vals[0];
        record.cl2 = vals[1];
        record.cl3 = vals[2];
        record.city = vals[3];
        record.name = vals[5];
        record.cmpName = vals[6];
        record.time = vals[7];
        record.jing = vals[8];
        record.top = vals[9];
        record.cmpUrl = vals[10];
        return record;
    });
    for (var j = start, c = 0; j < records.length && c < len; c++, j++) {
        this.records.push(records[j]);
    }
    console.log("Total count: " + this.records.length);
    this.preProcess();
}
Company.prototype.wgetCompanyList = function (city) {
    console.log("GET %s-%s-%d", city.cen, city.curInd, city.pn);
    var opt = new helper.basic_options('qy.58.com', '/' + city.cen + "_" + city.curInd + '/pn' + city.pn);
    opt.agent = false;
    helper.request_data(opt, null, function (data, args) {
        that.processCompanyList(data);
        if (args[0].mp == undefined) {
            var match = data.match(/mp=(\d+)/);
            args[0].mp = match && Number(match[1]);
            console.log(args[0].cname + " : " + args[0].mp);
        }
        if (args[0].pn < args[0].mp) {
            data = null;
            args[0].pn++;
            setTimeout(function () {
                that.wgetCompanyList(args[0]);
            }, (Math.random() * 0 + 0) * 1000);
        } else if (args[0].ind.length > 0) {
            args[0].curInd = args[0].ind.shift();
            args[0].pn = 1;
            setTimeout(function () {
                that.wgetCompanyList(args[0]);
            }, (Math.random() * 0 + 0) * 1000);
        } else {
            console.log("City done: " + args[0].cname);
            that.startFetchCompanys();
        }
    }, city);
}

Company.prototype.processCompanyList = function (data) {
    if (!data) {
        console.log('data empty.');
        return;
    }
    var $ = cheerio.load(data);
    var cmps = this.gotCompanys;
    $('div.compList ul li span a').each(function () {
        var href = $(this).attr('href');
        var name = $(this).text();
        var match = href.match(/\/(\d+)\//);
        if (match) {
            var id = match[1];
            if (!cmps[id]) {
                fs.appendFile(that.resultDir + that.cmpIdFile, id + "," + name + "\r\n", function (err) {
                    if (err) console.log(err.message);
                });
            } else {
                console.log("Skip %s", id);
            }
        }
    });
    return $("#pager a:last-child").attr('class') == 'next';
}

Company.prototype.startFetchCompanys = function () {
    if (this.cities.length == 0) {
        console.log("All cities done.");
        return;
    }
    var city = this.cities.pop();
    if (!city) city = this.cities.pop();
    city.pn = 1;
    city.ind = this.ind.concat();
    city.curInd = city.ind.shift();
    this.wgetCompanyList(city);
}

Company.prototype.wgetOneCompany = function () {
    if (this.companys.length == 0) {
        console.log("[DONE] job done.");
        return;
    }
    var cmp = this.companys.shift();
    console.log("[GET ] %s", cmp.name);
    var opt = new helper.basic_options('qy.58.com', '/' + cmp.id+"/");
    opt.agent = false;
    helper.request_data(opt, null, function (data, args) {
        that.processOneCompany(data,args);
    }, cmp);
}

Company.prototype.processOneCompany = function (data, args) {
    var $ = cheerio.load(data);
    if ($("h1").text().trim() != "企业名录") {
        $('.basicMsg table').each(function () {
            var member = $('.yearIco i', this).text();
            args[0].member = member?member:0;
            args[0].ind = $('.c33', this).text();
        });
        fs.appendFileSync(this.resultDir + this.companyFile, args[0].id + ','+args[0].city + ',' + args[0].name + ',' + (args[0].member?args[0].member:0) + ',' + (args[0].ind?args[0].ind:"其他") + '\n');
        console.log("[DONE] %s", args[0].name);
    } else {
        console.log("[WARN] company has been deleted");
	     fs.appendFileSync(this.resultDir+this.companyFile,args[0].id+',该公司已经被删除,,\n');
    }
    setTimeout(function () { 
        that.wgetOneCompany();
    }, (Math.random() * 1 + 2) * 1000);
    
}

Company.prototype.startEachCompany = function () {
    console.log("[INFO] Start get each company.");
    this.companys = [];
    for (var key in this.cmpOfJobs) {
        var cur = this.cmpOfJobs[key];
        if (!cur)
            continue;
        
        //this.wgetOneCompany(cur);
        this.companys.push(cur);
    }
    this.wgetOneCompany();
}
var worker = new Company();
var that = worker;
worker.init();
//worker.start();
//worker.startFetchCompanyfs();
worker.startEachCompany();
