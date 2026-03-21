(() => {
    var selectedIndex = 0;
    var stops = [];
    var widgets = [];
    var listWidgets = [];

    function getService() {
        return __$$hmAppManager$$__.currentApp.app._options.globalData.service;
    }

    function getRoutesText(routesIds) {
        if (!routesIds || !routesIds.length) return '-';
        var routesMap = getService().getRoutesMap();
        return routesIds.slice(0, 5).map(function(r) {
            return getService().getRouteName(r);
        }).join(' ');
    }

    function renderList() {
        listWidgets.forEach(function(w) { hmUI.deleteWidget(w); });
        listWidgets = [];

        for (var i = 0; i < 4; i++) {
            var stopIdx = selectedIndex + i;
            var stop = stops[stopIdx];
            if (!stop) continue;

            var isSelected = i === 1;
            var baseY = 60 + i * 60;

            listWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
                x: 16, y: baseY, w: 160, h: 52,
                color: isSelected ? 0x3366cc : 0x222222,
                radius: 8
            }));

            listWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 24, y: baseY + 6, w: 140, h: 22,
                text: stop.name,
                text_size: 16,
                color: 0xffffff
            }));

            listWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 24, y: baseY + 28, w: 140, h: 18,
                text: getRoutesText(stop.routes_ids),
                text_size: 12,
                color: 0x888888
            }));

            var stopCopy = stop;
            var btn = hmUI.createWidget(hmUI.widget.IMG, {
                x: 16, y: baseY, w: 160, h: 52,
                src: ''
            });
            listWidgets.push(btn);

            (function(stopItem) {
                btn.addEventListener(hmUI.event.CLICK_UP, function() {
                    hmApp.gotoPage({
                        url: 'page/StopDetailPage',
                        param: JSON.stringify({ stopId: stopItem.id, stopName: stopItem.name })
                    });
                });
            })(stop);
        }

        if (selectedIndex > 0) {
            listWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 0, y: 305, w: 192, h: 20,
                text: '^ вверх',
                text_size: 12,
                color: 0x666666,
                align_h: hmUI.align.CENTER_H
            }));
        }

        if (selectedIndex < stops.length - 4) {
            listWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 0, y: 325, w: 192, h: 20,
                text: 'v вниз',
                text_size: 12,
                color: 0x666666,
                align_h: hmUI.align.CENTER_H
            }));
        }
    }

    function clearAll() {
        widgets.forEach(function(w) { hmUI.deleteWidget(w); });
        listWidgets.forEach(function(w) { hmUI.deleteWidget(w); });
        widgets = [];
        listWidgets = [];
    }

    var __$$app$$__ = __$$hmAppManager$$__.currentApp;
    var __$$module$$__ = __$$app$$__.current;
    
    __$$module$$__.module = DeviceRuntimeCore.Page({
        onInit() {
            clearAll();

            widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 0, y: 15, w: 192, h: 35,
                text: 'Остановки',
                text_size: 22,
                color: 0xffffff,
                align_h: hmUI.align.CENTER_H
            }));

            getService().getStops().then(function(data) {
                stops = data.objects || [];
                selectedIndex = 0;
                renderList();
            }).catch(function() {
                hmUI.showToast({ text: 'Ошибка загрузки' });
            });

            hmApp.registerGestureEvent(function(e) {
                if (e === hmApp.gesture.UP) {
                    if (selectedIndex > 0) {
                        selectedIndex--;
                        renderList();
                    }
                    return true;
                }
                if (e === hmApp.gesture.DOWN) {
                    if (selectedIndex < stops.length - 1) {
                        selectedIndex++;
                        renderList();
                    }
                    return true;
                }
                return false;
            });
        }
    });
})();
