import { MessageBuilder } from "../shared/message";

var API_BASE = 'https://api.tgt72.ru/api/v5';
var routesCache = null;
var stopsCache = null;

var messageBuilder = new MessageBuilder();

function fetchJSON(url, callback) {
    try {
        var res = fetch(url);
        if (!res) {
            callback('fetch not available');
            return;
        }
        var body = res.body;
        if (typeof body === 'string') {
            callback(null, JSON.parse(body));
        } else {
            callback(null, body);
        }
    } catch (e) {
        callback('Error: ' + (e.message || String(e)));
    }
}

function buildRoutesMap(routes) {
    var map = {};
    try {
        for (var i = 0; i < routes.length; i++) {
            var r = routes[i];
            if (r && r.id !== undefined) {
                map[r.id] = r.name || String(r.id);
            }
        }
    } catch (e) {}
    return map;
}

function getRoutes(callback) {
    if (routesCache) {
        callback(null, routesCache);
        return;
    }
    fetchJSON(API_BASE + '/routesforsearch/?date=today', function(err, data) {
        if (err) { callback(err); return; }
        try {
            var routes = data.objects || data || [];
            routesCache = { routes: routes, map: buildRoutesMap(routes) };
            callback(null, routesCache);
        } catch (e) { callback('Parse error'); }
    });
}

function getStops(callback) {
    if (stopsCache) {
        callback(null, stopsCache);
        return;
    }
    fetchJSON(API_BASE + '/checkpoint/', function(err, data) {
        if (err) { callback(err); return; }
        try {
            stopsCache = data.objects || data || [];
            callback(null, stopsCache);
        } catch (e) { callback('Parse error'); }
    });
}

function getArrivals(stopId, callback) {
    fetchJSON(API_BASE + '/prediction/?checkpoint_id=' + stopId, function(err, data) {
        if (err) { callback(err); return; }
        callback(null, data);
    });
}

AppSideService({
    onInit: function() {
        console.log('Side onInit');
        messageBuilder.listen(function() {
            console.log('Listening ready');
        });
        
        messageBuilder.on("request", function(ctx) {
            var method, params;
            try {
                var jsonRpc = messageBuilder.buf2Json(ctx.request.payload);
                method = jsonRpc.method;
                params = jsonRpc.params || {};
            } catch (e) {
                ctx.response({ data: { error: 'Invalid request' } });
                return;
            }
            
            console.log('Request:', method);
            
            if (method === 'GET_ROUTES') {
                getRoutes(function(err, data) {
                    if (err) ctx.response({ data: { error: err } });
                    else ctx.response({ data: { result: data } });
                });
            } else if (method === 'GET_STOPS') {
                getStops(function(err, data) {
                    if (err) ctx.response({ data: { error: err } });
                    else ctx.response({ data: { result: data } });
                });
            } else if (method === 'GET_ARRIVALS') {
                getArrivals(params.stopId, function(err, data) {
                    if (err) ctx.response({ data: { error: err } });
                    else ctx.response({ data: { result: data } });
                });
            } else {
                ctx.response({ data: { error: 'Unknown: ' + method } });
            }
        });
    },

    onRun: function() {
        console.log('Side onRun');
    },

    onDestroy: function() {}
});
