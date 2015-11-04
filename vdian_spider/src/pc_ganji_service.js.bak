var fs = require('fs')
var http = require('http')
var querystring = require('querystring')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')

function Rent() {
    this.dataDir = '../appdata/';
    this.resultDir = '../result/';
    this.cities = [];
    this.cityFile = 'ganji.city.txt';
    this.services = [];
    this.serviceFile = "ganji.service.txt";
    this.resultFile = 'ganji_service.txt';
    this.pagePerTask = 100;
}

Rent.prototype.init = function(){
    //load city from file
    this.cities = fs.readFileSync(this.dataDir+this.cityFile).toString().split('\n').filter(function (line,i) {
        if (i > 11) return false;
        return true;
    }).map(function (line) {
        if(!line) return;
        line = line.replace('\r', '');
        var vals = line.split(',');
        return { cname: vals[0], cen: vals[1] };
    });

    //load service category file
    this.services = fs.readFileSync(this.dataDir+this.serviceFile).toString().split('\n').map(function (line) {
        if(!line) return;
        line = line.replace('\r', '');
        var vals = line.split(',');
        return {"cat1_name": vals[0], "cat2_name": vals[1], "cat2_ename": vals[2], "class": vals[3]};
    });

    //add service task
    this.tasks = [];
    for(var i=0; i< this.cities.length;i++){
        var city = this.cities[i];
        for(var j=0;j<this.services.length;j++){
            var service = this.services[j];
            if (!service) continue;
            var tmp = {"cityName":city.cname,"cityPinyin":city.cen,"cat1_name":service.cat1_name,"cat2_name":service.cat2_name,"cat2_ename":service.cat2_ename,"class":service.class};
            this.tasks.push(tmp);
        }
    }

    var arguments = process.argv.splice(2);
    var start = Number(arguments[0]);
    var len = Number(arguments[1]);
    //前闭后开区间
    this.tasks = this.tasks.slice(start,start+len);
    console.log("[INFO] task count: %d",this.tasks.length);
}

Rent.prototype.start = function(){
    this.init();
    this.wgetList();
}

Rent.prototype.wgetList = function(t){
    if(!t){
        if(this.tasks.length==0){
            console.log("job done.");
            return;
        }
        t = this.tasks.shift();
        t.pn = 1;
        console.log('task left: %d', this.tasks.length);
    }
    var pinyin = t.regionPinyin || t.districtPinyin;
    var name = t.regionName || t.districtName;
    var opt = new helper.basic_options(t.cityPinyin+".ganji.com","/"+t.cat2_ename+"/o"+t.pn+"/");
    opt.agent = false;
    console.log("[GET ] %s, %s, %s, %d",t.cityName,t.cat1_name,t.cat2_name,t.pn);
    helper.request_data(opt,null,function(data,args,res){
    	that.processList(data,args,res);
    },t);
}

Rent.prototype.processList = function(data,args,res){
    if(!data){
        console.log("data empty.");
        if(t.class== '1') {
            console.log("[DONE] Category: " + t.category);
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 4 + 2) * 1000);
        } else {
            t.pn++;
            setTimeout(function () {
                that.wgetList(t);
            }, (Math.random() * 4 + 2) * 1000);
        }
    }
    t = args[0]

    var $ = cheerio.load(data);
    var memberCount = 0;

    script = $('script:contains("GOOGLE_ANA_CODE")').text().trim();
    json_string = script.match(/(\{.*?\}) \|\|/);
    if(!json_string){
        t['html'] = data;
        t['user_info'] = [];
        t['json_data'] = [];
        t['ajax_tasks'] = [];
        that.processAjaxTasks(t);
    }else {
        json_data = JSON.parse(json_string[1]);
        json_task = ['bidding_post_ids', 'sticky_post_ids', 'bang_post_ids', 'fee_post_ids', 'normal_post_ids', 'hot_post_ids', 'ding_post_ids', 'jing_post_ids'];
        ajax_tasks = [];
        for(var i=0; i<json_task.length; i++) {
            if(json_data[json_task[i]]){
                ajax_tasks.push(json_task[i]);
            }
        }
        t['html'] = data;
        t['user_info'] = [];
        t['json_data'] = json_data;
        t['ajax_tasks'] = ajax_tasks;
        that.processAjaxTasks(t);
    }
}

Rent.prototype.processAjaxTasks = function(t){
    if(t['ajax_tasks'].length == 0){
        that.processData(t);
    } else {
        ajax_task = t['ajax_tasks'][0];
        post_data = t['json_data'][ajax_task];
        if (t.cat1_name == '教育培训')
            post_data['module'] = 'training_auth_new';
        else
            post_data['module'] = 'service_auth';
        post_data['__hash__'] = json_data['__hash__'];
        //var opt = new helper.basic_options(t.cityPinyin+".ganji.com","/ajax.php",'POST',false,true,post_data);
        //opt.agent = false;
        //helper.request_data(opt,post_data,function(data,args,res){
        //	that.processAjaxRequest(data,args,res);
        //},t);
        var post_data = querystring.stringify(post_data);
        var options = {
            host:'bj.ganji.com',
            path:'/ajax.php',
            method:'POST',
            port:80,
            headers:{
                'Content-Length':post_data.length,
                'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'
            }
        }
        var req = http.request(options, function(res){
            res.setEncoding('utf8');
            var chunks = [];
            res.on('data', function(chunk){
                chunks.push(chunk);
            })
            res.on('end',function(){
                that.processAjaxRequest(chunks,t,res);
            });
        })
        req.write(post_data + '\n');
        req.end();
    }
}

Rent.prototype.processAjaxRequest = function(chunks,t,res){
    if(!chunks){
        console.log("chunk empty.");
        if(t.class== '1') {
            console.log("[DONE] Category: " + t.category);
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 4 + 2) * 1000);
        } else {
            t.pn++;
            setTimeout(function () {
                that.wgetList(t);
            }, (Math.random() * 4 + 2) * 1000);
        }
    } else {
        var buffer = chunks.join('');
        ajax_task = t['ajax_tasks'].shift();
        t['user_info'].push(buffer);
        if(t['ajax_tasks'].length > 0){
            that.processAjaxTasks(t);
        } else {
            that.processData(t);
        }
    }
}


Rent.prototype.processData = function(t){
    if(t['user_info'].length == 0){
        console.log("userinfo empty.");
        if(t.class== '1') {
            console.log("[DONE] Category: " + t.category);
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 4 + 2) * 1000);
        } else {
            t.pn++;
            setTimeout(function () {
                that.wgetList(t);
            }, (Math.random() * 4 + 2) * 1000);
        }
    } else {
        for (var i = 0; i < t['user_info'].length; i++){
            t['user_info'][i] = JSON.parse(t['user_info'][i]);
        }

        var $ = cheerio.load(t['html']);
        var memberCount = 0;

        $("div.leftBox div.list ul li.list-img").each(function(){
            var div = $("div.txt",this);
            var user_id_string = $("span[id^='js_authyear']",div).attr('id');
            if(user_id_string){
                var user_id = user_id_string.split('_')[3];
                var member = 0;
                var user = '';
                for (var i = 0; i < t['user_info'].length; i++){
                    ua = t['user_info'][i];
                    if(ua[user_id]) {
                        if(ua[user_id].biz_name)
                            user = ua[user_id].biz_name.replace(/[\n\r,，]/g,";");
                        if(ua[user_id].bang_auth_year){
                            if(t.cat1_name == '教育培训')
                                member = ua[user_id].bang_auth_year;
                            else
                                for (x in ua[user_id].bang_auth_year) {
                                    member = ua[user_id].bang_auth_year[x];
                                    break;
                                }
                        }
                    }
                }

                var top = $("a em.ico-stick-yellow",div).length;
                var adTop = $("a em.ico-stick-red",div).length;
                var hot = $("span.ico-hot",this).length;
                var jing = $("span.ico-jing",this).length;
                var pub_date = $("span.fc9",div).eq(0).text().replace(/[\n\r,，]/g,";");
                var title = $("p.t a.f14",div).text().trim().replace(/[\n\r,，]/g,";");
                var url_title = $("p.t a.f14",div).attr("href");
                var url_user = $("p.p2 a.website",div).attr("href");

                if(member)
                    memberCount++;
                var record = [t.cityName,t.cat2_name,t.class,member,hot,jing,top,adTop,pub_date,title,user,url_title,url_user,"\n"].join();
                fs.appendFileSync(that.resultDir+that.resultFile,record);
            }
        });
         $("div.leftBox div.list ul li.list-noimg").each(function(){
            var div = $("div.txt",this);
            var user_id_string = $("span[id^='js_authyear']",div).attr('id');
            if(user_id_string){
                var user_id = user_id_string.split('_')[3];
                var member = 0;
                var user = '';
                for (var i = 0; i < t['user_info'].length; i++){
                    ua = t['user_info'][i];
                    if(ua[user_id]) {
                        if(ua[user_id].biz_name)
                            user = ua[user_id].biz_name.replace(/[\n\r,，]/g,";");
                        if(ua[user_id].bang_auth_year){
                            for (x in ua[user_id].bang_auth_year) {
                                member = ua[user_id].bang_auth_year[x];
                                break;
                            }
                        }
                    }
                }

                var top = $("a em.ico-stick-yellow",div).length;
                var adTop = $("a em.ico-stick-red",div).length;
                var hot = $("span.ico-hot",this).length;
                var jing = $("span.ico-jing",this).length;
                var pub_date = $("span.fc9",div).eq(0).text().replace(/[\n\r,，]/g,";");
                var title = $("p a.f14",div).text().trim().replace(/[\n\r,，]/g,";");
                var url_title = $("p a.f14",div).attr("href");
                var url_user = $("p.p2 a.website",div).attr("href");

                if(member)
                    memberCount++;
                var record = [t.cityName,t.cat2_name,t.class,member,hot,jing,top,adTop,pub_date,title,user,url_title,url_user,"\n"].join();
                fs.appendFileSync(that.resultDir+that.resultFile,record);
            }
        });

        if(t.class== '1') {
            console.log("[DONE] Category: " + t.cat2_name);
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 4 + 2) * 1000);
        } else {
            if ($("div.leftBox div.list ul li").length<10 || memberCount<=4) {
                console.log("[DONE] less info,Category: " + t.cat2_name);
                setTimeout(function () {
                    that.wgetList();
                }, (Math.random() * 4 + 2) * 1000);
            } else if ($('.pageLink li a').last().attr("class") == "next" && t.pn < this.pagePerTask) {
                data = null;
                t.pn++;
                setTimeout(function () {
                    that.wgetList(t);
                }, (Math.random() * 4 + 2) * 1000);
            } else {
                console.log("[DONE] Category: " + t.cat2_name);
                setTimeout(function () {
                    that.wgetList();
                }, (Math.random() * 4 + 2) * 1000);
            }
        }
    }

}

var instance = new Rent();
var that = instance;
that.start();
