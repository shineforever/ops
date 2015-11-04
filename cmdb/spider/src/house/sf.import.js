var Importer = require("../db.importer.js")

var importer = Importer({
    transform : transform,
    parallel:10000,
    quote:'++++++++',
    source:['../../result/sofang/sfershou_2015-08-04.csv']
});

importer.start();

function insert(vals){
    importer.conn.query("insert into `soufang` (title,serial_num,area,release_date,is_individual,city,url,picture_num,Tag,capture_datetime,createddate) VALUES ?",[vals],function(err){
	if(err){
	    console.log(err);
	    return;
	}
	
	// if(--queued === 0){
	//     if(pipeEnd){
	// 	process.nextTick(function(){
	// 	    conn.end();
	// 	});
	//     }
	// }
    });
}

function transform(record, callback){
    var r = record.slice(0);
    r.push("2015-08-04");
    if(r[5].trim()){
	insert([r]);
    }
    
    callback(null, record.join());
}
