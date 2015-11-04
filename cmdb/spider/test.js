var fs = require('fs')
var Crawler = require("node-webcrawler")

var cityurls = [
	'http://esf.fang.com',
	'http://esf.bd.fang.com',
	'http://esf.hs.fang.com',
	'http://esf.lf.fang.com',
	'http://esf.qhd.fang.com',
	'http://esf.sjz.fang.com',
	'http://esf.ts.fang.com',
	'http://esf.taiyuan.fang.com',
	'http://esf.nm.fang.com',
	'http://esf.anshan.fang.com',
	'http://esf.dl.fang.com',
	'http://esf.sy.fang.com',
	'http://esf.changchun.fang.com',
	'http://esf.suzhou.fang.com',
	'http://esf.jl.fang.com',
	'http://esf.daqing.fang.com',
	'http://esf.hrb.fang.com',
	'http://esf.changshu.fang.com',
	'http://esf.cz.fang.com',
	'http://esf.huaian.fang.com',
	'http://esf.jy.fang.com',
	'http://esf.ks.fang.com',
	'http://esf.lyg.fang.com',
	'http://esf.nt.fang.com',
	'http://esf.taizhou.fang.com',
	'http://esf.wuxi.fang.com',
	'http://esf.wj.fang.com',
	'http://esf.sz.fang.com',
	'http://esf.xz.fang.com',
	'http://esf.yancheng.fang.com',
	'http://esf.yz.fang.com',
	'http://esf.zhenjiang.fang.com',
	'http://esf.huzhou.fang.com',
	'http://esf.jx.fang.com',
	'http://esf.jh.fang.com',
	'http://esf.nb.fang.com',
	'http://esf.shaoxing.fang.com',
	'http://esf.wz.fang.com',
	'http://esf.zhoushan.fang.com',
	'http://esf.bengbu.fang.com',
	'http://esf.hf.fang.com',
	'http://esf.huainan.fang.com',
	'http://esf.mas.fang.com',
	'http://esf.wuhu.fang.com',
	'http://esf.fz.fang.com',
	'http://esf.sh.fang.com',
	'http://esf.putian.fang.com',
	'http://esf.qz.fang.com',
	'http://esf.xm.fang.com',
	'http://esf.zhangzhou.fang.com',
	'http://esf.ganzhou.fang.com',
	'http://esf.jiujiang.fang.com',
	'http://esf.nc.fang.com',
	'http://esf.binzhou.fang.com',
	'http://esf.tj.fang.com/',
	'http://esf.jn.fang.com',
	'http://esf.qd.fang.com',
	'http://esf.weihai.fang.com',
	'http://esf.wf.fang.com',
	'http://esf.yt.fang.com',
	'http://esf.ly.fang.com',
	'http://esf.zz.fang.com',
	'http://esf.huangshi.fang.com',
	'http://esf.hz.fang.com',
	'http://esf.xiangyang.fang.com',
	'http://esf.yc.fang.com',
	'http://esf.cs.fang.com',
	'http://esf.changde.fang.com',
	'http://esf.hengyang.fang.com',
	'http://esf.xt.fang.com',
	'http://esf.yueyang.fang.com',
	'http://esf.nanjing.fang.com',
	'http://esf.zhuzhou.fang.com',
	'http://esf.dg.fang.com',
	'http://esf.fs.fang.com',
	'http://esf.huizhou.fang.com',
	'http://esf.jm.fang.com',
	'http://esf.maoming.fang.com',
	'http://esf.meizhou.fang.com',
	'http://esf.qingyuan.fang.com',
	'http://esf.cd.fang.com',
	'http://esf.st.fang.com',
	'http://esf.yangjiang.fang.com',
	'http://esf.zj.fang.com',
	'http://esf.zhaoqing.fang.com',
	'http://esf.zs.fang.com',
	'http://esf.zh.fang.com',
	'http://esf.bh.fang.com',
	'http://esf.fangchenggang.fang.com',
	'http://esf.guigang.fang.com',
	'http://esf.guilin.fang.com',
	'http://esf.liuzhou.fang.com',
	'http://esf.nn.fang.com',
	'http://esf.gz.fang.com',
	'http://esf.cqchangshou.fang.com',
	'http://esf.cqjiangjin.fang.com',
	'http://esf.yongchuan.fang.com',
	'http://esf.cq.fang.com',
	'http://esf.deyang.fang.com',
	'http://esf.leshan.fang.com',
	'http://esf.luzhou.fang.com',
	'http://esf.meishan.fang.com',
	'http://esf.mianyang.fang.com',
	'http://esf.neijiang.fang.com',
	'http://esf.nanchong.fang.com',
	'http://esf.suining.fang.com',
	'http://esf.cq.fang.com',
	'http://esf.gy.fang.com',
	'http://esf.km.fang.com',
	'http://esf.lijiang.fang.com',
	'http://esf.qujing.fang.com',
	'http://esf.hn.fang.com',
	'http://esf.sanya.fang.com',
	'http://esf.baoji.fang.com',
	'http://esf.xian.fang.com',
	'http://esf.wuhan.fang.com',
	'http://esf.xianyang.fang.com',
	'http://esf.Lz.fang.com',
	'http://esf.qingyang.fang.com',
	'http://esf.yinchuan.fang.com',
	'http://esf.xn.fang.com',
	'http://esf.akesu.fang.com',
	'http://esf.bazhou.fang.com',
	'http://esf.changji.fang.com',
	'http://esf.shihezi.fang.com',
	'http://esf.xj.fang.com',
	'http://esf.yili.fang.com'
]

function Sofang() {
	this.resultDir = "./result/";
	this.resultFile = "sofang_pagecount.txt";
	this.crawler = new Crawler({
		maxConnections:1,
		userAgent:"Mozilla/5.0"
	});
	this.urls = [];
}

Sofang.prototype.start = function() {
	this.doCity();
}

Sofang.prototype.doCity = function() {
	var cityUrl = cityurls.pop();
	if(!cityUrl) {
		console.log("[INFO] CityUrls done.\n[INFO] Proceed to get page count.");
		setTimeout(that.getPagecount, 0);
		return;
	}
	that.crawler.queue({
		uri:cityUrl+"/house/a21-j3100-w33/",
		callback:function(error, result, $) {
			var domain = result.uri.match(/http:\/\/esf\.\w+\.fang\.com/);
			if(!domain) {
				setTimeout(that.doCity, 0);
				return;
			}
			domain = domain[0];
			if(error || !$) {
				console.log("[ERROR] Error opening ", result.uri);
				setTimeout(that.doCity, 0);
				return;
			}
			var alist;
			try {
				alist = $("#list_39 p.floatl a");
			} catch(e) {
				console.log("[ERROR] Error parsing ", result.uri);
				setTimeout(that.doCity, 0);
				return;
			}
			for(var i = 0; i < alist.length; i++) {
				if(alist.eq(i).text() == "不限") {
					continue;
				}
				that.urls.push(domain+alist.eq(i).attr("href"));
			}
			console.log("[INFO] city left: ", cityurls.length);
			setTimeout(that.doCity, 0);
		}
	});
}

Sofang.prototype.getPagecount = function() {
	var url = that.urls.pop();
	if(!url) {
		console.log("[INFO] Job done.");
		return;
	}
	that.crawler.queue({
		uri:url,
		jQuery:false,
		callback:function(error, result) {
			if(error) {
				console.log("[ERROR] Error opening ", result.uri);
				return;
			}
			try {
				var pagecount = result.body.match(/<span class="fy_text">1\/(\d+)<\/span>/)[1];
				var city = result.uri.match(/esf\.(\w+)\.fang\.com/)[1];
				var low = result.uri.match(/c2(\d+)-/);
				low = low ? low[1] : 0;
				var high = result.uri.match(/d2(\d+)-/);
				high = high ? high[1] : "不限";
				fs.appendFileSync(that.resultDir+that.resultFile, [city, low, high, pagecount].join("\t")+"\n");
			} catch(e) {
				console.log("[ERROR] Error parsing ", result.uri);
			}
			console.log("[INFO] task left: ", that.urls.length);
			setTimeout(that.getPagecount, 0);
		}
	});
}

var that = new Sofang();
that.start();

