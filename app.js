import "./shared/device-polyfill";
import "./shared/promise";
import * as Config from "./config.js";
import { MessageBuilder } from "./shared/message.js";
import { Compressor } from "./shared/compressor.js";
import { _LOCAL_API } from "./localAPI.js";

var _messageBuilder = null;
var _isReady = false;
var _pendingRequests = [];

function processPending() {
    while (_pendingRequests.length > 0 && _isReady) {
        var req = _pendingRequests.shift();
        req();
    }
}

function apiRequestRemote(method, params, callback) {
    console.log('Remote: START', method, 'ready=', _isReady);
    
    if (!_isReady || !_messageBuilder) {
        console.log('Remote: not ready, queueing');
        _pendingRequests.push(function() {
            apiRequestRemote(method, params, callback);
        });
        return;
    }
    
    try {
        _messageBuilder.requestCb({
            method: method,
            params: params || {}
        }, function(err, result) {
            console.log('Remote: callback err=', err, 'result=', typeof result);
            
            if (typeof callback !== 'function') {
                console.log('Remote: callback not function');
                return;
            }
            
            if (err) {
                console.log('Remote: has error');
                callback(null, { arrivals: [] });
                return;
            }
            
            var data = null;
            if (result && result.data) {
                data = result.data.result !== undefined ? result.data.result : result.data;
            } else {
                data = result;
            }
            
            console.log('Remote: data type=', typeof data, 'preview=', String(data).substring(0, 50));
            
            var arrivals = [];
            
            if (typeof data === 'string' && data.length > 0) {
                console.log('Remote: data is string, decompressing...');
                try {
                    var decompressed = Compressor.decode(data);
                    console.log('Remote: decompressed=', JSON.stringify(decompressed));
                    if (decompressed && decompressed.arrivals) {
                        arrivals = decompressed.arrivals;
                    }
                } catch (e) {
                    console.log('Remote: decompress error', e);
                }
            } else if (data && typeof data === 'object') {
                console.log('Remote: data is object, keys=', Object.keys(data));
                if (data.result && typeof data.result === 'string') {
                    console.log('Remote: data.result is string, decompressing...');
                    try {
                        var decompressed = Compressor.decode(data.result);
                        console.log('Remote: decompressed=', JSON.stringify(decompressed));
                        if (decompressed && decompressed.arrivals) {
                            arrivals = decompressed.arrivals;
                        }
                    } catch (e) {
                        console.log('Remote: decompress data.result error', e);
                    }
                } else if (data.arrivals) {
                    arrivals = data.arrivals;
                } else {
                    console.log('Remote: unknown object format');
                }
            } else {
                console.log('Remote: unknown format, data=', JSON.stringify(data));
            }
            
            callback(null, { arrivals: arrivals });
        });
    } catch (e) {
        console.log('Remote: error', e);
        if (typeof callback === 'function') {
            callback(null, { arrivals: [] });
        }
    }
}

function getLocalArrivals(stopId) {
    console.log('LocalAPI: stopId=', stopId);
    if (typeof _LOCAL_API === 'undefined' || !_LOCAL_API) {
        console.log('LocalAPI: _LOCAL_API not defined');
        return [];
    }
    var stopData = _LOCAL_API[stopId];
    if (!stopData) {
        console.log('LocalAPI: no data for stopId');
        return [];
    }
    console.log('LocalAPI: found stopData, routes=', Object.keys(stopData));
    
    var arrivals = [];
    var now = new Date();
    var localH = now.getHours();
    var localM = now.getMinutes();
    var localS = now.getSeconds();
    var nowSec = localH * 3600 + localM * 60 + localS;
    
    for (var routeName in stopData) {
        var times = stopData[routeName];
        if (!times || !Array.isArray(times)) continue;
        
        for (var i = 0; i < times.length; i++) {
            var time = times[i];
            if (typeof time !== 'string') continue;
            
            var parts = time.split(':');
            if (parts.length < 2) continue;
            
            var h = parseInt(parts[0], 10);
            var m = parseInt(parts[1], 10);
            var s = parts.length > 2 ? parseInt(parts[2], 10) : 0;
            
            var dayOffset = 0;
            var timeSec = h * 3600 + m * 60 + s;
            
            if (timeSec < nowSec - 300) {
                dayOffset = 1;
            }
            
            var arrivalDate = new Date();
            arrivalDate.setDate(arrivalDate.getDate() + dayOffset);
            arrivalDate.setHours(h, m, s, 0);
            
            arrivals.push({
                r: routeName,
                t: arrivalDate.getTime(),
                p: 0
            });
        }
    }
    
    arrivals.sort(function(a, b) {
        return a.t - b.t;
    });
    
    console.log('LocalAPI: total arrivals=', arrivals.length);
    return arrivals;
}

function apiRequestLocal(method, params, callback) {
    if (typeof callback !== 'function') return;
    
    setTimeout(function() {
        var arrivals = [];
        if (method === 'GET_ARRIVALS') {
            var stopId = params && params.stopId ? params.stopId : 0;
            arrivals = getLocalArrivals(stopId);
        }
        callback(null, { arrivals: arrivals });
    }, 100);
}

function generateMockArrivals(stopId) {
    var routes = ['1', '5', '10', '14', '19', '20', '25', '30', '41', '45', '60', '77'];
    var arrivals = [];
    var now = Date.now();
    
    for (var i = 0; i < 10; i++) {
        var route = routes[Math.floor(Math.random() * routes.length)];
        var offsetMinutes = Math.floor(Math.random() * 45) + 1;
        var planTime = now + offsetMinutes * 60000;
        arrivals.push({
            r: route,
            t: planTime,
            p: Math.random() > 0.25 ? 1 : 0
        });
    }
    
    arrivals.sort(function(a, b) {
        return a.t - b.t;
    });
    
    return arrivals;
}

function apiRequestMock(method, params, callback) {
    if (typeof callback !== 'function') return;
    
    setTimeout(function() {
        var arrivals = [];
        if (method === 'GET_ARRIVALS') {
            arrivals = generateMockArrivals(params && params.stopId ? params.stopId : 0);
        }
        callback(null, { arrivals: arrivals });
    }, 300 + Math.random() * 500);
}

function apiRequest(method, params, callback) {
    var mode = Config.API_MODE || 'remote';
    
    if (mode === 'local') {
        apiRequestLocal(method, params, callback);
    } else if (mode === 'mock') {
        apiRequestMock(method, params, callback);
    } else {
        apiRequestRemote(method, params, callback);
    }
}

App({
    globalData: {
        apiRequest: apiRequest,
        isReady: function() { return _isReady; },
        API_MODE: Config.API_MODE
    },
    onCreate: function() {
        try {
            console.log('App onCreate, API_MODE:', Config.API_MODE);
            
            var mode = Config.API_MODE || 'remote';
            
            if (mode === 'local' || mode === 'mock') {
                _isReady = true;
                return;
            }
            
            var appId = 27280;
            if (hmApp && hmApp.packageInfo) {
                try { appId = hmApp.packageInfo().appId; } catch (e) {}
            }
            
            _messageBuilder = new MessageBuilder({ appId: appId });
            
            _messageBuilder.connect(function(mb) {
                console.log('Connected to side');
                _isReady = true;
                processPending();
            });
            
        } catch (e) {
            console.log('Init error:', e);
        }
    },
    onDestroy: function() {
        _pendingRequests = [];
        try {
            if (_messageBuilder) {
                _messageBuilder.disConnect();
            }
        } catch (e) {}
    }
});
