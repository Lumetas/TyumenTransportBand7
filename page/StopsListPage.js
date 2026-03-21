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
var routesMap = {};

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

function getRoutesText(routeIds) {
    if (!routeIds || !routeIds.length) return '-';
    var result = [];
    for (var i = 0; i < Math.min(routeIds.length, 4); i++) {
        result.push(routesMap[routeIds[i]] || String(routeIds[i]));
    }
    return result.join(' ');
}

Page({
    state: {},
    
    onInit(param) {
        var query = parseQueryParam(param);
        var stopsStr = query.stops || '[]';
        var routesStr = query.routes || '{}';
        
        try {
            var stopsList = JSON.parse(stopsStr);
            routesMap = JSON.parse(routesStr);
        } catch (e) {
            var stopsList = [];
        }
        
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 5, w: dims.width, h: 28,
            text: 'Остановки',
            text_size: 24, color: 0xffffff, align_h: hmUI.align.CENTER_H
        });
        
        if (!stopsList || stopsList.length === 0) {
            hmUI.createWidget(hmUI.widget.TEXT, {
                x: 0, y: 50, w: dims.width, h: 30,
                text: 'Нет данных',
                text_size: 18, color: 0x888888, align_h: hmUI.align.CENTER_H
            });
            return;
        }
        
        var dataArray = [];
        for (var i = 0; i < stopsList.length; i++) {
            dataArray.push({
                name: stopsList[i].name || '?',
                routes: getRoutesText(stopsList[i].routes_ids),
                id: stopsList[i].id
            });
        }
        
        hmUI.createWidget(hmUI.widget.SCROLL_LIST, {
            x: 8, y: 40, w: dims.width - 16, h: dims.height - 80,
            item_space: 8,
            item_config: [{
                type_id: 1,
                item_height: 68,
                item_bg_color: 0x222222,
                item_bg_radius: 10,
                text_view: [
                    { x: 8, y: 8, w: dims.width - 32, h: 28, key: 'name', color: 0xffffff, text_size: 22 },
                    { x: 8, y: 38, w: dims.width - 32, h: 24, key: 'routes', color: 0x888888, text_size: 18 }
                ],
                text_view_count: 2
            }],
            item_config_count: 1,
            data_array: dataArray,
            data_count: dataArray.length,
            item_click_func: function(list, index) {
                var stop = stopsList[index];
                if (stop) {
                    var stopsJson = encodeURIComponent(JSON.stringify(stopsList));
                    var routesJson = encodeURIComponent(JSON.stringify(routesMap));
                    var stopJson = encodeURIComponent(JSON.stringify(stop));
                    hmApp.gotoPage({
                        url: 'page/StopDetailPage',
                        param: '?stop=' + stopJson + '&allStops=' + stopsJson + '&allRoutes=' + routesJson
                    });
                }
            }
        });
    },
    
    build() {}
});
