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
var stopsList = [];
var scrollList = null;
var loadingText = null;
var routesMap = {};
var loadTimeout = null;

function getRoutesText(routeIds) {
    if (!routeIds || !routeIds.length) return '-';
    var result = [];
    for (var i = 0; i < Math.min(routeIds.length, 4); i++) {
        result.push(routesMap[routeIds[i]] || String(routeIds[i]));
    }
    return result.join(' ');
}

function renderStops(stops, error) {
    stopsList = stops || [];
    
    if (loadingText) {
        try { loadingText.delete(); } catch (e) {}
        loadingText = null;
    }
    
    if (scrollList) {
        try { scrollList.delete(); } catch (e) {}
        scrollList = null;
    }
    
    hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0, y: 5, w: dims.width, h: 28,
        text: error ? 'Ошибка' : 'Остановки',
        text_size: 24, color: 0xffffff, align_h: hmUI.align.CENTER_H
    });
    
    if (stopsList.length === 0) {
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 50, w: dims.width, h: 30,
            text: error ? String(error) : 'Нет данных',
            text_size: 16, color: 0x888888, align_h: hmUI.align.CENTER_H
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
    
    scrollList = hmUI.createWidget(hmUI.widget.SCROLL_LIST, {
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
                var param = '{"stopId":' + stop.id + ',"stopName":"' + (stop.name || '') + '"}';
                hmApp.gotoPage({ url: 'page/StopDetailPage', param: param });
            }
        }
    });
}

Page({
    state: {},
    
    build() {
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 5, w: dims.width, h: 28,
            text: 'Остановки',
            text_size: 24, color: 0xffffff, align_h: hmUI.align.CENTER_H
        });
        
        loadingText = hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 50, w: dims.width, h: 30,
            text: 'Загрузка...',
            text_size: 18, color: 0x888888, align_h: hmUI.align.CENTER_H
        });
        
        var apiRequest = getApp()._options.globalData.apiRequest;
        if (!apiRequest) {
            renderStops([], 'No API');
            return;
        }
        
        loadTimeout = setTimeout(function() {
            renderStops([], 'Таймаут');
        }, 15000);
        
        apiRequest('GET_ROUTES', {}, function(err, data) {
            if (!err && data && data.map) {
                routesMap = data.map;
            }
            
            apiRequest('GET_STOPS', {}, function(err2, stops) {
                if (loadTimeout) {
                    clearTimeout(loadTimeout);
                    loadTimeout = null;
                }
                if (!err2 && stops) {
					console.log('Остановки получены, пытаемся отрисовать список');
                    renderStops(stops);
                } else {
					console.log('Остановки не получены, пытаемся отрисовать список пустым');
                    renderStops([], err2 || 'Нет данных');
                }
            });
        });
    }
});
