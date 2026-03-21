(() => {
    var MockTransportService = function() {
        this._routesMap = new Map([
            [1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5'],
            [6, '6'], [7, '7'], [8, '8'], [9, '9'], [10, '10'],
            [11, '11'], [12, '12'], [14, '14'], [15, '15'], [16, '16'],
            [17, '17'], [18, '18'], [19, '19'], [20, '20'], [21, '21'],
            [22, '22'], [23, '23'], [24, '24'], [25, '25'], [26, '26'],
            [27, '27'], [28, '28'], [29, '29'], [30, '30'], [31, '31'],
            [32, '32'], [33, '33'], [34, '34'], [35, '35'], [36, '36'],
            [37, '37'], [38, '38'], [39, '39'], [40, '40'], [41, '41'],
            [42, '42'], [43, '43'], [44, '44'], [45, '45'], [46, '46'],
            [47, '47'], [48, '48'], [49, '49'], [50, '50'],
        ]);
        
        this._stops = [
            { id: 1001, name: 'Центр', lat: 57.1531, lon: 65.5343, routes_ids: [1, 2, 3, 4, 5] },
            { id: 1002, name: 'Вокзал', lat: 57.1545, lon: 65.5432, routes_ids: [1, 6, 7, 8, 9] },
            { id: 1003, name: 'Технопарк', lat: 57.1567, lon: 65.5521, routes_ids: [10, 11, 12, 14, 15] },
            { id: 1004, name: 'Аквапарк', lat: 57.1589, lon: 65.5612, routes_ids: [16, 17, 18, 19, 20] },
            { id: 1005, name: 'ТЦ Кристалл', lat: 57.1612, lon: 65.5703, routes_ids: [21, 22, 23, 24, 25] },
            { id: 1006, name: 'ТюмГУ', lat: 57.1634, lon: 65.5794, routes_ids: [26, 27, 28, 29, 30] },
            { id: 1007, name: 'Заречный', lat: 57.1656, lon: 65.5885, routes_ids: [31, 32, 33, 34, 35] },
            { id: 1008, name: 'Драмтеатр', lat: 57.1678, lon: 65.5976, routes_ids: [36, 37, 38, 39, 40] },
            { id: 1009, name: 'Солнечный', lat: 57.1700, lon: 65.6067, routes_ids: [41, 42, 43, 44, 45] },
            { id: 1010, name: 'Лесопарковый', lat: 57.1722, lon: 65.6158, routes_ids: [46, 47, 48, 49, 50] },
        ];
    };

    MockTransportService.prototype.getStops = function() {
        var self = this;
        return new Promise(function(resolve) {
            setTimeout(function() {
                resolve({ objects: self._stops });
            }, 100);
        });
    };

    MockTransportService.prototype.getArrivals = function(stopId) {
        var self = this;
        return new Promise(function(resolve) {
            setTimeout(function() {
                var now = new Date();
                var routes = self._stops.find(function(s) { return s.id === stopId; });
                routes = routes ? routes.routes_ids : [1, 2, 3];
                
                var arrivals = [];
                for (var i = 0; i < Math.min(routes.length, 5); i++) {
                    for (var j = 0; j < 2; j++) {
                        var planTime = new Date(now.getTime() + (j * 10 + Math.floor(Math.random() * 15)) * 60000);
                        arrivals.push({
                            route_id: routes[i],
                            departure_plan: planTime.toISOString(),
                            precise: Math.random() > 0.3,
                            distance: Math.floor(Math.random() * 500) + 100
                        });
                    }
                }
                
                arrivals.sort(function(a, b) {
                    return new Date(a.departure_plan) - new Date(b.departure_plan);
                });
                
                resolve({
                    objects: [{
                        route_id: arrivals[0] ? arrivals[0].route_id : 1,
                        order: arrivals.map(function(a) {
                            return {
                                prediction: {
                                    departure_plan: a.departure_plan,
                                    precise: a.precise
                                }
                            };
                        })
                    }]
                });
            }, 150);
        });
    };

    MockTransportService.prototype.getRoutesMap = function() {
        return this._routesMap;
    };

    MockTransportService.prototype.getRouteName = function(routeId) {
        return this._routesMap.get(routeId) || String(routeId);
    };

    var __$$app$$__ = __$$hmAppManager$$__.currentApp;
    __$$app$$__.app = DeviceRuntimeCore.App({
        globalData: {
            service: new MockTransportService()
        },
        onCreate(options) {},
        onShow(options) {},
        onHide(options) {},
        onDestroy(options) {},
        onError(error) {},
        onPageNotFound(obj) {},
        onUnhandledRejection(obj) {}
    });
})()
