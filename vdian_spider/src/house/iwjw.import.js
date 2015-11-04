var fs = require('fs')
var parse = require('csv-parse');
var transform = require('stream-transform');
var mysql = require("mysql")
var moment = require("moment")

var conn = mysql.createPool({
    "database":"bdadata",
    "user":"root",
    "password":"xiaokang2015",
    "host":"bda-server-2",
    "connectionLimit":30
});

var city = {
    "2":"上海",
    "12438":"北京",
    "40000":"广州",
    "56000":"深圳",
    "71049":"杭州",
    "71099":"天津"
};

var error = 0;
var normal = 0;
var queued = 0;

var parser = parse({delimiter: ','})
var input = fs.createReadStream('../../result/house/iwjw_2015-08-06.csv');
var nil = fs.createWriteStream("/dev/null");
var pipeEnd = false;

var transformer = transform(function(record, callback){
    if(record.length!==6){
	++error;
    }
    
    record[1] = city[record[1].trim()];
    record.push("2015-08-06");
    record.push(new Date());
    record.push(new Date());

    ++queued;
    //insert([record]);
    console.log(parser.lines);
    callback(null, record.join());
}, {parallel: 10000});




input.pipe(parser).pipe(transformer).pipe(progressStream).pipe(nil);


transformer.on('end',function(){
    console.log('transformer end.');
    pipeEnd = true;
});

function insert(vals){
    conn.query("insert into `iwjw` (url,city,area,name,pics,video,capture_dt,createdAt,updatedAt) VALUES ?",[vals],function(err){
	if(err){
	    ++error;
	    console.log(err);
	}else{
	    ++normal;
	}
	
	if(--queued === 0){
	    if(pipeEnd){
		process.nextTick(function(){
		    conn.end();
		});
	    }
	}
    });
}
