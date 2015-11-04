var helper = require('../helpers/webhelper.js')
exports.hotel=function(){
    this.city="";
    this.id = 0;
    this.name = "";
    this.shortName = "";
    this.star=0;
    this.currency = "";
    this.lowPrice="";
    this.points="";
    this.zoneName="";
    this.picCount=0;
    this.commentCount=0;

    this.isGift=false;
    this.isNew=false;
    this.isFan=false;
    this.fanPrice=0;
    this.fanType="";
    this.isQuan=false;
    this.quanPrice=0;
    this.quanType="";
    this.isCu = false;
    this.isMp=false;
    this.isMorning=false;
    this.isStar=false;
    this.isRoomFull=false;

    
    this.faclPoints= "0";//设施
    this.raAtPoints = "0";//环境
    this.ratPoints = "0";//卫生
    this.servPoints = "0";//服务
    this.rooms = [];
};
exports.hotel.prototype.toString=function(site){
    if(site=="qunar_pc"){
        var sb = new helper.StringBuffer();
        for(var i=0;i<this.rooms.length;i++){
            for(var j=0;j<this.rooms[i].book.length;j++){
                sb.append(this.city);
                sb.append(',');
		sb.append(this.id);
		sb.append(',');
                sb.append(this.name);
		sb.append(',');
                sb.append(this.rooms[i].name);
                sb.append(',');
		sb.append(this.rooms[i].bedType||"");
                sb.append(',');
                sb.append(this.rooms[i].book[j].name);
                sb.append(",");
		sb.append(this.rooms[i].book[j].roomTitle||"");
		sb.append(",");
		sb.append(this.rooms[i].book[j].prePay||"");
		sb.append(",");
		sb.append(this.rooms[i].book[j].breakfast||"");
		sb.append(",");
                sb.append(this.rooms[i].book[j].price);
                sb.append(',');
                sb.append(this.rooms[i].book[j].fan);
		sb.append(',');
		sb.append();
                sb.append("\n");
            }
        }
        return sb.toString();
    }
    else if(site=="ctrip_pc"){
        var sb = new helper.StringBuffer();
        for(var i = 0;i<this.rooms.length;i++){
            sb.append(this.city);
            sb.append(',');
	    sb.append(this.id);
            sb.append(',');
            sb.append(this.name);
            sb.append(',');
            sb.append(this.rooms[i].name);
	    sb.append(',');
	    sb.append(this.rooms[i].pkg);
            sb.append(',');
            sb.append(this.rooms[i].bedType);
            sb.append(',');
            sb.append(this.rooms[i].price);
            sb.append(',');
            sb.append(this.rooms[i].fan);
            sb.append(',');
	    var b = this.rooms[i].breakfast;
	    if(b=='单早') sb.append(1);
            else if(b=="双早") sb.append(2);
	    else if(b=="三早") sb.append(3);
	    else if(b=="四早") sb.append(4);
	    else if(b=="五早") sb.append(5);
	    else if(b=="六早") sb.append(6);
	    else if(b=="七早") sb.append(7);
	    else sb.append(0);
	    
            sb.append(',');
            sb.append(this.rooms[i].lan);
	    sb.append(',');
	    sb.append(this.rooms[i].prePay?'Y':'N');
	    sb.append(',');
	    sb.append(this.rooms[i].assurance?'Y':'N');
	    sb.append(',');
	    sb.append(this.rooms[i].tags.join(';'));
            sb.append('\n');
        }
        return sb.toString();
    }
    else if(site=='elong'){
        var sb = new helper.StringBuffer();
        for(var i=0;i<this.rooms.length;i++){
            sb.append(this.city);
            sb.append(',');
	    sb.append(this.id);
	    sb.append(',');
            sb.append(this.name);
            sb.append(',');
            sb.append(this.star);
            sb.append(',');
            sb.append(this.rooms[i].name);
            sb.append(',');
            sb.append(this.rooms[i].price);
            sb.append(',');
            sb.append(this.rooms[i].fan);
            sb.append(',');
            sb.append(this.commentCount);
            sb.append(',');
            sb.append(this.prate);
            sb.append(',');
            sb.append(this.picCount);
            sb.append(',');
            sb.append(this.payType==0?'Y':'N');
            sb.append(',');
            sb.append(this.rooms[i].sjzx=='Y'?'Y':'N');
            sb.append(',');
            sb.append(this.rooms[i].jrtj=='Y'?'Y':'N');
            sb.append(',');
            if(this.rooms[i].breakfast=='无早')
                sb.append('0');
            else if(this.rooms[i].breakfast=='双早')
                sb.append('2');
            else if(this.rooms[i].breakfast=='单早')
                sb.append('1');
            
            sb.append(',');
            sb.append(this.rooms[i].lan);
            sb.append('\r\n');
        }
        return sb.toString();
    }
    else if(site=="qunar"){
        var sb = new helper.StringBuffer();
        for(var i=0;i<this.rooms.length;i++){
            var r = this.rooms[i];
            for(var j=0;j<r.sites.length;j++){
                sb.append(this.city);
                sb.append(',');
		sb.append(this.id);
		sb.append(',');
                sb.append(this.name);
                sb.append(',');
                sb.append(this.star);
                sb.append(',');
                sb.append(r.sites[j].pkg);
                sb.append(',');
                sb.append(r.sites[j].site)
                sb.append(',');
                sb.append(r.sites[j].price);
                sb.append(',');
                sb.append(this.commentCount);
                sb.append(',');
                sb.append(this.points);
                sb.append(',');
                sb.append(r.sites[j].tuan);
                sb.append('\r\n');
            }
        }
        return sb.toString();
    }
    else if(site=="elong_pc"){
        var sb = new helper.StringBuffer();
        for(var i = 0;i<this.rooms.length;i++){
            var r = this.rooms[i];
            for(var j=0;j<r.plans.length;j++){
                sb.append(this.city);
                sb.append(',');
		sb.append(this.id);
		sb.append(',');
                sb.append(this.name);
                sb.append(',');
                sb.append(this.zoneName);
                sb.append(',');
                sb.append(this.star);
                sb.append(',');
                sb.append(r.name);
                sb.append(',');
                sb.append(r.bedType);
                sb.append(',');
                sb.append(this.commentCount);
                sb.append(',');
                //sb.append(this.goodComment);
                //sb.append(',');
                //sb.append(this.badComment);
                //sb.append(',');
                sb.append(this.prate);
                sb.append(',');
                sb.append(r.plans[j].name);
                sb.append(',');
		var b = r.plans[j].breakfast;
		if(b=="单早"){
                    sb.append(1);
		}else if(b=="双早"){
		    sb.append(2);
		}else if(b=="三早"){
		    sb.append(3);
		}else{
		    sb.append(0);
		}
		sb.append(',');
                sb.append(r.plans[j].price);
                sb.append(',');
                sb.append(r.plans[j].fan);
                sb.append(',');
                sb.append(r.plans[j].lan);
                sb.append(',');
                sb.append(r.plans[j].payType);
                sb.append(',');
                sb.append(r.plans[j].hasWeifang);
                sb.append(',');
                sb.append(r.plans[j].needSurety);
                sb.append(',');
                sb.append(r.plans[j].gift.replace(/,/g,''));
                sb.append(',');
                sb.append(r.plans[j].reduce);
                sb.append(',');
                sb.append(r.plans[j].timeLimit);
                sb.append('\r\n');
            }
        }
        return sb.toString();
    }
    var sb = new helper.StringBuffer();
    for(var i=0;i<this.rooms.length;i++){
        sb.append(this.city);
        sb.append(',');
	sb.append(this.id);
	sb.append(',');
        sb.append(this.name);
        sb.append(',');
        sb.append(this.zoneName==null?"":this.zoneName);
	sb.append(',');
        sb.append(this.star);
        sb.append(',');
        sb.append(this.rooms[i].name);
        sb.append(',');
        sb.append(this.rooms[i].price);
        sb.append(',');
        sb.append(this.commentCount);
        sb.append(',');
        sb.append(this.picCount);
        sb.append(',');
        sb.append(this.points);
        sb.append(',');
        sb.append(this.faclPoints);//设施
        sb.append(',');
        sb.append(this.raAtPoints);//环境
        sb.append(',');
        sb.append(this.servPoints);//服务
        sb.append(',');
        sb.append(this.ratPoints);//卫生
        sb.append(',');
        //var b;
        //if(this.rooms[i].breakfast=="单早")
        //    b=1;
        //else if(this.rooms[i].breakfast=="双早")
        //    b=2;
        //else b=0;
        sb.append(this.rooms[i].breakfast);
        sb.append(',');
        if(this.rooms[i].gift){
            sb.append(this.rooms[i].gift);
	}else{
	    sb.append("N");
	}
	sb.append(',');
        //sb.append((this.isCu?"Y":"N"));
        //sb.append(',');
        if(this.rooms[i].fanPrice)
            sb.append(this.rooms[i].fanPrice);
	else{
	    sb.append("￥0");
	}
        sb.append(',');
        //sb.append(this.rooms[i].payType==0?"Y":"N");
	sb.append(this.rooms[i].pay);
	sb.append(',');
	sb.append(this.rooms[i].spay);
        sb.append('\r\n');
    }
    return sb.toString();
}

exports.room = function(){
    this.id=0;
    this.name="";
    this.breakfast="";
    this.fan="";
    this.gift="";
    this.isCu=0;
    this.payType=1;
    this.price="";
};

exports.flight = function(){
    this.aPortCode='';
    this.aTerminal='';
    this.aTime='';
    this.aaname='';
    this.airlineCode='';
    this.aname='';
    this.cmpName='';
    this.cabins=[];
    this.ctinfo=[];
    this.dPortCode='PEK';
    this.dTerminal=null;
    this.dTime='2014/2/23 6:35:00';
    this.daname='首都';
    this.flag=0;
    this.flightNo='';
    this.planeType='320';
    this.puncRate=93;
    this.stopCities=null;
    this.price = '';
};

exports.flight.prototype.toString=function(site,cabin){
    var sb = new helper.StringBuffer();
    if(site=="ctrip_pc"){
        for(var i=0;i<this.cabins.length;i++){
            var c = this.cabins[i];
            sb.append(this.dname);
            sb.append(',');
            sb.append(this.aname);
            sb.append(',');
            sb.append(this.flightNo);
            sb.append(',');
            sb.append(this.planeType);
            sb.append(',');
            sb.append(this.dTime);
            sb.append(',');
            sb.append(this.aTime);
            sb.append(',');
            sb.append(c.discount?c.discount:'');
            sb.append(',');
            sb.append(c.price);
            sb.append(',');
            sb.append(c.ctype);
            sb.append(',');
            sb.append(c.fan);
	    sb.append(',');
	    sb.append(this.tax);
	    sb.append(',');
	    sb.append(this.oilFee);
            sb.append(',');
            sb.append(c.tCount);
            sb.append(',');
            sb.append(this.puncRate);
            sb.append(',');
            sb.append(c.tui?c.tui:'');
            sb.append(',');
            sb.append(c.gai?c.gai:'');
            sb.append(',');
            sb.append(c.qian?c.qian:'');
            sb.append(',');
            sb.append(c.hui);
            sb.append(',');
            sb.append(c.lv);
            sb.append(',');
            sb.append(c.isSpec);//网络专享价
            sb.append(',');
            sb.append(c.isAgent);
            sb.append("\r\n");
        }
    }
    else if(site=="elong_pc"){
        //for(var i=0;i<this.cabins.length;i++){
            //var i=idx;
            //if(this.cabins[i].tui==undefined) continue;
            if(!cabin) {
                console.log("cabin null.");
                return;
            }
            sb.append(this.dname);
            sb.append(',');
            sb.append(this.aname);
            sb.append(',');
            sb.append(this.flightNo);
            sb.append(',');
            sb.append(this.dTime);
            sb.append(',');
            sb.append(this.aTime);
            sb.append(',');
            sb.append(this.price);
        sb.append(',');
        sb.append(cabin.tui.replace(/[,，\r\n]*/g,''));
            sb.append(',');
        sb.append(cabin.gai.replace(/[,，\r\n]*/g,''));
        sb.append(',');
        sb.append(cabin.qian.replace(/[,，\r\n]*/g,''));
            sb.append(',');
            sb.append(cabin.ctype);
            sb.append(',');
            sb.append(cabin.price);
            sb.append(',');
            sb.append(cabin.fan);
            sb.append(',');
        sb.append(cabin.tCount==2147483647?"充足":cabin.tCount);
            sb.append('\r\n');
        //}

    }else if(site=="qunar_pc"){
        sb.append(this.dname);
        sb.append(',');
        sb.append(this.aname);
        sb.append(',');
        sb.append(this.flightNo);
        sb.append(',');
        sb.append(this.dTime);
        sb.append(',');
        sb.append(this.aTime);
        sb.append(',');
        sb.append(this.price);
        sb.append('\r\n');
    }
    else{
        for(var i=0;i<this.cabins.length;i++){
        sb.append(this.dname);
        sb.append(',');
        sb.append(this.aname);
        sb.append(',');
        sb.append(this.cmpName);
        sb.append(this.flightNo);
        sb.append(',');
        sb.append(this.dTime);
        sb.append(',');
        sb.append(this.aTime);
        sb.append(',');
        sb.append(this.price);
        sb.append(',');
        sb.append(this.cabins[i].tui.replace(/[,]*/g,''));
        sb.append(',');
        sb.append(this.cabins[i].gai.replace(/[,]*/g,''));
        sb.append(',');
        sb.append(this.cabins[i].ctype);
        sb.append(',');
        sb.append(this.cabins[i].price);
        sb.append(',');
        sb.append(this.cabins[i].tCount);
        sb.append('\r\n');
        }
    }
    var result = sb.toString();
    sb=null;
    this.cabins = [];
    return result;
};
