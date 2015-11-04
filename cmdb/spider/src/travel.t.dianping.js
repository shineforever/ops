/*处理点评旅游的deal list*/
var fs = require('fs');
var t_dp_url = "http://t.dianping.com";
var Crawler = require('crawler');

var c = new Crawler({
	maxConnections:1,
	callback: processUrls,
	userAgent:"Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36",
	rateLimits: 2000
});
var current_time = new Date();
var time_str = current_time.getFullYear()+"_"+(current_time.getMonth()+1)+"_"+current_time.getDate();
var write_path = "../result/dp/dp_travel_"+time_str+".txt";
/*获取分类url并放入队列*/
function processUrls(error, result, $){
	if (error) {
		console.log(error);
	};
	if (!$) {
		console.log(result.uri+ "  is null");
		return;
	};
	var aLabels = $("a", $(".tg-tab-box .tg-classify-wrap").eq(1));
	for (var i = 1; i < aLabels.length; i++){
		var cat_url = $(aLabels).eq(i).attr("href");
		var cat_name = $(aLabels).eq(i).text().trim();
		console.log("Catory: "+cat_name+" - "+cat_url);
		var category_url = t_dp_url+cat_url;
		console.log("category_url : " + category_url);
		c.queue({uri:category_url, callback:processListInfo});
	}
	return;
}
/*抓取信息内容*/
function processListInfo(error, result, $){
	if (error) {
		console.log(error);
		return;
	};
	console.log(result.uri+" received!");
	if (!$) {
		return;
	};
	if ($(".tg-tab-box .tg-floor-list li a").attr("href") == null) {
		console.log("this city has not this category");
		return;
	};
	$(".tg-tab-box .tg-floor-list li").each(function(){
		var deal_city = String($('head title').text()).substring(1, String($('head title').text()).search("团购"));
		var deal_id = String($('.tg-floor-img', this).attr("href")).match(/\d+/g);
		var deal_title = String($('h3', this).text()).trim();
		var deal_desc = String($('h4', this).text()).replace(/\s+/, "");
		var deal_price_new = String($('em', this).text()).trim();
		var deal_price_old = String($('del', this).text()).trim();
		var sales_quantity = String($('.tg-floor-sold', this).text()).replace(/\s/g, "")
		if (sales_quantity.length == 0) {
			sales_quantity = "0";
		};
		sales_quantity = sales_quantity.substring(String(sales_quantity).search(/\d+/g), sales_quantity.length);
		entity = [""];
		entity.push([deal_city, deal_id, deal_title, deal_price_new, deal_price_old, sales_quantity, deal_desc, time_str].join("\t"));
		console.log(entity.join("\n"));
		fs.appendFileSync(write_path, entity.join("\n"));
	});
	next_page = $(".tg-paginator-wrap a").last().text().trim();
	if (String(next_page).search("下一页") != -1) {
		nextPage_u = $(".tg-paginator-wrap a").last().attr("href").trim()
		nextPage_url = result.uri+nextPage_u;
		console.log("nextPageUrl enter queue: "+nextPage_url);
		c.queue({uri: nextPage_url, callback:processListInfo});
	};
	return;
}

/*依次读入每个城市， 城市之间停顿一秒（可以设置参数：ratasLimits ??????*/
var read_path = "../appdata/dp_city.txt";
var city_codes = fs.readFileSync(read_path, "utf-8");
var citys = String(city_codes).split(/\n/);
for (var i =0; i < citys.length-1; i++){
	city_info = String(citys[i]).split(",");
	city_code = city_info[0];
	city_name = city_info[1];
	city_py = String(city_info[2]).replace(/\s/g, "");
	city_url = t_dp_url+"/travel/"+city_py+"-category_6";
	console.log(i + "city_name: "+city_name +" city_url is : "+city_url);
	c.queue(city_url);

}


