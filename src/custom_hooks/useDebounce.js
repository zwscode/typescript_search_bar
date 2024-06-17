import { useCallback, useEffect, useRef, useState } from "react";

function useDebounce(
    callback,
    wait = 0,
    options = { leading: false, trailing: true, maxWait: null }
) {
    const { leading, trailing, maxWait } = options || {};

    const [value, setValue] = useState();
    const [delayedCount, setDelayedCount] = useState(0);

    const lastArgsRef = useRef();
    const lastThisRef = useRef();
    const lastInvokeTimeRef = useRef(0);

    const maxWaitTimer = useRef(null);
    const timeoutTimer = useRef(null);

    const invokeFunction = useCallback(
        (time) => {
            const args = lastArgsRef.current;
            const thisArg = lastThisRef.current;
            lastArgsRef.current = lastThisRef.current = null;
            lastInvokeTimeRef.current = time;
            setValue(callback.apply(thisArg, args));
        },
        [callback]
    );

    const shouldInvoke = (time) => {
        const timeSinceLastCall = time - lastInvokeTimeRef.current;
        return (
            lastInvokeTimeRef.current === 0 ||
            timeSinceLastCall >= wait ||
            (maxWait && timeSinceLastCall >= maxWait)
        );
    };

    const cancel = () => {
        if (maxWaitTimer.current) {
            clearTimeout(maxWaitTimer.current);
            maxWaitTimer.current = null;
        }
        if (timeoutTimer.current) {
            clearTimeout(timeoutTimer.current);
            timeoutTimer.current = null;
        }
        lastInvokeTimeRef.current = 0;
        lastArgsRef.current = lastThisRef.current = null;
    };

    useEffect(() => {
        return () => {
            cancel();
        };
    }, []);

    const maxWaitExpired = () => {
        const time = Date.now();
        if (shouldInvoke(time)) {
            invokeFunction(time);
        }
        maxWaitTimer.current = null;
    };

    const timerExpired = () => {
        const time = Date.now();
        if (shouldInvoke(time) && trailing) {
            if (!(leading && trailing && delayedCount === 0)) {
                invokeFunction(time);
            }
        }
        timeoutTimer.current = null;
    };

    const startTimer = () => {
        if (timeoutTimer.current) {
            setDelayedCount((count) => count + 1);
            clearTimeout(timeoutTimer.current);
        } else {
            setDelayedCount(0);
        }
        timeoutTimer.current = setTimeout(timerExpired, wait);
    };

    const flush = () => {
        if (timeoutTimer.current && lastArgsRef.current) {
            timerExpired();
        }
        return value;
    };

    const debounced = useCallback(
        (...args) => {
            const time = Date.now();
            const isInvoking = shouldInvoke(time);

            lastArgsRef.current = args;
            lastThisRef.current = this;

            let needStartTimer = false;

            if (isInvoking) {
                if (leading) {
                    if (!timeoutTimer.current) {
                        invokeFunction(time);
                    }
                    needStartTimer = true;
                }

                if (trailing) {
                    needStartTimer = true;
                }

                if (needStartTimer) {
                    startTimer();
                }

                if (maxWait && !leading) {
                    if (!maxWaitTimer.current) {
                        maxWaitTimer.current = setTimeout(
                            maxWaitExpired,
                            maxWait
                        );
                    }
                }
            }

            return value;
        },
        [callback, wait, leading, maxWait, trailing]
    );

    debounced.cancel = cancel;
    debounced.flush = flush;

    return debounced;
}

export default useDebounce;
