const version = -9;
import "./shared/device-polyfill";
import "./shared/promise";
import { MessageBuilder } from "./shared/message";

var _messageBuilder = null;
var _isReady = false;
var _pendingRequests = [];

function getMessageBuilder() {
    return _messageBuilder;
}

function isReady() {
    return _isReady;
}

function apiRequest(method, params, callback) {
    if (!_isReady || !_messageBuilder) {
        setTimeout(function() {
            callback({ error: 'Not ready' }, null);
        }, 100);
        return;
    }
    
    try {
        _messageBuilder.requestCb({
            method: method,
            params: params || {}
        }, function(err, result) {
            if (err) {
                callback({ error: String(err) }, null);
                return;
            }
            try {
                var data = null;
                if (result && result.data) {
                    data = result.data.result !== undefined ? result.data.result : result.data;
                } else {
                    data = result;
                }
                callback(null, data);
            } catch (e) {
                callback({ error: 'Parse: ' + String(e) }, null);
            }
        });
    } catch (e) {
        callback({ error: String(e) }, null);
    }
}

App({
    _VERSIONL: version,
    globalData: {
        apiRequest: apiRequest,
        isReady: isReady
    },
    onCreate: function() {
        try {
            console.log('App onCreate');
            
            var appId = 27280;
            if (hmApp && hmApp.packageInfo) {
                try {
                    appId = hmApp.packageInfo().appId;
                } catch (e) {}
            }
            
            _messageBuilder = new MessageBuilder({ appId: appId });
            
            _messageBuilder.connect(function(mb) {
                console.log('Connected to side');
                _isReady = true;
            });
            
        } catch (e) {
            console.log('Init error:', e);
        }
    },
    onDestroy: function() {
        try {
            if (_messageBuilder) {
                _messageBuilder.disConnect();
            }
        } catch (e) {}
    }
});
