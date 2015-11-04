var fs = require('fs')
var helper = require('../../helpers/webhelper.js')
var Crawler = require('crawler')

var c = new Crawler({
    maxConnections:5,
    callback:function(error,result){
	var obj = JSON.parse(result.body);
	if(obj){
	    console.log(obj);
	}
	var lines = obj.result.list.map(function(li){
	    return Object.keys(li).map(function(k){
		return li[k];
	    }).join('\t');
	}).join('\n');
	fs.appendFileSync("../../result/app/wanzhoumo.txt",lines);
    }
});

//&lat=39.913367&lon=116.460203
//&offset=0

var url = "http://www.wanzhoumo.com/wanzhoumo?UUID=ffffffff-ca6f-bdc9-4df4-ef7c00000000&app_key=800000002&app_v_code=41&app_v_name=3.1.1&format=json&is_near=1&is_valid=1&method=activity.featured&os=android&pagesize=30&r=wanzhoumo&sign=aebbb26b08ff6bea1cba6448790d2974&timestamp=1421726579&v=2.0";
var offset=0;
c.queue(url+"&lat=39.913367&lon=116.460203"+"&offset="+offset);
