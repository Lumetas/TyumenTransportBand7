Page({
    state: {
        widgets: [],
        stopData: null
    },
    
    onInit(param) {
        this.service = getApp()._options.globalData.service;
        this.state.stopData = this.parseParam(param);
        if (!this.state.stopData) {
            hmApp.goBack();
            return;
        }
    },
    
    build() {
        this.clearAll();
        this.renderHeader();
        this.loadArrivals();
        this.registerGestures();
    },
    
    parseParam: function(param) {
        if (!param) return null;
        try {
            if (typeof param === 'string') {
                var result = {};
                var parts = param.replace(/[{}"]/g, '').split(',');
                for (var i = 0; i < parts.length; i++) {
                    var kv = parts[i].split(':');
                    if (kv.length >= 2) {
                        var key = kv[0].trim();
                        var val = kv.slice(1).join(':').trim();
                        if (key === 'stopId') {
                            result.stopId = parseInt(val, 10);
                        } else if (key === 'stopName') {
                            result.stopName = val;
                        }
                    }
                }
                return result;
            }
            return null;
        } catch (e) {
            return null;
        }
    },
    
    getService: function() {
        return this.service;
    },
    
    clearAll: function() {
        this.state.widgets.forEach(function(w) { hmUI.deleteWidget(w); });
        this.state.widgets = [];
    },
    
    renderHeader: function() {
        this.state.widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0, y: 5, w: 176, h: 28,
            text: this.state.stopData.stopName || 'Остановка',
            text_size: 22,
            color: 0xffffff,
            align_h: hmUI.align.CENTER_H,
            align_v: hmUI.align.CENTER_V
        }));
    },
    
    parseArrivals: function(data) {
        var arrivals = [];
        var objects = data.objects || [];
        
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            var routeId = obj.route_id;
            var orders = obj.order || [];
            
            for (var j = 0; j < orders.length; j++) {
                var order = orders[j];
                if (order.prediction) {
                    arrivals.push({
                        route_id: routeId,
                        departure_plan: order.prediction.departure_plan,
                        precise: order.prediction.precise
                    });
                }
            }
        }
        
        arrivals.sort(function(a, b) {
            return new Date(a.departure_plan) - new Date(b.departure_plan);
        });
        return arrivals.slice(0, 5);
    },
    
    renderArrivals: function(arrivals) {
        if (!arrivals.length) {
            this.state.widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 0, y: 100, w: 176, h: 30,
                text: 'Нет данных',
                text_size: 18,
                color: 0x888888,
                align_h: hmUI.align.CENTER_H,
                align_v: hmUI.align.CENTER_V
            }));
            return;
        }

        var now = new Date();

        for (var i = 0; i < arrivals.length; i++) {
            var arr = arrivals[i];
            var routeName = this.getService().getRouteName(arr.route_id);
            var planTime = new Date(arr.departure_plan);
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

            var baseY = 45 + i * 55;

            this.state.widgets.push(hmUI.createWidget(hmUI.widget.FILL_RECT, {
                x: 8, y: baseY, w: 160, h: 48,
                color: 0x222222,
                radius: 8
            }));

            this.state.widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 8, y: baseY, w: 50, h: 48,
                text: routeName,
                text_size: 22,
                color: 0xffffff,
                align_h: hmUI.align.CENTER_H,
                align_v: hmUI.align.CENTER_V
            }));

            this.state.widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 58, y: baseY, w: 70, h: 48,
                text: timeText,
                text_size: 22,
                color: timeColor,
                align_h: hmUI.align.CENTER_H,
                align_v: hmUI.align.CENTER_V
            }));

            this.state.widgets.push(hmUI.createWidget(hmUI.widget.TEXT, {
                x: 128, y: baseY, w: 40, h: 48,
                text: arr.precise ? 'тчк' : 'рас',
                text_size: 14,
                color: 0x666666,
                align_h: hmUI.align.CENTER_H,
                align_v: hmUI.align.CENTER_V
            }));
        }
    },
    
    loadArrivals: function() {
        var self = this;
        var stopId = this.state.stopData.stopId;
        this.getService().getArrivals(stopId).then(function(data) {
            var arrivals = self.parseArrivals(data);
            self.renderArrivals(arrivals);
        });
    },
    
    registerGestures: function() {
        hmApp.registerGestureEvent(function(e) {
            if (e === hmApp.gesture.RIGHT) {
                hmApp.goBack();
                return true;
            }
            return false;
        });
    }
});
