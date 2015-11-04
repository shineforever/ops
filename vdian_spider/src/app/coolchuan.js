var fs = require('fs')
var Emitter = require("events").EventEmitter
var Crawler = require("node-webcrawler")
var moment = require('moment')
var mysql = require('mysql')

var arguments = process.argv.splice(2);
var fileApps = arguments[0];

function Cch(name,psd){
    this.e = new Emitter();
    this.c = new Crawler({
	maxConnections:1,
	jar:true,
	userAgent:"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:23.0) Gecko/20100101 Firefox/23.0",
	rateLimits:1000,
	onDrain:function(){
	    //that.conn.end();
	}
    });
    
    this.conn = mysql.createConnection({
	host     : 'db-server',
	user     : 'mike',
	password : 'Mike442144',
	database:'InternetCompanies'
    });
    
    this.e.on("login",function(){
	console.log("[INFO] sign in success.");
	that.wget();
    });
    
    this.e.on("loaded",function(result,$){
	console.log("[INFO] sign in page loaded.");
	that.login(result,$);
    });
    this.name = name;
    this.psd = psd;
    this.appset = fs.readFileSync("../../appdata/"+(fileApps||"coolchuan.app.txt")).toString().split("\n").map(function(l){
	var vals = l.split(',');
	return {name:vals[0],pkgName:vals[1]};
    });
    console.log("[INFO] appset count: %d",this.appset.length);
    this.categories = ['total_downloads', 'daily_downloads']//, 'total_rank', 'category_rank'];
    this.token = '';
    this.tasks = [];
}

Cch.prototype.start = function(){
    this.init();
}

Cch.prototype.init = function(){
    console.log("[INFO] loading...");
    this.c.queue({
	uri:"http://www.coolchuan.com/sign_in",
	callback:function(err,result,$){
	    if(err){
		console.log(err);
	    }else{
		that.e.emit("loaded",result,$);
	    }
	}
    });
}

Cch.prototype.login = function(result,$){
    var token = $("meta[name='csrf-token']").attr("content");
    data = {
	'user[email]':this.name,
	'user[password]':this.psd,
	'user[remember_me]':0,
	'authenticity_token':token,
	'redirect_uri':''
    };
    console.log("[INFO] authenticating.");
    this.c.queue({
	uri:'http://www.coolchuan.com/sign_in',
	method:"POST",
	form:data,
	jQuery:false,
	headers:{
	    'X-Requested-With':'XMLHttpRequest'
	},
	callback:function(err,result){
	    if(err){
		console.log(err);
	    }else{
		var res = null;
		try{
		    res = JSON.parse(result.body);
		}catch(error){
		    console.error(error);
		}
		
		if(res && res.status === '200'){
		    console.log("[INFO] authenticated.");
		    that.requestToken();
		}else{
		    console.log("[INFO] sign in error.");
		}
	    }
	}
    });
}

Cch.prototype.requestToken = function(){
    console.log("[INFO] request token...");
    this.c.queue({
	uri:'http://jk.coolchuan.com/report/total-downloads',
	callback:function(err,result){
	    if(err){
		console.error("[ERROR] %s",err);
	    }else{
		that.token = result.body.match(/report_token_rp:'([a-f\d]{32})'/)[1];
		that.timestamp = result.body.match(/timestamp_rp:'(\d{10})'/)[1];
		that.e.emit("login");
	    }
	},
	jQuery:false
    });
}

Cch.prototype.search = function(app){
    console.log('[INFO] searching %s ',app.name);
    this.c.queue({
	uri:'http://jk.coolchuan.com/add',
	qs:{q:app.pkgName},
	appName:app.name,
	callback:function(err,result,$){
	    if(err){
		console.error(err);
	    }else{
		if($("#apps ul li div.from").length > 0){
		    var pkgName = $("#apps ul li div.from").first().attr("title")
		    ,link = $("#apps ul li > h4 a").first()
		    ,name = link.text().replace(/[\s,，]/g,'')
		    ,url = link.attr("href");
		    
		    that.conn.query("INSERT INTO `CoolChuanApp` (`appname`,`ccname`,`appurl`,`pkgname`,`updatedAt`,`createdAt`) VALUES  (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE updatedAt=? ",[this.appName,name,url,pkgName,new Date(),new Date(),new Date()],function(err,re){
			if(err){
			    console.error(err);
			}
			//console.log(re.affectedRows);
			that.generateTask({pkgName:pkgName,appName:result.options.appName,storeAppName:name,appUrl:url});
			if(re.affectedRows>0){
			    //do 
			}else{
			    
			}
		    });
		}else{
		    console.log("[WARN] %s not found",this.appName);
		}
	    }
	}
    });
}

Cch.prototype.wget = function(){
    this.appset.forEach(function(app){
	if(app.name){
	    this.search(app);
	}
    },this);
    //this.search(this.appset[0][0]);
}

Cch.prototype.generateTask = function(arg){
    if(!arg){
	console.log('[ERROR] arguments empty.');
	throw "arg empty";
    }
    
    var startdate = moment("2015-07-01")
    ,now = moment()
    ,enddate =  moment("2015-08-01")
    ,cur = startdate;
    
    while(cur < now){
	for(var i=0;i<this.categories.length;i++){
	    var c = this.categories[i];
	    this.tasks.push({
		category:c,
		start_date:cur.format("YYYY.MM.DD"),
		end_date:enddate>now?now.format("YYYY.MM.DD"):enddate.format("YYYY.MM.DD"),
		packageName:arg.pkgName,
		arg:arg
	    });
	}
	cur = cur.add(1,"M");
	enddate = enddate.add(1,"M")
    }
    
    this.loadData();
}

Cch.prototype.loadData = function(){
    while(this.tasks.length>0){
	var query = this.tasks.shift();
	var arg = query.arg;
	query['id_rp'] = 'coolchuan';
	query['timestamp_rp'] = this.timestamp;
	query['report_token_rp'] = this.token;
	
	delete query.arg;
	
	console.log("[GET ] %s,%s,%s-%s",arg.appName,query.category,query.start_date,query.end_date);
	this.c.queue({
	    uri:'http://jk.coolchuan.com/show_report',
	    qs:query,
	    arg:arg,
	    callback:function(err,result){
		if(err){
		    console.error(err);
		}else{
		    that.processData(result,arg);
		}
	    },
	    jQuery:false,
	    debug:true
	});
    }
}

Cch.prototype.processData = function(result,arg){
    var obj = null;
    try{
	obj = JSON.parse(result.body);
    }catch(err){
	console.error(err);
    }
    var cate = result.options.qs.category;
    if(obj && obj.data){
	console.log("[INFO] stores: %d",obj.data.series.length);
	var records = [];
	for(var i=0;i<obj.data.series.length;i++){
	    var store = obj.data.series[i];
	    for(var j=0;j<obj.data.categories.length;j++){
		var date = obj.data.categories[j];
		if(date.length===5){
		    date = new Date("2015-"+date);
		}
		if(store.data[j]!==null){
		    var r = [arg.appName,store.name.replace(/[\s,，]/g,''),cate,store.data[j].y,'',date,new Date(),new Date()];
		    records.push(r);
		}
	    }
	}
	if(records.length>0){
	    this.conn.query("INSERT INTO `CoolChuanData` (`appname`,`store`,`category`,`data`,`dimension`,`datepoint`,`updatedAt`,`createdAt`) VALUES ?",[records],function(err){
		if(err){
		    console.error(err);
		}
	    });
	}
	//console.log(records.join("\n"));
    }else{
	console.log("[WARN] data empty. %s",JSON.stringify(obj));
    }
}

var that = new Cch("meiqin.fang@bda.com","hello4cc");
that.start();
