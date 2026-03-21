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
        var result = [];
        for (var i = 0; i < Math.min(routesIds.length, 4); i++) {
            result.push(routesMap[routesIds[i]] || String(routesIds[i]));
        }
        return result.join(' ');
    },
    
    loadStops() {
        var self = this;
        this.getService().getStops().then(function(data) {
            self.state.stops = data.objects || [];
            self.state.selectedIndex = 0;
            self.renderList();
        });
    },
    
    renderHeader() {
        this.state.widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 5, w: 176, h: 28,
            text: 'Остановки',
            text_size: 24,
            color: 0xffffff,
            align_h: hmUI.align.CENTER_H,
            align_v: hmUI.align.CENTER_V
        }));
    },
    
    renderList() {
        var self = this;
        this.state.listWidgets.forEach(function(w) { hmUI.deleteWidget(w); });
        this.state.listWidgets = [];

        for (var i = 0; i < 3; i++) {
            var stopIdx = this.state.selectedIndex + i;
            var stop = this.state.stops[stopIdx];
            if (!stop) continue;

            var baseY = 40 + i * 75;

            this.state.listWidgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
                x: 8, y: baseY, w: 160, h: 68,
                color: 0x222222,
                radius: 10
            }));

            this.state.listWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 8, y: baseY + 8, w: 160, h: 28,
                text: stop.name,
                text_size: 22,
                color: 0xffffff,
                align_h: hmUI.align.CENTER_H,
                align_v: hmUI.align.CENTER_V
            }));

            var routesText = this.getRoutesText(stop.routes_ids);
            this.state.listWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 8, y: baseY + 38, w: 160, h: 24,
                text: routesText,
                text_size: 18,
                color: 0x888888,
                align_h: hmUI.align.CENTER_H,
                align_v: hmUI.align.CENTER_V
            }));

            var btn = hmUI.createWidget(hmUI.widget.IMG, {
                x: 8, y: baseY, w: 160, h: 68,
                src: ''
            });
            this.state.listWidgets.push(btn);

            btn.addEventListener(hmUI.event.CLICK_UP, (function(s) {
                return function() {
                    var param = '{"stopId":' + s.id + ',"stopName":"' + s.name + '"}';
                    hmApp.gotoPage({ url: 'page/StopDetailPage', param: param });
                };
            })(stop));
        }

        if (this.state.selectedIndex > 0) {
            this.state.listWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 0, y: 275, w: 176, h: 24,
                text: '^',
                text_size: 20,
                color: 0x666666,
                align_h: hmUI.align.CENTER_H,
                align_v: hmUI.align.CENTER_V
            }));
        }

        if (this.state.selectedIndex < this.state.stops.length - 3) {
            this.state.listWidgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 0, y: 300, w: 176, h: 24,
                text: 'v',
                text_size: 20,
                color: 0x666666,
                align_h: hmUI.align.CENTER_H,
                align_v: hmUI.align.CENTER_V
            }));
        }
    },
    
    clearAll() {
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
