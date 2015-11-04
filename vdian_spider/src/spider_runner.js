var exec = require('child_process').exec;
var city_start_id = 1;
var city_end_id = 400;
var args = process.argv.slice(2);
var reset = '';

if(args.length>0){
    city_start_id = args[0];
    
    if(args.length>1){
        city_end_id = args[1];
    }else{
        city_end_id = city_start_id;
    }
    if(args.length>2 && args[2] == 'reset'){
	reset = 'reset';
    }
}
console.log("[spider_runner] start_id: %d end_id: %d", city_start_id, city_end_id);

//var spider_file = 'dp_tiny_hotpot.js 1 300';
//var spider_file = 'dp_get_city.js';
//var spider_file = 'dp_tuan_num.js';

var spider_file = 'dp_tuan_products.js ';
var goon = true;
var args = city_start_id + ' ' + city_end_id + ' ';
//var mode = 'recover';

var run_spider = function(mode){
    if(!mode){
	mode='recover';
    }
    var spider = exec('node ' + spider_file+args+mode);
    
    spider.stdout.on('data', function (data) { 
        console.log(data); 
        var data_arr = data.split('\n');
        var data_arr_len = data_arr.length;
        for(var i in data_arr){
            var data = data_arr[i];
            if(data == 'ok')
            {
                goon = false;
                return;
            }
        }
    }); 
    
    spider.on('exit', function (code) { 
        console.log('process exit(%d)!!!', code);
        if(goon)
        {
            setTimeout(function () {
                run_spider("recover");
            }, 20000);
        } 
    }); 
}

run_spider(reset);
