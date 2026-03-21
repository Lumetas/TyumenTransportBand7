import { MessageBuilder } from "../shared/message";

var API_BASE = 'https://api.tgt72.ru/api/v5';
var routesCache = null;
var stopsCache = null;

var messageBuilder = new MessageBuilder();

async function fetchJSON(url, callback) {
    try {
		// TODO: Если оставить первый вариант, то ошибка парсинга. Если второй, то бесконечный цикл с подключениями
        var res = await fetch(url);
		callback(null, JSON.parse(res.body));
		
		// const data = typeof res.body === 'string' ?  JSON.parse(res.body) : res.body
		// callback(null, data);
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
        if (err) { callback(err + '1'); return; }
        try {
            var routes = data.objects || data || [];
            routesCache = { routes: routes, map: buildRoutesMap(routes) };
            callback(null, routesCache);
        } catch (e) { callback('Parse error' + JSON.stringify(data)); }
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
					data = JSON.stringify(data);
                    if (err) ctx.response({ data: { error: err } });
                    else ctx.response({ data: { result: data } });
                });
            } else if (method === 'GET_STOPS') {
                getStops(function(err, data) {
					data = JSON.stringify(data);
                    if (err) ctx.response({ data: { error: err } });
                    else ctx.response({ data: { result: data } });
                });
            } else if (method === 'GET_ARRIVALS') {
                getArrivals(params.stopId, function(err, data) {
					data = JSON.stringify(data);
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
