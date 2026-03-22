import { STOPS } from "../config.js";

var _hasNavigated = false;

function getDeviceDims() {
    try {
        if (typeof hmSetting !== 'undefined' && hmSetting.getDeviceInfo) {
            var info = hmSetting.getDeviceInfo();
            if (info && typeof info.width === 'number') {
                return { width: info.width, height: info.height };
            }
        }
    } catch (e) {
        console.log('StopsList: getDeviceDims error', e);
    }
    return { width: 176, height: 368 };
}

var dims = getDeviceDims();

var stopsList = [];
try {
    for (var name in STOPS) {
        stopsList.push({
            name: name,
            id: STOPS[name]
        });
    }
    console.log('StopsList: Loaded', stopsList.length, 'stops');
} catch (e) {
    console.log('StopsList: Error loading stops', e);
}

Page({
    state: {},
    
    onInit(param) {
        try {
            console.log('StopsList: onInit', param);
            
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
                    routes: '...',
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
                    try {
                        var stop = stopsList[index];
                        if (stop) {
                            console.log('StopsList: Clicked stop', stop.name, stop.id);
                            var stopJson = encodeURIComponent(JSON.stringify(stop));
                            hmApp.gotoPage({
                                url: 'page/StopDetailPage',
                                param: '?stop=' + stopJson
                            });
                        }
                    } catch (e) {
                        console.log('StopsList: item_click error', e);
                    }
                }
            });
        } catch (e) {
            console.log('StopsList: onInit error', e);
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
                    console.log('StopsList: gesture error', err);
                    return false;
                }
            });
        } catch (e) {
            console.log('StopsList: build error', e);
        }
    }
});
