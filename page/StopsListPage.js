Page({
    state: {
        selectedIndex: 0,
        stops: [],
        widgets: [],
        listWidgets: []
    },
    
    onInit() {
        this.service = getApp()._options.globalData.service;
    },
    
    build() {
        this.clearAll();
        this.renderHeader();
        this.loadStops();
        this.registerGestures();
    },
    
    getService() {
        return this.service;
    },
    
    getRoutesText(routesIds) {
        if (!routesIds || !routesIds.length) return '-';
        var routesMap = this.getService().getRoutesMap();
        return routesIds.slice(0, 5).map(function(r) {
            return this.getService().getRouteName(r);
        }.bind(this)).join(' ');
    },
    
    loadStops() {
        var self = this;
        this.getService().getStops().then(function(data) {
            self.state.stops = data.objects || [];
            self.state.selectedIndex = 0;
            self.renderList();
        }).catch(function() {
            hmUI.showToast({ text: 'Ошибка загрузки' });
        });
    },
    
    renderHeader() {
        this.state.widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 15, w: 192, h: 35,
            text: 'Остановки',
            text_size: 22,
            color: 0xffffff,
            align_h: hmUI.align.CENTER_H
        }));
    },
    
    renderList() {
        var self = this;
        this.state.listWidgets.forEach(function(w) { hmUI.deleteWidget(w); });
        this.state.listWidgets = [];

        for (var i = 0; i < 4; i++) {
            var stopIdx = this.state.selectedIndex + i;
            var stop = this.state.stops[stopIdx];
            if (!stop) continue;

            var isSelected = i === 1;
            var baseY = 60 + i * 60;

            this.state.listWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
                x: 16, y: baseY, w: 160, h: 52,
                color: isSelected ? 0x3366cc : 0x222222,
                radius: 8
            }));

            this.state.listWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 24, y: baseY + 6, w: 140, h: 22,
                text: stop.name,
                text_size: 16,
                color: 0xffffff
            }));

            var routesText = this.getRoutesText(stop.routes_ids);
            this.state.listWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 24, y: baseY + 28, w: 140, h: 18,
                text: routesText,
                text_size: 12,
                color: 0x888888
            }));

            var btn = hmUI.createWidget(hmUI.widget.IMG, {
                x: 16, y: baseY, w: 160, h: 52,
                src: ''
            });
            this.state.listWidgets.push(btn);

            (function(stopItem) {
                btn.addEventListener(hmUI.event.CLICK_UP, function() {
                    hmApp.gotoPage({
                        url: 'page/StopDetailPage',
                        param: JSON.stringify({ stopId: stopItem.id, stopName: stopItem.name })
                    });
                });
            })(stop);
        }

        if (this.state.selectedIndex > 0) {
            this.state.listWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 0, y: 305, w: 192, h: 20,
                text: '^ вверх',
                text_size: 12,
                color: 0x666666,
                align_h: hmUI.align.CENTER_H
            }));
        }

        if (this.state.selectedIndex < this.state.stops.length - 4) {
            this.state.listWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 0, y: 325, w: 192, h: 20,
                text: 'v вниз',
                text_size: 12,
                color: 0x666666,
                align_h: hmUI.align.CENTER_H
            }));
        }
    },
    
    clearAll() {
        var self = this;
        this.state.widgets.forEach(function(w) { hmUI.deleteWidget(w); });
        this.state.listWidgets.forEach(function(w) { hmUI.deleteWidget(w); });
        this.state.widgets = [];
        this.state.listWidgets = [];
    },
    
    registerGestures() {
        var self = this;
        hmApp.registerGestureEvent(function(e) {
            if (e === hmApp.gesture.UP) {
                if (self.state.selectedIndex > 0) {
                    self.state.selectedIndex--;
                    self.renderList();
                }
                return true;
            }
            if (e === hmApp.gesture.DOWN) {
                if (self.state.selectedIndex < self.state.stops.length - 1) {
                    self.state.selectedIndex++;
                    self.renderList();
                }
                return true;
            }
            return false;
        });
    }
});
