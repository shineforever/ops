var fs = require('fs')
var helper = require('../helpers/webhelper.js')
var cheerio = require('cheerio')

function Rent() {
    this.dataDir = '../appdata/';
    this.resultDir = '../result/58/';
    this.cities = [];
    this.cityFile = '58.city.txt';
    this.services = [];
    this.serviceFile = "58.job.txt";
    this.regionFile = "58.regions.txt";
    this.today = new Date().toString();
    var strs = this.today.split('-');
    
    this.resultFile = '58_job_'+strs[0]+'-'+strs[1]+'.txt';
    this.pagePerTask = 1;
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
        return {"class": vals[0],"cat1_name": vals[1],"cat2_name": vals[2],"cat_enname": vals[3]};
    });
    this.regions = JSON.parse(fs.readFileSync(this.dataDir+this.regionFile).toString());
    //add service task
    this.tasks = [];
    for(var i=0; i< this.cities.length;i++){
        var city = this.cities[i];
        for(var j=0;j<this.services.length;j++){
            var service = this.services[j];
            if (!service) continue;
	    /*var cityregion = this.regions.filter(function(r){return r.cname===city.cname;})[0];
	    if(!cityregion){
		console.log("[ERROR] Cannot find city: %s",city.name);
	    }else{
		cityregion.districts.forEach(function(d){
		*/    var tmp = {"cityName":city.cname,
			       "cityPinyin":city.cen,
			       "cat1_name":service.cat1_name,
			       "cat2_name":service.cat2_name,
			       "cat_enname":service.cat_enname,
	//		       "region":d.pinyin,
	//		       "regionName":d.name,
			       "class":service.class
			      };
		    this.tasks.push(tmp);
	    /*	},this);
	    }*/
        }
    }
    
    var arguments = process.argv.splice(2);
    var start = Number(arguments[0]) || 0;
    var len = Number(arguments[1]) || this.tasks.length;
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
        console.log('[INFO] Task left: %d', this.tasks.length);
    }
    var pinyin = t.regionPinyin || t.districtPinyin;
    var name = t.regionName || t.districtName;
    if(t.class == '1')
        var opt = new helper.basic_options(t.cityPinyin+".58.com","/"+t.cat_enname+"/");
    else
        var opt = new helper.basic_options(t.cityPinyin+".58.com","/"+t.cat_enname+"/pn"+t.pn+"/");
    
    opt.agent = false;
    console.log("[GET ] %s, %s, %s, %d",t.cityName,t.cat1_name,t.cat2_name,t.pn);
    helper.request_data(opt,null,function(data,args,res){
    	that.processList(data,args,res);
    },t);
}

Rent.prototype.processList = function(data,args,res){
    if(!data){
        console.log("data empty.");
        if(args[0].class == '1') {
            console.log("[DONE] Category: " + args[0].cat1_name);
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 2 + 2) * 1000);
        } else {
            args[0].pn++;
            setTimeout(function () {
                that.wgetList(args[0]);
            }, (Math.random() * 2 + 2) * 1000);
        }
    } else {
        var $ = cheerio.load(data);
        var end_flag = 0;
	var timeRegexp = /[今天|小时|分钟]/;
        $("div#infolist dl").each(function(){
            if($(this).text().indexOf("以上本地信息更新较少") >= 0) {
                end_flag = 1;
                return false;
            }
            if($(this).text().indexOf("新信息较少，我们为您推荐以下相关信息") >= 0) {
                end_flag = 1;
                return false;
            }
	    
            var title = $("dt a.t",this).text().replace(/[\n\r,，]/g,";");
            var url_title = $("dt a.t",this).attr("href");
            var user = $("dd.w271 a.fl",this).text().replace(/[\n\r,，]/g,";");
            var url_user = $("dd.w271 a.fl",this).attr("href");
            var post_time = $("dd.w68",this).text().trim()
	    end_flag = !timeRegexp.test(post_time);
	    
	    var jing = post_time === '精准'?1:0
            ,top = post_time === '置顶'?1:0;
            //var jing = $("a.ico.jingpin",this).length;
            //var top = $("a.ico.ding1",this).length;
            var record = [args[0].cityName,args[0].cat1_name,args[0].cat2_name,jing,top,title,user,post_time,url_title,url_user,that.today,"\n"].join();
            fs.appendFileSync(that.resultDir+that.resultFile,record);
        });
	
        if(args[0].class == '1') {
            console.log("[DONE] Category: " + args[0].cat1_name);
            setTimeout(function () {
                that.wgetList();
            }, (Math.random() * 2 + 2) * 1000);
        } else {
            if (end_flag || $("div#infolist dl").length<10) {
                console.log("[DONE] less info,Category: " + args[0].cat2_name);
                setTimeout(function () {
                    that.wgetList();
                }, (Math.random() * 2 + 2) * 1000);
            } else if (data.search('pager') != -1 && args[0].pn < this.pagePerTask) {
                data = null;
                args[0].pn++;
                setTimeout(function () {
                    that.wgetList(args[0]);
                }, (Math.random() * 2 + 2) * 1000);
            } else {
                console.log("[DONE] Category: " + args[0].cat2_name);
                setTimeout(function () {
                    that.wgetList();
                }, (Math.random() * 2 + 2) * 1000);
            }
        }
    }
}

var instance = new Rent();
var that = instance;
that.start();
