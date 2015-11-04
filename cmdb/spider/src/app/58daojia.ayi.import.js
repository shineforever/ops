var Importer = require("../db.importer.js"),
	fs = require("fs"),
	util = require("util"),
	moment = require("moment");

// specify input file
var args = process.argv.splice(2);
var start = args[0];
var end = args[1] || start;
if(!start || !end) {
	throw "[ERROR] Must specify start date and end date.";
}
var source = [], inputfile = "../../../../data/58daojia/ayi/58daojia.ayi.%s.csv", 
	date = moment(start, "YYYY-MM-DD"), enddate = moment(end, "YYYY-MM-DD").add(1, "d");
while(date.isBefore(enddate)) {
	source.push(util.format(inputfile, date.format("YYYY-MM-DD")));
	date.add(1, "d");
}
console.log(source);

// load history data
var blacklist = JSON.parse(fs.readFileSync("../../../dataprocess/58daojia/58daojia.ayi.blacklist.txt").toString().trim());
var ayi = JSON.parse(fs.readFileSync("../../../dataprocess/58daojia/58daojia.ayi.history.txt").toString().trim());
console.log("Black list length: %s", Object.keys(blacklist).length);
console.log("History ayi length: %s", Object.keys(ayi).length);

var importer = Importer({
	host:"192.168.98.213",
    transform:transform,
    parallel:13000,
    delimiter:',',
    quote:'++++++++',
    source:source
});

importer.start();

function insert(vals){
    importer.conn.query("insert ignore `58_ayi_month` (uid, city, name, mobile, servicecount, entrytime, capturedate, worktime) VALUES ?", [vals], function(err){
		if(err){
		    console.log(err);
		    return;
		}
    });
}

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
	if(record[0] != "地址") {
		switch(record.length) {
			case 24:
				parsed = parse24(record);break;
			default:
				break;
		}
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

function buildSQL(ayi) {
	var vals = [];
	Object.keys(ayi).forEach(function(key){
		var item = ayi[key];
		Object.keys(item.month).forEach(function(month){
			vals.push([item.uid,item.city,item.name,item.mobile,item.month[month].dealcount,item.entrytime,item.month[month].capturedate,item.worktime]);
		});
	});
	return vals;
}

importer.on("done", function(){
	insert(buildSQL(ayi));
	fs.writeFile("../../../dataprocess/58daojia/58daojia.ayi.history.new.txt", JSON.stringify(ayi));
	fs.writeFile("../../../dataprocess/58daojia/58daojia.ayi.blacklist.new.txt", JSON.stringify(blacklist));
	console.log("done");
});
