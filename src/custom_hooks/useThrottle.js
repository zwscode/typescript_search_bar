import { useRef, useState, useEffect, useCallback } from "react";

function useThrottle(
    callback,
    wait = 0,
    options = { leading: true, trailing: true }
) {
    const { leading, trailing } = options;

    const [value, setValue] = useState();
    const [delayedCount, setDelayedCount] = useState(0);

    const timeoutRef = useRef(null);
    const lastArgsRef = useRef(null);
    const lastThis = useRef(null);

    const lastInvokeTimeRef = useRef(0);

    const invokeFunc = useCallback(
        (time) => {
            const thisArg = lastThis.current;
            const args = lastArgsRef.current;
            setValue(callback.apply(thisArg, args));
            lastInvokeTimeRef.current = time;
            timeoutRef.current = null;
            lastArgsRef.current = null;
            lastThis.current = null;
        },
        [callback]
    );

    const timeExpired = useCallback(() => {
        if (timeoutRef.current && trailing && lastArgsRef.current) {
            if (!(leading && delayedCount === 0)) {
                invokeFunc(Date.now());
            }
        }
        timeoutRef.current = null;
    }, [trailing, invokeFunc]);

    const startTimer = useCallback(() => {
        if (timeoutRef.current) {
            return;
        }
        setDelayedCount(0);
        timeoutRef.current = setTimeout(timeExpired, wait);
    }, [timeExpired, wait]);

    const throttled = useCallback(
        (...args) => {
            const time = Date.now();
            const isInvoking = timeoutRef.current === null;

            lastArgsRef.current = args;
            lastThis.current = this;

            if (isInvoking) {
                if (leading) {
                    invokeFunc(time);
                }
                startTimer();
            } else {
                setDelayedCount((prev) => prev + 1);
            }
        },
        [startTimer, wait]
    );

    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        lastInvokeTimeRef.current = 0;
        lastArgsRef.current = null;
        lastThis.current = null;
    }, []);

    const flush = useCallback(() => {
        timeExpired();
        return value;
    }, [invokeFunc]);

    useEffect(() => {
        return () => {
            cancel();
        };
    }, [cancel]);

    throttled.cancel = cancel;
    throttled.flush = flush;

    return throttled;
}

export default useThrottle;
