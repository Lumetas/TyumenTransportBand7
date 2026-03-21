import { MessageBuilder } from "../shared/message";

var API_BASE = 'https://api.tgt72.ru/api/v5';
var routesCache = null;
var stopsCache = null;

var messageBuilder = new MessageBuilder();

function fetchJSON(url) {
    return fetch({
        url: url,
        method: 'GET'
    }).then(function(response) {
        return response.json();
    });
}

function buildRoutesMap(routes) {
    var map = {};
    for (var i = 0; i < routes.length; i++) {
        map[routes[i].id] = routes[i].name;
    }
    return map;
}

function getRoutes() {
    if (routesCache) {
        return Promise.resolve(routesCache);
    }
    return fetchJSON(API_BASE + '/routesforsearch/?date=today').then(function(data) {
        var routes = data.objects || data || [];
        routesCache = {
            routes: routes,
            map: buildRoutesMap(routes)
        };
        return routesCache;
    });
}

function getStops() {
    return fetchJSON(API_BASE + '/checkpoint/').then(function(data) {
        stopsCache = data.objects || data || [];
        return stopsCache;
    });
}

function getArrivals(stopId) {
    return fetchJSON(API_BASE + '/prediction/?checkpoint_id=' + stopId);
}

function getSchedule(stopId, date) {
    var d = date || new Date().toISOString().split('T')[0];
    return fetchJSON(API_BASE + '/times/?date=' + d + '&checkpoint_id=' + stopId + '&show_intervals=1');
}

AppSideService({
    onInit: function() {
        messageBuilder.listen();
        
        messageBuilder.on("request", function(ctx) {
            var jsonRpc = messageBuilder.buf2Json(ctx.request.payload);
            var method = jsonRpc.method;
            var params = jsonRpc.params || {};
            
            function responseHandler(data) {
                ctx.response({ data: { result: data } });
            }
            
            function errorHandler(e) {
                ctx.response({ data: { error: e.message || String(e) } });
            }
            
            if (method === 'GET_ROUTES') {
                getRoutes().then(responseHandler).catch(errorHandler);
            } else if (method === 'GET_STOPS') {
                getStops().then(responseHandler).catch(errorHandler);
            } else if (method === 'GET_ARRIVALS') {
                getArrivals(params.stopId).then(responseHandler).catch(errorHandler);
            } else if (method === 'GET_SCHEDULE') {
                getSchedule(params.stopId, params.date).then(responseHandler).catch(errorHandler);
            } else {
                ctx.response({ data: { error: 'Unknown method: ' + method } });
            }
        });
    },

    onRun: function() {},

    onDestroy: function() {}
});
