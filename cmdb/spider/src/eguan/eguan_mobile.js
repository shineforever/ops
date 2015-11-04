var fs = require("fs"),
    util = require("util"),
    moment = require("moment"),
    logger = require("winston"),
    Crawler = require("node-webcrawler"),
    env = process.env.NODE_ENV || "development";

logger.cli();
if(env==="development"){
    logger.add(logger.transports.File, {filename:"../../log/eguan.log", logstash:true, level:"info"});
    // logger.remove(logger.transports.Console);
}

var category_traffic_title = [
    "Category",
    "CategoryID",
    "Classification",
    "活跃人数(万)",
    "启动次数(万)",
    "使用时长(万小时)",
    "日均活跃人数(万)",
    "日均启动次数(万)",
    "日均使用时长(万小时)",
    "人均单日启动次数(次)",
    "人均单日使用时长(分钟)",
    "日期"
].join() + "\n";

var app_traffic_title = [
    "AppName",
    "AppID",
    "Category",
    "CategoryID",
    "Classification",
    "活跃人数(万)",
    "启动次数(万)",
    "使用时长(万小时)",
    "日均活跃人数(万)",
    "日均启动次数(万)",
    "日均使用时长(万小时)",
    "人均单日启动次数(次)",
    "人均单日使用时长(分钟)",
    "相对活跃用户渗透率(%)",
    "绝对活跃用户渗透率(%)",
    "活跃度环比(%)",
    "日期"
].join() + "\n";

function fileExists(path) {
    try {
        fs.readFileSync(path);
        return true;
    } catch(e) {
        return false;
    }
}

function Eguan() {
    this.monthSwitch = process.argv.splice(2)[0] ? true : false;
    this.firstDayOfMonth = moment().startOf("month").valueOf();
    this.queryStartDate = "2014-01-01";
    this.queryEndDate = moment().format("YYYY-MM-DD");
    this.today = moment().format("YYYY-MM-DD");
    this.resultDir = "../../result/eguan/";
    this.categoryResultFile = "eguan_m_category."+this.today+".txt";
    this.appResultFile = "eguan_m_app."+this.today+".txt";
    this.crawler = new Crawler({
        maxConnections:1,
        userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.130 Safari/537.36",
        jQuery:false
    });
    this.redirectUrl = encodeURIComponent(util.format("http://eur.analysys.cn/user-radar/casLogin/redirect?service=%s", encodeURIComponent("http://eur.analysys.cn/user-radar/casLogin/loginInfo")));
    this.JSESSIONID;
    
}

Eguan.prototype.init = function() {
    logger.info("initialisation starts.");
    if(!fs.existsSync(this.resultDir)) {
        fs.mkdir(this.resultDir);
    }
    if(fileExists(this.resultDir + this.categoryResultFile)) {
        var content = fs.readFileSync(this.resultDir + this.categoryResultFile).toString();
        if(!content) {
            fs.appendFileSync(this.resultDir + this.categoryResultFile, category_traffic_title);
        }
    } else {
        fs.appendFileSync(this.resultDir + this.categoryResultFile, category_traffic_title);
    }
    if(fileExists(this.resultDir + this.appResultFile)) {
        var content = fs.readFileSync(this.resultDir + this.appResultFile).toString();
        if(!content) {
            fs.appendFileSync(this.resultDir + this.appResultFile, app_traffic_title);
        }
    } else {
        fs.appendFileSync(this.resultDir + this.appResultFile, app_traffic_title);
    }
    logger.info("initialisation completes.");
}

Eguan.prototype.start = function() {
    this.init();
    this.login();
}

Eguan.prototype.run = function() {
    that.getCategoryInfo();
}

Eguan.prototype.getCategoryInfo = function() {
    that.crawler.queue({
        uri:"http://eur.analysys.cn/user-radar/mobile/mobileRecommendList",
        method:"POST",
        headers:{Cookie:that.JSESSIONID},
        callback:function(error, result) {
            try {
                var data = JSON.parse(result.body).mobileCategorys;
            } catch(e) {
                logger.error("Eguan-getCategoryInfo parse error.");
                return;
            }
            data.forEach(function(mainCategory){
                mainCategory.categorys.forEach(function(category){
                    that.getCategoryTraffic({mainCategory:mainCategory.cateName,categoryName:category.itemName,categoryId:category.itemId});
                });
            });
        }
    });
}

Eguan.prototype.getCategoryTraffic = function(category) {
    that.crawler.queue({
        uri:"http://eur.analysys.cn/user-radar/mobile/categoryDetailAjax",
        method:"POST",
        form:{
            categoryId:category.categoryId,
            type:"item_cover_nums",
            dateType:"month",
            profileType:"",
            startDate:that.queryStartDate,
            endDate:that.queryEndDate,
            profileValue:""
        },
        category:category,
        headers:{Cookie:that.JSESSIONID},
        callback:function(error, result) {
            var category = result.options.category;
            if(error) {
                logger.error("%s-%s fail to get category detail.", category.mainCategory, category.categoryName);
                return;
            }
            try {
                var data = JSON.parse(result.body);
            } catch(e) {
                logger.error("%s-%s fail to parse category detail.", category.mainCategory, category.categoryName);
                return;
            }
            if(data.errMsg) {
                logger.warn("%s-%s no data.", category.mainCategory, category.categoryName);
                return;
            }
            var categoryTrafficRecords = [];
            data.mobileCategorys.forEach(function(categoryMonthlyDetail){
                if(that.monthSwitch) {
                    if(parseInt(categoryMonthlyDetail.statDate) < that.firstDayOfMonth) {
                        return;
                    }
                }
                categoryTrafficRecords.push([
                    category.categoryName,category.categoryId,category.mainCategory,
                    categoryMonthlyDetail.activeNums,categoryMonthlyDetail.launchNums,
                    categoryMonthlyDetail.runtimeNums,categoryMonthlyDetail.activeAvgDay,
                    categoryMonthlyDetail.launchAvgDay,categoryMonthlyDetail.runtimeAvgDay,
                    categoryMonthlyDetail.launchAvgPerson,categoryMonthlyDetail.runtimeAvgPerson,
                    moment(categoryMonthlyDetail.statDate).format("YYYY-MM")
                ].join());
            });
            if(categoryTrafficRecords.length > 0) {
                fs.appendFileSync(that.resultDir+that.categoryResultFile, categoryTrafficRecords.join("\n")+"\n");
            }
            logger.info("%s-%s traffic record got.", category.mainCategory, category.categoryName);
            data.mobileRanks.forEach(function(app){
                that.getAppTraffic({mainCategory:category.mainCategory,categoryName:category.categoryName,categoryId:category.categoryId,appId:app.itemId,appName:app.itemName});
            });
            logger.info("%s-%s got %s apps.", category.mainCategory, category.categoryName, data.mobileRanks.length);
        }
    });
}

Eguan.prototype.getAppTraffic = function(app) {
    that.crawler.queue({
        uri:"http://eur.analysys.cn/user-radar/mobile/appDetailAjax",
        method:"POST",
        form:{
            appId:app.appId,
            startDate:that.queryStartDate,
            endDate:that.queryEndDate,
            dateType:"month",
            type:"active_nums"
        },
        priority:0,
        app:app,
        headers:{Cookie:that.JSESSIONID},
        callback:function(error, result) {
            var app = result.options.app;
            if(error) {
                logger.error("%s-%s %s fail to get app detail.", app.mainCategory, app.categoryName, app.appName);
                return;
            }
            try {
                var data = JSON.parse(result.body);
            } catch(e) {
                logger.error("%s-%s %s fail to parse app detail.", app.mainCategory, app.categoryName, app.appName);
                return;
            }
            if(data.errMsg) {
                logger.warn("%s-%s %s no data.", app.mainCategory, app.categoryName, app.appName);
                return;
            }
            var appTrafficRecords = [];
            data.mobileCategorys.forEach(function(appMonthlyDetail){
                if(that.monthSwitch) {
                    if(parseInt(appMonthlyDetail.statDate) < that.firstDayOfMonth) {
                        return;
                    }
                }
                appTrafficRecords.push([
                    app.appName,app.appId,app.categoryName,app.categoryId,app.mainCategory,
                    appMonthlyDetail.activeNums,appMonthlyDetail.launchNums,appMonthlyDetail.runtimeNums,
                    appMonthlyDetail.activeAvgDay,appMonthlyDetail.launchAvgDay,appMonthlyDetail.runtimeAvgDay,
                    appMonthlyDetail.launchAvgPerson,appMonthlyDetail.runtimeAvgPerson,
                    (Number(appMonthlyDetail.activeAbsolutePermeabilityRate)*100.00).toPrecision(4),
                    (Number(appMonthlyDetail.activeRelativePermeabilityRate)*100.00).toPrecision(4),
                    (Number(appMonthlyDetail.activeChainRate)*100.00).toPrecision(4),
                    moment(appMonthlyDetail.statDate).format("YYYY-MM")
                ].join());
            });
            if(appTrafficRecords.length > 0) {
                fs.appendFileSync(that.resultDir+that.appResultFile, appTrafficRecords.join("\n")+"\n");
            }
            logger.info("%s-%s %s traffic record got.", app.mainCategory, app.categoryName, app.appName);
        }
    });
}

Eguan.prototype.login = function() {
    that.crawler.queue({
        uri:"http://eur.analysys.cn/user-radar/casLogin/loginInfo",
        method:"POST",
        callback:function(error, result) {
            if(error) {
                logger.error("Eguan-login network error.");
                return;
            }
            try {
                that.JSESSIONID = result.caseless.dict["set-cookie"][0].match(/JSESSIONID=(.*?);/)[1];
            } catch(e) {
                logger.error("Eguan-login JSESSIONID error.");
                return;
            }
            setTimeout(that.getTicketForLogin, 0);
        }
    });
}

Eguan.prototype.getTicketForLogin = function() {
    that.crawler.queue({
        uri:util.format("http://cas.analysys.com.cn/cas-auth-server/login?service=%s", that.redirectUrl),
        headers:{
            "Accept-Language":"zh-CN,zh;q=0.8,en;q=0.6",
            Referer:"http://eur.analysys.cn/"
        },
        jQuery:true,
        callback:function(error, result, $) {
            if(error || !$) {
                logger.error("Eguan-getTicketForLogin network error.");
                return;
            }
            try {
                var body = {
                    username:"bda_03",
                    passwordShow:"",
                    password:"579518",
                    lt:$("input[name='lt']").attr("value"),
                    execution:$("input[name='execution']").attr("value"),
                    _eventId:$("input[name='_eventId']").attr("value"),
                    submit:$("input[name='submit']").attr("value")
                }
                var JSESSIONID = result.caseless.dict["set-cookie"][0].split(";")[0].split("=")[1];
            } catch(e) {
                logger.error("Eguan-getTicketForLogin postbody or JSESSIONID error.");
                return;
            }
            logger.info(body);
            logger.info("JSESSIONID: %s", JSESSIONID);
            that.crawler.queue({
                uri:util.format("http://cas.analysys.com.cn/cas-auth-server/login;jsessionid=%s?service=%s", JSESSIONID, that.redirectUrl),
                headers:{
                    "Accept-Language":"zh-CN,zh;q=0.8,en;q=0.6",
                    Referer:util.format("http://cas.analysys.com.cn/cas-auth-server/login?service=%s", that.redirectUrl),
                    Cookie:util.format("JSESSIONID=%s", JSESSIONID),
                    "Content-Type":"application/x-www-form-urlencoded"
                },
                followRedirect:false,
                method:"POST",
                form:body,
                callback:function(error, result) {
                    try {
                        setTimeout(function(){
                            that.enterWithTicket(result.caseless.dict.location);
                        }, 0);
                    } catch(e) {
                        logger.error("Eguan-getTicketForLogin location error.");
                        return;
                    }
                }
            })
        }
    });
}

Eguan.prototype.enterWithTicket = function(url) {
    that.crawler.queue({
        uri:url,
        headers:{
            "Accept-Language":"zh-CN,zh;q=0.8,en;q=0.6",
            Referer:util.format("http://cas.analysys.com.cn/cas-auth-server/login?service=%s", that.redirectUrl),
            Cookie:util.format("JSESSIONID=%s", that.JSESSIONID)
        },
        callback:function(error, result) {
            if(error) {
                logger.error("Eguan-enterWithTicket network error.");
                return;
            }
            logger.info(result.body);
            setTimeout(that.run, 0);
        }
    });
}

var that = new Eguan();
that.start();