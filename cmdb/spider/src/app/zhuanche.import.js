var Importer = require("../db.importer.js")

var importer = Importer({
    transform : transform,
    host:'db-server',
    user:'mike',
    password:"Mike442144",
    database:"InternetCompanies",
    parallel:10000,
    delimiter:'\t',
    source:['../../result/app/zhuanche_2015-08-11.txt']
});

importer.start();

function insert(vals){
    importer.conn.query("insert into `zhuanche` (driverName,longitude,latitude,driverId,car,license,orders,city,createdAt) VALUES ?",[vals],function(err){
	if(err){
	    console.log(err);
	}
    });
}

var error = 0
function transform(record, callback){
    if(record.length<14){
	error++;	
    }else{
	var r = [];
	r.push(record[1]);
	r.push(record[3]);
	r.push(record[4]);
	r.push(record[11]);
	r.push(record[10]);
	r.push(record[9]);
	r.push(record[8]);
	r.push(record[13]);
	r.push(record[12]);
	
	insert([r]);
    }
    
    callback(null, record.join('\t'));
}

importer.on('done',function(){
    console.log('done');
})
