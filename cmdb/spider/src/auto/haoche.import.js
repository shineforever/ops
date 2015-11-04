var fs = require("fs")
var mysql = require("mysql")
var moment = require("moment")

var data = {};
var start = moment('2015-07-18');
var files=[];
for(var cur=start;cur<moment('2015-08-10');cur.add(1,'d')){
    var ds = cur.format('YYYY-MM-DD');
    //if(ds==='2015-06-23') continue;
    var filename="../../result/auto/haoche.ganji_"+ds+".csv";
    files.push(filename);
}
console.log(files);
var conn = mysql.createPool({
    "database":"bdadata",
    "user":"root",
    "password":"xiaokang2015",
    "host":"bda-server-2",
    "connectionLimit":30
});

// data["11"].toString().split("\n").forEach(function(line){
//     var vals = line.split(",");
//     vals[vals.length-1]=vals[vals.length-2];
//     vals[2] = moment(vals[2],"YYYY-MM").format("YYYY-MM-DD HH:mm:ss");
//     conn.query("insert into `Haoche` (city,title,carddate,mileage,price,newcarprice,code,checker,checkdate,url,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",vals,function(err){
// 	if(err)
// 	    console.log(err);
//     });
// });
//data["14"],data["15"],data["16"],data["17"],data["18"]

function append(files){
    var filename = null;
    if(!(filename=files.shift())){
	console.log('job done');
	return;
    }

    var stack=[];
    fs.readFileSync(filename).toString().split('\n').forEach(function(line){
	if(!line.trim()) return;
	vals = line.split(",");
	vals[vals.length-1] = vals[vals.length-2];
	vals[2] = moment(vals[2],"YYYY-MM").format("YYYY-MM-DD HH:mm:ss");
	vals.push(vals[vals.length-1]);
	vals.push(vals[4]);
	stack.push(1);
	conn.query("insert into `Haoche` (city,title,carddate,mileage,price,newcarprice,code,checker,checkdate,url,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE updatedAt=?,price=?",vals,function(err){
	    if(err){
		console.log(err);
	    }else{
		stack.pop();
		if(stack.length===0){
		    console.log(filename);
		    append(files);
		}
	    }
	});
    });
    

}
// Buffer.concat([data["18"]]).toString().split("\n").forEach(function(line){
//     vals = line.split(",");
//     vals[vals.length-1] = vals[vals.length-2];
//     vals[2] = moment(vals[2],"YYYY-MM").format("YYYY-MM-DD HH:mm:ss");
//     vals.push(vals[vals.length-1]);
//     vals.push(vals[4]);
//     conn.query("insert into `Haoche` (city,title,carddate,mileage,price,newcarprice,code,checker,checkdate,url,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE updatedAt=?,price=?",vals,function(err){
// 	if(err){
// 	    console.log(err);
// 	}
//     });
// });
append(files);
