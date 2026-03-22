const version = -9;
import "./shared/device-polyfill";
import "./shared/promise";
import { MessageBuilder } from "./shared/message";

var _messageBuilder = null;
var _isReady = false;
var _requestId = 0;

function apiRequest(method, params, callback) {
    console.log('Device: apiRequest START', method, JSON.stringify(params));
    
    if (typeof callback !== 'function') {
        console.log('Device: apiRequest ERROR - callback not a function');
        return;
    }
    
    if (!_isReady || !_messageBuilder) {
        console.log('Device: apiRequest - not ready');
        setTimeout(function() {
            try {
                callback({ error: 'Not ready' }, null);
            } catch (e) {
                console.log('Device: apiRequest retry callback error', e);
            }
        }, 100);
        return;
    }
    
    var reqId = ++_requestId;
    console.log('Device: apiRequest reqId', reqId);
    
    try {
        _messageBuilder.requestCb({
            method: method,
            params: params || {}
        }, function(err, result) {
            console.log('Device: apiRequest resp reqId', reqId, 'err:', JSON.stringify(err), 'hasResult:', !!result);
            
            try {
                if (err) {
                    callback({ error: String(err) }, null);
                    return;
                }
                
                try {
                    var data = null;
                    console.log('Device: result type:', typeof result, JSON.stringify(result));
                    if (result && result.data) {
                        console.log('Device: result.data:', JSON.stringify(result.data));
                        console.log('Device: result.data.result:', result.data.result);
                        if (result.data.result !== undefined) {
                            data = result.data.result;
                        } else {
                            data = result.data;
                        }
                    } else {
                        data = result;
                    }
                    console.log('Device: final data type:', typeof data, 'isString:', typeof data === 'string');
                    console.log('Device: final data:', JSON.stringify(data));
                    callback(null, data);
                } catch (e) {
                    console.log('Device: apiRequest resp parse error', e);
                    callback({ error: 'Parse: ' + String(e) }, null);
                }
            } catch (e) {
                console.log('Device: apiRequest resp callback error', e);
            }
        });
        
    } catch (e) {
        console.log('Device: apiRequest send error', e);
        try {
            callback({ error: String(e) }, null);
        } catch (err) {}
    }
}

App({
    _VERSIONL: version,
    globalData: {
        apiRequest: apiRequest,
        isReady: function() { return _isReady; }
    },
    onCreate: function() {
        try {
            console.log('Device: App onCreate');
            
            var appId = 27280;
            if (hmApp && hmApp.packageInfo) {
                try {
                    appId = hmApp.packageInfo().appId;
                } catch (e) {}
            }
            console.log('Device: appId', appId);
            
            _messageBuilder = new MessageBuilder({ appId: appId });
            console.log('Device: MessageBuilder created');
            
            _messageBuilder.on('raw', function(data) {
                console.log('Device: RAW data len', data ? (data.byteLength || data.length) : 0);
            });
            
            _messageBuilder.on('message', function(data) {
                console.log('Device: MESSAGE len', data ? (data.byteLength || data.length) : 0);
            });
            
            _messageBuilder.on('response', function(data) {
                console.log('Device: RESPONSE');
            });
            
            _messageBuilder.on('error', function(e) {
                console.log('Device: MessageBuilder ERROR', e);
            });
            
            _messageBuilder.connect(function(mb) {
                console.log('Device: Connected to side');
                _isReady = true;
            });
            
        } catch (e) {
            console.log('Device: Init error', e);
        }
    },
    onDestroy: function() {
        try {
            console.log('Device: App onDestroy');
            if (_messageBuilder) {
                _messageBuilder.disConnect();
            }
        } catch (e) {}
    }
});
