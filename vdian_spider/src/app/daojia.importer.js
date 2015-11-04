var mysql = require("mysql")
var fs = require('fs')
var logger = require('winston')
logger.cli();
var util = require('util')
var Emitter = require('events').EventEmitter
var env = "development"
var config = require('../../config.json')[env].db
var moment = require('moment')

config.host = "patrick";
config.user = "root";
config.password = "xiaokang2015";
config.database = "bdadata";

var conn = mysql.createPool(config);

var adapter = function(){};
adapter.prototype.getUid = function(func,domain,args){
    throw new Error("not implemented");
}
adapter.prototype.byId = function(func,domain,args){
    throw new Error("not implemented");
}

var ayiAdapter = function(){};
util.inherits(ayiAdapter,adapter);
var ayi = new ayiAdapter();

ayi.getUid = function(func,domain,args){
    conn.query("select distinct(`uid`),entrytime from `58_ayi_month`",function(err,rows){
	if(err){
	    logger.error(err);
	}else{
	    logger.info(rows.length);
	    //e.emit("uids",rows);
	    if(args instanceof Array){
		args.unshift(rows);
	    }else if(args){
		args=[rows,args];
	    }else{
		args=[rows];
	    }
	    
	    func.apply(domain,args);
	}
    })
}

ayi.byId = function(row,func,domain,args){
    conn.query("select `uid`,`name`,`servicecount`,`entrytime`,`capturedate`,`city`,`worktime` from `58_ayi_month` where uid=? order by `capturedate` asc",row.uid,function(err,rslt){
	if(err){
	    logger.error(err);
	}else{
	    
	    if(args instanceof Array){
		args.unshift(rslt);
	    }else if(args){
		args=[rslt,args];
	    }else{
		args = [rslt];
	    }
	    
	    func.apply(domain,args);
	    //e.emit("oneId",rslt);
	}
    });
}

var movingAdapter = function(){};
util.inherits(movingAdapter,adapter);
var moving = new movingAdapter();

moving.getUid = function(func,domain,args){
    conn.query("select distinct(`uid`),entrytime from `58_others` where type='Banjia'",function(err,rows){
	if(err){
	    logger.error(err);
	}else{
	    logger.info(rows.length);
	    //e.emit("uids",rows);
	    if(args instanceof Array){
		args.unshift(rows);
	    }else if(args){
		args=[rows,args];
	    }else{
		args=[rows];
	    }
	    
	    func.apply(domain,args);
	}
    })
}

moving.byId = function(row,func,domain,args){
    conn.query("select `uid`,`name`,`servicecount`,`entrytime`,`capturedate`,`city` from `58_others` where uid=? and  type='Banjia' order by `capturedate` asc",row.uid,function(err,rslt){
	if(err){
	    logger.error(err);
	}else{
	    
	    if(args instanceof Array){
		args.unshift(rslt);
	    }else if(args){
		args=[rslt,args];
	    }else{
		args = [rslt];
	    }
	    
	    func.apply(domain,args);
	    //e.emit("oneId",rslt);
	}
    });
}



var App = function App(adpt){
    logger.info("construct...");
    this.dataAdapter = adpt;
    Emitter.call(this);
};

util.inherits(App,Emitter);

App.prototype = {
    process:function(rows){
	var row = null;
	if(!(row = rows.shift())){
	    logger.info("job done");
	    conn.end(function(err){
		if(err){
		    logger.error(err);
		}
	    });
	    return;
	}
	
	this.dataAdapter.byId(row,this.processOneId,this,[row,rows]);
    },
    
    processOneId:function(rslt,row,rows){
	var entry = moment(row.entrytime);
	var months = {};

	var computeLast = moment(rslt[rslt.length-1].capturedate).format('YYYY-MM') < moment().format('YYYY-MM');
	
	for(var i=0,last={capturedate:new Date('2000-01-01')};i<rslt.length;i++){
	    var tmp = rslt[i];
	    var m = moment(rslt[i].capturedate)//.format('YYYY-MM');
	    
	    if(m.format('YYYY-MM') != moment(last.capturedate).format('YYYY-MM')){
		var cap = moment(rslt[i].capturedate);
		var entry =  moment(rslt[i].entrytime);
		var period = cap.diff(entry,'days');
		if(period<=0) continue;
		period = period>90?90:period;
		
		//logger.info("first day period: %d, entry: %s, cap: %s, orders: %d",period,entry.format('YYYY-MM-DD'),cap.format('YYYY-MM-DD'),rslt[i].servicecount);
		var perDay = rslt[i].servicecount / period ;
		
		//logger.info("order per day: %d",perDay);
		
		var f = null;
		if(last.capturedate.getTime()==new Date('2000-01-01').getTime()){//firt capture date
		    if(moment(cap).subtract(period,'d').month() == cap.month()){
			continue;
		    }
		    f = moment(cap).subtract(period,'days');
		}else{
		    var keys = Object.keys(months).sort();
		    var nearestMonth = keys[keys.length-1];
		    var thepoint = moment(cap).subtract(period,'d');
		    f = thepoint.format('YYYY-MM') > nearestMonth ? moment(thepoint) : moment(nearestMonth).add(1,'M');
		}
		
		for(;moment(f).startOf('month')<moment(cap).startOf('month');f=f.add(1,"M").startOf("month")){
		    var end = moment(f).endOf('month');
		    end = end.isBefore(cap)?end:moment(cap);
		    //logger.info(f.format('YYYY-MM-DD'),end.format('YYYY-MM-DD'));
		    var c = end.diff(f,"days") * perDay;
		    //logger.info("%d, %s, %d, %s, %s",rslt[i].uid,rslt[i].name,c,f.format("YYYY-MM"),rslt[i].city);
		    fs.appendFileSync('../../../dataprocess/58daojia/ayi.orders.txt',[rslt[i].uid,rslt[i].name,c.toFixed(2),f.format("YYYY-MM"),rslt[i].worktime,rslt[i].city,moment(rslt[i].entrytime).format("YYYY-MM-DD")].join()+'\n');
		    months[f.format("YYYY-MM")] = c;
		}
		
		last = tmp;
	    }
	    
	    if(computeLast && i==rslt.length-1){
		var cap = moment(rslt[i].capturedate);
		var entry =  moment(rslt[i].entrytime);
		var period = cap.diff(entry,'days');
		if(period<=0) continue;
		period = period>90?90:period;
		var perDay = rslt[i].servicecount / period ;
		
		//logger.info("order per day: %d",perDay);
		
		var keys = Object.keys(months).sort();
		var nearestMonth = keys[keys.length-1];
		var thepoint = moment(cap).subtract(period,'d');
		var f = thepoint.format('YYYY-MM') > nearestMonth ? moment(thepoint) : moment(nearestMonth).add(1,'M');
		
		for(;moment(f).startOf('month')<=moment(cap).startOf('month');f=f.add(1,"M").startOf("month")){
		    var end = moment(f).endOf('month');
		    end = end.isBefore(cap)?end:moment(cap);
		    //logger.info(f.format('YYYY-MM-DD'),end.format('YYYY-MM-DD'));
		    var c = end.diff(f,"days") * perDay;
		    //logger.info("%d, %s, %d, %s, %s",rslt[i].uid,rslt[i].name,c,f.format("YYYY-MM"),rslt[i].city);
		    fs.appendFileSync('../../../dataprocess/58daojia/ayi.orders.txt',[rslt[i].uid,rslt[i].name,c.toFixed(2),f.format("YYYY-MM"),rslt[i].worktime,rslt[i].city,moment(rslt[i].entrytime).format("YYYY-MM-DD")].join()+'\n');
		    months[f.format("YYYY-MM")] = c;
		}
	    }
	    
	    
	}
	

	this.process(rows);
    },
    
    start:function(){
	this.dataAdapter.getUid(this.process,this);
    }
}



var app = new App(ayi);
app.start();
