function getDeviceDims() {
    try {
        if (typeof hmSetting !== 'undefined' && hmSetting.getDeviceInfo) {
            var info = hmSetting.getDeviceInfo();
            if (info && typeof info.width === 'number') {
                return { width: info.width, height: info.height };
            }
        }
    } catch (e) {}
    return { width: 176, height: 368 };
}

var dims = getDeviceDims();

function parseQueryParam(param) {
    if (!param) return {};
    try {
        var result = {};
        var str = param.startsWith('?') ? param.substring(1) : param;
        var pairs = str.split('&');
        for (var i = 0; i < pairs.length; i++) {
            var kv = pairs[i].split('=');
            if (kv.length >= 2) {
                result[decodeURIComponent(kv[0])] = decodeURIComponent(kv.slice(1).join('='));
            }
        }
        return result;
    } catch (e) {
        return {};
    }
}

function getRouteName(routeId, routesMap) {
    return routesMap[routeId] || String(routeId);
}

function renderPage(data, error, routesMap, stopName) {
    hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0, y: 5, w: dims.width, h: 28,
        text: stopName || 'Остановка',
        text_size: 22, color: 0xffffff, align_h: hmUI.align.CENTER_H
    });
    
    if (error) {
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 50, w: dims.width, h: 30,
            text: String(error),
            text_size: 16, color: 0xff6666, align_h: hmUI.align.CENTER_H
        });
        return;
    }
    
    var arrivals = [];
    try {
        var objects = data && data.objects ? data.objects : [];
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (!obj) continue;
            var routeId = obj.route_id;
            var orders = obj.order || [];
            for (var j = 0; j < orders.length; j++) {
                var order = orders[j];
                if (order && order.prediction) {
                    arrivals.push({
                        route_id: routeId,
                        departure_plan: order.prediction.departure_plan,
                        precise: order.prediction.precise
                    });
                }
            }
        }
    } catch (e) {}
    
    arrivals.sort(function(a, b) {
        try { return new Date(a.departure_plan) - new Date(b.departure_plan); }
        catch (e) { return 0; }
    });
    arrivals = arrivals.slice(0, 6);
    
    var now = new Date();
    var items = [];
    for (var i = 0; i < arrivals.length; i++) {
        var arr = arrivals[i];
        var routeName = getRouteName(arr.route_id, routesMap);
        var planTime;
        try { planTime = new Date(arr.departure_plan); }
        catch (e) { planTime = now; }
        
        var diffMs = planTime - now;
        var diffMins = Math.round(diffMs / 60000);
        var timeText, timeColor;
        
        if (diffMins <= 0) {
            timeText = 'СЕЙЧАС';
            timeColor = 0xff6666;
        } else if (diffMins < 60) {
            timeText = diffMins + ' МИН';
            timeColor = diffMins < 5 ? 0xff6666 : 0x66ff66;
        } else {
            var h = planTime.getHours();
            var m = planTime.getMinutes();
            timeText = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
            timeColor = 0xffffff;
        }
        
        items.push({
            route: routeName,
            time: timeText,
            color: timeColor,
            precise: arr.precise ? 'тчк' : 'рас'
        });
    }
    
    if (items.length === 0) {
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 50, w: dims.width, h: 30,
            text: 'Нет данных',
            text_size: 18, color: 0x888888, align_h: hmUI.align.CENTER_H
        });
        return;
    }
    
    hmUI.createWidget(hmUI.widget.SCROLL_LIST, {
        x: 8, y: 40, w: dims.width - 16, h: dims.height - 80,
        item_space: 8,
        item_config: [{
            type_id: 1,
            item_height: 48,
            item_bg_color: 0x222222,
            item_bg_radius: 8,
            text_view: [
                { x: 8, y: 0, w: Math.floor((dims.width - 16) * 0.25), h: 48, key: 'route', color: 0xffffff, text_size: 22 },
                { x: 8 + Math.floor((dims.width - 16) * 0.25), y: 0, w: Math.floor((dims.width - 16) * 0.45), h: 48, key: 'time', color: 0x66ff66, text_size: 22 },
                { x: 8 + Math.floor((dims.width - 16) * 0.7), y: 14, w: Math.floor((dims.width - 16) * 0.3), h: 20, key: 'precise', color: 0x666666, text_size: 14 }
            ],
            text_view_count: 3
        }],
        item_config_count: 1,
        data_array: items,
        data_count: items.length,
        item_click_func: function() {}
    });
}

Page({
    state: {},
    
    onInit(param) {
        var query = parseQueryParam(param);
        var stopStr = query.stop || '{}';
        var routesStr = query.allRoutes || '{}';
        
        var stopData = {};
        var routesMap = {};
        
        try {
            stopData = JSON.parse(stopStr);
        } catch (e) {}
        
        try {
            routesMap = JSON.parse(routesStr);
        } catch (e) {}
        
        var apiRequest = getApp()._options.globalData.apiRequest;
        
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 5, w: dims.width, h: 28,
            text: stopData.name || 'Остановка',
            text_size: 22, color: 0xffffff, align_h: hmUI.align.CENTER_H
        });
        
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 50, w: dims.width, h: 30,
            text: 'Загрузка...',
            text_size: 18, color: 0x888888, align_h: hmUI.align.CENTER_H
        });
        
        if (!apiRequest || !stopData.id) {
            renderPage(null, 'Нет данных', routesMap, stopData.name);
            return;
        }
        
        apiRequest('GET_ARRIVALS', { stopId: stopData.id }, function(err, data) {
            renderPage(data, err, routesMap, stopData.name);
        });
    },
    
    build() {
        hmApp.registerGestureEvent(function(e) {
            if (e === hmApp.gesture.RIGHT) {
                hmApp.goBack();
                return true;
            }
            return false;
        });
    }
});
