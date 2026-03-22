import * as Config from "../config.js";

var dims = { width: 176, height: 368 };

function getDeviceDims() {
    try {
        if (typeof hmSetting !== 'undefined' && hmSetting.getDeviceInfo) {
            var info = hmSetting.getDeviceInfo();
            if (info && typeof info.width === 'number') {
                return { width: info.width, height: info.height };
            }
        }
    } catch (e) {}
    return dims;
}

dims = getDeviceDims();

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

var _isPageAlive = true;

function renderPage(arrivals, stopName) {
    if (!_isPageAlive) return;
    
    try {
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 5, w: dims.width, h: 28,
            text: stopName || 'Остановка',
            text_size: 22, color: 0xffffff, align_h: hmUI.align.CENTER_H
        });
        
        if (!arrivals || !arrivals.length) {
            hmUI.createWidget(hmUI.widget.TEXT, {
                x: 0, y: 50, w: dims.width, h: 30,
                text: 'Нет данных',
                text_size: 18, color: 0x888888, align_h: hmUI.align.CENTER_H
            });
            return;
        }
        
        arrivals = arrivals.slice(0, 6);
        
        var nowMs = Date.now();
        var items = [];
        for (var i = 0; i < arrivals.length; i++) {
            var arr = arrivals[i];
            var planTime = typeof arr.t === 'number' ? arr.t : (typeof arr.t === 'string' ? new Date(arr.t).getTime() : nowMs);
            var diffMs = planTime - nowMs;
            var diffMins = Math.round(diffMs / 60000);
            var timeText, timeColor;
            
            if (diffMins <= 0) {
                timeText = 'СЕЙЧАС';
                timeColor = 0xff6666;
            } else if (diffMins < 60) {
                timeText = diffMins + ' МИН';
                timeColor = diffMins < 5 ? 0xff6666 : 0x66ff66;
            } else {
                var MSK_OFFSET_SEC = 5 * 60 * 60;
                var totalSec = Math.floor(planTime / 1000) + MSK_OFFSET_SEC;
                var h = Math.floor(totalSec / 3600) % 24;
                var m = Math.floor((totalSec % 3600) / 60);
                timeText = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
                timeColor = 0xffffff;
            }
            
            items.push({
                route: arr.r,
                time: timeText,
                color: timeColor,
                precise: arr.p ? 'тчк' : 'рас'
            });
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
    } catch (e) {
        console.log('StopDetail: render error', e);
    }
}

Page({
    state: {},
    
    onInit(param) {
        _isPageAlive = true;
        
        try {
            var query = parseQueryParam(param);
            var stopStr = query.stop || '{}';
            var stopData = JSON.parse(stopStr);
            
            var apiRequest = getApp()._options.globalData.apiRequest;
            
            if (!apiRequest) {
                renderPage([], stopData.name);
                return;
            }
            
            apiRequest('GET_ARRIVALS', { stopId: stopData.id }, function(err, result) {
                if (_isPageAlive) {
                    var arrivals = (result && result.arrivals) ? result.arrivals : [];
                    renderPage(arrivals, stopData.name);
                }
            });
        } catch (e) {
            console.log('StopDetail: onInit error', e);
        }
    },
    
    onDestroy: function() {
        _isPageAlive = false;
    },
    
    build() {
        try {
            hmApp.registerGestureEvent(function(e) {
                try {
                    if (e === hmApp.gesture.RIGHT) {
                        _isPageAlive = false;
                        hmApp.goBack();
                        return true;
                    }
                    return false;
                } catch (err) {
                    return false;
                }
            });
        } catch (e) {}
    }
});
