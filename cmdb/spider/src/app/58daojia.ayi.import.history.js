var Importer = require("../db.importer.js"),
	fs = require("fs"),
	util = require("util"),
	moment = require("moment");

var importer = Importer({
	host:"192.168.98.213",
    transform:transform,
    parallel:13000,
    delimiter:'\t',
    quote:'++++++++',
    source:['../../../../data/58daojia/ayi/58daojia.history.txt']
});

importer.start();

function insert(vals){
    importer.conn.query("insert into `58_ayi_month` (uid, city, name, mobile, servicecount, entrytime, capturedate, worktime) VALUES ?", [vals], function(err){
	if(err){
	    console.log(err);
	    return;
	}
    });
}

var ayi = {};

var blacklist = {};

function isValid(parsed) {
	if(parsed.name.match(/测试/)) {
		return false;
	}
	var entrytime = moment(parsed.entrytime, "YYYY-MM-DD");
	if(entrytime.isBefore("2014-08-01") || entrytime.isAfter(parsed.capturedate)) {
		return false;
	}
	if(parsed.dealcount < 0) {
		return false;
	}
	return true;
}

function isIncompatible(parsed) {
	if(parsed.entrytime != ayi[parsed.uid].entrytime) {
		return true;
	}
	if(parsed.city != ayi[parsed.uid].city) {
		return true;
	}
	return false;
}

function parse34(record) {
	var result = {
		uid:record[22],
		city:record[27],
		name:record[13],
		mobile:record[11],
		entrytime:record[7],
		worktime:record[26],
		capturedate:record[32],
		dealcount:parseInt(record[16]),
		capturemonth:moment(record[32], "YYYY-MM-DD").format("YYYY-MM")
	};
	return result;
}

function parse24(record) {
	var result = {
		uid:record[17],
		city:record[21],
		name:record[10],
		mobile:record[9],
		entrytime:record[6],
		worktime:record[20],
		capturedate:record[22],
		dealcount:parseInt(record[13]),
		capturemonth:moment(record[22], "YYYY-MM-DD").format("YYYY-MM")
	};
	return result;
}

function transform(record, callback){
	var parsed = undefined;
	switch(record.length) {
		case 34:
			parsed = parse34(record);break;
		case 24:
			parsed = parse24(record);break;
		default:
			break;
	}
	if(parsed) {
		while(1) {
			if(blacklist[parsed.uid]) {
				break;
			}

			if(!isValid(parsed)) {
				blacklist[parsed.uid] = true;
				delete ayi[parsed.uid];
				break;
			}

			if(!ayi[parsed.uid]) {
				ayi[parsed.uid] = {
					uid:parsed.uid,
					city:parsed.city,
					name:parsed.name,
					mobile:parsed.mobile,
					entrytime:parsed.entrytime,
					worktime:parsed.worktime,
					month:{}
				}
				ayi[parsed.uid].month[moment(parsed.capturedate, "YYYY-MM-DD").format("YYYY-MM")] = {
					capturedate:parsed.capturedate,
					dealcount:parsed.dealcount
				}
				break;
			}

			if(isIncompatible(parsed)) {
				blacklist[parsed.uid] = true;
				delete ayi[parsed.uid];
				break;
			}

			var capturedate = moment(parsed.capturedate, "YYYY-MM-DD");
			if(!ayi[parsed.uid].month[parsed.capturemonth]) {
				ayi[parsed.uid].month[parsed.capturemonth] = {
					capturedate:parsed.capturedate,
					dealcount:parsed.dealcount
				};
			} else {
				if(capturedate.isBefore(ayi[parsed.uid].month[parsed.capturemonth].capturedate)) {
					ayi[parsed.uid].month[parsed.capturemonth] = {
						capturedate:parsed.capturedate,
						dealcount:parsed.dealcount
					};
				}
			}
			break;
		}
	}

    callback(null, record.join());
}

importer.on("done", function(){
	// console.log(ayi);
	// console.log(blacklist);
	fs.writeFile("../../../dataprocess/58daojia/58daojia.ayi.history.txt", JSON.stringify(ayi));
	fs.writeFile("../../../dataprocess/58daojia/58daojia.ayi.blacklist.txt", JSON.stringify(blacklist));
	console.log("done");
});
