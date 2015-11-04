function submitForm(n, t, i) {
    var r = document.createElement("form"),
    f,
    u;
    document.body.appendChild(r);
    r.method = "post";
    r.action = n;
    i && (r.target = i);
    for (f in t) u = document.createElement("input"),
    u.type = "hidden",
    u.value = t[f] == null ? "": t[f],
    u.name = f,
    r.appendChild(u);
    r.submit()
}
function $fixE(n) {
    var t, i;
    return n = window.event || n,
    n.target || (n.target = n.srcElement || document),
    n.target.nodeType === 3 && (n.target = n.target.parentNode),
    !n.relatedTarget && n.fromElement && (n.relatedTarget = n.fromElement === n.target ? n.toElement: n.fromElement),
    t = document.documentElement,
    n.pageX == null && n.clientX != null && (i = document.body, n.pageX = n.clientX + (t && t.scrollLeft || i && i.scrollLeft || 0) - (t && t.clientLeft || i && i.clientLeft || 0), n.pageY = n.clientY + (t && t.scrollTop || i && i.scrollTop || 0) - (t && t.clientTop || i && i.clientTop || 0)),
    n
}
function BaiduFloat() {
    try {
        document.referrer.toLowerCase().indexOf("baidu.com") > -1 && ($.loader.js("http://webresource.c-ctrip.com/ResCRMOnline/r1/js/float/active_float.min.js?releaseNo=" + ReleaseNo, {
            onload: function() {
                $.ajax(RootUrl + "HTML/baiduad.htm", {
                    onsuccess: function(n) {
                        var i = n.responseText,
                        t;
                        $("body").append($.instance(i));
                        t = new RegExp("baiduevn=([^&]+)", "i");
                        floatDomain = window.location.href.match(t) ? RegExp.$1: GetFloatDomainValue(window.location.host);
                        $("body").append($.instance('<input id="siteDomain" type="hidden" value="' + floatDomain + '" />'));
                        AppFloat.init("flight")
                    }
                })
            }
        }), $.loader.css("http://webresource.c-ctrip.com/ResCRMOnline/r1/css/float/float_lipin.css?releaseNo=" + ReleaseNo))
    } catch(n) {}
}
function GetFloatDomainValue(n) {
    var u = "",
    i, t, r;
    if (n != null && n != "") for (i = [".ctrip.", ".test.", ".testp.", ".dev.", ".testu."], t = 0; t < i.length; t++) if (n.indexOf(i[t]) > -1) {
        r = i[t].substring(1);
        u = r == "ctrip" ? r: r + "sh.ctriptravel";
        break
    }
    return u
}
function loadDomReady() {
    $.mod.multiLoad({
        address: "1.0",
        animate: "1.0",
        calendar: "6.0",
        jmp: "1.1",
        notice: "1.1",
        sideBar: "2.0",
        validate: "1.1"
    },
		    function() {
			var n, t;
			window.JsDiifTime = 0;
			online.registerAll();
			online.validateObj = online.getValidate();
			n = (new Date).getTime();
			SearchBox.init();
			pageConfig.needSearch ? (FlightFilter.init(), window.JsDiifTime += (new Date).getTime() - n, jsonCallback.ready(function(n) {
			    ResultList.processData(n, 0)
			}), jsonCallback.error(function(n) {
			    var n = {
				Error: {
				    Code: -1
				}
			    };
			    ResultList.processError(n)
			})) : setUTB_EDM();
			AirHotel.init();
			display360Ad();
			getOrderDynamic();
			t = $(document).regMod("sideBar", "2.0", {
			    url: {
				feedBackURL: "http://accounts.ctrip.com/MyCtrip/Community/CommunityAdvice.aspx?productType=1",
				liveChatURL: "http://livechat.ctrip.com/livechat/Login.aspx?GroupCode=FlightBookLocal&AsFrom=1|国内机票预定|航班选择||||||"
			    }
			});
			BaiduFloat()
		    });
    $("html").bind("mousedown",
		   function() {
		       addressFocusFlag = !1;
		       setTimeout(function() {
			   addressFocusFlag = !0
		       })
		   })
}
function getQueryInfo(n) {
    var t = {};
    return t.DCity1 = n.DCity1,
    t.ACity1 = n.ACity1,
    t.SearchType = n.SearchType,
    t.DDate1 = n.DDate1,
    n.PassengerType != "ADU" && (t.PassengerType = n.PassengerType),
    t.SearchType != "S" && (t.DDate2 = n.DDate2, t.ACity2 = n.ACity2),
    n.AirlineCode != "" && (t.AirlineCode = n.AirlineCode),
    n.EncryptUserId != "" && (t.EncryptUserId = n.EncryptUserId),
    n.Quantity > 1 && (t.Quantity = n.Quantity),
    n.ClassType != "" && (t.ClassType = n.ClassType),
    n.DPort1 && n.DPort1 != "" && (t.DCity1 += "," + n.DPort1, t.DPort1 = ""),
    n.APort1 && n.APort1 != "" && (t.ACity1 += "," + n.APort1, t.APort1 = ""),
    n.APort2 && n.APort2 != "" && (t.ACity2 += "," + n.APort2, t.APort2 = ""),
    n.DontDownloadData && n.DontDownloadData != "" && (t.DontDownloadData = n.DontDownloadData),
    t
}
function getCityUrlParameter() {
    var n = "";
    return SearchCondition.DCity1 != "" && (n = SearchCondition.DCity1.split(",")[0]),
    SearchCondition.ACity1 != "" && (n += "-" + SearchCondition.ACity1.split(",")[0]),
    SearchCondition.ACity2 && SearchCondition.ACity2 != "" && SearchCondition.ACity2 != SearchCondition.DCity1 && (n += "-" + SearchCondition.ACity2.split(",")[0]),
    n == "" ? "Search": n
}
function ModifyFlight() {
    SearchCondition.SearchRouteIndex = 0;
    window.location = SEORootUrl + SearchCondition.DCity1 + "-" + SearchCondition.ACity1 + "/?" + $.toQuery(getQueryInfo(SearchCondition))
}
function OpenGiftDetail(n) {
    SetDisplayedGift(n);
    window.open(RootUrl + "HTML/GiftDetail.htm", "newwindow", "height=620,width=710,top=0,left=0,toolbar=no,menubar=no,location=no,status=no")
}
function SetDisplayedGift(n) {
    var i, t, r;
    if ($interface.Gifts = {},
	n.indexOf(",") != -1) for (i = n.split(","), t = 0, r = i.length; t < r; t++) $interface.Gifts["Gift" + i[t]] = routeGift["Gift" + i[t]];
    else $interface.Gifts["Gift" + n] = routeGift["Gift" + n]
}
function getOrderDynamic() {
    var n = RootUrl + "Search/BuildOrderDynamicShowSection/?dCity=" + SearchCondition.DCity1 + "&aCity=" + SearchCondition.ACity1;
    $.ajax(n, {
        cache: !1,
        onsuccess: function(n) {
            if (n.responseText != "") {
                var t = '<div id="div_DynamicShowSection" style="z-index: 10000;" class="searchresult_trends_tip">' + n.responseText + "<\/div>";
                $("body").append($.instance(t));
                setTimeout(function() {
                    $("#div_DynamicShowSection").hide()
                },
			   5e3)
            }
        }
    })
}
function OpenSpecialFlightPage(n, t, i) {
    var r = $.cloneJSON(SearchCondition),
    u;
    r.Airline = n;
    r.prit = t;
    r.SpecialType = i;
    cityURL = getCityUrlParameter();
    switch (t.toUpperCase()) {
    case "CZSPECIALPRICE":
        r.SearchType.trim() == "S" && (r.SearchType = "D", r.DDate2 = r.DDate1.toDate().addDays(2).toFormatString("yyyy-MM-dd"));
        window.open(SEORootUrl + cityURL + "/ShowFareMultipleSpecial?" + $.toQuery(r));
        break;
    case "ROUNDTRIPPRICE":
        r.SearchType.trim() == "S" && (r.SearchType = "D", r.DDate2 = r.DDate1.toDate().addDays(2).toFormatString("yyyy-MM-dd"));
        window.open(SEORootUrl + cityURL + "/ShowFareMultipleSpecial?" + $.toQuery(r));
        break;
    case "SINGLETRIPPRICE":
        r.SearchRouteIndex == "1" && r.SearchType == "D" ? (u = {
            DCity1: r.ACity1,
            ACity1: r.DCity1,
            DDate1: r.DDate2,
            passengerQuantity: r.Quantity,
            PassengerType: r.PassengerType,
            SearchType: "S",
            RouteIndex: 1
        },
							    window.open(SEORootUrl + r.ACity1 + "-" + r.DCity1 + "/ShowFareSingleSpecial?" + $.toQuery(u))) : r.SearchRouteIndex == "1" && r.SearchType == "M" ? (u = {
								DCity1: r.ACity1,
								ACity1: r.ACity2,
								DDate1: r.DDate2,
								passengerQuantity: r.Quantity,
								PassengerType: r.PassengerType,
								SearchType: "S",
								RouteIndex: 1
							    },
																										  window.open(SEORootUrl + r.ACity1 + "-" + r.ACity2 + "/ShowFareSingleSpecial?" + $.toQuery(u))) : (r.DDate2 = "", r.ACity2 = "", window.open(SEORootUrl + cityURL + "/ShowFareSingleSpecial?" + $.toQuery(r)));
        break;
    default:
        return ! 1
    }
}
function setUTB_EDM() {
    try {
        var r = "FlightType=" + {
            searchType: {
                S: "OW",
                D: "RT",
                M: "Multi"
            }
        }.searchType[SearchCondition.SearchType] + "&PassengerType=" + textConfig.passengerType[SearchCondition.PassengerType] + "&Quantity=" + SearchCondition.Quantity + "&Airline=" + SearchCondition.AirlineCode + "&SendTicketCity=" + SearchCondition.DCityName1 + "&SubClass=" + (SearchCondition.ClassType == "CF" ? "公务舱/头等舱": "经济舱"),
        t = "",
        i = "",
        n = "",
        u = "";
        SearchCondition.SearchType == "S" ? (t = SearchCondition.DCityName1 + "-" + SearchCondition.DCity1 + "-", i = SearchCondition.ACityName1 + "-" + SearchCondition.ACity1 + "-", n = SearchCondition.DDate1) : (t = SearchCondition.DCityName1 + "-" + SearchCondition.DCity1 + "-," + SearchCondition.ACityName1 + "-" + SearchCondition.ACity1 + "-", i = SearchCondition.ACityName1 + "-" + SearchCondition.ACity1 + "-," + SearchCondition.ACityName2 + "-" + SearchCondition.ACity2 + "-", SearchCondition.SearchType == "D" ? (n = SearchCondition.DDate1, u = SearchCondition.DDate2) : n = SearchCondition.DDate1 + "," + SearchCondition.DDate2);
        r += "&From=" + t + "&To=" + i + "&FromTime=" + n + "&ToTime=" + u;
        var f = $.config("charset").indexOf("big5") > -1 ? "big5": "gb",
        e = "UID=${duid}&page_id=${page_id}&" + r + "&Language=" + f;
        window.$_bf && window.$_bf.loaded === !0 ? window.$_bf.tracklog("flt.searchresult", e) : setTimeout("window.$_bf.tracklog(UBTKey, value)", 500)
    } catch(o) {}
}
function ReselectAirport() {
    var n = $.cloneJSON(SearchCondition),
    f = $("input[name='recommendDPort']:checked"),
    e = $("input[name='recommendAPort']:checked"),
    t = f.attr("citycode"),
    r = f.attr("cityname"),
    o = f.attr("airportname"),
    i = e.attr("citycode"),
    u = e.attr("cityname"),
    s = e.attr("airportname");
    f.length > 0 && (n.DCity1 = t, n.DCityName1 = r, o.indexOf(textConfig.airport[4]) > -1 && (n.DCity1 = t + ",SHA", n.DCityName1 = r + "(" + textConfig.airport[4] + ")"), o.indexOf(textConfig.airport[5]) > -1 && (n.DCity1 = t + ",PVG", n.DCityName1 = r + "(" + textConfig.airport[5] + ")"), o.indexOf(textConfig.airport[2]) > -1 && (n.DCity1 = t + ",PEK", n.DCityName1 = r + "(" + textConfig.airport[2] + ")"), o.indexOf(textConfig.airport[3]) > -1 && (n.DCity1 = t + ",NAY", n.DCityName1 = r + "(" + textConfig.airport[3] + ")"));
    e.length > 0 && (n.ACity1 = i, n.ACityName1 = u, s.indexOf(textConfig.airport[4]) > -1 && (n.ACity1 = i + ",SHA", n.ACityName1 = u + "(" + textConfig.airport[4] + ")"), s.indexOf(textConfig.airport[5]) > -1 && (n.ACity1 = i + ",PVG", n.ACityName1 = u + "(" + textConfig.airport[5] + ")"), s.indexOf(textConfig.airport[2]) > -1 && (n.ACity1 = i + ",PEK", n.ACityName1 = u + "(" + textConfig.airport[2] + ")"), s.indexOf(textConfig.airport[3]) > -1 && (n.ACity1 = i + ",NAY", n.ACityName1 = u + "(" + textConfig.airport[3] + ")"));
    n.SearchType == "D" && (n.ACity2 = n.DCity1, n.ACityName2 = n.DCityName1);
    window.location = t != "" && i != "" ? SEORootUrl + t + "-" + i + "?" + $.toQuery(n) : RootUrl + "Search/FirstRoute?" + $.toQuery(n)
}
function getRecommendProducts(n, t) {
    var i = "",
    r, u, f;
    n && (n.rn && (i = "Near"), n.rht && (i += ",Train"), n.rt && (i += ",Trasit"));
    i != "" && (r = "dcity=" + SearchCondition.DCity1 + "&acity=" + SearchCondition.ACity1 + "&departdate=" + SearchCondition.DDate1 + "&type=" + i, r += t ? "&price=" + t: "&price=", u = "FSR", SearchCondition.SearchRouteIndex == 0 ? r += "&currentPageType=FSR": (u = "SSR", r += "&currentPageType=SSR"), f = RootUrl + "Search/Get_FlightRecommendForAjax/?" + r, $.ajax(f, {
        onsuccess: function(n) {
            var y, nt, o, d, b, k, rt, t, ut, f, w, s;
            if (n = n.responseText, y = function(n) {
                return new Function("return " + n)()
            } (n), y != null) {
                var i = y.NearRecommendModel,
                e = y.HighTrainRecommendModel,
                r = y.TransitFlightRecommendModel,
                g = "",
                c = "",
                p = "",
                l = "",
                a = "",
                v = "",
                h = "";
                switch (u) {
                case "BTH":
                    l = "#rec=BG";
                    a = "#rec=BLJ";
                    v = "#rec=BLG";
                    h = "#rec=BZ";
                    break;
                case "WZF":
                    l = "#rec=WG";
                    a = "#rec=WLJ";
                    v = "#rec=WLG";
                    h = "#rec=WZ";
                    break;
                case "YSW":
                    l = "#rec=YG";
                    a = "#rec=YLJ";
                    v = "#rec=YLG";
                    h = "#rec=YZ";
                    break;
                case "WJC":
                    l = "#rec=EG";
                    a = "#rec=ELJ";
                    v = "#rec=ELG";
                    h = "#rec=EZ";
                    break;
                default:
                    l = "#rec=SG";
                    a = "#rec=SLJ";
                    v = "#rec=SLG";
                    h = "#rec=SZ"
                }
                if (r != null && r.length > 0) {
                    for (nt = r.length > 4 ? 4 : r.length, o = $.cloneJSON(SearchCondition), t = 0; t < nt; t++) o.DCity1 = r[t].DepartCity.Code.trim(),
                    o.ACity1 = r[t].TransitCity.Code.trim(),
                    o.ACity2 = r[t].ArriveCity.Code.trim(),
                    r[t].OtherDayRecommend ? (f = o.DDate1.toDate().addDays(1), w = f.getFullYear().toString() + "-" + (f.getMonth() + 1).toString() + "-" + f.getDate().toString(), o.DDate2 = w, d = typeof msg != "undefined" ? "隔日中转": "") : (o.DDate2 = SearchCondition.DDate1, d = ""),
                    h != "" && (p += '<li><a href="' + SEORootUrl + r[t].DepartCity.Code.trim() + "-" + r[t].TransitCity.Code.trim() + "/?" + encodeURI($.toQuery(o)) + "&" + h + '" target="_blank">', p += r[t].DepartCity.Name.trim() + "—" + r[t].ArriveCity.Name.trim() + "<br />（" + (typeof msg != "undefined" ? "经": "") + "" + r[t].TransitCity.Name.trim() + "）" + d + '<br /><span class="base_price"><dfn>&yen;<\/dfn>' + r[t].Price + "<\/span><\/a>", p += "<\/li>");
                    $("#TransferFlightRecommend").length > 0 && $("#TransferFlightRecommend").remove();
                    $("#recommendProducts").length > 0 && p != "" && (s = '<div class="recommend_box" id="TransferFlightRecommend"><h3>' + textConfig.text[48] + '<\/h3><ul class="recommend_list clearfix">' + p + "<\/ul><\/div>", $("#recommendProducts").append($.instance(s)))
                }
                if (e != null && e.length > 0) {
                    var ft = SearchCondition.DDate1.replace(/\-/g, "/"),
                    et = Math.ceil((new Date(ft) - new Date) / 864e5) + 1,
                    tt = "http://trains.ctrip.com/TrainBooking/Search.aspx?from=" + e[0].DepartCity.NamePinyin.trim() + "&to=" + e[0].ArriveCity.NamePinyin.trim() + "&day=" + et,
                    it = e[0].DepartCity.Name.trim() + "—" + e[0].ArriveCity.Name.trim() + "（" + e[0].SeatTypeName.trim() + '）<span class="base_price"><dfn>&yen;<\/dfn>' + e[0].Price + "<\/span><\/a>";
                    g += '<a href="' + tt + "&" + v + '" class="low_price" target="_blank">';
                    g += it;
                    b = "<h3>" + (typeof msg != "undefined" ? "高铁推荐": "") + '<\/h3><a href="' + tt + "&" + l + '" class="emu"  target="_blank">';
                    b += it;
                    $("#HighTrainRecommend").length > 0 && $("#HighTrainRecommend").remove();
                    $("#recommendProducts").length > 0 && b != "" && (s = '<div class="recommend_box" id="HighTrainRecommend">' + b + "<\/div>", $("#recommendProducts").append($.instance(s)))
                }
                if (i != null && i.length > 0) {
                    for (k = $.cloneJSON(SearchCondition), rt = i.length > 4 ? 4 : i.length, t = 0; t < rt; t++) k.DCity1 = i[t].DepartCity.Code.trim(),
                    k.ACity1 = i[t].ArriveCity.Code.trim(),
                    ut = i[t].Rate == 0 || i[t].Rate == 1 ? "": (i[t].Rate * 10).toFixed(1) + (typeof msg != "undefined" ? "折": ""),
                    f = SearchCondition.DDate1.toDate(),
                    w = f.getFullYear().toString() + "-" + (f.getMonth() + 1).toString() + "-" + f.getDate().toString(),
                    c += '<li><a class="low_price" href="javascript:void(0);"><span class="base_price">' + w + "<\/span><\/a>",
                    c += '<a href="' + SEORootUrl + i[t].DepartCity.Code.trim() + "-" + i[t].ArriveCity.Code.trim() + "/?" + encodeURI($.toQuery(k)) + "&" + a + '" target="_blank">',
                    c += i[t].DepartCity.Name.trim() + "—" + i[t].ArriveCity.Name.trim() + '<br /><span class="base_price"><dfn>&yen;<\/dfn>' + i[t].Price + "&nbsp;" + ut + "<\/span><\/a>",
                    c += "<\/li>";
                    $("#NearFlightRecommend").length > 0 && $("#NearFlightRecommend").remove();
                    $("#recommendProducts").length > 0 && c != "" && (s = '<div class="recommend_box" id="NearFlightRecommend"><h3>' + textConfig.text[49] + '<\/h3><ul class="recommend_list clearfix">' + c + "<\/ul><\/div>", $("#recommendProducts").append($.instance(s)))
                }
            }
        }
    }))
}
function display360Ad() {
    var n, t, i; (typeof hascookieuser == "undefined" || hascookieuser != "T") && (n = $.cookie.get("Union", "AllianceID"), t = $.cookie.get("Union", "SID"), window.location.href.toLowerCase().indexOf("c=360oneboxf") != -1 || $.cookie.get("Union") && n == "5376" && t == "176275") && (i = '<div class="floatad_360" id="div360"><p><a class="floatad_360_btn" href="https://accounts.ctrip.com/member/emailregist.aspx" target="_blank"><span><\/span><\/a><a class="floatad_360_close" href="javascript:void(0)" onclick="document.getElementById("div360").style.display="none";"><\/a><\/p><\/div>', $("#div360").length == 0 && ($("body").append($.instance(i)), setTimeout(function() {
        $("#div360").hide()
    },
																																																																																			7e3)))
}
var FlightBuilder, LowestPriceCalendar; (function(n) {
    n.extend({
        rboolean: /^(?:checked|selected|autofocus|autoplay|async|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped)$/i,
        propFix: {
            tabindex: "tabIndex",
            readonly: "readOnly",
            "for": "htmlFor",
            "class": "className",
            maxlength: "maxLength",
            cellspacing: "cellSpacing",
            cellpadding: "cellPadding",
            rowspan: "rowSpan",
            colspan: "colSpan",
            usemap: "useMap",
            frameborder: "frameBorder",
            contenteditable: "contentEditable"
        },
        elemdisplay: [],
        dir: function(t, i, r) {
            for (var f = [], u = t[i]; u && u.nodeType !== 9 && (r === undefined || u.nodeType !== 1 || !n(u).is(r));) u.nodeType === 1 && f.push(u),
            u = u[i];
            return f
        },
        isNative: function(n) {
            return /^[^{]+\{\s*\[native code/.test(n + "")
		     },
            containsElement: function(t, i) {
		if (n.isNative(document.documentElement.contains) || document.documentElement.compareDocumentPosition) {
                    var u = t.nodeType === 9 ? t.documentElement: t,
                    r = i && i.parentNode;
                    return t === r || !!(r && r.nodeType === 1 && (u.contains ? u.contains(r) : t.compareDocumentPosition && t.compareDocumentPosition(r) & 16))
		}
		if (i) while (i = i.parentNode) if (i === t) return ! 0;
		return ! 1
            },
            isHidden: function(t, i) {
		return t = i || t,
		n(t).css("display") === "none" || !n.containsElement(t.ownerDocument, t)
            },
            defaultDisplay: function(t) {
		var i = n.elemdisplay[t],
		r;
		return i || (r = document.createElement(t), document.body.appendChild(r), i = n(r).css("display"), n(r).remove(), n.elemdisplay[t] = i),
		i
            },
            showHide: function(t, i) {
		for (var e, r, o, f = [], u = 0, s = t.length; u < s; u++)(r = t[u], r.style) && (f[u] = n(r).data("olddisplay"), e = r.style.display, i ? (f[u] || e !== "none" || (r.style.display = ""), r.style.display === "" && n.isHidden(r) && (f[u] = n.defaultDisplay(r.nodeName), n(r).data("olddisplay", f[u]))) : f[u] || (o = n.isHidden(r), (e && e !== "none" || !o) && (f[u] = o ? e: n(r).css("display"), n(r).data("olddisplay", f[u]))));
		for (u = 0; u < s; u++)(r = t[u], r.style) && (i && r.style.display !== "none" && r.style.display !== "" || (r.style.display = i ? f[u] || "": "none"));
		return t
            },
            bodyWidth: function() {
		var t, i;
		return n.browser.isIE6 ? (t = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth), i = Math.max(document.documentElement.offsetWidth, document.body.offsetWidth), t < i ? document.documentElement.clientWidth: t) : Math.max(document.body.scrollWidth, document.documentElement.scrollWidth, document.body.offsetWidth, document.documentElement.offsetWidth, document.documentElement.clientWidth)
            },
            bodyHeight: function() {
		var t, i;
		return n.browser.isIE6 ? (t = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight), i = Math.max(document.documentElement.offsetHeight, document.body.offsetHeight), t < i ? document.documentElement.clientHeight: t) : Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.documentElement.clientHeight)
            },
            instance: function(t) {
		var l, e, o, r, u, s, a, h, c, f, v, i;
		if (typeof t == "string" && (l = new RegExp("<([a-zA-Z1-9]+)", "i"), l.test(t) && (e = {
                    option: [1, "<select multiple='multiple'>", "<\/select>"],
                    legend: [1, "<fieldset>", "<\/fieldset>"],
                    area: [1, "<map>", "<\/map>"],
                    param: [1, "<object>", "<\/object>"],
                    thead: [1, "<table>", "<\/table>"],
                    tr: [2, "<table><tbody>", "<\/tbody><\/table>"],
                    col: [2, "<table><tbody><\/tbody><colgroup>", "<\/colgroup><\/table>"],
                    td: [3, "<table><tbody><tr>", "<\/tr><\/tbody><\/table>"],
                    _default: [0, "", ""]
		},
												   o = RegExp.$1, o))) {
                    r = e[o] || e._default;
                    u = document.createElement("div");
                    u.innerHTML = r[1] + t + r[2];
                    s = r[0];
                    try {
			for (a = n(u), i = a.childNodes(); s-->0;) i = i.childNodes();
			return i
                    } catch(y) {
			for (h = [], c = u.childNodes, f = 0, v = c.length; f < v; f++) h.push(c[f]);
			for (i = cQuery.fn.pushStack(h); s-->0;) i = n(i[0].childNodes[0]);
			return i
                    }
		}
		return null
            },
            dateDiff: function(n, t) {
		var n = typeof n == "string" ? n.toDateTime() : n,
		t = typeof t == "string" ? t.toDateTime() : t,
		i = t.getTime() - n.getTime();
		return {
                    days: Math.floor(i / 864e5),
                    hours: Math.floor(i / 36e5),
                    minutes: Math.floor(i / 6e4),
                    seconds: Math.floor(i / 1e3),
                    milliseconds: i
		}
            },
            cloneJSON: function(t) {
		var i = n.stringifyJSON(t);
		return n.parseJSON(i)
            },
            fromQuery: function(n, t) {
		for (var i, u = n.split("&"), f = {},
		     r = 0; r < u.length; r++) i = u[r].split("="),
		1 < i.length && (f[i[0]] = t ? t(i.slice(1).join("=")) : i.slice(1).join("="));
		return f
            },
            toQuery: function(n, t) {
		var r = [],
		i;
		for (i in n) n.hasOwnProperty(i) && r.push([i, t ? t(n[i]) : n[i]].join("="));
		return r.join("&")
            },
            stopEvent: function(n, t) {
		n = $fixE(n);
		t = t || 0;
		0 <= t && (n.preventDefault ? n.stopPropagation() : n.cancelBubble = !0);
		0 != t && (n.preventDefault ? n.preventDefault() : n.returnValue = !1)
            }
	});
	     n.extend(!1, n.fn, {
		 show: function() {
		     return n.showHide(this, !0)
		 },
		 hide: function() {
		     return n.showHide(this, !1)
		 },
		 values: function() {
		     var n = "";
		     return this.each(function(t) {
			 n += t.value() + ","
		     }),
		     n.length > 0 ? n.substr(0, n.length - 1) : n
		 },
		 previousSiblings: function() {
		     for (var n = this,
			  t = []; (n = n.previousSibling()) && n.length > 0;) t.push(n[0]);
		     return this.pushStack(t)
		 },
		 nextSiblings: function() {
		     for (var n = this,
			  t = []; (n = n.nextSibling()) && n.length > 0;) t.push(n[0]);
		     return this.pushStack(t)
		 },
		 siblings: function() {
		     for (var n = this,
			  t = []; (n = n.previousSibling()) && n.length > 0;) t.push(n[0]);
		     for (n = this; (n = n.nextSibling()) && n.length > 0;) t.push(n[0]);
		     return this.pushStack(t)
		 },
		 parents: function(t) {
		     var r = [],
		     i;
		     return this.each(function(t) {
			 for (var u = n.dir(t.get(0), "parentNode"), i = 0; i < u.length; i++) r.push(u[i])
		     }),
		     i = this.pushStack(r),
		     t && (i = i.filter(t)),
		     i
		 },
		 parentsUntil: function(t, i) {
		     var u = [],
		     f = this.length,
		     r;
		     return this.each(function(i) {
			 for (var f = n.dir(i.get(0), "parentNode", t), r = 0; r < f.length; r++) u.push(f[r])
		     }),
		     r = this.pushStack(u),
		     i && (r = r.filter(i)),
		     r
		 },
		 removeAttr: function(t) {
		     var i = n.propFix[t] || t;
		     return this.each(function(r) {
			 n.rboolean.test(t) ? r.get(0)[i] = !1 : r.get(0).attr(i, "");
			 r.get(0).removeAttribute(i)
		     }),
		     this
		 },
		 bgiframe: function(t) {
		     if (n.browser.isIE6) {
			 t = n.extend(!0, {
			     top: "auto",
			     left: "auto",
			     width: "auto",
			     height: "auto",
			     opacity: !0,
			     src: "javascript:false;"
			 },
				      t || {});
			 var i = function(n) {
			     return n && n.constructor == Number ? n + "px": n
			 },
			 r = '<iframe class="bgiframe" frameborder="0" tabindex="-1" src="' + t.src + '" style="display:block;position:absolute;z-index:-1;' + (t.opacity !== !1 ? "filter:Alpha(Opacity='0');": "") + "top:" + (t.top == "auto" ? "expression(((parseInt(this.parentNode.currentStyle.borderTopWidth)||0)*-1)+'px')": i(t.top)) + ";left:" + (t.left == "auto" ? "expression(((parseInt(this.parentNode.currentStyle.borderLeftWidth)||0)*-1)+'px')": i(t.left)) + ";width:" + (t.width == "auto" ? "expression(this.parentNode.offsetWidth+'px')": i(t.width)) + ";height:" + (t.height == "auto" ? "expression(this.parentNode.offsetHeight+'px')": i(t.height)) + ';"/>';
			 return this.each(function(n) {
			     n.find("iframe.bgiframe").length == 0 && n.prepend(document.createElement(r))
			 })
			     }
		     return this
		 }
	     });
	     n.extend(!0, Array.prototype, {
		 remove: function(n) {
		     for (var t = 0,
			  i = this.length; t < i; t++) this[t] == n && this.splice(t, 1)
		 },
		 associate: function(n, t) {
		     for (var r = t || {},
			  i = 0,
			  u = Math.min(n.length, this.length); i < u; i++) r[n[i]] = this[i];
		     return r
		 },
		 contains: function(n) {
		     for (var t = 0,
			  i = this.length; t < i;) if (this[t++] == n) return ! 0;
		     return ! 1
		 }
	     });
	     n.extend(!0, Date.prototype, {
		 getFestival: function() {
		     function l(n) {
			 return a(n) ? i[n - 1900] & 65536 ? 30 : 29 : 0
		     }
		     function a(n) {
			 return i[n - 1900] & 15
		     }
		     function p(n, t) {
			 return i[n - 1900] & 65536 >> t ? 30 : 29
		     }
		     function w(n) {
			 for (var r = 348,
			      t = 32768; t > 8; t >>= 1) r += i[n - 1900] & t ? 1 : 0;
			 return r + l(n)
		     }
		     function v(n) {
			 typeof n == "string" && (n = new Date(Date.parse(n)));
			 var i, f = 0,
			 u = 0,
			 r = Math.floor((n.getTime() + 22064256e5) / 864e5),
			 t = {};
			 for (t.dayCyl = r + 40, t.monCyl = 14, i = 1900; i < 2050 && r > 0; i++) u = w(i),
			 r -= u,
			 t.monCyl += 12;
			 for (r < 0 && (r += u, i--, t.monCyl -= 12), t.year = i, t.yearCyl = i - 1864, f = a(i), t.isLeap = !1, i = 1; i < 13 && r > 0; i++) f > 0 && i == f + 1 && t.isLeap == !1 ? (--i, t.isLeap = !0, u = l(t.year)) : u = p(t.year, i),
			 t.isLeap == !0 && i == f + 1 && (t.isLeap = !1),
			 r -= u,
			 t.isLeap == !1 && t.monCyl++;
			 return r == 0 && f > 0 && i == f + 1 && (t.isLeap ? t.isLeap = !1 : (t.isLeap = !0, --i, --t.monCyl)),
			 r < 0 && (r += u, --i, --t.monCyl),
			 t.month = ("0" + i).slice( - 2),
			 t.day = ("0" + (r + 1)).slice( - 2),
			 t.year + "-" + t.month + "-" + t.day
		     }
		     var t = n.config("charset") == "gb2312",
		     o = {
			 "0101": t ? "元旦": "元旦",
			 "0501": t ? "劳动节": "勞動節",
			 "1001": t ? "国庆节": "國慶節",
			 "1225": t ? "圣诞节": "聖誕節"
		     },
		     r = (new Date).getFullYear(),
		     h = "0404",
		     c,
		     i,
		     s,
		     y,
		     u,
		     f,
		     e;
		     return ",2014,2015,2018,2019,2022,2023,2026,2027,2030,2031,2034,2035,2038,2039,2043,2047,".indexOf("," + r + ",") > -1 && (h = "0405"),
		     o[h] = t ? "清明节": "清明節",
		     c = {
			 "0101": t ? "春节": "春節",
			 "1230": t ? "除夕": "除夕",
			 "0115": t ? "元宵节": "元宵節",
			 "0505": t ? "端午节": "端午節",
			 "0815": t ? "中秋节": "中秋節"
		     },
		     i = [19416, 19168, 42352, 21717, 53856, 55632, 91476, 22176, 39632, 21970, 19168, 42422, 42192, 53840, 119381, 46400, 54944, 44450, 38320, 84343, 18800, 42160, 46261, 27216, 27968, 109396, 11104, 38256, 21234, 18800, 25958, 54432, 59984, 28309, 23248, 11104, 100067, 37600, 116951, 51536, 54432, 120998, 46416, 22176, 107956, 9680, 37584, 53938, 43344, 46423, 27808, 46416, 86869, 19872, 42448, 83315, 21200, 43432, 59728, 27296, 44710, 43856, 19296, 43748, 42352, 21088, 62051, 55632, 23383, 22176, 38608, 19925, 19152, 42192, 54484, 53840, 54616, 46400, 46496, 103846, 38320, 18864, 43380, 42160, 45690, 27216, 27968, 44870, 43872, 38256, 19189, 18800, 25776, 29859, 59984, 27480, 21952, 43872, 38613, 37600, 51552, 55636, 54432, 55888, 30034, 22176, 43959, 9680, 37584, 51893, 43344, 46240, 47780, 44368, 21977, 19360, 42416, 86390, 21168, 43312, 31060, 27296, 44368, 23378, 19296, 42726, 42208, 53856, 60005, 54576, 23200, 30371, 38608, 19415, 19152, 42192, 118966, 53840, 54560, 56645, 46496, 22224, 21938, 18864, 42359, 42160, 43600, 111189, 27936, 44448],
		     r = this.toFormatString("yyyy"),
		     _month = this.toFormatString("MM"),
		     _date = this.toFormatString("dd"),
		     o[_month + _date] ? s = o[_month + _date] : (y = v(r + "/" + _month + "/" + _date), u = y.substr(5).replace("-", ""), u == "1229" && (f = new Date(Date.parse(r + "/" + _month + "/" + _date) + 864e5), e = v(f.getFullYear() + "/" + ("0" + (f.getMonth() + 1)).slice( - 2) + "/" + ("0" + f.getDate()).slice( - 2)), e = e.substr(5).replace("-", ""), e == "0101" && (u = "1230")), s = c[u] || ""),
		     s
		 }
	     })
	    })(cQuery),
					 function(n) {
					     Ctrip = {};
					     Ctrip.UI = {};
					     var t = function(i) {
						 window.CTRIP_UI_Dialogs == undefined && (window.CTRIP_UI_Dialogs = []);
						 var h = {
						     WIDTH: 960,
						     HEIGHT: 720
						 },
						 c = {
						     x: 0,
						     y: 0
						 },
						 l = {
						     top: 0,
						     left: 0
						 },
						 r = {},
						 u = n.extend(!0, {
						     title: "",
						     type: "content",
						     content: "",
						     showTitle: !0,
						     showClose: !0,
						     closeText: "×",
						     width: 320,
						     height: 240,
						     modal: !0,
						     draggable: !1,
						     autoShow: !0,
						     fixed: !0,
						     loading: '<img src="http://pic.c-ctrip.com/myctripv2/loading_animation_20.gif" />',
						     classNames: {
							 dialog: "dialog",
							 titleBar: "bar",
							 title: "title",
							 close: "close",
							 content: "content"
						     },
						     open: null,
						     close: null,
						     loaded: null,
						     template: '<div id="${id}" class="${dialogClassName}" style="position: ${position};width:${width};height:${height}; z-index: 1001;display:none;"><div class="${titleBarClassName}"><span class="${titleClassName}">${title}<\/span><a class="${closeClassName}" href="javascript:void(0);">${closeText}<\/a><\/div><div class="${contentClassName}"><\/div><div class="loading">${loading}<\/div><\/div>',
						     style: ".dialog{background-color: #FFFFFF;border: 1px solid #67A1E1;position: absolute;z-index: 1050; overflow:hidden;}                    .dialog .bar{background-color: #EFF6FC;width: 100%;overflow:hidden;}                    .dialog .title{float:left;font-size: 13px;padding: 5px 10px;font-weight:bold;}                    .dialog .close{float:right;color: #9ABBDE;cursor:pointer;font-family: Tahoma;font-size: 20px;font-weight: bold;line-height: 22px;padding: 0;text-shadow: 0 1px 0 #FFFFFF;  margin-right: 5px;}                    .dialog .content{display:none;position:relative;}                    .dialog .content iframe{position:absolute;top:0px;left:0px;z-index:1001;}                    .dialog .content .iframemask{display:none;position:absolute;top:0px;left:0px;z-index:1002;}                    .dialog .loading{text-align: center;width: 100%;}                    .dialog-overlay{opacity:0.5;filter:alpha(opacity:50);background:#000;top:0px;left:0px;position:absolute;z-index:1000;width:100%;}"
						 },
							      i),
						 e = u.id ? u.id: "dialog_" + (new Date).getTime() + (Math.random() * 1e10).toFixed(0),
						 a = !0,
						 f = this,
						 o = u.height,
						 s = u.classNames;
						 return this.init = function() {
						     var t, i, h;
						     u.type.toLowerCase() == "id" && n("#" + u.content).attr("dialog_instance_id") ? (e = n("#" + u.content).attr("dialog_instance_id"), a = !1) : (u.modal && (t = n("#ctrip_ui_overlay"), t.length == 0 && (t = n.instance('<div id="ctrip_ui_overlay" class="dialog-overlay"><\/div>'), document.createElement("div"), n("body").append(t), t.css("height", document.documentElement.scrollHeight + "px")), n(t).bgiframe()), i = n.tmpl.render(u.template, {
							 id: e,
							 dialogClassName: s.dialog,
							 titleBarClassName: s.titleBar,
							 titleClassName: s.title,
							 closeClassName: s.close,
							 contentClassName: s.content,
							 title: u.title,
							 closeText: u.closeText,
							 loading: u.loading,
							 position: u.fixed == !0 ? "fixed": "absolute",
							 width: u.width == 0 ? "auto": u.width + "px",
							 height: u.height == 0 ? "auto": u.height + "px"
						     }), h = n.instance(i), n("body").append(h));
						     r = {
							 dialog: n("#" + e),
							 overlay: n("#ctrip_ui_overlay"),
							 bar: n("#" + e + " ." + s.titleBar),
							 loading: n("#" + e + " .loading"),
							 closeButton: n("#" + e + " ." + s.close),
							 content: n("#" + e + " ." + s.content)
						     };
						     u.autoShow && this.show();
						     o = u.height - r.bar.offset().height;
						     this.setLoading();
						     a && (u.draggable && (r.bar.bind("mousedown",
										      function(t) {
											  r.bar.css("cursor", "move");
											  r.iframeMask && r.iframeMask.show();
											  n("#" + e + " .bgiframe").hide();
											  var i = window.event || t;
											  c.x = i.screenX;
											  c.y = i.screenY;
											  l.top = r.dialog.offset().top;
											  l.left = r.dialog.offset().left;
											  n(document).bind("mousemove", f.dragDialog)
										      }), n(document).bind("mouseup",
													   function() {
													       r.bar.css("cursor", "default");
													       r.iframeMask && r.iframeMask.hide();
													       n("#" + e + " .bgiframe").show();
													       n(document).unbind("mousemove", f.dragDialog)
													   })), r.closeButton.bind("click",
																   function() {
																       f.close()
																   }), n.browser.isIE6 && u.fixed == !0 && r.dialog.css("position", "absolute"), this.getContent(u.type, u.content), window.CTRIP_UI_Dialogs.push(this));
						     this.resize()
						 },
						 this.setLoading = function() {
						     r.loading.css("marginTop", (o - r.loading.offset().height) / 2 + "px")
						 },
						 this.resize = function() {
						     r.overlay.length > 0 && r.overlay.css("height", n.bodyHeight() + "px");
						     n.browser.isIE6 || !u.fixed ? (r.dialog[0].style.left = document.documentElement.scrollLeft + document.body.scrollLeft + Math.max(0, (document.documentElement.clientWidth - r.dialog[0].offsetWidth) / 2) + "px", r.dialog[0].style.top = document.documentElement.scrollTop + document.body.scrollTop + Math.max(0, (document.documentElement.clientHeight - r.dialog[0].offsetHeight) / 2) + "px") : (r.dialog[0].style.left = Math.max(0, (document.documentElement.clientWidth - r.dialog[0].offsetWidth) / 2) + "px", r.dialog[0].style.top = Math.max(0, (document.documentElement.clientHeight - r.dialog[0].offsetHeight) / 2) + "px")
						 },
						 this.getContent = function(t, i) {
						     var c, s, h;
						     r.content.html("");
						     switch (u.type.toLowerCase()) {
						     case "id":
							 r.content.append(n("#" + u.content));
							 n("#" + u.content).show();
							 n("#" + u.content).attr("dialog_instance_id", e);
							 f.loaded();
							 break;
						     case "img":
							 c = document.createElement("img");
							 c.onload = this.imgLoaded;
							 c.src = u.content;
							 r.content.append(c);
							 break;
						     case "iframe":
							 s = document.createElement("iframe");
							 s.src = u.content;
							 s.width = "100%";
							 s.height = o;
							 s.frameBorder = "0";
							 s.attachEvent ? s.attachEvent("onload",
										       function() {
											   f.iframeLoaded()
										       }) : s.onload = function() {
											   f.iframeLoaded()
										       };
							 r.content.append(s);
							 h = document.createElement("div");
							 h.className = "iframemask";
							 h.style.width = "100%";
							 h.style.height = o + "px";
							 r.content.append(h);
							 r.iframeMask = n("#" + e + " .iframemask");
							 break;
						     case "content":
							 r.content.html(u.content);
							 f.loaded();
							 break;
						     case "url":
							 n.ajax(i, {
							     method: "GET",
							     async: !0,
							     onsuccess: function(n, t) {
								 r.content.html(t);
								 f.loaded()
							     }
							 })
						     }
						 },
						 this.creatStyle = function(i) {
						     var r = i.style;
						     t.isFirstRegister || (t.isFirstRegister || (t.isFirstRegister = !0), n.browser.isIE ? (sty = document.createStyleSheet(), sty.cssText = r) : (sty = document.createElement("style"), sty.type = "text/css", sty.textContent = r, document.getElementsByTagName("head")[0].appendChild(sty)))
						 },
						 this.imgLoaded = function() {
						     f.showContent();
						     var n = this,
						     t = {
							 width: u.width > h.WIDTH ? h.WIDTH: u.width,
							 height: u.height > h.HEIGHT ? h.HEIGHT: u.height
						     },
						     i = n.offsetWidth / n.offsetHeight;
						     n.offsetWidth > t.width && (n.style.width = t.width + "px", n.style.height = t.width / i + "px");
						     n.offsetHeight > o && (n.style.width = o * i + "px", n.style.height = o + "px");
						     n.offsetHeight < o && (n.style.marginTop = (o - n.offsetHeight) / 2 + "px");
						     n.offsetWidth < t.width && (n.style.marginLeft = (t.width - n.offsetWidth) / 2 + "px");
						     f.loaded()
						 },
						 this.iframeLoaded = function() {
						     f.showContent();
						     f.loaded()
						 },
						 this.loaded = function() {
						     this.showContent();
						     u.loaded && typeof u.loaded == "function" && u.loaded()
						 },
						 this.showContent = function() {
						     r.loading.hide();
						     r.content.show()
						 },
						 this.show = function() {
						     this.creatStyle(u);
						     for (var n = 0; n < window.CTRIP_UI_Dialogs.length; n++) window.CTRIP_UI_Dialogs[n].close();
						     r.overlay.show();
						     r.dialog.show();
						     u.open && typeof u.open == "function" && u.open();
						     clearInterval(r.dialog.attr("resize_intervalid"));
						     r.dialog.attr("resize_intervalid", setInterval(function() {
							 f.resize()
						     },
												    500))
						 },
						 this.close = function() {
						     clearInterval(r.dialog.attr("resize_intervalid"));
						     r.dialog.attr("resize_intervalid", 0);
						     r.dialog.hide();
						     r.overlay.hide();
						     u.close && typeof u.close == "function" && u.close()
						 },
						 this.dragDialog = function(n) {
						     var u = window.event || n,
						     f = document.documentElement.clientWidth - r.dialog.offset().width,
						     e = document.documentElement.clientHeight - r.dialog.offset().height,
						     t = l.top + (u.screenY - c.y),
						     i = l.left + (u.screenX - c.x);
						     i = i < 0 ? 0 : i;
						     t = t < 0 ? 0 : t;
						     i = i > f ? f: i;
						     t = t > e ? e: t;
						     r.dialog.css("top", t + "px");
						     r.dialog.css("left", i + "px");
						     u.preventDefault ? u.preventDefault() : u.returnValue = !1
						 },
						 this.init(),
						 this
					     };
					     n.extend(!0, Ctrip.UI, {
						 Dialog: t
					     })
					 } (cQuery);
					 var addressFocusFlag = !0,
					 $interface = {},
					 focusConfig = {
					     S: {
						 DCityName1: "ACityName1",
						 ACityName1: "DDate1"
					     },
					     D: {
						 DCityName1: "ACityName1",
						 ACityName1: "DDate1",
						 DDate1: "ReturnDepartDate1"
					     },
					     M: {
						 DCityName1: "ACityName1",
						 ACityName1: "DDate1",
						 DDate1: "ACityName2",
						 ACityName2: "DDate2"
					     }
					 },
					 IsIPad = $.browser.isIPad || $.browser.isIPhone || $.browser.isIPadUCWeb,
					 COMMON_STATUS = {
					     LOADING: "loading",
					     COMPLETED: "completed"
					 }; (function(n, t) {
					     if (typeof t != "undefined") {
						 var i = {
						     address: "1.0",
						     calendar: "6.0",
						     jmp: "1.1",
						     notice: "1.1",
						     validate: "1.1"
						 },
						 r = ["http://webresource.c-ctrip.com/code/cquery/resource/address/flight/"],
						 u = ".c_address_select {font-family: Arial,Simsun;font-size: 12px;}\t\t.c_address_select .c_address_wrap {background: none repeat scroll 0 0 #FFFFFF;border: 1px solid #7F9DB9;margin: 0;padding: 0 0 4px;text-align: left;width: 300px;}\t\t.c_address_select .c_address_wrong {height:auto;overflow:hidden;padding:5px 10px;line-height:18px;color:#C01111;word-break:break-all;word-wrap:break-word;}\t\t.c_address_select .c_address_list {margin: 0;max-height: 600px;padding: 0;}\t\t.c_address_select .c_address_list a {border-bottom: 1px solid #FFFFFF;border-top: 1px solid #FFFFFF;color: #0055AA;cursor: pointer;display: block;height: 22px;line-height: 22px;min-height: 22px;overflow: hidden;padding: 1px 9px 0;text-align: left;text-decoration: none;}\t\t.c_address_select .c_address_list a:hover {background: none repeat scroll 0 0 #E8F4FF;border-bottom: 1px solid #7F9DB9;border-top: 1px solid #7F9DB9;}\t\t.c_address_select .c_address_list span {float: right;font: 10px/22px verdana;margin: 0;overflow: hidden;padding: 0;text-align: right;white-space: nowrap;width: 110px;}\t\t.c_address_select .c_address_pagebreak {display: none;line-height: 25px;margin: 0;padding: 0;text-align: center;}\t\t.c_address_select .c_address_pagebreak a {color: #0055AA;display: inline-block;font-family: Arial,Simsun,sans-serif;font-size: 14px;margin: 0;padding: 0 4px;text-align: center;text-decoration: underline;width: 15px;}\t\t.c_address_select .c_address_pagebreak a.address_current {color: #000; text-decoration: none;}        .c_address_select .c_address_list .nearby {color:#333;}\t\t.c_address_select .c_address_list .none {cursor:default;}\t\t.c_address_select .c_address_list .none:hover {border-top:1px solid #FFF;border-bottom:1px solid #FFF;background-color:#FFF;}\t\t.c_address_select .c_address_list i {font-style:normal;color:#999;}        .address_selected { background: none repeat scroll 0 0 #FFE6A6; color: #FFFFFF; height: 22px; }        .c_address_list .hover {background: none repeat scroll 0 0 #E8F4FF;border-bottom: 1px solid #7F9DB9;border-top: 1px solid #7F9DB9;}\t\t\t\t\t\t\t\t\t\t\t\t",
						 f = '<div class="address_hot" id="address_hot">                            <div class="address_hotcity"><a href="" class="close">×<\/a>支持中文/拼音/简拼输入<\/div>                            <div class="address_hotlist">                                <ol class="address_hot_abb">                                    {{enum(key) data}}                                    <li><span>${key}<\/span><\/li>                                    {{/enum}}                                <\/ol>                                {{enum(key,arr) data}}                                    {{if key=="热门"}}                                        <ul class="address_hot_adress layoutfix" style="width:295px;">                                        {{each arr}}                                        <li><a data="${data}" href="javascript:void(0);">${display}<\/a><\/li>                                        {{/each}}                                        <\/ul>                                    {{else}}                                        <dl class="address_hot_adress layoutfix" style="width:295px;">                                        {{enum(subKey,subArr) arr}}                                            <dt>${subKey}<\/dt>                                            <dd>                                        {{if !subArr.length>0}}                                        &nbsp;                                        {{/if}}                                            {{each subArr}}                                            <a href="javascript:;" title="${display}" data="${data}">${display}<\/a>                                            {{/each}}                                        <\/dd>                                        {{/enum}}                                        <\/dl>                                    {{/if}}                                {{/enum}}                            <\/div>                        <\/div>',
						 e = '<div class="c_address_select">\t                    <div class="c_address_wrap">\t\t                    {{if hasResult}}{{else}} <div class="c_address_wrong">找不到${val}<\/div>{{/if}}\t\t                    <div class="c_address_list" style="">                                {{if list}}\t\t\t                        {{each (i,item) list}}\t\t\t\t                        {{if cQuery.type(item)=="string"}}\t\t\t\t\t                        <label>${item}<\/label>\t\t\t\t                        {{else}}\t\t\t\t\t                        {{if data.split("|")[6] != ""}}\t\t\t\t\t\t                        <a href="javascript:void(0);" style="display: block;" class="none"><span>${left}<\/span>${right}-<i>该城市没有机场<\/i><\/a>\t\t\t\t\t\t                        {{each(index) data.split("|")[5].split("#")}}\t\t\t\t\t\t\t                        <a style="color:#000" href="javascript:void(0);" data="${data.split("|")[0]}|${data.split("|")[5].split("#")[index].split(" ")[0]}__"><b>.<\/b>邻近机场：${data.split("|")[5].split("#")[index].replace("-","")}-${data.split("|")[6].split("#")[index]}公里<\/a>\t\t\t\t\t\t                        {{/each}}\t\t\t\t\t                        {{else}}\t\t\t\t\t\t                        <a href="javascript:void(0);" data="${data}" style="display: block;"><span>${left}<\/span>${right}<\/a>\t\t\t\t\t                        {{/if}}\t\t\t\t                        {{/if}}\t\t\t                        {{/each}}                                {{/if}}\t\t                    <\/div>\t\t                    {{if page.max>-1}}\t\t\t                    <div class="c_address_pagebreak" style="display: block;">\t\t\t\t                    {{if page.current>0}}\t\t\t\t\t                    <a href="javascript:void(0);" page="${page.current-1}">&lt;-<\/a>\t\t\t\t                    {{/if}}\t\t\t\t                    {{if page.current<2}}\t\t\t\t\t                    {{loop(index) Math.min(5,page.max+1)}}\t\t\t\t\t\t                    <a href="javascript:void(0);"{{if page.current==index}} class="address_current"{{/if}} page="${index}">${index+1}<\/a>\t\t\t\t\t                    {{/loop}}\t\t\t\t                    {{else page.current>page.max-2}}\t\t\t\t\t                    {{loop(index) Math.max(0,page.max-4),page.max+1}}\t\t\t\t\t\t                    <a href="javascript:void(0);"{{if page.current==index}} class="address_current"{{/if}} page="${index}">${index+1}<\/a>\t\t\t\t\t                    {{/loop}}\t\t\t\t                    {{else}}\t\t\t\t\t                    {{loop(index) Math.max(0,page.current-2),Math.min(page.current+3,page.max+1)}}\t\t\t\t\t\t                    <a href="javascript:void(0);"{{if page.current==index}} class="address_current"{{/if}} page="${index}">${index+1}<\/a>\t\t\t\t\t                    {{/loop}}\t\t\t\t                    {{/if}}\t\t\t\t                    {{if page.current<page.max}}\t\t\t\t\t                    <a href="javascript:void(0);" page="${page.current+1}">-&gt;<\/a>\t\t\t\t                    {{/if}}\t\t\t                    <\/div>\t\t                    {{/if}}\t                    <\/div>                    <\/div>';
						 MySortFunction = function(n, t, i, r) {
						     var u = [],
						     f = 0,
						     e = new RegExp("@" + t.toReString() + ".+", "i"),
						     o = new RegExp("@.+\\|([a-z]{3},)*" + t.toReString() + ".+", "i"),
						     s = new RegExp("[a-z]", "i"),
						     h = function(n, i) {
							 var h = 0,
							 l = !1,
							 c = i.split("|");
							 if (r) {
							     if (c[1] != t) return;
							     u[f++] = {
								 left: c[0],
								 right: c[1],
								 data: i,
								 sortPrioity: h
							     }
							 } else "" != c[6] && (h -= 200),
							 c[1].indexOf("(") > 0 && (h -= 1),
							 c[0].indexOf("Shanhaiguan") > -1 && (h -= 5),
							 1 == t.length ? s.test(t) ? (l = e.test(n), h += 100) : (l = o.test(n), h += 50) : 1 < t.length && (e.test(n) && (h += 100, l = !0), o.test(n) && (0 == c[4].indexOf(t.toUpperCase()) && (h += 50), 0 == c[2].indexOf(t.toUpperCase()) && (h += 10), l = !0)),
							 l && isNaN(t) && (u[f++] = {
							     left: c[0],
							     right: c[1],
							     data: i,
							     priority: h
							 })
						     };
						     return n.replace(new RegExp("@([^@]*" + t.toReString() + "[^@]*)", "gi"), h),
						     r || u.sort(function(n, t) {
							 return n.priority == t.priority ? n.data < t.data ? -1 : n.data > t.data ? 1 : 0 : n.priority > t.priority ? -1 : 1
						     }),
						     u
						 };
						 t.extend = function() {
						     var r = arguments,
						     n = r.length == 1 ? t: r[0],
						     u = r.length > 1 ? r[1] : r[0],
						     i;
						     if (u == null) return n;
						     try {
							 for (i in u) n.hasOwnProperty(u[i]) || (typeof n == "object" && (n[i] = u[i]) || typeof n == "function" && (n.prototype[i] = u[i]));
							 return n
						     } catch(f) {}
						 };
						 t.extend({
						     getTableTips: function(n) {
							 var r, t, i, u;
							 if (typeof $$.module.jmpInfo.array.CraftType != "undefined" && (n = n.indexOf("?") != -1 ? n.match(new RegExp("=(\\w+)"))[1] : "", n != "")) {
							     if (r = {},
								 t = $$.module.jmpInfo.array.CraftType.match(new RegExp("@(" + n + "\\|[^@]*\\|[^@]*\\|\\d*\\|\\d*)@", "i")), !t || t == null) return {};
							     for (t = t[1].split("|"), i = 0, u = t.length; i < u; i++) r["txt" + i] = t[i];
							     return r
							 }
							 return {}
						     }
						 });
						 t.extend({
						     inits: {},
						     elements: $("[mod]"),
						     form: $("#aspnetForm"),
						     charset: n.config("charset"),
						     getValidate: function() {
							 return $(document).regMod("validate", i.validate)
						     },
						     validateMethod: {
							 required: function(n, t) {
							     return t && t.trim().length > 0
							 },
							 date: function(n, t) {
							     return t && t.isDate()
							 },
							 laterThan: function(n, t, i) {
							     if (!t) return ! 0;
							     var r = i;
							     return (i.isDate() || (r = $(i).value().trim()), !r) ? !0 : !t.isDate() || !r.isDate() ? !0 : t.trim().toDateTime() >= r.toDateTime()
							 },
							 notLaterThan: function(n, t, i) {
							     if (!t) return ! 0;
							     var r = i;
							     return (i.isDate() || (r = $(i).value().trim()), !r) ? !0 : !t.isDate() || !r.isDate() ? !0 : t.trim().toDateTime() <= r.toDateTime()
							 },
							 equal: function(n, t, i) {
							     return t.trim() == $(i).value().trim()
							 },
							 notEqual: function(n, t, i) {
							     return t.trim().split("(")[0] != $(i).value().trim().split("(")[0]
							 }
						     },
						     registerAll: function() {
							 for (var r = $("[mod]"), u, i, o, f, n = 0, e = r.length; n < e; n++) for (u = $(r[n]).attr("mod").split("|"), i = 0, o = u.length; i < o; i++) f = "register_" + u[i],
							 t[f] && t[f]($(r[n]));
							 $(document).regMod("jmp", "1.1", {})
						     },
						     register_notice: function(n) {
							 var t = "placeholder" in document.createElement("input");
							 t || $.mod.load("notice", i.notice,
									 function() {
									     var t, r, u, f;
									     if (n && n.length > 0) for (t = 0, r = n.length; t < r; t++) u = $(n[0]).attr("placeholder"),
									     f = (new Date).toFormatString("hh:mm"),
									     n[0].noticeInstance = $(n[0]).regMod("notice", i.notice, {
										 name: f,
										 tips: u,
										 selClass: "default_text"
									     },
														  !0)
									 })
						     },
						     register_address: function(n) {
							 var s = n[0].getAttribute("focus_loader"),
							 o = function(n) {
							     var s = n[0].getAttribute("mod_address_source"),
							     c = n[0].getAttribute("id"),
							     l = $("#" + n[0].getAttribute("mod_address_reference")),
							     o = {},
							     h;
							     mysort = $.browser.isIPad ? ["^0$", "^1$", "^2$", "^3$", "^4$", "^5$", "^0", "^1", "^2", "^3", "^4", "^5", "0", "1", "2", "3", "4", "5"] : MySortFunction;
							     n[0].getAttribute("mod_address_tpl") != "on" || $.browser.isIPad || (o.suggestion = f, o.filter = e, o.filterPageSize = 10, o.suggestionStyle = ".address_hot {background-color: #FFFFFF;font-size: 12px;width: 332px;padding-top:5px;border:1px solid #999;}\t\t.address_hotcity {color: #999;height: 24px;line-height: 24px;padding:0 10px;}\t\t.address_hotcity .close {float:right;width:20px;height:20px;margin-top:3px;text-align:center;font:bold 16px/20px Simsun;text-decoration:none;color:#666;}\t\t.address_hotlist {overflow: hidden;padding: 5px;}\t\taddress_hot li, .address_hot_abb, .address_hot_adress {list-style: none outside none;margin: 0;padding: 0;}\t\t.address_hot_abb {border-bottom: 1px solid #5DA9E2;padding-bottom: 20px;}\t\t.address_hot_abb li {color: #005DAA;cursor: pointer;float: left;height: 20px;line-height: 20px;list-style-type: none;text-align: center;}\t\t.address_hot_abb li span {padding: 0 8px;}\t\t.address_hot_abb li .hot_selected {background-color: #FFFFFF;border-color: #5DA9E2;border-style: solid;border-width: 1px 1px 0;color: #000000;display: block;font-weight: bold;padding: 0 7px;}\t\tul.address_hot_adress {padding-left:30px;padding-top: 4px;}\t\tdl.address_hot_adress {padding-left:30px;padding-top: 4px;}\t\t.address_hot_adress li {float: left;height: 24px;overflow: hidden;width: 67px;}\t\t.address_hot_adress li a {border: 1px solid #FFFFFF;color: #000000;display: block;height: 22px;line-height: 22px;padding-left: 5px;}\t\t.address_hot_adress li a:hover {background-color: #E8F4FF;border: 1px solid #ACCCEF;text-decoration: none;}\t\t.address_hot_adress a {text-decoration: none;}        .address_hot_adress dt {float:left;_display:inline;width:20px;margin-left:-25px;text-align:center;font-family:Verdana;color:#E56700;line-height:22px;}\t\t.address_hot_adress dd {overflow:hidden;*zoom:1;}\t\t.address_hot_adress dd a {float:left;width:65px;height:22px;padding-left:5px;float:left;border:1px solid #FFFFFF;color:#000;line-height:22px;overflow:hidden;}\t\t.address_hot_adress dd a:hover {border: 1px solid #ACCCEF;background-color: #E8F4FF;text-decoration: none;}", o.filterStyle = u, o.suggestionInit = function(t) {
								 function s() {
								     var n = this;
								     r.each(function(t, i) {
									 t[0] == n ? (t.addClass("hot_selected"), u[i].style.display = "") : (t.removeClass("hot_selected"), u[i].style.display = "none")
								     });
								     t.cover()
								 }
								 for (var r = t.find("span"), u = t.find("dl"), e = t.find("ul"), h, c, f, i = 0, o = u.length; i < o; i++) e.push(u[i]);
								 if (u = e, r.length) {
								     for (h = 30, i = 0, c = r.length; i < c; i++) h += r[i].offsetWidth;
								     f = t.find("div").first();
								     f[0] && f.css("width", "335px");
								     r.bind("mousedown", s);
								     s.apply(r[0]);
								     t.find(".close").bind("mousedown",
											   function() {
											       addressFocusFlag = !1;
											       n.trigger("blur");
											       addressFocusFlag = !0
											   })
								 }
							     });
							     s == "fltDomestic" && (s = "");
							     $.browser.isIPad && (s = "flight");
							     h = n.regMod("address", i.address, {
								 name: c,
								 jsonpSource: r[0] + s + "_" + t.charset + ".js?releaseNo=" + ReleaseNo,
								 template: o,
								 isAutoCorrect: !0,
								 relate: {
								     2 : l
								 },
								 sort: mysort
							     });
							     h.method("bind", "change",
								      function(n, t) {
									  var i, e, f, r, o, u;
									  if (t.value == "") return this.blur(),
									  !1;
									  if (i = $("#FlightSearchType").value(), IsIPad && i == "M" && this.id == "ACityName1" && (addressFocusFlag = !1), this.value.indexOf("__") > 0) for (e = this.value.replace("__", "").replace("-", ""), f = h.get("source").data.split("@"), r = 0, o = f.length; r < o; r++) if (e == f[r].split("|")[1]) {
									      this.value = e;
									      document.getElementById(this.getAttribute("mod_address_reference")).value = f[r].split("|")[2];
									      this.blur();
									      break
									  }
									  if (i == "M" && this.id == "ACityName1" && ($("#DCityName2").value($("#ACityName1").value()), $("#DCity2").value($("#ACity1").value())), addressFocusFlag) {
									      if ($("div.pad_calendar").length > 0) return;
									      if ($("div").length == 0) return;
									      u = this.id;
									      setTimeout(function() {
										  $.browser.isIPad || $.browser.isIPhone || $.browser.isIPadUCWeb ? focusConfig[i][u] && $("#" + focusConfig[i][u])[0].focus() : focusConfig[i][u] && $("#" + focusConfig[i][u])[0].focus()
									      })
									  }
								      })
							 };
							 s ? n.bind("focus", o.bind(this, n)) : o(n)
						     },
						     register_calendar: function(n) {
							 n && n.length > 0 && $.mod.load("calendar", i.calendar,
											 function() {
											     var t = {
												 autoShow: !1,
												 showWeek: !0
											     };
											     n[0].getAttribute("mod_calendar_reference") && (t.reference = "#" + n[0].getAttribute("mod_calendar_reference"));
											     n[0].calendarInstance = n.regMod("calendar", i.calendar, {
												 options: t,
												 listeners: {
												     onChange: function(n, t) {
													 var i, r, u; (n.id.indexOf("DDate1") > -1 && ($("#ReturnDate1").data("minDate", t), $("#DDate2").data("minDate", t), $("#FlightSearchType").value() == "D" ? i = "ReturnDate1": $("#FlightSearchType").value() == "M" && (i = "ACityName2")), r = null, u = 0, i && typeof i != "undefined") && (i.indexOf("~") != -1 ? (i = i.split("~"), u = i.length, r = document.getElementById(i[0])) : i && (r = document.getElementById(i)), r && $(r).data("minDate", t), r && r.focus())
												     }
												 }
											     });
											     n.bind("blur",
												    function() {
													n[0].calendarInstance.method("setWeek", n)
												    })
											 })
						     },
						     maskShow: function(t, i, r) {
							 var f = function(t, i) {
							     var r = t.style;
							     n.browser.isIE ? (r.filter = (r.filter || "").replace(/alpha\([^\)]*\)/gi, "") + (i == 1 ? "": "alpha(opacity=" + i * 100 + ")"), r.zoom = 1) : r.opacity = typeof i == "number" ? i: 0
							 },
							 u;
							 i = typeof i == "undefined" ? !0 : i;
							 $(t)[i ? "mask": "unmask"]();
							 i && typeof r != "undefined" && (u = $(t).data("__mask__").maskDiv, r.color && (u.style.backgroundColor = r.color), r.opacity && f(u, r.opacity))
						     }
						 })
					     }
					 })($, online);
					 var SearchBox = {
					     init: function() {
						 var t = this,
						 n;
						 this.fillData();
						 $("#DDate1").bind("blur",
								   function() {
								       $("#DDate2").data("minDate", $(this).value());
								       $("#ReturnDate1").data("minDate", $(this).value());
								       online.validateObj && online.validateObj.method("hide", $(this))
								   });
						 $("#DDate2").bind("blur",
								   function() {
								       online.validateObj && online.validateObj.method("hide", $(this))
								   });
						 $("#ReturnDate1").bind("blur",
									function() {
									    online.validateObj && online.validateObj.method("hide", $(this));
									    $(this).value().isDate() && ($("#FlightSearchType").value("D"), $(".returndate").removeClass("low_text"))
									});
						 $("#FlightSearchType").bind("change",
									     function() {
										 var n = $("#FlightSearchType").value();
										 SearchBox.displayInputs(n)
									     });
						 $("#DCityName1").bind("blur",
								       function() {
									   online.validateObj && online.validateObj.method("hide", $("#ACityName1"))
								       });
						 $("#ACityName1").bind("blur",
								       function() {
									   var n = t.getValidateRules();
									   online.validateObj && online.validateObj.method("hide", $(this));
									   $("#FlightSearchType").value() == "M" && ($("#DCityName2").value($(this).value()), $("#DCity2").value($("#ACity1").value()), online.validateObj && online.validateObj.method("hide", $("#ACityName2")))
								       });
						 $("#ACityName2").bind("blur",
								       function() {
									   online.validateObj && online.validateObj.method("hide", $("#ACityName2"));
									   online.validateObj && online.validateObj.method("hide", $("#ACityName1"))
								       });
						 $("#advancedSearch").bind("click",
									   function() {
									       t.displayAdvancedSearch()
									   });
						 $(".swapcity").bind("click",
								     function() {
									 SearchBox.swapCity()
								     });
						 $("#btnReSearch").bind("click",
									function() {
									    SearchBox.reSearch()
									});
						 $("#FlightSearchType").trigger("change");
						 $("#DDate1").trigger("blur");
						 n = this.getData(); (n.PassengerQuantity > 1 || n.ClassType != "" || n.PassengerType != "ADU") && t.displayAdvancedSearch();
						 typeof pageConfig != "undefined" && typeof pageConfig.displayMode != "undefined" && pageConfig.displayMode && pageConfig.displayMode == 1 && $("#btnReSearch").hide()
					     },
					     displayAdvancedSearch: function() {
						 if ($("#advanceOption")[0].style.display == "none") {
						     if (IsIPad) $("#advanceOption").show();
						     else try {
							 $("#advanceOption").slideDown(200)
						     } catch(n) {
							 $("#advanceOption").show()
						     }
						     $("#advancedSearch").html(textConfig.button[8] + "<b><\/b>");
						     $("#advancedSearch")[0].className = "arrow_up"
						 } else {
						     if (IsIPad) $("#advanceOption").hide();
						     else try {
							 $("#advanceOption").slideUp(200)
						     } catch(n) {
							 $("#advanceOption").hide()
						     }
						     $("#advancedSearch").html(textConfig.button[7] + "<b><\/b>");
						     $("#advancedSearch")[0].className = "arrow_down"
						 }
					     },
					     fillData: function() {
						 $("#FlightSearchType").value(SearchCondition.SearchType);
						 $("#DCity1").value(SearchCondition.DCity1 + (SearchCondition.DPort1 == "" ? "": "," + SearchCondition.DPort1));
						 this.setTextValue("DCityName1", SearchCondition.DCityName1 + this.getAirportName(SearchCondition.DPort1));
						 $("#ACity1").value(SearchCondition.ACity1 + (SearchCondition.APort1 == "" ? "": "," + SearchCondition.APort1));
						 this.setTextValue("ACityName1", SearchCondition.ACityName1 + this.getAirportName(SearchCondition.APort1));
						 $("#DCity2").value(SearchCondition.ACity1 + (SearchCondition.APort1 == "" ? "": "," + SearchCondition.APort1));
						 this.setTextValue("DCityName2", SearchCondition.ACityName1 + this.getAirportName(SearchCondition.APort1));
						 $("#ACity2").value(SearchCondition.ACity2 + (SearchCondition.APort2 == "" ? "": "," + SearchCondition.APort2));
						 this.setTextValue("ACityName2", SearchCondition.ACityName2 + this.getAirportName(SearchCondition.APort2));
						 this.setDateValue("DDate1", SearchCondition.DDate1);
						 this.setDateValue("DDate2", SearchCondition.DDate2);
						 this.setDateValue("ReturnDate1", SearchCondition.DDate2);
						 $("#PassengerQuantity").value(SearchCondition.Quantity);
						 $("#PassengerType").value(SearchCondition.PassengerType);
						 $("#ClassType").value(SearchCondition.ClassType)
					     },
					     setDateValue: function(n, t) {
						 $("#" + n).value(t);
						 $("#" + n)[0].calendarInstance && $("#" + n)[0].calendarInstance.method("setWeek");
						 $("#" + n)[0].noticeInstance && $("#" + n)[0].noticeInstance.method("checkValue")
					     },
					     setTextValue: function(n, t) {
						 $("#" + n).value(t);
						 $("#" + n)[0].noticeInstance && $("#" + n)[0].noticeInstance.method("checkValue")
					     },
					     getAirportName: function(n) {
						 var t = "";
						 if (n && n != "") {
						     switch (n.toUpperCase()) {
						     case "PEK":
							 t = textConfig.airport[2];
							 break;
						     case "NAY":
							 t = textConfig.airport[3];
							 break;
						     case "SHA":
							 t = textConfig.airport[4];
							 break;
						     case "PVG":
							 t = textConfig.airport[5]
						     }
						     t != "" && (t = "(" + t + ")")
						 }
						 return t
					     },
					     displayInputs: function(n) {
						 n == "S" || n == "D" ? ($(".search_m").hide(), $(".multiway").hide(), $(".swapcity").show(), $(".returndate").show(), n == "S" ? ($(".returndate").addClass("low_text"), this.setDateValue("ReturnDate1", "")) : ($(".returndate").removeClass("low_text"), this.setDateValue("ReturnDate1", $("#ReturnDate1").value())), $("#advanceOption").css("padding-left", "0px"), $("#passengerType_label").css("padding-left", "22px")) : ($(".search_m").show(), $(".multiway").show(), $(".swapcity").hide(), $(".returndate").hide(), this.setDateValue("DDate2", $("#DDate2").value()), $("#DCityName2").value($("#ACityName1").value()), $("#DCity2").value($("#ACity1").value()), $("#advanceOption").css("padding-left", "56px"), $("#passengerType_label").css("padding-left", "0px"))
					     },
					     swapCity: function() {
						 var t = $("#DCityName1")[0].value,
						 n;
						 $("#DCityName1").value($("#ACityName1").value());
						 $("#ACityName1").value(t);
						 n = $("#DCity1").value();
						 $("#DCity1").value($("#ACity1").value());
						 $("#ACity1").value(n)
					     },
					     getData: function() {
						 var n = {};
						 return n.FlightWay = $("#FlightSearchType").value(),
						 n.ReturnDate1 = $("#ReturnDate1").value(),
						 n.FlightWay == "D" && n.ReturnDate1 == "" && (n.FlightWay = "S"),
						 n.DCityName1 = $("#DCityName1").value(),
						 n.DCity1 = $("#DCity1").value(),
						 n.ACityName1 = $("#ACityName1").value(),
						 n.ACity1 = $("#ACity1").value(),
						 n.DCityName2 = $("#DCityName2").value(),
						 n.DCity2 = $("#DCity2").value(),
						 n.ACityName2 = $("#ACityName2").value(),
						 n.ACity2 = $("#ACity2").value(),
						 n.DDate1 = $("#DDate1").value(),
						 n.DDate2 = $("#DDate2").value(),
						 n.PassengerQuantity = $("#PassengerQuantity").value(),
						 n.PassengerType = $("#PassengerType").value(),
						 n.ClassType = $("#ClassType").value(),
						 n
					     },
					     resetData: function() {
						 var n = $("#FlightSearchType").value();
						 n != "M" && ($("#DCity2").value(""), $("#ACity2").value(""), this.setTextValue("DCityName2", ""), this.setTextValue("ACityName2", ""), this.setDateValue("DDate2", ""));
						 n == "S" && this.setDateValue("ReturnDate1", "")
					     },
					     validate: function() {
						 var n = this.getValidateRules();
						 return this.validateMethod(n)
					     },
					     getValidateRules: function() {
						 var n = {
						     DCityName1: {
							 rules: "required",
							 messages: {
							     required: msg.ERROR_FLIGHT[0]
							 }
						     },
						     ACityName1: {
							 rules: {
							     required: !0,
							     notEqual: "#DCityName1"
							 },
							 messages: {
							     required: msg.ERROR_FLIGHT[1],
							     notEqual: msg.ERROR_FLIGHT[2]
							 }
						     },
						     DDate1: {
							 rules: {
							     required: !0,
							     date: !0,
							     laterThan: (new Date).toFormatString("yyyy-MM-dd")
							 },
							 messages: {
							     required: msg.ERROR_FLIGHT[3],
							     date: msg.ERROR_FLIGHT[3],
							     laterThan: msg.ERROR_FLIGHT[4]
							 }
						     }
						 },
						 t = this.getData();
						 return t.FlightWay == "D" ? n.ReturnDate1 = {
						     rules: {
							 required: !0,
							 date: !0,
							 laterThan: "#DDate1"
						     },
						     messages: {
							 required: msg.ERROR_FLIGHT[7],
							 date: msg.ERROR_FLIGHT[7],
							 laterThan: msg.ERROR_FLIGHT[8]
						     }
						 }: t.FlightWay == "M" && (n.ACityName2 = {
						     rules: {
							 required: !0,
							 notEqual: "#ACityName1"
						     },
						     messages: {
							 required: msg.ERROR_FLIGHT[1],
							 notEqual: msg.ERROR_FLIGHT[2]
						     }
						 },
									   n.DDate2 = {
									       rules: {
										   required: !0,
										   date: !0,
										   laterThan: "#DDate1"
									       },
									       messages: {
										   required: msg.ERROR_FLIGHT[3],
										   date: msg.ERROR_FLIGHT[3],
										   laterThan: msg.ERROR_FLIGHT[12]
									       }
									   }),
						 n
					     },
					     validateMethod: function(n) {
						 var t, i, r;
						 for (t in n) if (i = n[t].rules, r = n[t].messages, !this.validateElement(t, n[t], !0)) return ! 1;
						 return ! 0
					     },
					     validateElement: function(n, t, i) {
						 var r = t.rules,
						 f = t.messages,
						 u;
						 if (typeof r == "string") {
						     if (!this.validateRule($("#" + n), r, null, f[r], i)) return ! 1
						 } else for (u in r) if (!this.validateRule($("#" + n), u, r[u], f[u], i)) return ! 1;
						 return ! 0
					     },
					     validateRule: function(n, t, i, r, u) {
						 if (online.validateObj && online.validateObj.method("hide", n), online.validateMethod[t]) {
						     var f = n.value().trim().split("(")[0];
						     if (!online.validateMethod[t](n, f, i)) return online.validateObj && online.validateObj.method("show", {
							 $obj: n,
							 data: r,
							 removeErrorClass: !0,
							 isFocus: u,
							 showArrow: !1,
							 position: "rm_lm",
							 classNames: {
							     tip: "none",
							     tipContent: "tip_check"
							 },
							 templs: {
							     tipTempl: '<div id=${tipId} class="${tip}" group=${group} style="min-width:${minWidth}px; width:${maxWidth}px;_width:${minWidth}px; width:auto !important;max-width:${maxWidth}px;overflow:hidden;display:block;z-index:99;margin:0;padding:0;left:0px;top:0px;overflow:hidden;position:absolute;"><div id=${boxId}><b class="${arrow}" id=${arrowId}><\/b><div class="${loading}" id=${loadingId}>${loadingImg}<\/div><div class=${content} id=${contentId}><\/div><\/div>'
							 },
							 temp: "<span>${txt}<\/span>"
						     }),
						     u && n[0].focus(),
						     n.attr("validate", "F"),
						     !1
						 }
						 return n.attr("validate", "T"),
						 !0
					     },
					     setSearchCookie: function(n) {
						 var r = n.FlightWay + "$" + n.DCityName1 + "$" + n.DCity1 + "$" + n.DDate1 + "$" + n.ACityName1 + "$" + n.ACity1,
						 i, u, t;
						 switch (n.FlightWay) {
						 case "D":
						     r += "$" + n.ReturnDate1;
						     break;
						 case "M":
						     r += "$" + n.DDate2 + "$" + $("#TransitCityTextBox").value() + "$" + $("#TransitCity").value()
						 }
						 r = escape(r);
						 t = new Date;
						 t.setTime(t.getTime() + 2592e6);
						 i = document.domain.split(".").slice(document.domain.indexOf(".hk") !== -1 ? -3 : -2).join(".");
						 u = $.config("charset") == "big5" ? "B": "";
						 document.cookie = u + "LastSearch_" + n.FlightWay + "=" + r + "; expires=" + t.toGMTString() + "; path=/; domain=" + i;
						 document.cookie = u + "LastSearchSearchType=" + n.FlightWay + "; expires=" + t.toGMTString() + "; path=/; domain=" + i;
						 t = new Date;
						 t.setTime(t.getTime() - 1);
						 document.cookie = u + "LastSearch_" + n.FlightWay + "=none; expires=" + t.toGMTString() + "; path=/" + (i ? "; domain=flights" + i: "");
						 document.cookie = u + "LastSearchSearchType=none; expires=" + t.toGMTString() + "; path=/" + (i ? "; domain=flights" + i: "")
					     },
					     getSearchUrlParam: function(n) {
						 var t = "DCity1=" + escape(n.DCity1) + "&ACity1=" + escape(n.ACity1) + "&DCityName1=";
						 t += $.config("charset").indexOf("big5") > -1 ? n.DCityName1: escape(n.DCityName1);
						 t += "&ACityName1=";
						 t += $.config("charset").indexOf("big5") > -1 ? n.ACityName1: escape(n.ACityName1);
						 t += "&DDate1=" + escape(n.DDate1);
						 switch (n.FlightWay) {
						 case "D":
						     n.ReturnDate1 != "" && (t += "&DDate2=" + escape(n.ReturnDate1));
						     break;
						 case "M":
						     t += "&ACity2=" + escape(n.ACity2);
						     t += "&DDate2=" + escape(n.DDate2)
						 }
						 return t += "&PassengerQuantity=" + escape(n.PassengerQuantity),
						 t += "&PassengerType=" + escape(n.PassengerType),
						 n.ClassType != "" && (t += "&ClassType=" + escape(n.ClassType)),
						 t + ("&FlightSearchType=" + encodeURI(n.FlightWay))
					     },
					     reSearch: function() {
						 var n, u, f, i, t;
						 if (this.resetData(), n = this.getData(), this.validate()) if (this.setSearchCookie(n), n.PassengerQuantity == 10) window.open(RootUrl + "MyToolBox/FlightTeamOrder.aspx?" + this.getSearchUrlParam(n));
						 else if (u = escape(n.DCity1), f = escape(n.ACity1), u == "" || f == "") window.location = RootUrl + "Search/FirstRoute/?" + this.getSearchUrlParam(n);
						 else if (n.FlightWay == "S") $("#IsSensitive").value("F"),
						 i = SEORootUrl + n.DCity1 + "-" + n.ACity1 + "-day-1.html",
						 document.getElementById("reSearchForm").action = i,
						 document.getElementById("reSearchForm").method = "post",
						 document.getElementById("reSearchForm").submit();
						 else {
						     var e = $.dateDiff(new Date, n.DDate1).days,
						     i = SEORootUrl + n.DCity1 + "-" + n.ACity1,
						     r = "DCityName1=";
						     r += $.config("charset").indexOf("big5") > -1 ? n.DCityName1: escape(n.DCityName1);
						     r += "&ACityName1=";
						     r += $.config("charset").indexOf("big5") > -1 ? n.ACityName1: escape(n.ACityName1);
						     n.FlightWay == "M" && (r += "&ACityName2=", r += $.config("charset").indexOf("big5") > -1 ? n.ACityName2: escape(n.ACityName2));
						     t = "-" + escape(n.ClassType) + "--";
						     t += n.FlightWay.toLowerCase() == "s" ? "": n.FlightWay;
						     t += "-";
						     t += escape(n.PassengerType);
						     t += "-";
						     t += escape(n.PassengerQuantity);
						     t += "/?";
						     t += "Dayoffset=";
						     t += e;
						     t += "&";
						     t += "DDate1=";
						     t += escape(n.DDate1);
						     n.FlightWay == "D" ? t += "&DDate2=" + n.ReturnDate1: n.FlightWay == "M" && (t += "&ACity2=" + escape(n.ACity2), t += "&DDate2=" + n.DDate2);
						     t += "&" + r;
						     i = i + t.toLowerCase();
						     window.location = i.toLowerCase()
						 }
					     }
					 },
					 AirHotel = {
					     ALLCITY: {},
					     init: function() {
						 setTimeout(function() {
						     AirHotel.loadAllCityData(!0)
						 },
							    300)
					     },
					     redirectToPackageAction: function() {
						 var o, s, u = SearchCondition.DCity1,
						 h = SearchCondition.ACity1,
						 i = SearchCondition.SearchType,
						 n = {},
						 f, t, e, r;
						 this.ALLCITY[u] && (o = this.ALLCITY[u].PingYin + this.ALLCITY[u].Id, s = this.ALLCITY[h].PingYin + this.ALLCITY[h].Id, (i == "S" || i == "D") && (n.DDate = SearchCondition.DDate1, n.Night = 1, i == "D" && (SearchCondition.DDate2 == "" ? (n.Night = 2, n.RDate = SearchCondition.DDate1.toDate().addDays(2).toFormatString("yyyy-MM-dd")) : (n.Night = $.dateDiff(SearchCondition.DDate1, SearchCondition.DDate2).days, n.RDate = SearchCondition.DDate2)), n.DCitySZM = u, n.DCityName = SearchCondition.DCityName1, n.ACitySZM = h, n.ACityName = SearchCondition.ACityName1, n.Adults = 2, n.Children = 0, n.Rooms = 1));
						 f = $("#AirHotelhref").length > 0 ? $("#AirHotelhref").value() : "http://package.ctrip.com"; (i == "S" || i == "D") && o && s && (f = (f + "/" + (i == "S" ? "oneway": "round") + "-" + o + "-" + s + "/").toLowerCase());
						 t = document.createElement("form");
						 document.body.appendChild(t);
						 t.method = "post";
						 t.target = "_blank";
						 t.action = f;
						 for (e in n) r = document.createElement("input"),
						 r.type = "hidden",
						 r.value = n[e] == null ? "": n[e],
						 r.name = e,
						 t.appendChild(r);
						 t.submit()
					     },
					     loadAllCityData: function(n) {
						 var t = "http://webresource.c-ctrip.com/code/cquery/resource/address/flight/flight_new_" + cQuery.config("charset") + ".js?releaseNo=" + ReleaseNo;
						 $.loader.jsonp(t, {
						     async: n,
						     onload: function(n) {
							 AirHotel.getCityData(n.data)
						     }
						 })
					     },
					     getCityData: function(n) {
						 for (var r = n.split("@"), t, i = 0, u = r.length; i < u; i++) t = r[i].split("|"),
						 t[2] && (this.ALLCITY[t[2]] = {
						     PingYin: t[0],
						     Id: t[7]
						 });
						 this.ALLCITY.Inited = !0
					     }
					 },
					 FlightBuilderBase = {
					     templates: {
						 SearchNoResult: '<div id="error_content" class="base_alert11"><span class="ico_alert">&nbsp;<\/span><div class="alert_content"><h3>${Message}<\/h3>${Content}{{if IsShowSchedule}}<p style="margin-top:10px;">${Schedule}<\/p>{{/if}}<\/div><\/div>',
						 FilterNoResult: '<div id="nofilterdata" class="base_alert11" style="display: none;"><div class="base_alert11" style="margin: 20px 10px;"><span class="ico_alert"><\/span><div class="alert_content"><h3 class="nodatamsg"><\/h3><p>${Content}<\/p><\/div><\/div><\/div>',
						 NormalSubClass: '<td class="special">${icon1}<\/td><td class="classes">${className}<\/td><td class="right discount">${rate}<\/td><td class="gift">${gift}<\/td><td class="rule">${rule}<\/td><td class="limit"><\/td><td class="right price ${lowestclass}"><span class="base_price02"><dfn>&yen;<\/dfn>${price}<\/span><\/td><td>${discount}${secondGift} <\/td><td class="right" style="width: 90px;"><input class="${buttonClass}" type="button" value="${buttonText}" data="${flightData}" isbooking="${isBooking}" onclick="${clickEvent}" id="${bookBtnId}" /><\/td><td class="center" style="width: 60px">${limitQuantity}<\/td>'
					     },
					     getRate: function(n) {
						 return n >= 1 ? n = textConfig.text[9] : (n = n * 10, n = n.toFixed(1) + textConfig.text[8]),
						 n
					     },
					     getPunctualityRate: function(n, t, i) {
						 return n.toDate().toFormatString("yyyy-MM-dd") == (new Date).toDate().toFormatString("yyyy-MM-dd") ? t >= 60 ? i ? textConfig.text[33] + "<br/>" + t.toFixed(0) + "%": textConfig.text[33] + textConfig.text[2] + t.toFixed(0) + "%": i ? textConfig.text[33] + "<br/>- ": textConfig.text[33] + textConfig.text[2] + "- ": t >= 60 ? i ? textConfig.text[34] + "<br/>" + t.toFixed(0) + "%": textConfig.text[34] + textConfig.text[2] + t.toFixed(0) + "%": i ? textConfig.text[34] + "<br/>- ": textConfig.text[34] + textConfig.text[2] + "- "
					     },
					     getCraftType: function(n) {
						 var t = "";
						 return n && n.is == !0 ? t = '<span class="special_text craft" code="' + n.c + '">' + n.dn + "<\/span>": n && n.c != null && n.c != "" && (t = n.s != "" ? '<div class="low_text">' + textConfig.text[31] + textConfig.text[2] + '<span class="direction_black_border craft" code="' + n.c + '">' + n.c + "(" + textConfig.craftSize[n.s.toUpperCase()] + ")<\/span><\/div>": '<div class="low_text">' + textConfig.text[31] + textConfig.text[2] + '<span class="direction_black_border craft" code="' + n.c + '">' + n.c + "<\/div>"),
						 t
					     },
					     getMeal: function(n) {
						 var t = "无";
						 return n != null && n != undefined && (n == "B" || n == "D" || n == "M" || n == "L") && (t = "有"),
						 textConfig.meal[0] + "<br/>" + t
					     },
					     getTGQRule: function(n) {
						 var t = "",
						 i = "";
						 n.rmk && (i = n.rmk);
						 t += '<span class="direction_blue tgqinfo" data="' + n.edn + "|" + n.rfn + "|" + n.rrn + "|" + i + '">';
						 switch (n.t) {
						 case "HighFee":
						     t += textConfig.tgq[0];
						     break;
						 case "LowFee":
						     t += textConfig.tgq[1];
						     break;
						 case "Allowed":
						     t += textConfig.tgq[2];
						     break;
						 case "NotAllowed":
						     t += textConfig.tgq[3];
						     break;
						 default:
						     t = ""
						 }
						 return t + "<\/span>"
					     },
					     getTGQDescription: function(n) {
						 if (n) {
						     var n = n.split("|"),
						     t = textConfig.iconDesc[1];
						     return $.tmpl.render(t, {
							 EndNote: n[0],
							 RefNote: n[1],
							 RerNote: n[2],
							 Remarks: n[3]
						     })
						 }
						 return ""
					     },
					     getClassName: function(n) {
						 return n.sn && n.sn != "" ? '<span class="direction_black specialClass" description="' + n.desc + '"><em>' + n.sn + "<\/em>" + textConfig.className[n.c] + "<\/span>": textConfig.className[n.c]
					     },
					     getDisplayIcon: function(n, t) {
						 var i = "",
						 r = this.getIcon(n, t);
						 return r && (i = this.buildIcon(r)),
						 i
					     },
					     getIcon: function(n, t) {
						 var r = null,
						 u, i, f;
						 if (n) for (u = t.split(","), i = 0, f = n.length; i < f; i++) if (u.contains(n[i].IconType)) {
						     r = n[i];
						     break
						 }
						 return r
					     },
					     getIconDesc: function(n, t) {
						 var u = "$$$",
						 r = "",
						 i;
						 switch (n) {
						 case "CashBack":
						     r = $.tmpl.render(textConfig.iconDesc[0], {
							 Amount: t
						     });
						     break;
						 case "Discount":
						     i = t.split(u);
						     r = $.tmpl.render(textConfig.iconDesc[2], {
							 Discount: i[0],
							 AirlineName: i[1],
							 Amount: i[2] * 1 + i[3] * 1,
							 Price1: i[2],
							 Price2: i[3]
						     });
						     break;
						 case "RoundDiscount":
						     i = t.split(u);
						     r = $.tmpl.render(textConfig.iconDesc[2], {
							 AirlineName: i[0],
							 Amount: i[1] * 1 + i[2] * 1,
							 Price1: i[1],
							 Price2: i[2]
						     });
						     break;
						 case "RoundSpecial":
						     i = t.split(u);
						     r = $.tmpl.render(textConfig.iconDesc[2], {
							 AirlineName: i[0],
							 Amount: i[1] * 1 + i[2] * 1,
							 Price1: i[1],
							 Price2: i[2]
						     });
						     break;
						 case "Package":
						     var i = t.split(u),
						     e = new Date,
						     f = new Date(e.getFullYear(), e.getMonth() + 7, 0).toFormatString(textConfig.text[53]);
						     r = i[1] == "3" ? $.tmpl.render(textConfig.iconDesc[12], {
							 CouponAmount: i[2],
							 EffectDate: f
						     }) : i[1] == "4" ? $.tmpl.render(textConfig.iconDesc[13], {
							 CouponAmount: i[2],
							 EffectDate: f
						     }) : i[1] == "5" ? $.tmpl.render(textConfig.iconDesc[8], {
							 Price: i[0],
							 Package: i[2],
							 Insurance: i[3]
						     }) : $.tmpl.render(textConfig.iconDesc[9], {
							 EffectDate: f
						     });
						     break;
						 case "CtripCard":
						     r = t.split(u)[1];
						     break;
						 case "Gift":
						     r = t.split(u)[1];
						     break;
						 case "StrategyInsurance":
						     i = t.split(u);
						     r = $.tmpl.render(textConfig.iconDesc[8], {
							 Price: i[0],
							 Package: i[2],
							 Insurance: i[3]
						     });
						     typeof pageConfig.IsTravelCouponSwitchOpen != "undefined" && pageConfig.IsTravelCouponSwitchOpen == "T" && (r = $.tmpl.render(textConfig.iconDesc[14], {
							 Price: i[0],
							 TravelCouponPrice: i[2],
							 BaoFeiAmountInfo: i[3],
							 PackageName: i[4],
							 PackagePrice: i[5],
							 ValidDate: i[6]
						     }));
						     break;
						 case "Young":
						 case "Old":
						 case "PreSale":
						 case "Share":
						     r = t.split(u).join("<br />");
						     break;
						 default:
						     r = t
						 }
						 return r
					     },
					     buildIcon: function(n) {
						 var i = "$$$",
						 t = {
						     Class: "",
						     Tag: "icon",
						     Type: n.IconType,
						     Data: n.Data,
						     Cursor: ""
						 };
						 switch (n.IconType) {
						 case "StrategyInsurance":
						     t.Class = "ico_whole";
						     t.Name = t.Data.split(i)[1] == 1 ? textConfig.icon[4] : textConfig.icon[3];
						     break;
						 case "CashBack":
						     t.Class = "ico_refund";
						     t.Name = $.tmpl.render(textConfig.icon[13], {
							 Amount: n.Data.split(i)[0]
						     });
						     break;
						 case "Package":
						     t.Class = "ico_whole";
						     t.Name = textConfig.icon[4];
						     break;
						 case "Discount":
						     t.Class = "ico_half";
						     t.Name = $.tmpl.render(textConfig.icon[14], {
							 Amount: n.Data.split(i)[0]
						     });
						     break;
						 case "RoundDiscount":
						     t.Class = "direction_blue";
						     t.Name = textConfig.icon[5];
						     break;
						 case "RoundSpecial":
						     t.Class = "direction_blue";
						     t.Name = textConfig.icon[6];
						     break;
						 case "Young":
						     t.Class = "ico_refund";
						     t.Name = textConfig.icon[7];
						     break;
						 case "Old":
						     t.Class = "ico_refund";
						     t.Name = textConfig.icon[8];
						     break;
						 case "CtripCard":
						     t.Class = "direction_blue";
						     t.Name = n.Data.split(i)[0];
						     break;
						 case "GiftPackage":
						 case "Gift":
						     t.Class = "ico_sale_gift";
						     t.Name = textConfig.icon[9];
						     break;
						 case "Share":
						     t.Class = "ico_refund";
						     t.Name = textConfig.icon[10]
						 }
						 return $.tmpl.render('<span class="${Class}" tag="${Tag}" type="${Type}" style="${Cursor}">${Name}<span class="desc" style="display:none;">${Data}<\/span><\/span>', t)
					     }
					 };
					 var FlightPager, FlightFilter = {
					     init: function() {
						 try {
						     if (!pageConfig.needSearch) return;
						     this.showAirportFilter();
						     $(".filter_condition li").bind("mouseover",
										    function() {
											var n = $(this).find(".filter_list"),
											t = $(this).find(".filter_trigger");
											clearTimeout(n.attr("hidetimeoutId"));
											n.show()
										    });
						     $(".filter_condition li").bind("mouseout",
										    function() {
											var n = $(this).find(".filter_list"),
											i = $(this).find(".filter_trigger"),
											t;
											clearTimeout(n.attr("showtimeoutId"));
											t = setTimeout(function() {
											    n.hide()
											},
												       0);
											n.attr("hidetimeoutId", t)
										    });
						     $(".filter_condition li input").bind("click", this.filterChanged);
						     $("#filterTransit").unbind("click").bind("click",
											      function() {
												  this.checked ? ResultList.fliter("Transfer", "1") : ResultList.fliter("Transfer", "0")
											      });
						     $("#filterCFClass").length > 0 && ($("#filterCFClass")[0].checked = SearchCondition.ClassType == "CF");
						     $("#filterCFClass").bind("click",
									      function() {
										  try {
										      if (ResultList.status != COMMON_STATUS.LOADING) {
											  if (SearchCondition.ClassType = this.checked ? "CF": "", SearchCondition.PassengerQuantity > 1 || SearchCondition.ClassType != "" || SearchCondition.PassengerType != "ADU") {
											      if ($("#advanceOption")[0].style.display == "none") {
												  if (IsIPad) $("#advanceOption").show();
												  else try {
												      $("#advanceOption").slideDown(200)
												  } catch(n) {
												      $("#advanceOption").show()
												  }
												  $("#advancedSearch").html(textConfig.button[8] + "<b><\/b>");
												  $("#advancedSearch")[0].className = "arrow_up"
											      }
											  } else if ($("#advanceOption")[0].style.display != "none") {
											      if (IsIPad) $("#advanceOption").hide();
											      else try {
												  $("#advanceOption").slideUp(200)
											      } catch(n) {
												  $("#advanceOption").hide()
											      }
											      $("#advancedSearch").html(textConfig.button[7] + "<b><\/b>");
											      $("#advancedSearch")[0].className = "arrow_down"
											  }
											  $("#ClassType").value(SearchCondition.ClassType);
											  LowestPriceCalendar.disable();
											  ResultList.search(1)
										      }
										  } catch(n) {
										      LowestPriceCalendar.enable()
										  }
									      });
						     $("#filterClear").bind("click",
									    function() {
										ResultList.clearFilter()
									    })
						 } catch(n) {}
					     },
					     fillData: function(n) {
						 var u, r, f, t, e, i;
						 try {
						     if ($("#filterAirelineCompanyList li").remove(), $("#filterCraftTypeList li").remove(), n.als) for (u in n.als) i = $.instance('<li><label><input class="input_checkbox" type="checkbox" value="' + u + '" name="flight_Airline"/> ' + n.als[u] + "<\/label><\/li>"),
						     $("#filterAirelineCompanyList").append(i);
						     if (n.fcts) {
							 for (r = [], t = 0, f = n.fcts.length; t < f; t++) n.fcts[t].toUpperCase() == "M" && (r[0] = t),
							 n.fcts[t].toUpperCase() == "S" && (r[1] = t),
							 n.fcts[t].toUpperCase() == "L" && (i = $.instance('<li><label><input class="input_checkbox" type="checkbox" value="' + n.fcts[t].toUpperCase() + '" name="flight_Craft"/> ' + textConfig.craftSize[n.fcts[t].toUpperCase()] + textConfig.text[30] + "<\/label><\/li>"), $("#filterCraftTypeList").append(i));
							 for (t = 0, e = r.length; t < e; t++) r[t] != undefined && (i = $.instance('<li><label><input class="input_checkbox" type="checkbox" value="' + n.fcts[r[t]].toUpperCase() + '" name="flight_Craft"/> ' + textConfig.craftSize[n.fcts[r[t]].toUpperCase()] + textConfig.text[30] + "<\/label><\/li>"), $("#filterCraftTypeList").append(i))
						     }
						     n.tf ? $("#showTransferFilter").show() : $("#showTransferFilter").hide();
						     $("#filterAirelineCompanyList li input").bind("click", this.filterChanged);
						     $("#filterCraftTypeList li input").bind("click", this.filterChanged)
						 } catch(o) {}
					     },
					     setFilter: function(n, t) {
						 for (var u = t.split(","), r, i = 0, f = u.length; i < f; i++) r = $("input[name='flight_" + n + "'][value=" + u[i] + "]"),
						 r.length > 0 && r[0].click()
					     },
					     filterChanged: function() {
						 var n = $(this).attr("name"),
						 r = $("input:checked[name='" + n + "']").values(),
						 t = $(this).value(),
						 u = $(this).parentNode().text(),
						 i;
						 ResultList.fliter(n.replace("flight_", ""), r);
						 $(this)[0].checked ? $("#filterConditionShow a[value='" + t + "']").length == 0 && (i = $.instance('<a class="filter_clear" field="' + n + '" value="' + t + '">' + u + " <b>×<\/b><\/a>"), i.insertBefore($("#filterConditionShow #filterClear")), $("#filterConditionShow").show(), i.find("b").bind("click",
																																											 function() {
																																											     var n = $(this).parentNode(),
																																											     t = $(".filter_condition li input[value='" + n.attr("value") + "']"),
																																											     i;
																																											     t.length > 0 && (t[0].checked = !1);
																																											     i = $("input:checked[name='" + n.attr("field") + "']").values();
																																											     ResultList.fliter(n.attr("field").replace("flight_", ""), i);
																																											     n.remove();
																																											     $("#filterConditionShow a").length <= 1 && $("#filterConditionShow").hide()
																																											 })) : ($("#filterConditionShow a[field='" + n + "'][value='" + t + "']").remove(), $("#filterConditionShow a").length <= 1 && $("#filterConditionShow").hide())
					     },
					     showAirportFilter: function() {
						 var i = SearchCondition.DCity1,
						 t = SearchCondition.ACity1,
						 n;
						 SearchCondition.SearchRouteIndex == 1 && (i = SearchCondition.ACity1, t = SearchCondition.ACity2, SearchCondition.SearchType == "D" && (t = SearchCondition.DCity1)); (i == "BJS" || i == "SHA") && (SearchCondition.DPort1 && SearchCondition.DPort1 != "" || $("#dport_filter").length == 0 && (n = '<a class="filter_trigger arrow_down" href="javascript:void(0);" id="dport_filter">' + textConfig.airport[0] + "<b><\/b><\/a>", n += '<div class="filter_list" style="display:none;*width:100px;"><h4 class="arrow_up">' + textConfig.airport[0] + "<b><\/b><\/h4><ul>", n = i == "BJS" ? n + '<li><label><input class="input_checkbox" type="checkbox" name="flight_DPort" value="PEK">&nbsp;' + textConfig.airport[2] + '<\/label><\/li><li><label><input class="input_checkbox" type="checkbox" name="flight_DPort" value="NAY">&nbsp;' + textConfig.airport[3] + "<\/label><\/li>": n + '<li><label><input class="input_checkbox" type="checkbox" name="flight_DPort" value="SHA">&nbsp;' + textConfig.airport[4] + '<\/label><\/li><li><label><input class="input_checkbox" type="checkbox" name="flight_DPort" value="PVG">&nbsp;' + textConfig.airport[5] + "<\/label><\/li>", n += "<\/ul><\/div>", $($(".filter_condition")[0]).append($.instance("<li>" + n + "<\/li>")))); (t == "BJS" || t == "SHA") && (SearchCondition.APort1 && SearchCondition.APort1 != "" || $("#aport_filter").length == 0 && (n = '<a class="filter_trigger arrow_down" href="javascript:void(0);" id="aport_filter">' + textConfig.airport[1] + "<b><\/b><\/a>", n += '<div class="filter_list" style="display:none;*width:100px;"><h4 class="arrow_up">' + textConfig.airport[1] + "<b><\/b><\/h4><ul>", n = t == "BJS" ? n + '<li><label><input class="input_checkbox" type="checkbox" name="flight_APort" value="PEK">&nbsp;' + textConfig.airport[2] + '<\/label><\/li><li><label><input class="input_checkbox" type="checkbox" name="flight_APort" value="NAY">&nbsp;' + textConfig.airport[3] + "<\/label><\/li>": n + '<li><label><input class="input_checkbox" type="checkbox" name="flight_APort" value="SHA">&nbsp;' + textConfig.airport[4] + '<\/label><\/li><li><label><input class="input_checkbox" type="checkbox" name="flight_APort" value="PVG">&nbsp;' + textConfig.airport[5] + "<\/label><\/li>", n += "<\/ul><\/div>", $($(".filter_condition")[0]).append($.instance("<li>" + n + "<\/li>"))))
					     },
					     clear: function() {
						 $(".search_condition input:checkbox").removeAttr("checked");
						 ResultList.clearFilter()
					     }
					 },
					 FlightSorter = {
					     init: function(n) {
						 $(".search_sort [cmd='sort']").bind("click",
										     function() {
											 var t = "ASC",
											 i = $(this).attr("field");
											 i != ResultList.currentSortField && ($(".search_sort .current").removeClass("current"), $(this).addClass("current"), $(this).attr("sort", t), ResultList.sort(i, t, n))
										     })
					     }
					 },
					 ResultList = {
					     filterState: {},
					     classDataKeys: "Flight,SubClass,Price,PriceType,PolicyId,AllowGroupBook,ProductType,IsAirReHotel,CanSeparateSale,ApplyType,CanMergeOrder,RSpecialType,RPolicyId,RPrice1,RPrice2,RAirlineRate,RPriceType,IsCanSell",
					     currentSortField: "dtime",
					     data: {},
					     status: "",
					     retryCount: 0,
					     compareMethods: {
						 price: function(n, t) {
						     return n.price = n.p ? n.p: n.scs[0].p,
						     t.price = t.p ? t.p: t.scs[0].p,
						     n.price > t.price ? 1 : -1
						 },
						 dtime: function(n, t) {
						     return n.dTime = n.dt ? n.dt: n.Routes[0].fis[0].dt,
						     t.dTime = t.dt ? t.dt: t.Routes[0].fis[0].dt,
						     n.dTime.toDateTime() > t.dTime.toDateTime() ? 1 : -1
						 }
					     },
					     search: function(n) {
						 var t, i, u, r, f;
						 pageConfig.needSearch && (t = this, this.status != COMMON_STATUS.LOADING && (this.status = COMMON_STATUS.LOADING, this.showLoading($("#searchPannel")[0].style.display == "none" ? 0 : 1), $("#searchError").html(""), $("#searchError").hide(), $("#noresult_seo").hide(), i = "SearchFirstRouteFlights", SearchCondition.SearchRouteIndex == 1 && (i = "SearchSecondRouteFlights"), u = t.getSelectedFlightInfo(SelectedFlight1, SearchCondition.SearchRouteIndex), r = getQueryInfo(SearchCondition), $.extend(!0, r, u), f = SearchRootUrl + i + "?" + $.toQuery(r) + "&r=" + Math.random(), $.ajax(f, {
						     method: "GET",
						     cache: !1,
						     onsuccess: function(i) {
							 var r = eval("(" + i.responseText + ")");
							 t.processData(r, n)
						     },
						     onerror: function() {
							 t.processError({
							     Error: {
								 Code: -1
							     }
							 })
						     }
						 })))
					     },
					     research: function() {
						 this.showLoading();
						 $("#searchError").hide();
						 $("#noresult_seo").hide();
						 this.search(0)
					     },
					     searchByDate: function(n) {
						 var t, r, i;
						 this.status != COMMON_STATUS.LOADING && ($("#date2late").length > 0 && $("#date2late").remove(), SearchCondition.SearchRouteIndex == 0 && (SearchCondition.DDate1 = n, $("#DDate1").value(n), $("#DDate2").data("minDate", n), $("#ReturnDate1").data("minDate", n), $("#DDate1")[0].calendarInstance && $("#DDate1")[0].calendarInstance.method("setWeek")), SearchCondition.SearchType != "S" && (t = SearchCondition.SearchRouteIndex == 0 ? SearchCondition.DDate2: n, t.toDate() < SearchCondition.DDate1.toDate() && (t = SearchCondition.DDate1.toDate().addDays(1).toFormatString("yyyy-MM-dd"), r = '<div class="alert_new" id="date2late"><i class="ico_alert_new">&nbsp;<\/i><p class="text_info">${alertInfo}<\/p><\/div>', i = SearchCondition.SearchType == "M" ? $.tmpl.render(textConfig.text[43], {
						     Date: t
						 }) : $.tmpl.render(textConfig.text[42], {
						     Date: t
						 }), $("#searchPannel").prepend($.instance($.tmpl.render(r, {
						     alertInfo: i
						 })))), SearchCondition.DDate2 = t, $("#ReturnDate1").value(t), $("#ReturnDate1")[0].calendarInstance && $("#ReturnDate1")[0].calendarInstance.method("setWeek"), $("#DDate2").value(t), $("#DDate2")[0].calendarInstance && $("#DDate2")[0].calendarInstance.method("setWeek")), this.search(1))
					     },
					     processData: function(n, t) {
						 var r, i, u, f;
						 try {
						     if (r = (new Date).getTime(), i = this, t || (t = 0), $("#searchError").html(""), $("#searchError").hide(), n.Error && (i.status = COMMON_STATUS.COMPLETED, n.Error.Code == 100)) {
							 if (i.retryCount < 2) {
							     setTimeout(function() {
								 i.retryCount >= 1 && (SearchCondition.DontDownloadData = "T");
								 i.search();
								 i.retryCount++
							     },
									4e3);
							     return
							 }
							 n.Error = {
							     Code: 102
							 }
						     }
						     if (SearchCondition.DontDownloadData == "T" && i.retryCount < 2 && (n.fis == null || n.fis.length == 0)) {
							 setTimeout(function() {
							     i.search();
							     i.retryCount++
							 },
								    4e3);
							 return
						     }
						     if ($(".searchresult_content").html(""), (n.fis == null || n.fis.length == 0) && $("#searchPannel").hide(), i.retryCount = 0, SearchCondition.DontDownloadData = "", n.Error) {
							 $("#searchPannel").hide();
							 i.processError(n);
							 i.hideLoading(t);
							 return
						     }
						     $("#noresult_seo").hide();
						     u = $("#page_id").value() != "wait";
						     $("#page_id").value(SearchCondition.SearchRouteIndex == 0 ? "101027": "101029");
						     u && (typeof window.__bfi == "undefined" && (window.__bfi = []), window.__bfi.push(["_asynRefresh", {
							 page_id: $("#page_id").value(),
							 url: window.location.href
						     },
																	 null]));
						     window.routeGift = i.getGiftJSON(n.gifts);
						     window.RouteLowestPrice = n.lp;
						     window.Airline = n.als;
						     window.AirportBuilding = n.apb;
						     FlightPager.pageIndex = 1;
						     n.sf && FlightBuilder.buildSelectedFlight(n.sf);
						     n.tf && (SearchCondition.SearchType == "S" ? n.fis.push(n.tf) : SearchCondition.SearchType == "D" && FlightBuilder.buildRoundTransitFlight(n.tf));
						     i.data = n;
						     i.sortData(n.fis, "dtime");
						     LowestPriceCalendar.init(n.islpc, n.lps, n.lp);
						     n.islpc ? $("#showCFFilter").show() : $("#showCFFilter").hide();
						     FlightFilter.fillData(n);
						     FlightFilter.clear();
						     FlightSorter.init(n.fis);
						     SearchCondition.AirlineCode != "" && FlightFilter.setFilter("Airline", SearchCondition.AirlineCode);
						     SearchCondition.DTimeRange != "" && FlightFilter.setFilter("DTime", SearchCondition.DTimeRange);
						     SearchCondition.IsSortByPrice && ($(".search_sort .current").removeClass("current"), $("#price_sort").addClass("current"), i.sort("price", ""));
						     f = i.getFilterData();
						     FlightPager.init(f);
						     FlightPager.listen();
						     FlightPager.startListener();
						     i.buildAlertInfo(n.icfnf);
						     i.setRouteLowestPrice(n);
						     i.setLowPriceSubscription(n);
						     i.buildNeighbor();
						     i.buildSpecialSummaryList(n.sss);
						     i.buildAirlineSEO(n.als);
						     i.buildCommonGift(n.gifts);
						     $("#tool_schedule").show();
						     $("#tool_icon").show();
						     i.hideLoading(0);
						     i.hideLoading(1);
						     n.iaw ? ($("#searchControlPannel").hide(), i.processAllWaitingResult(n)) : ($("#full_title").hide(), $("#searchControlPannel").show());
						     $("#searchPannel").show();
						     LowestPriceCalendar.enable();
						     i.status = COMMON_STATUS.COMPLETED;
						     setTimeout(function() {
							 getRecommendProducts(n.rflag, n.lp)
						     },
								1e3);
						     setUTB_EDM();
						     window.JsDiifTime += (new Date).getTime() - r
						 } catch(e) {
						     i.status = COMMON_STATUS.COMPLETED;
						     i.hideLoading(t);
						     LowestPriceCalendar.enable()
						 }
					     },
					     processError: function(n) {
						 var l = FlightBuilderBase.templates.SearchNoResult,
						 t = textConfig.errorMsg[5],
						 o = SearchCondition.DCityName1 + textConfig.text[7] + SearchCondition.ACityName1,
						 r = !1,
						 u = !1,
						 i,
						 s,
						 h,
						 f,
						 e,
						 c;
						 try {
						     n.Error.Data && (typeof n.Error.Data == "string" ? (i = n.Error.Data.split("$$$"), i.length > 1 && (r = i[0].toLowerCase() == "true", u = i[1].toLowerCase() == "true")) : (n.Error.Data.IsShowSchedule && (r = !0), n.Error.Data.IsShowLowestPriceCalendar && (u = !0)));
						     s = $("#page_id").value() != "wait";
						     switch (n.Error.Code) {
						     case 101:
							 $("#page_id").value("101053");
							 t = SearchCondition.SearchRouteIndex == 1 ? SelectedFlight1 && SelectedFlight1.IsCanSeparateSale ? textConfig.errorMsg[8] : textConfig.errorMsg[7] : textConfig.errorMsg[1];
							 break;
						     case 102:
							 $("#page_id").value("101052");
							 t = $.tmpl.render(textConfig.errorMsg[4], {
							     DepartDate: SearchCondition.DDate1,
							     CityName: o
							 });
							 break;
						     case 103:
							 $("#page_id").value("101051");
							 t = $.tmpl.render(textConfig.errorMsg[3], {
							     CityName: o
							 });
							 break;
						     default:
							 t = textConfig.errorMsg[5]
						     }
						     s && (typeof window.__bfi == "undefined" && (window.__bfi = []), window.__bfi.push(["_asynRefresh", {
							 page_id: $("#page_id").value(),
							 url: window.location.href
						     },
																	 null]))
						 } catch(a) {}
						 h = $.tmpl.render(l, {
						     Message: t,
						     Content: "",
						     IsShowSchedule: r,
						     Schedule: textConfig.text[46]
						 });
						 f = $.instance(h);
						 $("#searchError").html("");
						 $("#searchError").append(f);
						 n.Error.Code == 108 && (e = f.find(".alternates_info"), c = e.find(".desc").html(), $(e).regMod("jmp", "1.1", {
						     options: {
							 boundaryShow: !1,
							 type: "jmp_text",
							 css: {
							     maxWidth: 300,
							     minWidth: 260
							 },
							 position: "bottomLeft-topLeft",
							 classNames: {
							     boxType: "jmp_text"
							 },
							 content: {
							     txt0: c
							 },
							 template: "#jmp_text"
						     }
						 }));
						 u ? this.buildNoResultLowestPrice(n.lps) : $("#noresult_calendar").length > 0 && $("#noresult_calendar").remove();
						 setUTB_EDM();
						 this.hideLoading(0);
						 this.hideLoading(1);
						 this.status = COMMON_STATUS.COMPLETED;
						 $("#searchPannel").hide();
						 $("#searchError").show();
						 $("#noresult_seo").show()
					     },
					     processAllWaitingResult: function(n) {
						 var o = FlightBuilderBase.templates.SearchNoResult,
						 s = textConfig.errorMsg[1],
						 r = '<p style="margin-top:5px;">' + textConfig.errorMsg[0] + '<\/p><p style="margin-top:10px;">' + textConfig.text[32] + textConfig.text[2] + '<input type="button" isallwaiting="T" isbooking="T" onclick="ResultList.bookAllWaiting()" class="alternates" value="' + textConfig.button[1] + '" />&nbsp;&nbsp;<span class="alternates_info"><span class="desc" style="display:none;">' + textConfig.iconDesc[6] + "<\/span><\/span><\/p>",
						 u,
						 t,
						 i,
						 f,
						 e;
						 SearchCondition.DDate1 == (new Date).toFormatString("yyyy-MM-dd") && (r = '<p style="margin-top:5px;">' + textConfig.errorMsg[0] + "<\/p>");
						 u = $.tmpl.render(o, {
						     Message: s,
						     Content: r,
						     IsShowSchedule: !0,
						     Schedule: textConfig.text[46]
						 });
						 t = $.instance(u);
						 $("#searchError").append(t);
						 this.buildNoResultLowestPrice(n.lps);
						 i = t.find(".alternates_info");
						 f = i.find(".desc").html();
						 $(i).regMod("jmp", "1.1", {
						     options: {
							 boundaryShow: !1,
							 type: "jmp_text",
							 css: {
							     maxWidth: 300,
							     minWidth: 260
							 },
							 position: "bottomLeft-topLeft",
							 classNames: {
							     boxType: "jmp_text"
							 },
							 content: {
							     txt0: f
							 },
							 template: "#jmp_text"
						     }
						 });
						 $("#full_title").length == 0 && (e = $.instance('<h3 id="full_title" class="full_title">' + textConfig.title[2] + "<\/h3>"), e.insertBefore($(".searchresult_content")));
						 $("#searchError").show()
					     },
					     bookAllWaiting: function() {
						 var t = $(".search_box:first"),
						 n = t.find(".search_table tr:first input");
						 n.attr("isallwaiting", "T");
						 n.click()
					     },
					     buildNoResultLowestPrice: function(n) {
						 var u, f, t, o, i, s, h, c;
						 $("#noresult_calendar").length > 0 && $("#noresult_calendar").remove();
						 var l = '<div id="noresult_calendar"><p style="margin-left:60px;">' + textConfig.text[11] + '<\/p><div class="calendar_tab clearfix"><ul id="calendarTab" class="calendar_ul clearfix">${PriceList}<\/ul><\/div><\/div>',
						 e = SearchCondition.SearchRouteIndex == 0 ? SearchCondition.DDate1.toDate() : SearchCondition.DDate2.toDate(),
						 r = (new Date).toDate();
						 for (e.toDate().addDays( - 3) > (new Date).toDate() && (r = e.addDays( - 3).toDate()), u = n, f = "", t = r, o = r.addDays(7); t < o; t = t.addDays(1)) i = t.toFormatString("yyyy-MM-dd"),
						 s = u[i] ? '<span class="base_price02"><dfn>&yen;<\/dfn>' + u[i] + "<\/span>": "<span>" + textConfig.button[4] + "<\/span>",
						 h = '<li><a href="javascript:void(0);" onclick="ResultList.searchByDate(\'${Day}\');"><span class="calendar_date">${Date}<\/span>${Price} <\/a><\/li>',
						 c = {
						     Date: t.toFormatString("MM-dd") + textConfig.week[t.getDay()],
						     Day: i,
						     Price: s
						 },
						 f += $.tmpl.render(h, c);
						 $("#error_content .alert_content").append($.instance($.tmpl.render(l, {
						     PriceList: f
						 })))
					     },
					     buildAlertInfo: function(n) {
						 var t, i;
						 n && (SearchCondition.ClassType = "", $("#CFNoResultTip").length == 0 && (t = {
						     DCityName: SearchCondition.DCityName1,
						     ACityName: SearchCondition.ACityName1,
						     DDate: SearchCondition.DDate1
						 },
															   SearchCondition.SearchRouteIndex == 1 && (t = {
															       DCityName: SearchCondition.ACityName1,
															       ACityName: SearchCondition.ACityName2,
															       DDate: SearchCondition.DDate2
															   }), i = $.tmpl.render(textConfig.text[12], t), $("#searchPannel").prepend($.instance('<div id="CFNoResultTip" class="alert_new"><i class="ico_alert_new">&nbsp;<\/i><p class="text_info">' + i + "<\/p><\/div>"))))
					     },
					     setRouteLowestPrice: function(n) {
						 $("#RouteLowestPriceList").length > 0 && SearchCondition.SearchRouteIndex == 0 && $("#RouteLowestPriceList").value(n.rpl);
						 $("#RouteLowestPriceListSecond").length > 0 && SearchCondition.SearchRouteIndex == 1 && $("#RouteLowestPriceListSecond").value(n.rpl)
					     },
					     getSelectedFlightInfo: function(n, t) {
						 var i = {};
						 return typeof n == "undefined" || !n || n.Flight == "" ? i: (i["Flight" + t] = n.Flight, i["SubClass" + t] = n.SubClass, i["Price" + t] = n.Price, i["PriceType" + t] = n.PriceType, i["PolicyId" + t] = n.PolicyId, i["ProductType" + t] = n.ProductType, i)
					     },
					     showLoading: function(n) {
						 if (n == 1) $("#mask_loading").length == 0 && $(".searchresult_content").prepend($.instance('<div id="mask_loading" class="mask_box"><i class="ico_loading"><\/i><\/div>')),
						 $("#mask_loading").show();
						 else {
						     if ($("#searchLoading .ico_loading").length == 0) {
							 var t = '<p style="color: #333;  padding: 5px 0;">' + textConfig.text[40] + '<\/p><i class="ico_loading"><\/i><p style="color: #999;  padding: 5px 0;">' + textConfig.text[41] + "<\/p>";
							 $("#searchLoading").html(t)
						     }
						     $("#searchLoading").show()
						 }
					     },
					     hideLoading: function(n) {
						 n == 1 ? $("#mask_loading").hide() : $("#searchLoading").hide()
					     },
					     showMoreClasses: function(n, t) {
						 var e = this,
						 i = $("#flight_" + t),
						 f = i.data("data"),
						 s = "allClasses",
						 o = i.find("[tag='normalClasses']"),
						 u = i.find("[tag='" + s + "']"),
						 r;
						 if (u.length > 0) {
						     u.find("table").length > 0 && (i.attr("currentClasses", n), this.displayClasses(t));
						     return
						 }
						 i.attr(COMMON_STATUS.LOADING) != "T" && (i.attr(COMMON_STATUS.LOADING, "T"), this.showMoreLoading(t), r = {},
											  r.SearchRouteIndex == 0 ? r.Flight1 = t: typeof SelectedFlight1 != "undefined" && SelectedFlight1 && SelectedFlight1.Flight && SelectedFlight1.Flight != "" ? (r.Flight1 = SelectedFlight1.Flight, r.SubClass1 = SelectedFlight1.SubClass, r.Price1 = SelectedFlight1.Price, r.PriceType1 = SelectedFlight1.PriceType, r.PolicyId1 = SelectedFlight1.PolicyId, r.ProductType1 = SelectedFlight1.ProductType, r.Flight2 = t) : r.Flight1 = t, $.ajax(SearchRootUrl + "GetFlightAllSubClasses/?" + $.toQuery(getQueryInfo(SearchCondition)) + "&r=" + Math.random(), {
											      cache: !1,
											      context: r,
											      method: "POST",
											      onsuccess: function(r) {
												  var g, c, l, nt, b, k, v, a, y, p, h, tt, it, w, d;
												  if (r) {
												      if (g = eval("(" + r.responseText + ")"), c = g.SubClasses, c.length > 0) {
													  for (u = document.createElement("div"), l = '<table class="search_table">', h = 0, a = c.length; h < a; h++) nt = "<tr>" + FlightBuilder.buildSubClass(f, c[h], "more") + "<\/tr>",
													  l += nt;
													  if (l = l + "<\/table>", b = $.instance(l), $(u).append(b), $(u).insertAfter(o), $(u).attr("tag", s), FlightBuilder.attachSubClassEvent(b), i.attr("currentClasses", n), e.displayClasses(t), f.scs[0].ina != !0) {
													      for (k = !0, v = f.scs[0], h = 0, a = c.length; h < a; h++) if (y = c[h], v.p == y.p && v.sc == y.sc && v.pi == y.pi && v.prit == y.prit) {
														  k = !1;
														  break
													      }
													      if (k) {
														  for (p = !0, f.scs.length > 1 && c[0].p >= f.scs[1].p && (p = !1), h = 0, tt = ResultList.data.fis.length; h < tt; h++) if (ResultList.data.fis[h].fn && t == ResultList.data.fis[h].fn) {
														      p ? ResultList.data.fis[h].scs[0] = c[0] : ResultList.data.fis[h].scs.splice(0, 1);
														      break
														  }
														  p ? (it = $(u).find("tr:first").clone(!0), it.insertBefore(o.find("tr:first")), o.find("tr:eq(1)").remove(), i.find(".search_table_header .price .base_price02").html("<dfn>&yen;<\/dfn>" + c[0].p)) : (o.find("tr:eq(0)").remove(), i.find(".search_table_header .price .base_price02").html("<dfn>&yen;<\/dfn>" + f.scs[1].p));
														  i.find(".lowest_price").removeClass("lowest_price")
													      }
													  }
												      } else w = i.find("[tag='expandAll']"),
												      d = i.find("[tag='collapseAll']"),
												      w.css("display") != "none" ? (w.hide(), d.show()) : (w.show(), d.hide());
												      i.attr(COMMON_STATUS.LOADING, "F");
												      e.hideMoreLoading(t)
												  }
											      },
											      onerror: function() {
												  i.attr(COMMON_STATUS.LOADING, "F");
												  e.hideMoreLoading(t)
											      },
											      onabort: function() {
												  i.attr(COMMON_STATUS.LOADING, "F");
												  e.hideMoreLoading(t)
											      }
											  }))
					     },
					     showMoreLoading: function(n) {
						 var t = $("#flight_" + n);
						 t.find(".search_footer .ico_loading_18").show()
					     },
					     hideMoreLoading: function(n) {
						 var t = $("#flight_" + n);
						 t.find(".search_footer .ico_loading_18").hide()
					     },
					     displayClasses: function(n) {
						 var t = $("#flight_" + n),
						 e = t.attr("currentClasses"),
						 i = t.find("[tag='normalClasses']"),
						 r = t.find("[tag='allClasses']"),
						 u = t.find("[tag='expandAll']"),
						 f = t.find("[tag='collapseAll']");
						 e == "all" ? (i.hide(), r.show(), u.hide(), f.show()) : (i.show(), r.hide(), u.show(), f.hide())
					     },
					     hideMoreClasses: function(n) {
						 var t = $("#flight_" + n);
						 t.attr("currentClasses", "normal");
						 this.displayClasses(n)
					     },
					     flightBook: function(n, t) {
						 var o = n.id,
						 r, i, f, e, s, u, h, c;
						 if (t || (t = "1"), ssoInitLoginFlag == "T" && $(n).attr("isbooking") == "T") __SSO_booking(n.id, t);
						 else {
						     if (r = o.indexOf("transit_") > -1, r) {
							 this.submitFlight(n, null, r);
							 return
						     }
						     if (i = {},
							 $(n).attr("data").split("|").associate(this.classDataKeys.split(","), i), i.ApplyType == "WaitingPolicy") {
							 f = new Date;
							 e = "F";
							 $(n).attr("isallwaiting") == "T" && (e = "T");
							 s = $(n).parents(".search_box").data("data");
							 f = s.dt.toDateTime(); (new Date).addHours(24) > f ? ($("#apChoose24").hide(), $("#apChoose72").hide(), $("#apChooseAll").show(), $("#apChooseAll input").attr("checked", "checked")) : (new Date).addHours(72) > f ? ($("#apChoose72").hide(), $("#apChoose24").show(), $("#apChooseAll").show(), $("#apChoose24 input").attr("checked", "checked")) : ($("#apChoose24").show(), $("#apChoose72").show(), $("#apChooseAll").show(), $("#apChoose24 input").attr("checked", "checked"));
							 new Ctrip.UI.Dialog({
							     title: '<span style="font-size: 14px; font-weight: bold;">' + textConfig.title[3] + "<\/span>",
							     type: "id",
							     content: "ApplyProductWaitTimeTips",
							     height: 0,
							     width: 420,
							     classNames: {
								 dialog: "pop_v2",
								 titleBar: "pop_v2_hd",
								 title: "title",
								 close: "delete",
								 content: "pop_v2_bd"
							     }
							 });
							 $("#ApplyProductBtn").bind("click",
										    function() {
											i.ApplyProductWaitTime = $("#ApplyProductWaitTimeTips input:checked").value();
											i.IsAllWaitPolicy = e;
											ResultList.submitFlight(n, i, r)
										    });
							 return
						     }
						     if (u = "", $("#SmCorpFeeType1").value() == "") {
							 if ($(".smCorpFeeType").length > 0 && (u = $(".smCorpFeeType input:checked").values(), u == "")) {
							     $(".smCorpFeeType input:first")[0].focus();
							     alert(textConfig.text[51]);
							     return
							 }
						     } else u = $("#SmCorpFeeType1").value();
						     if (u == "PUB" && this.isLowestPriceInTime(o)) {
							 $("#NoSelectCheapperFlightWarningMask").length == 0 && (h = '<div id="NoSelectCheapperFlightWarningMask" style="width: 450px; padding: 8px 10px; display: none">                                        <p style="padding: 10px 20px; text-indent: 2em;">贵公司差旅政策要求“预订选择航班前后一小时内的最低价格航班”。您目前所选择的航班非最低价格航班，是否重新选择？<\/p>                                        <div style="padding: 10px; text-align: center;">                                            <input type="button" class="base_btns2 cancel" value="重新选择航班" id="btnReSelectFlight" />&nbsp;&nbsp; <input type="button" class="base_btns2 determine" value="预订当前航班" id="btnConfirmBook" />                                        <\/div>                                    <\/div>', $("body").append($.instance(h)));
							 c = new Ctrip.UI.Dialog({
							     title: textConfig.title[1],
							     type: "id",
							     content: "NoSelectCheapperFlightWarningMask",
							     height: 0,
							     width: 450
							 });
							 $("#btnReSelectFlight").bind("click",
										      function() {
											  c.close()
										      });
							 $("#btnConfirmBook").bind("click",
										   function() {
										       ResultList.submitFlight(n, i, r)
										   });
							 return
						     }
						     this.submitFlight(n, i, r)
						 }
					     },
					     isLowestPriceInTime: function(n) {
						 var l = $("#" + n),
						 e = {},
						 u,
						 h,
						 t,
						 c,
						 f,
						 s;
						 l.attr("data").split("|").associate(this.classDataKeys.split(","), e);
						 var o = $("#flight_" + e.Flight).data("data"),
						 a = o.dt.toDateTime(),
						 r = e.Price,
						 i = null;
						 for (u = 0, h = this.data.fis.length; u < h; u++)(t = this.data.fis[u], t.Routes) || (c = t.dt.toDateTime(), f = Math.abs($.dateDiff(c, a).seconds), f <= 3600 && (s = t.scs[0].p, s < r && (r = s, (i == null || i.diffTime > f) && (i = {
						     diffTime: f,
						     data: t.dt.toDateTime().toFormatString("hhmm") + "|" + t.scs[0].p + "|" + t.scs[0].sc + "|" + t.fn + "|" + t.scs[0].rate
						 }))));
						 return o.Price != r && i != null && (SearchCondition.SearchRouteIndex == 0 ? document.getElementById("SmCorpData1").value = i.data: document.getElementById("SmCorpData").value = i.data),
						 o.Price != r
					     },
					     submitFlight: function(n, t, i) {
						 var r, e, s, u, o, h, c, f;
						 i || this.saveSubClassLog(n, t);
						 r = {}; (SearchCondition.PassengerType != "" || SearchCondition.PassengerType != "ADU") && (r.PassengerType = SearchCondition.PassengerType);
						 SearchCondition.ClassType != "" && (r.ClassType = SearchCondition.ClassType);
						 r.PassengerQuantity = SearchCondition.Quantity;
						 r.FlightWay = SearchCondition.SearchType;
						 r.DCity1 = SearchCondition.DCity1;
						 r.ACity1 = SearchCondition.ACity1;
						 r.DDate1 = SearchCondition.DDate1;
						 $("#RouteLowestPriceList").length > 0 && (r.RouteLowestPriceList = $("#RouteLowestPriceList").value());
						 $("#RouteLowestPriceListSecond").length > 0 && $("#RouteLowestPriceListSecond").value() != "" && (r.RouteLowestPriceListSecond = $("#RouteLowestPriceListSecond").value());
						 e = {};
						 i ? (r.SendTicketCity = SearchCondition.DCityName1, $.extend(!0, r, transferFlightData), submitForm(BookRootUrl + "Book?r=" + Math.random(), r)) : (s = "", s = $(".smCorpFeeType").length > 0 ? $(".smCorpFeeType input:checked").values() : $("#SmCorpFeeType1").value(), u = {},
																								     SearchCondition.SearchRouteIndex == 0 && (u.Flight1 = t.Flight, u.Subclass1 = t.SubClass, u.Price1 = t.Price, u.PriceType1 = t.PriceType, u.PolicyID1 = t.PolicyId, u.canSeparateSale1 = t.CanSeparateSale, u.productType1 = t.ProductType, u.SmCorpFeeType1 = $("input[name='SmCorpFeeType']:checked").values(), u.SmCorpData1 = $("#SmCorpData1").value()), o = "Book", SearchCondition.SearchType == "S" ? (r.SendTicketCity = SearchCondition.DCityName1, r.IsAllWaitPolicy = t.IsAllWaitPolicy, r.ApplyProductWaitTime = t.ApplyProductWaitTime, $.extend(!0, r, u), submitForm(BookRootUrl + o + "?r=" + Math.random(), r)) : (r.DCity2 = SearchCondition.DCity2, r.ACity2 = SearchCondition.ACity2, r.DDate2 = SearchCondition.DDate2, SearchCondition.SearchRouteIndex == 0 ? (h = u.Flight1 + "|" + u.Subclass1.replace("+", "%2b") + "|" + u.Price1 + "|" + u.PolicyID1 + "|" + u.PriceType1 + "|" + u.productType1 + "|0|" + u.canSeparateSale1, e.SmCorpData1 = u.SmCorpData1, $("#RouteLowestPriceList").length > 0 && (e.RouteLowestPriceList = $("#RouteLowestPriceList").value()), c = getCityUrlParameter(), submitForm(SEORootUrl + c + "/SecondRoute/?" + $.toQuery(getQueryInfo(SearchCondition)) + "&sf1=" + h + "&SmCorpFeeType1=" + u.SmCorpFeeType1, e)) : (f = {},
																																																																																																																																																																																			 r.Flight1 = SelectedFlight1.Flight, r.SubClass1 = SelectedFlight1.SubClass, r.Price1 = SelectedFlight1.Price, r.PriceType1 = SelectedFlight1.PriceType, r.PolicyID1 = SelectedFlight1.PolicyId, r.CanSeparateSale1 = SelectedFlight1.IsCanSeparateSale, r.ProductType1 = SelectedFlight1.ProductType, r.SmCorpFeeType1 = $("#SmCorpFeeType1").value(), r.SmCorpData1 = $("#SmCorpData1").value(), r.SmCorpData = $("#SmCorpData").value(), SearchCondition.SearchRouteIndex == 1 && (f.Flight2 = t.Flight, f.SubClass2 = t.SubClass, f.Price2 = t.Price, f.PriceType2 = t.PriceType, f.PolicyID2 = t.PolicyId, f.CanSeparateSale2 = t.CanSeparateSale, f.ProductType2 = t.ProductType, f.CanMergeOrder = t.CanMergeOrder), $.extend(!0, r, f), r.ClassType = "", r.IsShowSpecialPrice = "F", t.RPriceType && t.RPriceType.trim() != "" && (r.Price1 = t.RPrice1, r.Price2 = t.RPrice2, r.PriceType1 = t.RPriceType, r.PriceType2 = t.RPriceType, r.PolicyID1 = t.RPolicyId, r.PolicyID2 = t.RPolicyId, r.OriginalPrice1 = SelectedFlight1.Price ? SelectedFlight1.Price: "0", r.OriginalPrice2 = t.Price, r.IsShowSpecialPrice = t.RPriceType.toUpperCase() == "CZSPECIALPRICE" ? "T": "F", r.OriginalPriceCount = parseInt(r.OriginalPrice1) + parseInt(r.OriginalPrice2), r.AirlineRate = t.RAirlineRate), r.SendTicketCity = SearchCondition.DCityName1, t.AllowGroupBook.toUpperCase() == "TRUE" ? submitForm(BookRootUrl + o + "?r=" + Math.random(), r) : t.RPriceType && (t.RPriceType.toUpperCase() == "CZSPECIALPRICE" || t.RPriceType.toUpperCase() == "ROUNDTRIPPRICE") ? submitForm(BookRootUrl + o + "?r=" + Math.random(), r) : submitForm(RootUrl + "Search/TwoRouteNotGroup/?", r))))
					     },
					     saveSubClassLog: function(n, t) {
						 var i, r, u;
						 try {
						     i = {
							 DepartCity: SearchCondition.SearchRouteIndex == 0 ? SearchCondition.DCity1: SearchCondition.ACity1,
							 ArriveCity: SearchCondition.SearchRouteIndex == 0 ? SearchCondition.ACity1: SearchCondition.ACity2,
							 DepartDate: SearchCondition.SearchRouteIndex == 0 ? SearchCondition.DDate1: SearchCondition.DDate2,
							 SearchType: SearchCondition.SearchType,
							 RouteIndex: SearchCondition.SearchRouteIndex + 1
						     };
						     i.Flight = t.Flight;
						     i.SubClass = t.SubClass;
						     i.Price = t.Price;
						     r = $(n);
						     u = r.parents("tr:first");
						     i.Location = r.parents("[tag='normalClasses']").length > 0 ? 0 : $("input[data='" + r.attr("data") + "']").length > 1 ? 1 : 2;
						     i.ClassName = escape(u.find("td.classes").text());
						     i.TotalCount = u.siblings().length + 1;
						     i.SelectedIndex = u.previousSiblings().length + 1;
						     $.ajax(RootUrl + "Ajax/AirDomSubClassLog?" + $.toQuery(i), {
							 method: "GET",
							 async: !1
						     })
						 } catch(f) {}
					     },
					     filterMethods: {
						 Airline: function(n, t) {
						     try {
							 var i = "";
							 return i = n.Routes ? n.Routes[0].fis[0].alc: n.alc,
							 !t || t == "" || t.split(",").contains(i)
						     } catch(r) {
							 return ! 1
						     }
						 },
						 DPort: function(n, t) {
						     if (n.Routes) {
							 for (var i = 0,
							      r = n.Routes[0].fis.length; i < r; i++) if (!t || t == "" || t.split(",").contains(n.Routes[0].fis[i].dpc)) return ! 0;
							 return ! 1
						     }
						     return ! t || t == "" || t.split(",").contains(n.dpc)
						 },
						 APort: function(n, t) {
						     if (n.Routes) {
							 for (var i = 0,
							      r = n.Routes[0].fis.length; i < r; i++) if (!t || t == "" || t.split(",").contains(n.Routes[0].fis[i].apc)) return ! 0;
							 return ! 1
						     }
						     return ! t || t == "" || t.split(",").contains(n.apc)
						 },
						 Craft: function(n, t) {
						     try {
							 var i = n.cf ? n.cf.s: n.Routes ? n.Routes[0].fis[0].cf.s: "";
							 return ! t || t == "" || t.split(",").contains(i)
						     } catch(r) {
							 return ! 1
						     }
						 },
						 Transfer: function(n, t) {
						     return ! n.Routes && t == "1" || t == "0"
						 },
						 DTime: function(n, t) {
						     var u, i, o, r;
						     try {
							 if (u = n.Routes ? n.Routes[0].fis[0].dt: n.dt, !t || t == "") return ! 0;
							 var h = {
							     MO: "6-12",
							     MI: "12-13",
							     AF: "13-18",
							     EV: "18-24"
							 },
							 f = u.toDateTime().getHours(),
							 e = t.split(",");
							 for (i = 0, o = e.length; i < o; i++) {
							     if (r = h[e[i].trim().toUpperCase()], !r) return ! 0;
							     var s = r.split("-"),
							     c = parseInt(s[0]),
							     l = parseInt(s[1]);
							     if (f >= c && f < l) return ! 0
							 }
							 return ! 1
						     } catch(a) {
							 return ! 1
						     }
						 }
					     },
					     getFilterData: function() {
						 var i = [],
						 u = !1,
						 t,
						 f,
						 r,
						 n;
						 for (n in this.filterState) if (this.filterState[n] != "") {
						     u = !0;
						     break
						 }
						 if (u) for (t = 0, f = this.data.fis.length; t < f; t++) {
						     r = !0;
						     for (n in this.filterState) if (this.filterMethods[n] && !this.filterMethods[n].call(this, this.data.fis[t], this.filterState[n])) {
							 r = !1;
							 break
						     }
						     r && i.push(this.data.fis[t])
						 } else i = this.data.fis;
						 return this.sortData(i, this.currentSortField),
						 i
					     },
					     fliter: function(n, t) {
						 var f = this,
						 i, r, u;
						 FlightPager.stopListener();
						 n && n != "" && (this.filterState[n] = t);
						 this.showLoading(1);
						 try {
						     i = $(".searchresult_content .search_box");
						     r = this.getFilterData();
						     FlightPager.init(r);
						     r.length == 0 ? (i.hide(), $("#nofilterdata").length == 0 && (u = $.tmpl.render(FlightBuilderBase.templates.FilterNoResult, {
							 Content: textConfig.text[45]
						     }), $(".searchresult_content").append($.instance(u))), $("#nofilterdata").show(), $("#nofilterdata .nodatamsg").html(textConfig.errorMsg[6])) : ($("#nofilterdata").hide(), FlightPager.disabled = !0, i.hide(), FlightPager.loadFlights(FlightPager.pageIndex), FlightPager.disabled = !1);
						     FlightPager.startListener()
						 } catch(e) {
						     FlightPager.startListener()
						 }
						 this.status != COMMON_STATUS.LOADING && setTimeout(function() {
						     f.hideLoading(1)
						 },
												    100)
					     },
					     clearFilter: function() {
						 this.filterState = {};
						 $("#filterConditionShow a:not(:last)").ohtml("");
						 $(".filter_condition").find("input:checkbox").removeAttr("checked");
						 $("#filterConditionShow").hide();
						 this.fliter()
					     },
					     sortData: function(n, t) {
						 this.compareMethods[t] && n.sort(this.compareMethods[t])
					     },
					     sort: function(n) {
						 var i, r, t;
						 FlightPager.stopListener();
						 i = this;
						 this.showLoading(1);
						 try {
						     this.currentSortField = n;
						     FlightPager.disabled = !0;
						     r = $(".searchresult_content .search_box");
						     t = this.getFilterData();
						     this.sortData(t, n);
						     r.hide();
						     FlightPager.init(t);
						     FlightPager.loadFlights(FlightPager.pageIndex);
						     FlightPager.disabled = !1;
						     FlightPager.startListener()
						 } catch(u) {
						     FlightPager.startListener()
						 }
						 this.status != COMMON_STATUS.LOADING && setTimeout(function() {
						     i.hideLoading(1)
						 },
												    100)
					     },
					     setLowPriceSubscription: function(n) {
						 var t = this;
						 SearchCondition.SearchType == "S" && SearchCondition.PassengerType == "ADU" && $("#btn_remind").attr("url", RootUrl + "MyToolBox/Option.aspx?DCity=" + SearchCondition.DCity1 + "&ACity=" + SearchCondition.ACity1 + "&DDate=" + SearchCondition.DDate1 + "&Amount=" + n.lp + "&Rate=" + Math.floor(n.lr * 10) / 10 + "&LinkSource=S")
					     },
					     getGiftJSON: function(n) {
						 var i = {},
						 t, r;
						 if (n) for (t = 0, r = n.length; t < r; t++) n[t].gid != "" && (i["Gift" + n[t].gid] = {
						     Desc: n[t].desc,
						     RuleDesc: n[t].rdesc,
						     IsCompleteMatch: n[t].icm
						 });
						 return i
					     },
					     buildNeighbor: function() {
						 $("#flight_pagefooter").length > 0 && $("#flight_pagefooter").remove();
						 var i = (new Date).toFormatString("yyyy-MM-dd").toDate(),
						 n = SearchCondition.SearchRouteIndex == 0 ? SearchCondition.DDate1.toDate() : SearchCondition.DDate2.toDate(),
						 t = '<div id="flight_pagefooter" class="page_neighbor"><a class="arrow_right" onclick="ResultList.searchByDate(\'' + n.addDays(1).toFormatString("yyyy-MM-dd") + '\')" title="' + textConfig.button[6] + '" href="javascript:void(0);">' + textConfig.button[6] + "(" + n.addDays(1).toFormatString("MM/dd") + ") <b><\/b><\/a>";
						 n > i && (t += '<a class="arrow_left" onclick="ResultList.searchByDate(\'' + n.addDays( - 1).toFormatString("yyyy-MM-dd") + '\')" title="' + textConfig.button[5] + '" href="javascript:void(0);"><b><\/b> (' + n.addDays( - 1).toFormatString("MM/dd") + ")" + textConfig.button[5] + "<\/a>");
						 t += "<\/div>";
						 $.instance(t).insertAfter($(".searchresult_content"))
					     },
					     buildSpecialSummaryList: function(n) {
						 var i, t, r, u;
						 if ($(".rightcolumn .specialprice").remove(), n && n.length > 0) {
						     for (i = '<div class="mod_box specialprice"><div class="hd">' + textConfig.text[13] + '<\/div><div class="bd">', t = 0, r = n.length; t < r; t++) u = '<a rel="nofollow" href="${Url}">${Title}<\/a><p>${Description}<\/p><span class="base_price"><dfn>&yen;<\/dfn><strong>${Price}<\/strong><\/span>${Tax}<b class="border_line"><\/b>',
						     i += $.tmpl.render(u, {
							 Url: n[t].Url,
							 Title: n[t].Title,
							 Price: n[t].Price,
							 Description: n[t].Description,
							 Tax: n[t].ContainsTax ? "(" + textConfig.text[15] + ")": ""
						     });
						     i += "<\/div><\/div>";
						     $(".rightcolumn").prepend($.instance(i))
						 }
					     },
					     buildAirlineSEO: function(n) {
						 var t, i;
						 if ($(".rightcolumn .airlineseo").remove(), n) {
						     t = "";
						     for (i in n) t += '<a href="http://' + i.toLowerCase() + 'air.flights.ctrip.com/" target="_blank">' + n[i] + "<\/a>";
						     t != "" && (t = '<div class="mod_box information airlineseo"><div class="hd">' + textConfig.text[14] + '<\/div><div class="bd">' + t + "<\/div><\/div>", $(".rightcolumn").append($.instance(t)))
						 }
					     },
					     buildCommonGift: function(n) {
						 var i, u, r, t, f;
						 if ($("#commongift").html(""), n) {
						     for (i = [], t = 0, u = n.length; t < u; t++) n[t].ip || i.push(n[t]);
						     if (i.length > 0) {
							 for (r = '<div class="mod_box gift_box"><div class="hd">' + textConfig.text[16] + '<\/div><div class="bd">', t = 0, f = i.length; t < f; t++) r += "<p>" + i[t].desc + '<span class="base_txtdiv" style="margin-left:10px;" tag="icon">' + textConfig.text[17] + '<span class="desc" style="display:none;">' + i[t].rdesc + "<\/span><\/span><\/p>",
							 i.length > 1 && t < i.length && (r += '<b class="border_line"><\/b>');
							 r += "<\/div><\/div>";
							 $("#commongift").html(r);
							 $("#commongift [tag='icon']").each(function(n) {
							     var t = n.find(".desc").html();
							     $(n).regMod("jmp", "1.1", {
								 options: {
								     boundaryShow: !1,
								     type: "jmp_text",
								     css: {
									 maxWidth: 300,
									 minWidth: 260
								     },
								     position: "bottomRight-topRight",
								     classNames: {
									 boxType: "jmp_text"
								     },
								     content: {
									 txt0: t
								     },
								     template: "#jmp_text"
								 }
							     })
							 })
							     }
						 }
					     }
					 };
					 FlightPager = {
					     intervalId: null,
					     disabled: !1,
					     pageIndex: 1,
					     totalPage: 1,
					     pageSize: 8,
					     data: {},
					     status: "",
					     init: function(n) {
						 this.data = n;
						 this.totalPage = Math.floor((n.length + this.pageSize - 1) / this.pageSize);
						 $("#flightCount").html(n.length)
					     },
					     nextPage: function() {
						 for (var i, t, r, u, n = this.pageSize * (this.pageIndex - 1), f = this.pageSize * this.pageIndex, e = this.data.length; n < f && n < e; n++) i = "flight_" + this.data[n].fn,
						 this.data[n].Routes && (i = "transit_" + this.data[n].Routes[0].fis[0].fn),
						 t = $("#" + i),
						 t.length > 0 ? t.show() : t = FlightBuilder.buildSingleFlight(this.data[n]),
						 t && ($(".searchresult_content .search_box").length > 0 ? n > 0 ? (r = $(".searchresult_content .search_box:eq(" + (n - 1) + ")"), i != r.attr("id") && t.insertAfter(r)) : (u = $(".searchresult_content .search_box:first"), i != u.attr("id") && t.insertBefore(u)) : $(".searchresult_content").append(t));
						 this.pageIndex++
					     },
					     loadFlights: function(n) {
						 this.pageIndex = 1;
						 for (var t = 1; t < n; t++) this.nextPage()
					     },
					     listen: function() {
						 var i, n, t;
						 if (!this.disabled) {
						     if (this.status != COMMON_STATUS.LOADING) {
							 this.status = COMMON_STATUS.LOADING;
							 this.stopListener();
							 try {
							     if (this.pageIndex > this.totalPage) return this.status = COMMON_STATUS.COMPLETED,
							     !1;
							     i = document.documentElement.scrollTop || document.body.scrollTop;
							     n = 0;
							     n = document.body.clientHeight && document.documentElement.clientHeight ? document.body.clientHeight < document.documentElement.clientHeight ? document.body.clientHeight: document.documentElement.clientHeight: document.body.clientHeight > document.documentElement.clientHeight ? document.body.clientHeight: document.documentElement.clientHeight;
							     t = $(".searchresult_content").offset();
							     i + n - t.top - t.height > -400 && this.nextPage()
							 } catch(r) {
							     this.status = COMMON_STATUS.COMPLETED
							 }
							 this.startListener()
						     }
						     this.status = COMMON_STATUS.COMPLETED
						 }
					     },
					     startListener: function() {
						 clearInterval(this.intervalId);
						 this.intervalId = setInterval(function() {
						     FlightPager.listen()
						 },
									       100)
					     },
					     stopListener: function() {
						 clearInterval(this.intervalId)
					     }
					 };
					 FlightBuilder = {
					     buildSingleFlight: function(n) {
						 var t;
						 try {
						     t = $.instance('<div class="search_box"><\/div>');
						     t.data("data", n);
						     n.fn ? t.attr("id", "flight_" + n.fn) : n.Routes && t.attr("id", "transit_" + n.Routes[0].fis[0].fn);
						     var r = this.buildFlightHeader(n),
						     i = this.buildSubClasses(n),
						     u = this.buildFooter(n);
						     return i && (t.append(r), t.append(i), t.append(u), this.attachSubClassEvent(i), this.attachFlightEvent(t)),
						     t
						 } catch(f) {
						     return null
						 }
					     },
					     attachSubClassEvent: function(n) {
						 try {
						     if (n.find(".specialClass").length > 0 && n.find(".specialClass").each(function(n) {
							 $(n).regMod("jmp", "1.1", {
							     options: {
								 boundaryShow: !1,
								 type: "jmp_text",
								 css: {
								     maxWidth: 300,
								     minWidth: 260
								 },
								 position: "bottomLeft-topLeft",
								 classNames: {
								     boxType: "jmp_text"
								 },
								 content: {
								     txt0: n.attr("description")
								 },
								 template: "#jmp_text"
							     }
							 })
						     }), n.find(".tgqinfo").length > 0 && n.find(".tgqinfo").each(function(n) {
							 var t = FlightBuilderBase.getTGQDescription(n.attr("data"));
							 $(n).regMod("jmp", "1.1", {
							     options: {
								 css: {
								     maxWidth: "490"
								 },
								 showArrow: !1,
								 type: "jmp_text",
								 position: "bottomLeft-topLeft",
								 classNames: {
								     boxType: ""
								 },
								 template: "#jmp_text",
								 content: {
								     txt0: t
								 }
							     }
							 })
						     }), n.find("[tag='icon']").length > 0) {
							 var t = "$$$";
							 n.find("[tag='icon']").each(function(n) {
							     var i = n.attr("type"),
							     r = n.find(".desc").html(),
							     u = FlightBuilderBase.getIconDesc(i, r);
							     switch (i) {
							     case "Gift":
								 n.bind("click",
									function() {
									    OpenGiftDetail(r.split(t)[0])
									})
							     }
							     $(n).regMod("jmp", "1.1", {
								 options: {
								     boundaryShow: !1,
								     type: "jmp_text",
								     css: {
									 maxWidth: 300,
									 minWidth: 260
								     },
								     position: "bottomLeft-topLeft",
								     classNames: {
									 boxType: "jmp_text"
								     },
								     content: {
									 txt0: u
								     },
								     template: "#jmp_text"
								 }
							     })
							 })
							     }
						 } catch(i) {}
					     },
					     attachFlightEvent: function(n) {
						 var t, i, r;
						 try {
						     t = n.data("data");
						     n.find(".craft").length > 0 && n.find(".craft").each(function(n) {
							 var t = n.attr("code");
							 n.regMod("jmp", "1.1", {
							     options: {
								 css: {
								     maxWidth: "490"
								 },
								 showArrow: !1,
								 type: "jmp_table",
								 position: "bottomLeft-topLeft",
								 classNames: {
								     boxType: ""
								 },
								 template: "#jmp_table",
								 content: online.getTableTips("fltDomestic_planeType.asp?CraftType=" + t)
							     }
							 })
						     });
						     n.find(".center .arrow .stop").length > 0 && (n.find(".center .arrow .stop").bind("mouseover",
																       function() {
																	   $(this).removeClass("low_text");
																	   $(this).addClass("direction_black_border")
																       }), n.find(".center .arrow .stop").bind("mouseout",
																					       function() {
																						   $(this).removeClass("direction_black_border");
																						   $(this).addClass("low_text")
																					       }), t = n.find(".center .arrow .stop").attr("data").split("|"), i = "<span>" + textConfig.icon[17] + textConfig.text[2] + t[0] + "(" + t[1] + "-" + t[2] + ")<br/><\/span>", n.find(".center .arrow .stop").regMod("jmp", "1.1", {
																						   options: {
																						       css: {
																							   maxWidth: "490"
																						       },
																						       showArrow: !1,
																						       type: "jmp_text",
																						       position: "bottomLeft-topLeft",
																						       classNames: {
																							   boxType: "jmp_text"
																						       },
																						       content: {
																							   txt0: i
																						       },
																						       template: "#jmp_text"
																						   }
																					       }));
						     n.find(".addDay").length > 0 && n.find(".addDay").each(function(n) {
							 var t = n.attr("description");
							 n.regMod("jmp", "1.1", {
							     options: {
								 boundaryShow: !1,
								 type: "jmp_text",
								 css: {
								     maxWidth: 300,
								     minWidth: 260
								 },
								 position: "bottomLeft-topLeft",
								 classNames: {
								     boxType: "jmp_text"
								 },
								 content: {
								     txt0: t
								 },
								 template: "#jmp_text"
							     }
							 })
						     });
						     n.find(".flyman").length > 0 && (r = $.tmpl.render(textConfig.iconDesc[5]), n.find(".flyman").regMod("jmp", "1.1", {
							 options: {
							     boundaryShow: !1,
							     type: "jmp_text",
							     css: {
								 maxWidth: 300,
								 minWidth: 260
							     },
							     position: "bottomLeft-topLeft",
							     classNames: {
								 boxType: "jmp_text"
							     },
							     content: {
								 txt0: r
							     },
							     template: "#jmp_text"
							 }
						     }))
						 } catch(u) {}
					     },
					     getTransitData: function(n) {
						 var e = 1,
						 i, t, o, u;
						 n.Routes.length > 1 && (n.Routes[0].fis.length > 1 && n.Routes[0].fis.length > 1 ? e = 3 : n.Routes[0].fis.length > 1 ? e = 1 : n.Routes[1].fis.length > 1 && (e = 2));
						 i = {
						     hidTransitProduct: "true",
						     hidTransitProductMode: e,
						     hidTransitSearchType: SearchCondition.SearchType,
						     hidTransitType: "TP",
						     hidTransitPassengerType: "ADU",
						     hidTransitPassengerQuantity: SearchCondition.Quantity,
						     hidTransitPrice: n.p,
						     hidTransitCPCityID: SearchCondition.DCityId1,
						     hidTransitMinBeforeFlyDays: n.mbfd
						 };
						 for (var f = 0,
						      r = 1,
						      s = n.Routes.length; f < s; f++) for (r = f * 2 + 1, t = 0, o = n.Routes[f].fis.length; t < o; t++) u = n.Routes[f].fis[t],
						 i["hidTransitDCityID" + (r + t)] = u.dcid,
						 i["hidTransitACityID" + (r + t)] = u.acid,
						 i["hidTransitSubclass" + (r + t)] = u.sc,
						 i["hidTransitFlight" + (r + t)] = u.fn,
						 i["hidTransitDepartTime" + (r + t)] = u.dt.toDateTime().toFormatString("yyyy-MM-dd");
						 return i
					     },
					     fillHeaderData: function(n, t, i, r, u) {
						 var w = '<tr><td class="logo"><div class="clearfix"><span class="pubFlights_${AirlineCode} flight_logo">${AirlineName}<\/span> <strong>${Flight}<\/strong><\/div>${CraftCode}<\/td>                        <td class="right"><div><strong class="${DepartTimeClass}">${DTime}<\/strong>${SpanDay1}<\/div><div>${DepartAirport}<\/div><\/td>                        <td class="center"><div class="arrow">${Stop}<\/div>${StopCity}<\/td>                        <td class="left"><div><strong class="${ArriveTimeClass}">${ATime}<\/strong>${SpanDay2}<\/div>${ArriveAirport}<\/div><\/td>                        <td class="ontime">${PunctualityRate}<\/td>                        <td class="meals"><span class="division"><\/span>${Meal}<\/td>                        <td class="taxinfo"><span class="division"><\/span>' + textConfig.text[24] + "<br/><dfn>&yen;<\/dfn>${Tax}<dfn>&nbsp;<\/dfn>+<dfn>&nbsp;<\/dfn><dfn>&yen;<\/dfn>${OilFee}<\/td>${PriceColumn}${SpecialColumn}<\/tr>",
						 f = 0,
						 c = "",
						 l,
						 p;
						 f = $.dateDiff(n.dt.toDate(), n.at.toDate()).days;
						 f >= 1 && (c = '<span class="direction_blue_border addDay" description="' + textConfig.text[29] + textConfig.text[0] + n.at.toDateTime().toFormatString("yyyy-MM-dd hh:mm") + '">+' + f + "<\/span>");
						 r && r > 0 ? (l = $.tmpl.render(textConfig.text[50], {
						     spanDay: r
						 }), r = '<span class="direction_blue_border addDay" description="' + l + '">+' + r + "<\/span>") : r = "";
						 var a = "",
						 e = "time",
						 o = "time",
						 v = "";
						 t == "transit" && (u == 0 ? (e = "time", o = "transit_time") : (e = "transit_time", o = "time"));
						 n.sts && (a = '<span class="low_text stop" data="' + n.sts[0].cn + "|" + n.sts[0].at.toDateTime().toFormatString("hh:mm") + "|" + n.sts[0].dt.toDateTime().toFormatString("hh:mm") + '">' + textConfig.icon[17] + "<\/span>", v = '<span class="low_text">' + n.sts[0].cn + "<\/span>");
						 var s = "",
						 h = "",
						 i = n.scs ? n.scs[0].p: i,
						 y = i == RouteLowestPrice ? "lowest_price": "";
						 return t == "transit" ? u == 0 && (s = '<td class="price middle  ' + y + '" rowspan="3"><span class="base_price02"><dfn>&yen;<\/dfn>' + i + "<\/span><i>" + textConfig.text[19] + "<\/i><\/td>", h = '<td class="special" rowspan="3">' + (n.ifm ? '<span class="flyman">' + textConfig.icon[16] + "<\/span>": "") + "<\/td>") : (s = '<td class="price ' + y + '"><span class="base_price02"><dfn>&yen;<\/dfn>' + i + "<\/span><i>" + textConfig.text[19] + "<\/i><\/td>", h = '<td class="special">' + (n.ifm ? '<span class="flyman">' + textConfig.icon[16] + "<\/span>": "") + "<\/td>"),
						 p = {
						     Flight: n.fn,
						     AirlineName: Airline[n.alc],
						     AirlineCode: n.alc.toLowerCase(),
						     CraftCode: FlightBuilderBase.getCraftType(n.cf),
						     DTime: n.dt.toDateTime().toFormatString("hh:mm"),
						     DepartAirport: AirportBuilding[n.dpc + n.dbid],
						     Stop: a,
						     SpanDay2: c,
						     SpanDay1: r,
						     StopCity: v,
						     ATime: n.at.toDateTime().toFormatString("hh:mm"),
						     ArriveAirport: AirportBuilding[n.apc + n.abid],
						     DepartTimeClass: e,
						     ArriveTimeClass: o,
						     Tax: n.tax,
						     OilFee: n.of,
						     PunctualityRate: FlightBuilderBase.getPunctualityRate(n.dt, n.pr, !0),
						     PriceColumn: s,
						     SpecialColumn: h,
						     Meal: FlightBuilderBase.getMeal(n.mt)
						 },
						 $.tmpl.render(w, p)
					     },
					     buildFlightHeader: function(n) {
						 return n.Routes ? (window.transferFlightData = this.getTransitData(n), this.buildTransitFlightHeader(n)) : this.buildNormalFlightHeader(n)
					     },
					     buildNormalFlightHeader: function(n) {
						 return $.instance('<table class="search_table_header">' + this.fillHeaderData(n) + "<\/table>")
					     },
					     buildTransitFlightHeader: function(n) {
						 var r = "",
						 i, f, t, e, u;
						 for (r += '<table class="search_table_header">', i = 0, f = n.Routes.length; i < f; i++) for (t = 0, e = n.Routes[i].fis.length; t < e; t++) t == 0 && (r += this.fillHeaderData(n.Routes[i].fis[t], "transit", n.p, "", t)),
						 t == 1 && (u = $.dateDiff(n.Routes[i].fis[t - 1].dt.toDate(), n.Routes[i].fis[t].dt.toDate()).days, u < 1 && (u = ""), r = r + '<tr class="search_table_transit"><td class="logo"> <\/td><td class="flight_transit_new" colspan="3"><span>' + n.Routes[0].tcn + textConfig.text[20] + '<\/span><\/td><td  colspan="3"> <\/td><\/tr>' + this.fillHeaderData(n.Routes[i].fis[t], "transit", 0, u, t));
						 return r += "<\/table>",
						 $.instance(r)
					     },
					     buildTransitFlightItem: function(n, t, i, r) {
						 var u = "",
						 f = "",
						 e = $.dateDiff(n.dt.toDate(), n.at.toDate()).days,
						 o,
						 r,
						 s;
						 return e >= 1 && (u = e, f = '<span class="direction_blue_border addDay" description="' + textConfig.text[29] + textConfig.text[0] + n.at.toDateTime().toFormatString("yyyy-MM-dd hh:mm") + '">+' + u + "<\/span>"),
						 r && r > 0 ? (o = $.tmpl.render(textConfig.text[50], {
						     spanDay: r
						 }), r = '<span class="direction_blue_border addDay" description="' + o + '">+' + r + "<\/span>") : r = "",
						 s = {
						     AirlineCode: n.alc.toLowerCase(),
						     AirlineName: Airline[n.alc],
						     Flight: n.fn,
						     Craft: FlightBuilderBase.getCraftType(n.cf),
						     DepartAirport: AirportBuilding[n.dpc + n.dbid],
						     ArriveAirport: AirportBuilding[n.apc + n.abid],
						     DepartTime: n.dt.toDateTime().toFormatString("hh:mm"),
						     ArriveTime: n.at.toDateTime().toFormatString("hh:mm"),
						     DepartTimeClass: i == 0 ? "time": "transit_time",
						     ArriveTimeClass: i == 0 ? "transit_time": "time",
						     ClassName: t,
						     SpanDay1: r,
						     SpanDay2: f
						 },
						 $.tmpl.render('<td class="logo">\t\t\t\t\t\t\t<div class="clearfix"><span class="pubFlights_${AirlineCode} flight_logo">${AirlineName}<\/span> <strong>${Flight}<\/strong><\/div>\t\t\t\t\t\t\t${Craft}\t\t\t\t\t\t<\/td>                        <td class="right">\t\t\t\t\t\t\t<div><strong class="${DepartTimeClass}">${DepartTime}<\/strong>${SpanDay1}<\/div>\t\t\t\t\t\t\t<div>${DepartAirport}<\/div>\t\t\t\t\t\t<\/td>                        <td class="center">\t\t\t\t\t\t\t<div class="arrow"><\/div>\t\t\t\t\t\t<\/td>                        <td class="left">\t\t\t\t\t\t\t<div><strong class="${ArriveTimeClass}">${ArriveTime}<\/strong>${SpanDay2}<\/div>\t\t\t\t\t\t\t<div>${ArriveAirport}<\/div>\t\t\t\t\t\t<\/td>                        <td class="classes">${ClassName}<\/td>', s)
					     },
					     buildRoundTransitPrice: function(n) {
						 var f = '<td rowspan="7" class="transit_td">\t\t\t\t\t    <div class="transit_price"><span class="base_price02"><dfn>&yen;<\/dfn>${Price}<\/span><br>${TGQInfo}<\/div>\t\t\t\t\t    <div class="transit_sales">${Icon2}<\/div>\t\t\t\t\t    <div class="transit_book"><input type="button" id="${ButtonId}" class="${ButtonClass}" onclick="ResultList.flightBook(this,\'1\')" isbooking="T" value="' + textConfig.button[0] + '"><\/div>\t\t\t\t    <\/td>',
						 t = "",
						 i = "",
						 u,
						 r,
						 n;
						 return t = FlightBuilderBase.getDisplayIcon(n.ics, "Discount"),
						 i = FlightBuilderBase.getDisplayIcon(n.ics, "Gift"),
						 t != "" && i != "" ? t += "<br/>" + i: i != "" && (t = i),
						 u = "transit_round_" + n.Class + n.p,
						 r = "btn_book",
						 typeof pageConfig.displayMode != "undefined" && pageConfig.displayMode && pageConfig.displayMode == 1 && (r += " hide"),
						 n = {
						     Price: n.p,
						     TGQInfo: FlightBuilderBase.getTGQRule(n.tgq),
						     Icon2: t,
						     ButtonId: u,
						     ButtonClass: r
						 },
						 $.tmpl.render(f, n)
					     },
					     buildRoundTransitFlight: function(n) {
						 var u, t, s, i, h, e;
						 try {
						     $("#flightTransitRound").length > 0 && $("#flightTransitRound").remove();
						     u = $.instance('<div id="flightTransitRound" class="recommend_transit_box"><h3 class="recommend_transit_hd">' + textConfig.text[44] + '<\/h3><div class="search_box"><\/div><\/div>');
						     u.data("data", n);
						     var o = "",
						     f = [],
						     r = '<table class="search_table_header">';
						     for (t = 0, s = n.Routes.length; t < s; t++) for (t == 1 && (r += '<tr class="transit_line"><td colspan="6"><\/td><\/tr>'), i = 0, h = n.Routes[t].fis.length; i < h; i++) i == 1 && (r += '<tr class="search_table_transit"><td><\/td><td class="flight_transit_new" colspan="3"><span>' + n.Routes[t].tcn + textConfig.text[20] + "<\/span><\/td><td><\/td><\/tr>", e = $.dateDiff(n.Routes[t].fis[i - 1].dt.toDate(), n.Routes[t].fis[i].dt.toDate()).days, e >= 1 && (o = e)),
						     r += "<tr>",
						     i == 0 && (r += '<td rowspan="3" class="transit_date"><strong>' + (t == 0 ? textConfig.text[21] : textConfig.text[22]) + "<\/strong>" + n.Routes[t].fis[0].dt.toDate().toFormatString("yyyy-MM-dd") + "<\/td>"),
						     f.push(n.Routes[t].fis[i].tax),
						     f.push(n.Routes[t].fis[i].of),
						     r += this.buildTransitFlightItem(n.Routes[t].fis[i], n.cn, i, o),
						     t == 0 && i == 0 && (r += this.buildRoundTransitPrice(n)),
						     r += "<\/tr>";
						     r += "<\/table>";
						     u.find(".search_box").append($.instance(r));
						     u.find(".search_box").append(this.buildRoundTransitFooter(f));
						     u.insertAfter($(".searchresult_content"));
						     this.attachFlightEvent(u);
						     this.attachSubClassEvent(u);
						     window.transferFlightData = this.getTransitData(n)
						 } catch(c) {}
					     },
					     buildSubClasses: function(n) {
						 var t = '<table class="search_table" tag="normalClasses" >',
						 r, u, i;
						 if (n.scs) for (r = 0, u = n.scs.length; r < u; r++) i = this.buildSubClass(n, n.scs[r], "normal"),
						 i && (t = t + "<tr>" + i + "<\/tr>");
						 else i = this.buildTransitSubClass(n),
						 i && (t = t + "<tr>" + this.buildTransitSubClass(n) + "<\/tr>");
						 return t = t + "<\/table>",
						 $.instance(t)
					     },
					     buildTransitSubClass: function(n) {
						 var i, r, u;
						 try {
						     i = FlightBuilderBase.templates.NormalSubClass;
						     r = "";
						     n.mq > 0 && (u = '<span class="warning">' + $.tmpl.render(textConfig.icon[15], {
							 Quantity: n.mq
						     }) + "<\/span>");
						     var e = "transit_" + n.c.replace("+", "_") + n.p + n.pi,
						     o = FlightBuilderBase.getDisplayIcon(n.ics, "StrategyInsurance,CashBack,Package,Young,Share"),
						     t = FlightBuilderBase.getDisplayIcon(n.ics, "Discount");
						     t != "" && (t += "<br />");
						     var s = FlightBuilderBase.getDisplayIcon(n.ics, "GiftPackage,Gift"),
						     h = textConfig.button[0],
						     f = "btn_book";
						     typeof pageConfig.displayMode != "undefined" && pageConfig.displayMode && pageConfig.displayMode == 1 && (f += " hide");
						     var c = {
							 bookBtnId: e,
							 buttonText: h,
							 buttonClass: f,
							 icon1: r,
							 className: FlightBuilderBase.getClassName(n),
							 rate: FlightBuilderBase.getRate(n.rate),
							 gift: s,
							 rule: FlightBuilderBase.getTGQRule(n.tgq),
							 price: n.p,
							 discount: t,
							 secondGift: o,
							 limitQuantity: u,
							 flightData: "",
							 isBooking: "T",
							 clickEvent: "ResultList.flightBook(this,'1')"
						     };
						     return $.tmpl.render(i, c)
						 } catch(a) {
						     return null
						 }
					     },
					     buildSubClass: function(n, t, i) {
						 var c, r, o, u, v, h, p;
						 try {
						     i = i || "";
						     c = FlightBuilderBase.templates.NormalSubClass;
						     r = "";
						     r += FlightBuilderBase.getDisplayIcon(t.ics, "RoundDiscount,RoundSpecial,CtripCard");
						     r == "" && (t.ina && t.at == 2 ? r += '<span tag="icon">' + textConfig.icon[0] + '<span class="desc" style="display:none;">' + textConfig.iconDesc[6] + "<\/span><\/span>": t.inp == !0 && (r += "<span>" + textConfig.icon[1] + "<\/span>"));
						     t.ia == !0 && (r += '&nbsp;<span class="agent">' + textConfig.icon[2] + "<\/span>");
						     t.ina ? o = '<span class="alternates_info" tag="icon"><span class="desc" style="display:none;">' + textConfig.iconDesc[7] + "<\/span><\/span>": t.mq > 0 && (o = '<span class="warning">' + $.tmpl.render(textConfig.icon[15], {
							 Quantity: t.mq
						     }) + "<\/span>");
						     var w = i + n.fn + t.sc.replace("+", "_") + t.prit + t.p + t.pi,
						     s = FlightBuilderBase.getDisplayIcon(t.ics, "StrategyInsurance,CashBack,Package,Young,Share"),
						     l = t.rt,
						     a = FlightBuilderBase.getClassName(t);
						     s.indexOf('type="Package"') != -1 && s.indexOf('tag="icon"') != -1 && (l = "", a = "");
						     u = FlightBuilderBase.getDisplayIcon(t.ics, "Discount");
						     u != "" && (u += "<br />");
						     v = FlightBuilderBase.getDisplayIcon(t.ics, "GiftPackage,Gift");
						     h = n.fn + "|" + t.sc + "|" + t.p + "|" + t.prit + "|" + t.pi + "|" + t.agb + "|" + t.prot + "|" + t.arh + "|" + t.css + "|" + t.at + "|" + t.cmo;
						     t.rsi && (h += "|" + t.rsi.SpecialType + "|" + t.rsi.PolicyId + "|" + t.rsi.Price1 + "|" + t.rsi.Price2 + "|" + t.rsi.AirlineRate + "|" + t.rsi.PriceType + "|" + t.rsi.IsCanSeparateSale);
						     var f = "",
						     e = "btn_book",
						     b = FlightBuilderBase.getIcon(t.ics, "Package"),
						     y = "ResultList.flightBook(this,'" + (b ? "0": "1") + "')";
						     t.ina ? (e = "alternates", f = textConfig.button[1]) : t.IsSellOut ? (f = textConfig.button[12], y = "javascript:void(0);", e = "btn_book_disable") : f = SearchCondition.SearchRouteIndex == 0 ? SearchCondition.SearchType == "S" ? textConfig.button[0] : textConfig.button[3] : textConfig.button[0];
						     p = SearchCondition.SearchRouteIndex == 0 && SearchCondition.SearchType == "S" ? "T": SearchCondition.SearchRouteIndex == 1 ? "T": "F";
						     typeof pageConfig.displayMode != "undefined" && pageConfig.displayMode && pageConfig.displayMode == 1 && (e += " hide");
						     var k = t.p == RouteLowestPrice ? "lowest_price": "",
						     d = {
							 bookBtnId: w,
							 buttonText: f,
							 buttonClass: e,
							 icon1: r,
							 className: a,
							 rate: l,
							 gift: v,
							 rule: FlightBuilderBase.getTGQRule(t.tgq),
							 price: t.p,
							 discount: u,
							 secondGift: s,
							 limitQuantity: o,
							 flightData: h,
							 lowestclass: k,
							 isBooking: p,
							 clickEvent: y
						     };
						     return $.tmpl.render(c, d)
						 } catch(nt) {
						     return null
						 }
					     },
					     buildFooter: function(n) {
						 var n, u;
						 if (SearchCondition.PassengerType.toUpperCase() == "ADU") {
						     if (n.Routes) return this.buildSingleTransitFooter(n);
						     var t = "",
						     i = "",
						     r = "";
						     return n.fx && n.fx != 0 && (t = '<span class="refund_info">' + $.tmpl.render(textConfig.text[27], {
							 Amount: n.fx
						     }) + "<\/span>"),
						     n.hmp && n.hmp != 0 && (i = '<span class="show" tag="expandAll"><a onclick="ResultList.showMoreClasses(\'all\',\'' + n.fn + '\')" class="arrow_down" herf="javascript:void(0);">' + textConfig.text[25] + '<b><\/b><\/a><\/span><span class="show" style="display: none;" tag="collapseAll"><a class="arrow_up" onclick="ResultList.hideMoreClasses(\'' + n.fn + '\')" href="javascript:void(0);">' + textConfig.text[26] + "<b><\/b><\/a><\/span>"),
						     n.rlp > 0 && (r = '<span class="low_text">' + textConfig.text[52] + "<dfn>\u00a5<\/dfn>" + n.rlp + textConfig.text[19] + "<\/span>"),
						     n = {
							 highestFXAmount: t,
							 hasMorePrice: i,
							 roundLowestPrice: r
						     },
						     u = $.tmpl.render('<div class="search_footer">${roundLowestPrice}<span class="ico_loading_18" style="display: none;"><\/span>${highestFXAmount}&nbsp;&nbsp;${hasMorePrice}<\/div>', n),
						     $.instance(u)
						 }
						 return $.instance('<div class="search_footer"><\/div>')
					     },
					     buildRoundTransitFooter: function(n) {
						 var t = RootUrl + "search/transferflight?searchtype=D&dcity1=" + SearchCondition.DCity1 + "&acity1=" + SearchCondition.ACity1 + "&ddate1=" + SearchCondition.DDate1 + "&ddate2=" + SearchCondition.DDate2 + "&quantity=" + SearchCondition.Quantity,
						 i = '<div class="search_footer"><span class="low_text">' + textConfig.text[24] + textConfig.text[2] + "(" + n[0] + "+" + n[1] + ")+(" + n[2] + "+" + n[3] + ")+(" + n[4] + "+" + n[5] + ")+(" + n[6] + "+" + n[7] + ")" + textConfig.text[10] + '<\/span><span class="show"><a href="' + t + '" target="_blank">' + textConfig.text[23] + "<\/a><\/span><\/div>";
						 return $.instance(i)
					     },
					     buildSingleTransitFooter: function() {
						 var n = RootUrl + "search/transferflight?searchtype=S&dcity1=" + SearchCondition.DCity1.toLowerCase() + "&acity1=" + SearchCondition.ACity1.toLowerCase() + "&ddate1=" + SearchCondition.DDate1 + "&quantity=" + SearchCondition.Quantity,
						 t = '<div class="search_footer"><span class="show"><a href="' + n + '" target="_blank">' + textConfig.text[23] + "<\/a><\/span><\/div>";
						 return $.instance(t)
					     },
					     buildSelectedFlight: function(n) {
						 var i, a, u, f, e;
						 $("#sf_c").html("");
						 var v = $("#selectedFlightTemplate").html(),
						 t = n.scs[0],
						 y = FlightBuilderBase.getDisplayIcon(t.ics, "Gift"),
						 r = FlightBuilderBase.getDisplayIcon(t.ics, "StrategyInsurance,CashBack,Package,Young,Share"),
						 s = "",
						 h = "",
						 c = "",
						 l = "";
						 if (n.sts) for (c = '<span class="low_text stop" data="' + n.sts[0].cn + "|" + n.sts[0].at.toDateTime().toFormatString("hh:mm") + "|" + n.sts[0].dt.toDateTime().toFormatString("hh:mm") + '">' + textConfig.icon[17] + "<\/span>", i = 0, a = n.sts.length; i < a; i++) l += '<div class="low_text">' + n.sts[i].cn + "<\/div>";
						 u = $.dateDiff(n.dt.toDate(), n.at.toDate()).days;
						 u >= 1 && (s = u, h = '<span class="direction_blue_border addDay" description="' + textConfig.text[29] + textConfig.text[0] + n.at.toDateTime().toFormatString("yyyy-MM-dd hh:mm") + '">+' + s + "<\/span>");
						 f = t.rt;
						 e = FlightBuilderBase.getClassName(t);
						 r.indexOf('tag="icon"') != -1 && r.indexOf('type="Package"') != -1 && (f = "", e = "");
						 var p = {
						     Flight: n.fn,
						     AirlineCode: n.alc.toLowerCase(),
						     AirlineName: Airline[n.alc],
						     Price: t.p + n.tax + n.of,
						     DepartDate: n.dt.toDateTime().toFormatString("yyyy-MM-dd"),
						     DepartTime: n.dt.toDateTime().toFormatString("hh:mm"),
						     ArriveTime: n.at.toDateTime().toFormatString("hh:mm"),
						     DepartBuildingName: AirportBuilding[n.dpc + n.dbid],
						     ArriveBuildingName: AirportBuilding[n.apc + n.abid],
						     DepartCityName: SearchCondition.DCityName1,
						     ArriveCityName: SearchCondition.ACityName1,
						     Craft: FlightBuilderBase.getCraftType(n.cf),
						     SubClassName: e,
						     TGQInfo: FlightBuilderBase.getTGQRule(t.tgq),
						     Icon2: r,
						     Icon1: y,
						     StopFlag: c,
						     StopCity: l,
						     Rate: f,
						     SpanDay: h
						 },
						 w = $.tmpl.render(v, p),
						 o = $.instance(w);
						 this.attachFlightEvent(o);
						 this.attachSubClassEvent(o);
						 $("#sf_c").append(o)
					     }
					 };
					 LowestPriceCalendar = {
					     departDate: (new Date).toDate(),
					     now: (new Date).toDate(),
					     priceData: {},
					     fromEndDate: {},
					     disabled: !1,
					     currentStartDate: (new Date).toDate(),
					     getFromEndDays: function() {
						 var n = this.departDate.addDays( - 3),
						 t = this.departDate.addDays(3);
						 return this.departDate < this.now.addDays(90) && (n = this.departDate.addDays( - 3) <= this.now ? (new Date).toDate() : this.now.addDays( - (7 - $.dateDiff(this.now, this.departDate.addDays( - 3).toDate()).days % 7)), t = n.addDays(90)),
						 {
						     startDate: n,
						     endDate: t
						 }
					     },
					     buildPriceDay: function(n, t) {
						 var i = n.toFormatString("yyyy-MM-dd"),
						 u,
						 r,
						 s,
						 f;
						 this.priceData[i] ? (u = '<span class="base_price02"><dfn>&yen;<\/dfn>' + this.priceData[i] + "<\/span>", r = "ResultList.searchByDate('" + i + "');") : n < (new Date).toFormatString("yyyy-MM-dd").toDate() ? (u = '<span class="low_price overdue">—<\/span>', r = "javascript:void(0);") : (u = "<span>" + textConfig.button[4] + "<\/span>", r = "ResultList.searchByDate('" + i + "');");
						 i == t.toFormatString("yyyy-MM-dd") && (r = "javascript:void(0);");
						 var e = textConfig.week[i.toDate().getDay()],
						 o = i.toDate().getFestival();
						 return o != "" && (e = "<b>" + o + "<\/b>"),
						 s = {
						     Date: i.toDate().toFormatString("MM-dd") + "&nbsp;" + e,
						     Event: r,
						     Day: i,
						     Price: u
						 },
						 f = $.instance($.tmpl.render('<li date="${Day}"><a href="javascript:void(0);" onclick="${Event}"><span class="calendar_date">${Date}<\/span>${Price}<\/a><\/li>', s)),
						 i == t.toFormatString("yyyy-MM-dd") && (f[0].className = "current"),
						 f
					     },
					     buildCalendar: function(n, t, i) {
						 var e, f, r, u;
						 if (i == 1) {
						     if (e = $("#lowestPriceDateList li:last").attr("date").toDate(), e < n.addDays(6)) for (r = n; r <= n.addDays(6); r = r.addDays(1)) u = this.buildPriceDay(r, t),
						     $("#lowestPriceDateList").append(u)
						 } else if (f = $("#lowestPriceDateList li:first").attr("date").toDate(), f > n && f > this.now) for (r = n.addDays(6); r >= n && r >= this.now; r = r.addDays( - 1)) u = this.buildPriceDay(r, t),
						 $("#lowestPriceDateList").prepend(u)
					     },
					     init: function(n, t, i) {
						 var r = this;
						 if (n) $(".calendar_panel").show();
						 else {
						     $(".calendar_panel").hide();
						     return
						 }
						 $("#lowestPriceDateList").html("");
						 $("#lowestPriceLink").attr("href", this.getLowestPriceUrl(SearchCondition));
						 this.departDate = SearchCondition.SearchRouteIndex == 0 ? SearchCondition.DDate1.toDate() : SearchCondition.DDate2.toDate();
						 this.fromEndDate = this.getFromEndDays();
						 this.priceData = t;
						 this.priceData[this.departDate.toFormatString("yyyy-MM-dd")] = i;
						 this.currentStartDate = this.departDate < this.now.addDays(90) ? $.dateDiff((new Date).toDate(), this.departDate.toDate()).days < 3 ? (new Date).toDate() : this.departDate.addDays( - 3) : this.departDate.addDays( - 3);
						 $("#lowestPriceDateList")[0].style.width = "10070px";
						 this.buildCalendar(this.currentStartDate, this.departDate, 1);
						 this.setButtonClass();
						 $("#lowestPriceDateList").css({
						     left: "0px"
						 });
						 $("#prevDate").bind("click",
								     function() {
									 r.prePage(r.departDate)
								     });
						 $("#nextDate").bind("click",
								     function() {
									 r.nextPage(r.departDate)
								     })
					     },
					     setButtonClass: function() {
						 this.currentStartDate <= this.now || this.currentStartDate <= this.fromEndDate.startDate ? $("#prevDate a").attr("class", "arrow_left_disable") : $("#prevDate a").attr("class", "arrow_left");
						 this.currentStartDate.addDays(6) >= this.fromEndDate.endDate ? $("#nextDate a").attr("class", "arrow_right_disable") : $("#nextDate a").attr("class", "arrow_right")
					     },
					     nextPage: function(n) {
						 var t = this;
						 if (!this.disabled && this.currentStartDate.addDays(13) <= this.fromEndDate.endDate) {
						     this.disabled = !0;
						     this.currentStartDate.addDays(13) <= this.fromEndDate.endDate && (this.currentStartDate = this.currentStartDate.addDays(7));
						     this.buildCalendar(this.currentStartDate, n, 1);
						     var r = $("#lowestPriceDateList li:first").attr("date"),
						     u = $.dateDiff(r, this.currentStartDate).days,
						     i = $($("#lowestPriceDateList li").get(u)).offset().left - $("#lowestPriceDateList li:first").offset().left;
						     IsIPad ? ($("#lowestPriceDateList").css("left", -i + "px"), t.disabled = !1) : $("#lowestPriceDateList").animate({
							 left: -i + "px"
						     },
																				      800,
																				      function() {
																					  t.disabled = !1
																				      });
						     this.setButtonClass()
						 }
					     },
					     prePage: function(n) {
						 var i = this,
						 r, f, t;
						 if (!this.disabled && this.currentStartDate > this.now) {
						     this.disabled = !0;
						     r = this.currentStartDate;
						     this.currentStartDate.addDays( - 6) >= this.fromEndDate.startDate && (this.currentStartDate = this.currentStartDate.addDays( - 7));
						     this.buildCalendar(this.currentStartDate, n, 0);
						     var u = $("#lowestPriceDateList li:first").attr("date"),
						     e = $.dateDiff(u, r).days,
						     o = $($("#lowestPriceDateList li").get(e)).offset().left - $("#lowestPriceDateList li:first").offset().left;
						     $("#lowestPriceDateList").css("left", -o + "px");
						     f = $.dateDiff(u, this.currentStartDate < this.now ? this.now: this.currentStartDate).days;
						     t = $($("#lowestPriceDateList li").get(f)).offset().left - $("#lowestPriceDateList li:first").offset().left;
						     IsIPad ? ($("#lowestPriceDateList").css("left", -t + "px"), i.disabled = !1) : $("#lowestPriceDateList").animate({
							 left: -t + "px"
						     },
																				      800,
																				      function() {
																					  i.disabled = !1
																				      });
						     this.setButtonClass()
						 }
					     },
					     disable: function() {
						 this.disabled = !0;
						 $("#prevDate a").attr("class", "arrow_left_disable");
						 $("#nextDate a").attr("class", "arrow_right_disable")
					     },
					     enable: function() {
						 this.disabled = !1;
						 this.setButtonClass()
					     },
					     getLowestPriceUrl: function(n) {
						 var i = $.dateDiff(new Date, n.DDate1).days,
						 t = RootUrl + "booking/lowprice-" + n.DCity1 + "-" + n.ACity1 + "-" + n.ClassType + "-" + (n.SearchType == "S" ? n.AirlineCode: "") + "-" + (n.SearchType == "M" ? "s": n.SearchType) + "-" + n.PassengerType + "-" + n.Quantity + "/?Dayoffset=" + i + "&DDate1=" + n.DDate1;
						 return n.SearchType == "D" && (t += "&DDate2=" + n.DDate2),
						 t.toLowerCase()
					     }
					 },
					 function() {
					     var t = {
						 flight: [new RegExp("http://flights.ctrip.com/booking/([a-zA-Z0-9]{3})-([a-zA-Z0-9]{3})-day-1.html"), new RegExp("http://flights.ctrip.com/schedule/([a-zA-Z0-9]{3}).([a-zA-Z0-9]{3}).html")],
						 promot: [new RegExp("http://flights.ctrip.com/booking/([a-zA-Z0-9]{3})-([a-zA-Z0-9]+)-flights.html"), new RegExp("http://flights.ctrip.com/schedule/([a-zA-Z0-9]{3})..html")]
					     },
					     f = function() {
						 var n = "";
						 try {
						     n = top.window.location.href
						 } catch(t) {
						     try {
							 n = window.location.href
						     } catch(t) {
							 n = document.URL
						     }
						 }
						 return n && n != "" ? n.replace(/\s/g, " ") : n
					     },
					     e = function(n) {
						 var t = document.createElement("script"),
						 i;
						 t.type = "text/javascript";
						 try {
						     t.appendChild(document.createTextNode(n))
						 } catch(r) {
						     t.text = n
						 }
						 i = document.getElementsByTagName("script")[0];
						 i.parentNode.insertBefore(t, i)
					     },
					     r = f(),
					     u = fromcity = tocity = "",
					     i,
					     n;
					     for (i in t.flight) if (t.flight.hasOwnProperty(i) && (n = t.flight[i].exec(r), n && n.length == 3)) {
						 fromcity = n[1];
						 tocity = n[2];
						 break
					     }
					     if (fromcity == "" && tocity == "") for (i in t.promot) if (t.promot.hasOwnProperty(i) && (n = t.promot[i].exec(r), n && n.length >= 2)) {
						 u = n[1];
						 break
					     }
					     e("var _zpq = _zpq || [];_zpq.push(['_setPageID','42']);_zpq.push(['_setPageType','airplane']);_zpq.push(['_setParams','','%%promotline%%','%%fromcity%%','%%tocity%%','']);_zpq.push(['_setAccount','9']);(function() {var zp = document.createElement('script'); zp.type = 'text/javascript'; zp.async = true;zp.src = 'http://webresource.c-ctrip.com/uires/hotelbooking/online/JavaScript/domestic20130327/ZAMPDA/s.js';var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(zp, s);})();".replace("%%promotline%%", u).replace("%%fromcity%%", fromcity).replace("%%tocity%%", tocity))
					 } ()