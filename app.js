import "./shared/device-polyfill";
import "./shared/promise";
import * as Config from "./config.js";
import { MessageBuilder } from "./shared/message.js";
import { Compressor } from "./shared/compressor.js";

var _messageBuilder = null;
var _isReady = false;
var _pendingRequests = [];

function processPending() {
    while (_pendingRequests.length > 0 && _isReady) {
        var req = _pendingRequests.shift();
        req();
    }
}

function apiRequestReal(method, params, callback) {
    console.log('apiRequestReal', method, 'ready=', _isReady);
    
    if (!_isReady || !_messageBuilder) {
        console.log('apiRequestReal: not ready, queueing');
        _pendingRequests.push(function() {
            apiRequestReal(method, params, callback);
        });
        return;
    }
    
    try {
        _messageBuilder.requestCb({
            method: method,
            params: params || {}
        }, function(err, result) {
            try {
                if (typeof callback !== 'function') return;
                
                if (err) {
                    console.log('apiRequestReal: error', err);
                    callback(null, { arrivals: [] });
                    return;
                }
                
                var data = null;
                if (result && result.data) {
                    data = result.data.result !== undefined ? result.data.result : result.data;
                } else {
                    data = result;
                }
                
                console.log('apiRequestReal: data=', JSON.stringify(data));
                
                var arrivals = [];
                
                if (typeof data === 'string' && data.length > 0) {
                    console.log('apiRequestReal: decompressing string...');
                    try {
                        var decompressed = Compressor.decode(data);
                        if (decompressed && decompressed.arrivals) {
                            arrivals = decompressed.arrivals;
                            console.log('apiRequestReal: decompressed arrivals=', arrivals.length);
                        }
                    } catch (e) {
                        console.log('apiRequestReal: decompress error', e);
                    }
                } else if (typeof data === 'object' && data !== null) {
                    console.log('apiRequestReal: data is object, keys=', Object.keys(data));
                    if (data.arrivals) {
                        arrivals = data.arrivals;
                        console.log('apiRequestReal: found arrivals in data.arrivals');
                    } else if (data.result) {
                        console.log('apiRequestReal: data.result type=', typeof data.result);
                        if (typeof data.result === 'string' && data.result.length > 0) {
                            try {
                                var decompressed = Compressor.decode(data.result);
                                if (decompressed && decompressed.arrivals) {
                                    arrivals = decompressed.arrivals;
                                    console.log('apiRequestReal: decompressed from data.result');
                                }
                            } catch (e) {
                                console.log('apiRequestReal: decompress data.result error', e);
                            }
                        }
                    }
                }
                
                console.log('apiRequestReal: FINAL arrivals count=', arrivals.length);
                
                if (typeof callback === 'function') {
                    callback(null, { arrivals: arrivals });
                }
            } catch (e) {
                console.log('apiRequestReal: callback error', e);
            }
        });
    } catch (e) {
        console.log('apiRequestReal: error', e);
        try {
            if (typeof callback === 'function') {
                callback(null, { arrivals: [] });
            }
        } catch (err) {}
    }
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
        return new Date(a.t) - new Date(b.t);
    });
    
    return arrivals;
}

function apiRequestMock(method, params, callback) {
    if (typeof callback !== 'function') return;
    
    setTimeout(function() {
        try {
            var arrivals = [];
            if (method === 'GET_ARRIVALS') {
                arrivals = generateMockArrivals(params && params.stopId ? params.stopId : 0);
            }
            if (typeof callback === 'function') {
                callback(null, { arrivals: arrivals });
            }
        } catch (e) {}
    }, 300 + Math.random() * 500);
}

function apiRequest(method, params, callback) {
    if (Config.USE_MOCK_API) {
        apiRequestMock(method, params, callback);
    } else {
        apiRequestReal(method, params, callback);
    }
}

App({
    globalData: {
        apiRequest: apiRequest,
        isReady: function() { return _isReady; },
        USE_MOCK_API: Config.USE_MOCK_API
    },
    onCreate: function() {
        try {
            console.log('App onCreate, MOCK_API:', Config.USE_MOCK_API);
            
            if (Config.USE_MOCK_API) {
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
