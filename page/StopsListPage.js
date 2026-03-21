const service = getApp()._options.globalData.service;

function getRoutesText(routesIds) {
    if (!routesIds || !routesIds.length) return '-';
    var routesMap = service.getRoutesMap();
    var result = [];
    for (var i = 0; i < Math.min(routesIds.length, 4); i++) {
        result.push(routesMap[routesIds[i]] || String(routesIds[i]));
    }
    return result.join(' ');
}

Page({
    state: {},
    
    build() {
        var { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = hmSetting.getDeviceInfo();
        var stops = service.getStops();
        var stopsData = stops.objects || [];
        
        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 5, w: DEVICE_WIDTH, h: 28,
            text: 'Остановки',
            text_size: 24,
            color: 0xffffff,
            align_h: hmUI.align.CENTER_H
        });

        var dataArray = stopsData.map(function(s) {
            return {
                name: s.name,
                routes: getRoutesText(s.routes_ids),
                id: s.id
            };
        });

        hmUI.createWidget(hmUI.widget.SCROLL_LIST, {
            x: 8,
            y: 40,
            w: DEVICE_WIDTH - 16,
            h: DEVICE_HEIGHT - 80,
            item_space: 8,
            item_config: [
                {
                    type_id: 1,
                    item_height: 68,
                    item_bg_color: 0x222222,
                    item_bg_radius: 10,
                    text_view: [
                        {
                            x: 8, y: 8, w: DEVICE_WIDTH - 32, h: 28,
                            key: 'name',
                            color: 0xffffff,
                            text_size: 22
                        },
                        {
                            x: 8, y: 38, w: DEVICE_WIDTH - 32, h: 24,
                            key: 'routes',
                            color: 0x888888,
                            text_size: 18
                        }
                    ],
                    text_view_count: 2
                }
            ],
            item_config_count: 1,
            data_array: dataArray,
            data_count: dataArray.length,
            item_click_func: function(list, index) {
                var stop = stopsData[index];
                if (stop) {
                    var param = '{"stopId":' + stop.id + ',"stopName":"' + stop.name + '"}';
                    hmApp.gotoPage({ url: 'page/StopDetailPage', param: param });
                }
            }
        });
    }
});
