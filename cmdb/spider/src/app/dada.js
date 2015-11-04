var fs = require('fs')
var Crawler = require('node-webcrawler')
var helper = require('../../helpers/webhelper.js')
var crypto = require("crypto")
var qs = require("querystring")

var EventEmitter = require('events').EventEmitter
var e = new EventEmitter();

e.on("job-done",start);

var c = new Crawler({
    maxConnections:1,
    //rateLimit:30000,
    callback:function(err,result){
	if(err){ 
	    console.log(err);
	} 
	var o = null; 
	try{ 
	    o = JSON.parse(result.body); 
	}catch(e){ 
	    o = {status:"err"}; 
	    console.log(e); 
	} 
	if(o.status === 'ok'){ 
	    o.content.forEach(function(t){ 
		var r = Object.keys(t) 
		    .filter(function(tk){ 
			if(tk==='orders') 
			    return false; 
			else return true; 
		    }) 
		    .map(function(tk){
			if(typeof t[tk] === 'string'){
			    return t[tk].replace(/\s/g,'')
			}else{
			    return t[tk];
			}
		    }); 
		t.orders.forEach(function(order){ 
		    Object.keys(order) 
			.forEach(function(ok){
			    if(typeof order[ok] === 'string'){
				r.push(order[ok].replace(/\s/g,''));
			    }else{
				r.push(order[ok]);
			    }
			}); 
		}); 
		r.push(new Date().toDatetime());
		//console.log(r); 
		fs.appendFileSync("../../result/dada_"+result.options.city+".txt",r.join('\t')+"\n"); 
	    }); 
	}else{
	    console.log(o.errorMsg);
	}
	
	console.log("tasks in queue: %d",c.queueItemSize);
	//if(c.queueItemSize===1){
	//    e.emit("job-done");
	//}
	/*
	setTimeout(function(){ 
	    c.queue({ 
		uri:res.uri
		headers:header
	    }); 
	},5000); */
	//console.log(result.body); 
    }, 
    debug:true, 
    forceUTF8:true, 
    jQuery:false ,
    onDrain:function(){
	e.emit("job-done");
    }
}); 

function header() {
    this['Cache-Control']='no-cache' , 
    this['Connection']='close' , 
    this['User-Token']='1', 
    this['User-Id']='0', 
    this['App-Version']='1.10' , 
    this['App-Name']='a-dada' , 
    this['Platform']='Android' , 
    this['Channel-ID']='B003' , 
    this['OS-Version']='4.2.2' , 
    this['UUID']='ffffffff-ca6f-bdc9-0033-c58700000000', 
    this['City-Code']=0 , 
    this['City-Id']=5 , 
    this['Model']='Android-sdk', 
    this['Location-Provider']='gps' , 
    this['Network']='3G' , 
    this['User-Agent']='Dalvik/1.6.0 (Linux; U; Android 4.2.2; sdk Build/JB_MR1.1)',
    this['Host']='api.imdada.cn' 
}; 

function getOnePoint(lat,lng,city){ 
    var o = { 
	userid:0, 
	lat:''+lat, 
	lng:''+lng 
    }; 
    
    var str = qs.stringify(o);
    var md = crypto.createHash('md5');
    md.update(str+"GodBlessCasa");
    var digest = md.digest("hex");
    //console.log(digest);
    var h = new header();
    h['Verification-Hash'] = digest;
    h['Lat']=lat;
    h['Lng']=lng;
    h['User-Id']=o.userid;
    h['Location-Time']=new Date().getTime();
    c.queue({
	uri:'http://api.imdada.cn/v3_0/task/randomAvailableNearList/?'+str,
	headers:h,
	city: city
    });
}

var arguments = process.argv.splice(2);
var st = Number(arguments[0]);
var len = Number(arguments[1]);

function start(){
    var points = [];
    var items = fs.readFileSync("../../appdata/didipoints.txt").toString().split("\n");
    //前闭后开区间
    var ts = items.slice(st,st+len);
    //var ts = items.slice(0,1)//.concat(items.slice(15,17));
    
    ts.forEach(function(line){
	line = line && line.replace(/\r/g,'');
	if(!line) return;
	
	var vals = line.split("\t");
	var o = {c:vals[0],lefttop:vals[1].split(","),rightbottom:rightbottom=vals[2].split(","),xd:(+vals[5]),yd:(+vals[6])};
	points.push(o);
    });
    var d = 3;
    points.forEach(function(t){
	var lngstep = (t.rightbottom[1]-t.lefttop[1])/(t.xd/d),
	latstep = (t.lefttop[0]-t.rightbottom[0])/(t.yd/d),
	stlng = +t.lefttop[1],
	endlng = +t.rightbottom[1],
	stlat = +t.rightbottom[0],
	endlat = +t.lefttop[0];
	
	console.log("city: %s, lngstep: %s, latstep: %s",t.c,lngstep,latstep);
	
	for(var i=stlng;i<endlng;i+=lngstep){
	    for(var j=stlat;j<endlat;j+=latstep){
		getOnePoint(j,i,t.c);
	    }
	}  
    }); 
}

start();
