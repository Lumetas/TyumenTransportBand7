import { MessageBuilder } from "../shared/message";
import pako from "../shared/pako.js";

var API_BASE = 'https://api.tgt72.ru/api/v5';

var messageBuilder = new MessageBuilder();

var Buffer = typeof Buffer !== 'undefined' ? Buffer : null;

function deflate(data) {
    try {
        const str = JSON.stringify(data);
        console.log('Side: Deflate input length', str.length);
        const compressed = pako.deflate(str);
        var result;
        if (Buffer) {
            result = Buffer.from(compressed).toString('base64');
        } else {
            result = btoa(String.fromCharCode.apply(null, compressed));
        }
        console.log('Side: Deflate output length', result.length);
        return result;
    } catch (err) {
        console.log('Side: Deflate error', err);
        return null;
    }
}

async function fetchJSON(url, callback) {
    try {
        console.log('Side: Fetching', url);
        let res = await fetch(url);
        console.log('Side: Response status', res.status);
        let text = await res.text();
        console.log('Side: Response text length', text ? text.length : 0);
        try {
            let data = text ? JSON.parse(text) : null;
            console.log('Side: Parsed JSON', data ? 'OK' : 'NULL');
            callback(null, data);
        } catch (parseErr) {
            console.log('Side: JSON parse error', parseErr);
            callback('JSON parse error: ' + parseErr.message);
        }
    } catch (e) {
        console.log('Side: Fetch error', e.message || String(e));
        callback('Error: ' + (e.message || String(e)));
    }
}

function getArrivals(stopId, callback) {
    console.log('Side: getArrivals for stopId', stopId);
    fetchJSON(API_BASE + '/prediction/?checkpoint_id=' + stopId, function(err, data) {
        if (err) { 
            console.log('Side: Prediction error', err);
            callback(err); 
            return; 
        }
        
        console.log('Side: Prediction data:', JSON.stringify(data));
        
        try {
            var objects = data && data.objects ? data.objects : [];
            console.log('Side: Objects count', objects.length);
            
            if (objects.length === 0) {
                callback(null, deflate({ arrivals: [] }));
                return;
            }
            
            var routeIds = [];
            var routeMap = {};
            
            for (var i = 0; i < objects.length; i++) {
                var obj = objects[i];
                if (!obj) continue;
                var routeId = obj.route_id;
                if (routeIds.indexOf(routeId) === -1) {
                    routeIds.push(routeId);
                }
            }
            
            console.log('Side: Unique route IDs', routeIds);
            
            var pending = routeIds.length;
            if (pending === 0) {
                callback(null, deflate({ arrivals: [] }));
                return;
            }
            
            for (var j = 0; j < routeIds.length; j++) {
                (function(rid) {
                    fetchJSON(API_BASE + '/routesforsearch/' + rid + '/', function(rErr, rData) {
                        if (!rErr && rData && rData.name) {
                            console.log('Side: Route', rid, '=', JSON.stringify(rData));
                            routeMap[rid] = rData.name;
                        } else {
                            console.log('Side: Route', rid, 'fetch error or no name', rErr, JSON.stringify(rData));
                        }
                        pending--;
                        if (pending === 0) {
                            console.log('Side: All routes fetched, routeMap:', JSON.stringify(routeMap));
                            var arrivals = [];
                            
                            for (var k = 0; k < objects.length; k++) {
                                var item = objects[k];
                                if (!item) continue;
                                var rId = item.route_id;
                                var orders = item.order || [];
                                for (var m = 0; m < orders.length; m++) {
                                    var order = orders[m];
                                    if (order && order.prediction) {
                                        var planTime = null;
                                        try {
                                            planTime = new Date(order.prediction.departure_plan).getTime();
                                        } catch (e) {}
                                        arrivals.push({
                                            r: routeMap[rId] || String(rId),
                                            t: planTime,
                                            p: order.prediction.precise ? 1 : 0
                                        });
                                    }
                                }
                            }
                            
                            console.log('Side: Total arrivals', arrivals.length, JSON.stringify(arrivals.slice(0, 2)));
                            
                            arrivals.sort(function(a, b) {
                                try { return new Date(a.t) - new Date(b.t); }
                                catch (e) { return 0; }
                            });
                            
                            var compressed = deflate({ arrivals: arrivals });
                            console.log('Side: Sending compressed data');
                            callback(null, compressed);
                        }
                    });
                })(routeIds[j]);
            }
        } catch (e) {
            console.log('Side: Parse error', e);
            callback('Parse error: ' + e.message);
        }
    });
}

AppSideService({
    onInit: function() {
        console.log('Side: onInit');
        try {
            messageBuilder.listen(function() {
                console.log('Side: Listening ready');
            });
            
            messageBuilder.on("request", function(ctx) {
                var method, params;
                try {
                    var jsonRpc = messageBuilder.buf2Json(ctx.request.payload);
                    method = jsonRpc.method;
                    params = jsonRpc.params || {};
                } catch (e) {
                    console.log('Side: Invalid request', e);
                    ctx.response({ data: { error: 'Invalid request' } });
                    return;
                }
                
                console.log('Side: Request:', method, JSON.stringify(params));
                
                if (method === 'GET_ARRIVALS') {
                    getArrivals(params.stopId, function(err, data) {
                        if (err) {
                            console.log('Side: GET_ARRIVALS error', err);
                            ctx.response({ data: { error: err } });
                        } else {
                            console.log('Side: GET_ARRIVALS success, data length', data ? data.length : 0);
                            ctx.response({ data: { result: data } });
                        }
                    });
                } else {
                    console.log('Side: Unknown method', method);
                    ctx.response({ data: { error: 'Unknown: ' + method } });
                }
            });
        } catch (e) {
            console.log('Side: onInit error', e);
        }
    },

    onRun: function() {
        console.log('Side: onRun');
    },

    onDestroy: function() {
        console.log('Side: onDestroy');
    }
});
