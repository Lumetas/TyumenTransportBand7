var AppGesture = class {
    static init() {
        hmApp.registerGestureEvent((e) => {
            return AppGesture._events[e] ? AppGesture._events[e]() : false;
        });
    }

    static on(event, action) {
        this._events[this._evMapping[event]] = action;
    }

    static withYellowWorkaround(event, startReq) {
        let lastSwipe = 0;
        let count = 0;
        AppGesture.on(event, () => {
            if (Date.now() - lastSwipe > 1000)
                count = 1;
            if (count == 3) {
                hmApp.startApp(startReq);
                return;
            }
            count++;
            lastSwipe = Date.now();
            return true;
        });
    }
};
AppGesture._events = {};
AppGesture._evMapping = {
    "up": hmApp.gesture.UP,
    "left": hmApp.gesture.LEFT,
    "right": hmApp.gesture.RIGHT,
    "down": hmApp.gesture.DOWN
};
