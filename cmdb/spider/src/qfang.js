var fs = require('fs')

var Crawler = require("crawler")

var c = new Crawler({
    maxConnections:10
    ,callback:processUrls
});

var p_url = "";
var current_time = new Date();
var month = current_time.getMonth()+1;
var date_str = current_time.getFullYear()+"_"+month+"_"+current_time.getDate();
var resultFile = "../result/qfang/js_qfang_"+date_str+".txt";

//*error 参数：判断url合法的吗？ 这个函数主要处理url获取ids*/
function processUrls(error, result, $){
	
	if(error){
		console.log("processUrls : "+error);
		return;
    }
    console.log(result.uri+ " receive!")
    if(!$){
		return;
    }
	var ids_list = new Array();
	var is_Today = 0;
	$(".cycle-listings li").each(function(){
		var part_Url = $("p a", this).attr("href");
		// console.log("part_Url :"+part_Url);
		var temp_arr = String(part_Url).split("/"); //index:2 对应house_sale_id
		// console.log("temp_arr[2] : "+temp_arr[2])
		var update_str = $(".listings-item-bottom p", this).text();
		update_str = String(update_str).replace(/\s/g, ""); //去掉span标签中的内容
		//console.log("update_str : "+update_str);
		entity = ""//存放一条记录
		if (String(update_str).search("分钟") != -1) {
			entity = temp_arr[2];
		}else if (String(update_str).search("小时") != -1) {
			update_hour = parseInt(String(update_str).match(/\d+/g));
			current_hour = new Date().getHours()
			// console.log("update_hour: "+update_hour+", current_hour :"+current_hour)
			if (parseInt(current_hour) - update_hour > 0) {
				entity = temp_arr[2];
			}else{
				is_Today = -1;
			}
		}else{
			is_Today = -1;
		}
		// console.log("entity is : "+entity)
		if (String(entity).length != 0) {
			ids_list.push(entity);
		};
	})
	if (is_Today == 0) {
		next_url = $(".turnpage_next").attr("href");
		p_url = (String(result.uri).substring(0, String(result.uri).search(/\/sale/g))+next_url).trim();
		console.log("input queue url is : "+p_url);
		c.queue({uri: p_url, priority: 9, 	callback:processUrls});
	}

	/*组装url并调用 processBrokerInfo*/
	for (var i = 0; i < ids_list.length; i++) {
		//去掉/f***
		var temp_url = "";
		var index = String(result.uri).search(/f\d+/g);
		if (index != -1) {
			temp_url = String(result.uri).substring(0, index);
		}else{
			temp_url = result.uri+"/";
		}
		var detail_url =  temp_url + ids_list[i];
		console.log("detail_url : ", detail_url);
		detail_url = String(detail_url).replace(/^\s/, "");
		c.queue({uri:detail_url, callback:processBrokerInfo});
	}
	
	// console.log(result.uri + "  ending");
	return;
}

//*抓取需要信息*/
function processBrokerInfo(error, result, $){
	
	if (error) {
		console.log("processBrokerInfo : "+error);
		return;
	};
	if (!$) {
		return;
	};
	var city_name = $(".bread_crumbs_inner a").text();
	city_name = String(city_name).substring(0, String(city_name).search(/\w/));
	var house_id = $(".house_number span").text();
	var broker_name = $(".broker_basic_name").text();
	var broker_tel = $(".mtel_num").text();
	var release_time = $(".release_time").text();
	var store_add = "";
	$(".store_info").each(function(){
		var temp = $(this).text();
		store_add = store_add+temp;
	})
	//保存这些字段
	var entity = [""];
	var sale_id = String(result.uri).substring(String(result.uri).search(/\d+/g));
	entity.push([city_name, sale_id.replace(/\s/, ""), String(house_id).replace(/\s/, ""), String(broker_name).trim().replace(/\s/, ""), broker_tel, release_time, store_add, date_str].join("\t"));
	console.log(entity.join("\n").toString());
	fs.appendFileSync(resultFile,entity.join("\n").toString());


}


args = process.argv;
if (args.length == 2) {
	args[3] = "shenzhen";
};
for (var i = 2; i < args.length; i++) {
	city_url = "http://"+String(args[i]).trim()+".qfang.com/sale/"
	c.queue(city_url);
};
