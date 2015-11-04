var cheerio = require('cheerio')
var fs = require('fs')
var helper = require('../../helpers/webhelper.js')

var brands = [{"name":"安驰","path":"/anchi-116/"},
	      {"name":"AC Schnitzer","path":"/acschnitzer/"},
	      {"name":"奥迪","path":"/audi/"},
	      {"name":"阿尔法·罗密欧","path":"/alfaromeo/"},
	      {"name":"阿尔特","path":"/iat/"},
	      {"name":"奥克斯","path":"/aux-12/"},
	      {"name":"阿斯顿·马丁","path":"/astonmartin/"},
	      {"name":"北汽幻速","path":"/beiqihuansu/"},
	      {"name":"巴博斯","path":"/barbus/"},
	      {"name":"奔驰","path":"/mercedesbenz/"},
	      {"name":"保斐利","path":"/bufori/"},
	      {"name":"宝骏","path":"/bj/"},
	      {"name":"布加迪","path":"/bugatti/"},
	      {"name":"北京汽车","path":"/bjqc/"},
	      {"name":"别克","path":"/buick/"},
	      {"name":"宾利","path":"/bentley/"},
	      {"name":"宝龙","path":"/baolongmotors/"},
	      {"name":"宝马","path":"/bmw/"},
	      {"name":"北汽威旺","path":"/ww/"},
	      {"name":"北汽新能源","path":"/beiqixinnengyuan/"},
	      {"name":"北汽制造","path":"/beijingjeep/"},
	      {"name":"保时捷","path":"/porsche/"},
	      {"name":"本田","path":"/honda/"},
	      {"name":"奔腾","path":"/besturn/"},
	      {"name":"比亚迪","path":"/bydauto/"},
	      {"name":"标致","path":"/peugeot/"},
	      {"name":"成功","path":"/chenggong/"},
	      {"name":"长安轿车","path":"/cajc/"},
	      {"name":"长安商用","path":"/casyc/"},
	      {"name":"长安微车","path":"/chana/"},
	      {"name":"长城","path":"/greatwall/"},
	      {"name":"昌河","path":"/changheauto/"},
	      {"name":"东风御风","path":"/dongfengyufeng/"},
	      {"name":"Dacia","path":"/duster/"},
	      {"name":"东风小康","path":"/dongfengxiaokang-205/"},
	      {"name":"大迪","path":"/dadiauto/"},
	      {"name":"大发","path":"/daihatsu/"},
	      {"name":"东风","path":"/dongfeng-27/"},
	      {"name":"东风风度","path":"/dongfengfengdu/"},
	      {"name":"东风风神","path":"/fs/"},
	      {"name":"东风风行","path":"/fengxingauto/"},
	      {"name":"东风校车系列","path":"/dongfengxiaochexilie-198/"},
	      {"name":"道奇","path":"/dodge/"},
	      {"name":"东南","path":"/southeastautomobile/"},
	      {"name":"DS","path":"/ds/"},
	      {"name":"底特律电动车","path":"/ditelvdiandongche/"},
	      {"name":"大宇","path":"/daewoo/"},
	      {"name":"大众","path":"/volkswagen/"},
	      {"name":"福汽启腾","path":"/fujianxinlongmaqichegufenyouxiangongsi/"},
	      {"name":"Faralli Mazzanti","path":"/farallimazzanti/"},
	      {"name":"飞驰商务车","path":"/feichishangwuche/"},
	      {"name":"福达","path":"/fd/"},
	      {"name":"福迪","path":"/foday/"},
	      {"name":"法拉利","path":"/ferrari/"},
	      {"name":"弗那萨利","path":"/fornasari/"},
	      {"name":"富奇","path":"/fuqiautomobile/"},
	      {"name":"菲斯克","path":"/fisker/"},
	      {"name":"丰田","path":"/toyota/"},
	      {"name":"福特","path":"/ford/"},
	      {"name":"福田","path":"/foton/"},
	      {"name":"菲亚特","path":"/fiat/"},
	      {"name":"光冈","path":"/galue/"},
	      {"name":"GMC","path":"/gmc-109/"},
	      {"name":"广汽","path":"/gq/"},
	      {"name":"广汽吉奥","path":"/gonow/"},
	      {"name":"广汽日野","path":"/guangqihinomotors/"},
	      {"name":"观致汽车","path":"/qorosauto/"},
	      {"name":"华颂","path":"/huasong/"},
	      {"name":"黑豹","path":"/heibaoauto/"},
	      {"name":"哈飞","path":"/hafeiautomobile/"},
	      {"name":"哈弗","path":"/hafu-196/"},
	      {"name":"海格","path":"/higer/"},
	      {"name":"黄海","path":"/sgautomotive/"},
	      {"name":"汉江","path":"/hanjiangauto/"},
	      {"name":"悍马","path":"/hummer/"},
	      {"name":"海马","path":"/hama/"},
	      {"name":"海马商用车","path":"/fstar/"},
	      {"name":"华普","path":"/sma/"},
	      {"name":"红旗","path":"/faw-hongqi/"},
	      {"name":"华泰","path":"/huataiautomobile/"},
	      {"name":"恒天汽车","path":"/chtc/"},
	      {"name":"航天圆通","path":"/htyt/"},
	      {"name":"华阳","path":"/huayang-130/"},
	      {"name":"汇众","path":"/shanghaihuizhong-45/"},
	      {"name":"江铃集团轻汽","path":"/jianglingjituanqingqi/"},
	      {"name":"江西五十铃","path":"/jiangxiwushiling/"},
	      {"name":"金杯","path":"/jinbei/"},
	      {"name":"捷豹","path":"/jauger/"},
	      {"name":"金程","path":"/jinchengautomobile/"},
	      {"name":"俊风","path":"/jf/"},
	      {"name":"江淮","path":"/jac/"},
	      {"name":"吉利汽车","path":"/geely/"},
	      {"name":"江铃","path":"/jmc/"},
	      {"name":"九龙","path":"/joylongautomobile/"},
	      {"name":"吉利帝豪","path":"/emgrand/"},
	      {"name":"吉林江北","path":"/jljb/"},
	      {"name":"金旅客车","path":"/jlkc/"},
	      {"name":"金龙联合","path":"/kinglongmotor/"},
	      {"name":"吉利全球鹰","path":"/gleagle/"},
	      {"name":"吉利英伦","path":"/shanghaienglon/"},
	      {"name":"江南","path":"/jiangnanauto/"},
	      {"name":"济南汽车","path":"/jnqc/"},
	      {"name":"Jeep","path":"/jeep/"},
	      {"name":"凯翼","path":"/kaiyi/"},
	      {"name":"科瑞斯的","path":"/keruisi/"},
	      {"name":"KTM","path":"/ktm/"},
	      {"name":"卡威","path":"/kawei/"},
	      {"name":"凯迪拉克","path":"/cadillac/"},
	      {"name":"卡尔森","path":"/kaersen/"},
	      {"name":"克莱斯勒","path":"/chrysler/"},
	      {"name":"科尼赛克","path":"/koenigsegg/"},
	      {"name":"开瑞","path":"/karry/"},
	      {"name":"领志","path":"/leahead/"},
	      {"name":"朗世","path":"/ranz/"},
	      {"name":"兰博基尼","path":"/lamborghini/"},
	      {"name":"猎豹汽车","path":"/cf/"},
	      {"name":"罗孚","path":"/rover/"},
	      {"name":"力帆","path":"/lifanmotors/"},
	      {"name":"陆风","path":"/landwind/"},
	      {"name":"路虎","path":"/landrover/"},
	      {"name":"莲花","path":"/lotus-146/"},
	      {"name":"蓝海房车","path":"/hailanfangche/"},
	      {"name":"林肯","path":"/lincoln/"},
	      {"name":"雷克萨斯","path":"/lexus/"},
	      {"name":"铃木","path":"/suzuki/"},
	      {"name":"雷诺","path":"/renult/"},
	      {"name":"理念","path":"/everus/"},
	      {"name":"蓝旗亚","path":"/lancia/"},
	      {"name":"劳斯莱斯","path":"/rolls-royce/"},
	      {"name":"路特斯","path":"/lotus/"},
	      {"name":"MG","path":"/mg-79/"},
	      {"name":"迈巴赫","path":"/maybach/"},
	      {"name":"牡丹汽车","path":"/mudanauto/"},
	      {"name":"摩根","path":"/morgancars/"},
	      {"name":"MINI","path":"/mini/"},
	      {"name":"迈凯伦","path":"/mclaren/"},
	      {"name":"玛莎拉蒂","path":"/maserati/"},
	      {"name":"美亚","path":"/tianqimeiyaauto/"},
	      {"name":"马自达","path":"/mazda/"},
	      {"name":"纳智捷","path":"/luxgen/"},
	      {"name":"欧宝","path":"/opel/"},
	      {"name":"讴歌","path":"/acura/"},
	      {"name":"欧朗","path":"/ol/"},
	      {"name":"皮特比尔特卡车","path":"/pitebierte/"},
	      {"name":"旁蒂克","path":"/pontiac/"},
	      {"name":"PGO","path":"/pgo/"},
	      {"name":"帕加尼","path":"/pagani/"},
	      {"name":"乔治·巴顿","path":"/qiaozhibadun/"},
	      {"name":"启辰","path":"/venucia/"},
	      {"name":"庆铃","path":"/isuzu/"},
	      {"name":"奇瑞","path":"/chery/"},
	      {"name":"起亚","path":"/kia/"},
	      {"name":"日产","path":"/nissan/"},
	      {"name":"瑞麒","path":"/riich/"},
	      {"name":"荣威","path":"/roewe/"},
	      {"name":"smart","path":"/smart/"},
	      {"name":"上汽大通MAXUS","path":"/maxus/"},
	      {"name":"山姆","path":"/sam/"},
	      {"name":"绅宝","path":"/shenbao/"},
	      {"name":"萨博","path":"/saab/"},
	      {"name":"斯巴鲁","path":"/subaru/"},
	      {"name":"双环","path":"/sceo/"},
	      {"name":"世爵","path":"/sj/"},
	      {"name":"斯柯达","path":"/skoda/"},
	      {"name":"三菱","path":"/mitsubishi/"},
	      {"name":"双龙","path":"/ssangyong/"},
	      {"name":"顺旅","path":"/shunlv/"},
	      {"name":"SPIRRA","path":"/spirra/"},
	      {"name":"陕汽通家","path":"/tongjia/"},
	      {"name":"首望","path":"/sw/"},
	      {"name":"三星","path":"/sx/"},
	      {"name":"特斯拉","path":"/tesla/"},
	      {"name":"塔菲克","path":"/trafic/"},
	      {"name":"泰卡特","path":"/techart/"},
	      {"name":"特拉蒙塔纳","path":"/tlmtn/"},
	      {"name":"天马","path":"/tianmacar/"},
	      {"name":"腾势","path":"/denza/"},
	      {"name":"通田","path":"/ttauto/"},
	      {"name":"田野","path":"/zhongxingtianye/"},
	      {"name":"潍柴英致","path":"/enranger/"},
	      {"name":"沃尔沃","path":"/volvo/"},
	      {"name":"万丰","path":"/shanghaiwanfengauto/"},
	      {"name":"五菱","path":"/sgmw/"},
	      {"name":"威麟","path":"/rely/"},
	      {"name":"五十铃","path":"/isuzu-132/"},
	      {"name":"万通","path":"/wantongautomobile/"},
	      {"name":"威兹曼","path":"/wiesmann/"},
	      {"name":"现代","path":"/hyundai/"},
	      {"name":"新大地","path":"/xdd/"},
	      {"name":"雪佛兰","path":"/chevrolet/"},
	      {"name":"新凯","path":"/xinkaiauto/"},
	      {"name":"星客特","path":"/xkt/"},
	      {"name":"雪铁龙","path":"/citroen/"},
	      {"name":"新雅途","path":"/soyat/"},
	      {"name":"西雅特","path":"/seat/"},
	      {"name":"云豹","path":"/yb/"},
	      {"name":"英菲尼迪","path":"/infiniti/"},
	      {"name":"野马汽车","path":"/ym/"},
	      {"name":"云雀","path":"/yunquemotor/"},
	      {"name":"一汽","path":"/faw/"},
	      {"name":"宇通","path":"/yutong/"},
	      {"name":"英特诺帝","path":"/eternitimotors/"},
	      {"name":"依维柯","path":"/iveco/"},
	      {"name":"永源","path":"/jonwayautomobile/"},
	      {"name":"友谊客车","path":"/youyiautomobile/"},
	      {"name":"仪征","path":"/wel/"},
	      {"name":"扬州亚星客车","path":"/yangzhouyaxingkeche/"},
	      {"name":"中通客车","path":"/zhongtongkeche/"},
	      {"name":"浙江卡尔森","path":"/zhejiangkaersen/"},
	      {"name":"众泰","path":"/zotyeauto/"},
	      {"name":"中华","path":"/brillianceauto/"},
	      {"name":"中客华北","path":"/zkhb/"},
	      {"name":"之诺","path":"/zhinuo/"},
	      {"name":"中欧","path":"/zoemo/"},
	      {"name":"中顺","path":"/polarsunautomobile/"},
	      {"name":"中兴","path":"/zxauto/"}];

var ershou = function(){
    this.resultDir = "../../result/auto/";
    this.dataDir = '../../appdata/';
    this.resultFile = "yicheershou_"+new Date().toString()+".txt";
    this.progressFile = "yicheershou_progress_"+new Date().toString()+".txt";
    this.done = {};
    this.curPageIdx = 1;
    this.tasks = [];
    this.detailTasks = [];
    this.currentTask;
}

ershou.prototype.init = function(){
    if(fs.existsSync(this.resultDir+this.progressFile)){
	fs.readFileSync(this.resultDir+this.progressFile).toString().split('\n').reduce(function(pre,cur){
	    if(cur){
		pre[cur]=true;
	    }
	    return pre;
	},this.done);
    }
    for(var i=0;i<brands.length;i++){
	this.tasks.push({path:brands[i].path,name:brands[i].name,page:1});
    }
    console.log("[INFO] task count: %d",this.tasks.length);
}

ershou.prototype.start = function(){
    this.init();
    this.wgetList();
}

ershou.prototype.wgetList = function(t){
    if(!t){
	var t = null;
	do{
	    t = this.tasks.shift();
	}
	while(this.tasks.length && this.done[t.name])
	if(!t){
	    console.log("[DONE] job done");
	    return;
	}
    }
    
    var host = "www.taoche.com";
    var path = t.path;
    
    var opt = null;
    opt = new helper.basic_options(host,path,"GET",false,false,{"onsale":1,"page":t.page});
    opt.agent = false;
    
    console.log("[GET ] %s,%d/%d",t.name,t.page,t.maxPage);
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    },t);
}
var Task = function(){
    this.max=10;
    this.len=0;
    this.tasks = [];
}
Task.prototype.onEnd = function(){
    
}
Task.prototype.onStart = function(){
    
}
Task.prototype.add = function(ts){
    if(Array.isArray(ts)){
	this.tasks.concat(ts);
    }
}
Task.prototype.invoke = function(){
    
}
    
ershou.prototype.processList = function(data,args,res){
    if(!data){
		console.log("[ERROR] data empty");
		setTimeout(function(){
		    that.wgetList(args[0]);
		},3000);
		return;
    }
    var $ = cheerio.load(data);
    var records=[""];
    $("#logwtCarList li").each(function(){
		var tit = $(".cary-infor h3 a",this).attr("title").trim();
		var uri = $(".cary-infor h3 a",this).attr("href").replace(/[\r\n]/g,'');
		var vals = tit && tit.split(" ");
		var model='',config='';
		if(vals){
		    if(vals.length>0){
				model = vals[0].replace(/\s/g,'');
		    }
		    if(vals.length>1){
				vals.shift();
				config = vals.join(" ").replace(/[\r\n\t]/g,'');
		    }
		}
		config = config && config.replace(/\t/g,'');
		var price = $(".soujxiug",this).last().text().trim();
		var uptime = $(".cary-infor > p.maijzs",this).last().text().replace(/\s/g,'');
		var v = uptime && uptime.split('|');
		var year = v && v[0] || "无";
		var km = v && v.length>1 && v[1] || "无";
		var city = v && v.length>2 && v[2] || "无";
		
		// provider and audit are no longer accessable due to change of website
		// var audit = $(".cycsrz a",this).length;
		// var provider = $(".zizhi #logwtjxs a",this).text().trim();

		//var city = $(".vice-infor .ads a",this).text();

		// records.push([uri,args[0].name,model,config,price,km,year,audit?"Y":"N",provider,city].join('\t'));
		that.detailTasks.push({
	    	uri:uri,
	    	brand:args[0].name,
	    	model:model,
	    	config:config,
	    	price:price,
	    	km:km,
	    	year:year,
	    	city:city
	    });
    });
    // fs.appendFileSync(this.resultDir+this.resultFile,records.join("\n"));
    
    if(!args[0].maxPage){
	var nextPage = $(".the_pages a").last();
	if(nextPage){
	    args[0].maxPage = Number(nextPage.prev().text());
	}else{
	    args[0].maxPage = 1;
	}
    }

    that.currentTask = args[0];

    setTimeout(that.wgetDetail, 0);

    if(args[0].page<args[0].maxPage){
	args[0].page++;
	setTimeout(function(){
	    that.wgetList(args[0]);
	},0);
    }else{
	console.log("[DONE] %s",args[0].name);
	fs.appendFileSync(this.resultDir+this.progressFile,args[0].name+"\n");
	this.wgetList();
    }
}

ershou.prototype.wgetDetail = function() {
	var detailTask = that.detailTasks.shift();
	if(!detailTask) {
		if(that.currentTask.page<that.currentTask.maxPage){
			that.currentTask.page++;
			setTimeout(function(){
			    that.wgetList(that.currentTask);
			},0);
	    }else{
			console.log("[DONE] %s",that.currentTask.name);
			fs.appendFileSync(this.resultDir+this.progressFile,that.currentTask.name+"\n");
			this.wgetList();
	    }
	    return;
	}
	var host = "www.taoche.com";
	
	var opt = null;
    opt = new helper.basic_options(host,path,"GET",false,false,{"onsale":1,"page":t.page});
    opt.agent = false;
    
    console.log("[GET ] %s,%d/%d",t.name,t.page,t.maxPage);
    helper.request_data(opt,null,function(data,args,res){
	that.processList(data,args,res);
    },t);

}

var that = new ershou();
that.start();