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

Page({
    state: {},
    
    build() {
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 5, w: dims.width, h: 28,
            text: 'ТюменьГорТранс',
            text_size: 22, color: 0xffffff, align_h: hmUI.align.CENTER_H
        });
        
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 80, w: dims.width, h: 30,
            text: 'Загрузка...',
            text_size: 18, color: 0x888888, align_h: hmUI.align.CENTER_H
        });
        
        var apiRequest = getApp()._options.globalData.apiRequest;
        
        if (!apiRequest) {
            hmUI.createWidget(hmUI.widget.TEXT, {
                x: 0, y: 120, w: dims.width, h: 30,
                text: 'API не готов',
                text_size: 16, color: 0xff6666, align_h: hmUI.align.CENTER_H
            });
            return;
        }
        
        var routesMap = {};
        
        apiRequest('GET_ROUTES', {}, function(err, data) {
			console.log('data => ' + JSON.stringify(data));
			console.log('err => ' + JSON.stringify(err));
            if (!err && data && data.map) {
                routesMap = data.map;
            }
            
            apiRequest('GET_STOPS', {}, function(err2, stops) {
                if (!err2 && stops && stops.length > 0) {
                    var stopsJson = encodeURIComponent(JSON.stringify(stops));
                    var routesJson = encodeURIComponent(JSON.stringify(routesMap));
                    hmApp.gotoPage({
                        url: 'page/StopsListPage',
                        param: '?stops=' + stopsJson + '&routes=' + routesJson
                    });
                } else {
                    hmUI.createWidget(hmUI.widget.TEXT, {
                        x: 0, y: 120, w: dims.width, h: 30,
                        text: 'Нет данных',
                        text_size: 16, color: 0xff6666, align_h: hmUI.align.CENTER_H
                    });
                }
            });
        });
    }
});
