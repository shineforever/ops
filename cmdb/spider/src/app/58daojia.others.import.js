// This time, start from 2015-07-22
// Meijie, Nail, Xiufu may remove column 'star' from 2015-08-18 onwards!!!! So Be Cautious!!!
var Importer = require("../db.importer.js"),
	fs = require("fs"),
	util = require("util"),
	moment = require("moment");

// specify input file
var types = ["banjia","massage","meijie","nail","xiufu","yuesao"];
var args = process.argv.splice(2);
var type = args[0];
var start = args[1];
var end = args[2] || start;
if(!start || !end || types.indexOf(type) == -1) {
	throw "[ERROR] Must specify correct type, start date and end date.";
}
var source = [], inputfile = util.format("../../../../data/58daojia/%s/58daojia.%s.%s.txt", type, type), 
	date = moment(start, "YYYY-MM-DD"), enddate = moment(end, "YYYY-MM-DD").add(1, "d");
while(date.isBefore(enddate)) {
	source.push(util.format(inputfile, date.format("YYYY-MM-DD")));
	date.add(1, "d");
}
console.log(source);

var transform;
switch(type) {
	case "banjia": transform = banjia_transform;break;
	case "massage": transform = massage_transform;break;
	case "meijie": transform = meijie_transform;break;
	case "nail": transform = nail_transform;break;
	case "xiufu": transform = xiufu_transform;break;
	case "yuesao": transform = yuesao_transform;break;
	default: transform = nail_transform;break;
}

var importer = Importer({
	host:"192.168.98.213",
    transform:transform,
    parallel:13000,
    delimiter:'\t',
    quote:'++++++++',
    source:source
});

importer.start();

function insert(sql) {
	importer.conn.query(sql, function(err){
		if(err){
		    console.log(err);
		    return;
		}
    });
}

var sql = [];

function banjia_transform(record, callback) {
	if(record.length != 17 || record[1].length == 0) {
		console.log("Banjia length not 17!");
		callback(null, record.join());
		return;
	}
	record.splice(13, 2);
	record = record.map(function(element, index){
		if([5,9,10,11,12].indexOf(index) != -1) {
			return element;
		} else {
			return "\"" + element + "\"";
		}
	});
	record.push("'Banjia'");
	sql.push(util.format("(%s)", record.join()));
	callback(null, record.join());
}

function massage_transform(record, callback) {
	if(record.length != 9 || record[1].length == 0) {
		console.log("Massage length not 9!");
		callback(null, record.join());
		return;
	}
	record = record.map(function(element, index){
		if([7].indexOf(index) != -1) {
			return element;
		} else {
			return "\"" + element + "\"";
		}
	});
	record.push("'AnMo'");
	sql.push(util.format("(%s)", record.join()));
	callback(null, record.join());
}

function meijie_transform(record, callback) {
	if(record.length != 18 || record[1].length == 0) {
		console.log("Meijie length not 18!");
		callback(null, record.join());
		return;
	}
	record.splice(14, 2);
	record.splice(9, 1);
	record = record.map(function(element, index){
		if([5,9,10,11,12].indexOf(index) != -1) {
			return element;
		} else {
			return "\"" + element + "\"";
		}
	});
	record.push("'Meijie'");
	sql.push(util.format("(%s)", record.join()));
	callback(null, record.join());
}

function nail_transform(record, callback) {
	if(record.length != 18 || record[1].length == 0) {
		console.log("Nail length not 18!");
		callback(null, record.join());
		return;
	}
	record.splice(14, 2);
	record.splice(9, 1);
	record = record.map(function(element, index){
		if([5,9,10,11,12].indexOf(index) != -1) {
			return element;
		} else {
			return "\"" + element + "\"";
		}
	});
	record.push("'Meijia'");
	sql.push(util.format("(%s)", record.join()));
	callback(null, record.join());
}

function xiufu_transform(record, callback) {
	if(record.length != 18 || record[1].length == 0) {
		console.log("Xiufu length not 18!");
		callback(null, record.join());
		return;
	}
	record.splice(14, 2);
	record.splice(9, 1);
	record = record.map(function(element, index){
		if([5,9,10,11,12].indexOf(index) != -1) {
			return element;
		} else {
			return "\"" + element + "\"";
		}
	});
	record.push("'Xiufu'");
	sql.push(util.format("(%s)", record.join()));
	callback(null, record.join());
}

function yuesao_transform(record, callback) {
	if(record.length != 6 || record[1].length == 0) {
		console.log("Yuesao length not 6!");
		callback(null, record.join());
		return;
	}
	record.push(importer.currentSource.match(/\d{4}-\d{2}-\d{2}/)[0]);
	record = record.map(function(element, index){
		if([2].indexOf(index) != -1) {
			return element;
		} else {
			return "\"" + element + "\"";
		}
	});
	record.push("'Yuesao'");
	sql.push(util.format("(%s)", record.join()));
	callback(null, record.join());
}

function buildBanjiaSql() {
	return util.format("insert into `58_others` (city,uid,idcard,name,sex,age,province,mobile,address,servicecount,commentcount,servicecountofthismonth,commentcountofthismonth,entrytime,capturedate,type) values %s", 
		sql.join());
}

function buildMassageSql() {
	return util.format("insert into `58_others` (city,tid,name,title,sex,birthdate,province,workage,capturedate,type) values %s",
		sql.join());
}

function buildMeijieSql() {
	return util.format("insert into `58_others` (city,uid,intodcard,name,sex,age,province,mobile,address,servicecount,commentcount,servicecountofthismonth,commentcountofthismonth,entrytime,capturedate,type) values %s",
		sql.join());
}

function buildNailSql() {
	return util.format("insert into `58_others` (city,uid,idcard,name,sex,age,province,mobile,address,servicecount,commentcount,servicecountofthismonth,commentcountofthismonth,entrytime,capturedate,type) values %s",
		sql.join());
}

function buildXiufuSql() {
	return util.format("insert into `58_others` (city,uid,idcard,name,sex,age,province,mobile,address,servicecount,commentcount,servicecountofthismonth,commentcountofthismonth,entrytime,capturedate,type) values %s",
		sql.join());
}

function buildYuesaoSql() {
	return util.format("insert into `58_others` (city,name,age,area,price,url,capturedate,type) values %s",
		sql.join());
}

importer.on("done", function(){
	var val;
	switch(type) {
		case "banjia": val = buildBanjiaSql();break;
		case "massage": val = buildMassageSql();break;
		case "meijie": val = buildMeijieSql();break;
		case "nail": val = buildNailSql();break;
		case "xiufu": val = buildXiufuSql();break;
		case "yuesao": val = buildYuesaoSql();break;
		default: val = buildNailSql();break;
	}
	insert(val);
	sql = [];
	console.log("done");
});