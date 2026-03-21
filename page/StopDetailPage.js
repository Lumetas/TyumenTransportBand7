const service = getApp()._options.globalData.service;

var stopData = null;

function parseParam(param) {
    if (!param) return null;
    try {
        if (typeof param === 'string') {
            var result = {};
            var parts = param.replace(/[{}"]/g, '').split(',');
            for (var i = 0; i < parts.length; i++) {
                var kv = parts[i].split(':');
                if (kv.length >= 2) {
                    var key = kv[0].trim();
                    var val = kv.slice(1).join(':').trim();
                    if (key === 'stopId') {
                        result.stopId = parseInt(val, 10);
                    } else if (key === 'stopName') {
                        result.stopName = val;
                    }
                }
            }
            return result;
        }
        return null;
    } catch (e) {
        return null;
    }
}

function renderArrivals(data, stopName) {
    var { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = hmSetting.getDeviceInfo();
    var arrivals = [];
    var objects = data.objects || [];
    
    for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        var routeId = obj.route_id;
        var orders = obj.order || [];
        
        for (var j = 0; j < orders.length; j++) {
            var order = orders[j];
            if (order.prediction) {
                arrivals.push({
                    route_id: routeId,
                    departure_plan: order.prediction.departure_plan,
                    precise: order.prediction.precise
                });
            }
        }
    }
    
    arrivals.sort(function(a, b) {
        return new Date(a.departure_plan) - new Date(b.departure_plan);
    });
    arrivals = arrivals.slice(0, 6);

    var now = new Date();
    var items = arrivals.map(function(arr) {
        var routeName = service.getRouteName(arr.route_id);
        var planTime = new Date(arr.departure_plan);
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

        return {
            route: routeName,
            time: timeText,
            color: timeColor,
            precise: arr.precise ? 'тчк' : 'рас'
        };
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0, y: 5, w: DEVICE_WIDTH, h: 28,
        text: stopName || 'Остановка',
        text_size: 22,
        color: 0xffffff,
        align_h: hmUI.align.CENTER_H
    });

    if (items.length === 0) {
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 50, w: DEVICE_WIDTH, h: 30,
            text: 'Нет данных',
            text_size: 18,
            color: 0x888888,
            align_h: hmUI.align.CENTER_H
        });
        return;
    }

    hmUI.createWidget(hmUI.widget.SCROLL_LIST, {
        x: 8,
        y: 40,
        h: DEVICE_HEIGHT - 80,
        w: DEVICE_WIDTH - 16,
        item_space: 8,
        item_config: [
            {
                type_id: 1,
                item_height: 48,
                item_bg_color: 0x222222,
                item_bg_radius: 8,
                text_view: [
                    {
                        x: 8, y: 0, w: Math.floor((DEVICE_WIDTH - 16) * 0.25), h: 48,
                        key: 'route',
                        color: 0xffffff,
                        text_size: 22
                    },
                    {
                        x: 8 + Math.floor((DEVICE_WIDTH - 16) * 0.25), y: 0, w: Math.floor((DEVICE_WIDTH - 16) * 0.45), h: 48,
                        key: 'time',
                        color: 0x66ff66,
                        text_size: 22
                    },
                    {
                        x: 8 + Math.floor((DEVICE_WIDTH - 16) * 0.7), y: 14, w: Math.floor((DEVICE_WIDTH - 16) * 0.3), h: 20,
                        key: 'precise',
                        color: 0x666666,
                        text_size: 14
                    }
                ],
                text_view_count: 3
            }
        ],
        item_config_count: 1,
        data_array: items,
        data_count: items.length,
        item_click_func: function(list, index) {}
    });
}

Page({
    state: {},
    
    onInit(param) {
        stopData = parseParam(param);
        if (!stopData) {
            hmApp.goBack();
        }
    },
    
    build() {
        if (!stopData) return;
        
        var stopId = stopData.stopId;
        var data = service.getArrivals(stopId);
        renderArrivals(data, stopData.stopName);

        hmApp.registerGestureEvent(function(e) {
            if (e === hmApp.gesture.RIGHT) {
                hmApp.goBack();
                return true;
            }
            return false;
        });
    }
});
