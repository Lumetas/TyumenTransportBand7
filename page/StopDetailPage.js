import pako from "../shared/pako.js";
import { Compressor } from "../shared/compressor.js";

var dims = { width: 176, height: 368 };

function getDeviceDims() {
    try {
        if (typeof hmSetting !== 'undefined' && hmSetting.getDeviceInfo) {
            var info = hmSetting.getDeviceInfo();
            if (info && typeof info.width === 'number') {
                return { width: info.width, height: info.height };
            }
        }
    } catch (e) {
        console.log('StopDetail: getDeviceDims error', e);
    }
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
        console.log('StopDetail: parseQueryParam error', e);
        return {};
    }
}

function renderPage(error, arrivals, stopName) {
    try {
        console.log('StopDetail: renderPage START', JSON.stringify({ error: error, arrivalsCount: arrivals ? arrivals.length : 0, name: stopName }));
        
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 5, w: dims.width, h: 28,
            text: stopName || 'Остановка',
            text_size: 22, color: 0xffffff, align_h: hmUI.align.CENTER_H
        });
        
        if (error) {
            console.log('StopDetail: Render show error:', error);
            hmUI.createWidget(hmUI.widget.TEXT, {
                x: 0, y: 50, w: dims.width, h: 30,
                text: String(error),
                text_size: 16, color: 0xff6666, align_h: hmUI.align.CENTER_H
            });
            return;
        }
        
        if (!arrivals || !arrivals.length) {
            console.log('StopDetail: Render show no data');
            hmUI.createWidget(hmUI.widget.TEXT, {
                x: 0, y: 50, w: dims.width, h: 30,
                text: 'Нет данных',
                text_size: 18, color: 0x888888, align_h: hmUI.align.CENTER_H
            });
            return;
        }
        
        console.log('StopDetail: Render show list, count:', arrivals.length);
        arrivals = arrivals.slice(0, 6);
        
        var now = new Date();
        var items = [];
        for (var i = 0; i < arrivals.length; i++) {
            var arr = arrivals[i];
            var planTime;
            try { planTime = new Date(arr.t); }
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
        
        console.log('StopDetail: renderPage DONE');
    } catch (e) {
        console.log('StopDetail: renderPage ERROR', e);
    }
}

Page({
    state: {},
    
    onInit(param) {
        try {
            console.log('StopDetail: === onInit START ===');
            
            var query = parseQueryParam(param);
            var stopStr = query.stop || '{}';
            
            var stopData = {};
            try {
                stopData = JSON.parse(stopStr);
                console.log('StopDetail: stopData:', JSON.stringify(stopData));
            } catch (e) {
                console.log('StopDetail: Parse stop ERROR', e);
            }
            
            var apiRequest = null;
            try {
                var app = getApp();
                if (app && app._options && app._options.globalData) {
                    apiRequest = app._options.globalData.apiRequest;
                }
                console.log('StopDetail: apiRequest type:', typeof apiRequest);
            } catch (e) {
                console.log('StopDetail: getApp ERROR', e);
            }
            
            if (!apiRequest || !stopData.id) {
                console.log('StopDetail: Missing apiRequest or stopId');
                renderPage('Нет данных', null, stopData.name);
                return;
            }
            
            console.log('StopDetail: Requesting arrivals for stopId:', stopData.id);
            
            var startTime = Date.now();
            
            apiRequest('GET_ARRIVALS', { stopId: stopData.id }, function(err, data) {
                var elapsed = Date.now() - startTime;
                console.log('StopDetail: === API callback === elapsed:', elapsed, 'ms');
                console.log('StopDetail: err:', JSON.stringify(err));
                console.log('StopDetail: raw data:', JSON.stringify(data));
                
                try {
                    var arrivals = null;
                    
                    if (err) {
                        console.log('StopDetail: API error:', err);
                    } else if (data) {
                        console.log('StopDetail: data.result type:', typeof data.result, 'len:', data.result ? String(data.result).length : 0);
                        
                        if (typeof data.result === 'string') {
                            console.log('StopDetail: data.result preview:', data.result.substring(0, 50));
                            console.log('StopDetail: Decompressing...');
                            var decompressed = Compressor.decode(data.result);
                            console.log('StopDetail: decompressed:', JSON.stringify(decompressed));
                            if (decompressed && decompressed.arrivals) {
                                arrivals = decompressed.arrivals;
                                console.log('StopDetail: Decompressed OK, arrivals:', arrivals.length);
                            }
                        } else if (data.arrivals) {
                            console.log('StopDetail: Data is object with arrivals');
                            arrivals = data.arrivals;
                        } else {
                            console.log('StopDetail: Unknown data format');
                        }
                    } else {
                        console.log('StopDetail: No data');
                    }
                    
                    renderPage(err, arrivals, stopData.name);
                } catch (e) {
                    console.log('StopDetail: Callback ERROR', e);
                    renderPage('Ошибка: ' + String(e), null, stopData.name);
                }
            });
            
        } catch (e) {
            console.log('StopDetail: onInit ERROR', e);
        }
    },
    
    build() {
        try {
            hmApp.registerGestureEvent(function(e) {
                try {
                    if (e === hmApp.gesture.RIGHT) {
                        hmApp.goBack();
                        return true;
                    }
                    return false;
                } catch (err) {
                    console.log('StopDetail: gesture error', err);
                    return false;
                }
            });
        } catch (e) {
            console.log('StopDetail: build error', e);
        }
    }
});
