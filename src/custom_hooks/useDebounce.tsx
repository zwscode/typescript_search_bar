import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number | undefined;
};

function useDebounce<T extends (...args: any[]) => any>(
    callback: T,
    wait: number = 0,
    options: Options = { leading: false, trailing: true, maxWait: undefined }
) {
    const { leading, trailing, maxWait } = options;

    const [value, setValue] = useState<ReturnType<T>>();
    const [delayedCount, setDelayedCount] = useState(0);

    const lastArgsRef = useRef<any[] | null>(null);
    const lastInvokeTimeRef = useRef<number>(0);

    const maxWaitTimer = useRef<NodeJS.Timeout | null>(null);
    const timeoutTimer = useRef<NodeJS.Timeout | null>(null);

    const invokeFunction = useCallback(
        (time: number) => {
            const args = lastArgsRef.current || [];
            lastInvokeTimeRef.current = time;
            console.log("invokeFunction called", args)
            setValue(callback.apply(null, args));
            lastArgsRef.current = null;
            // remove maxWaitTimer
            if (maxWaitTimer.current) {
                clearTimeout(maxWaitTimer.current);
                maxWaitTimer.current = null;
            }
        },
        [callback]
    );

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
        lastArgsRef.current = null;
    };

    useEffect(() => {
        return () => {
            cancel();
        };
    }, []);

    const maxWaitExpired = () => {
        const time = Date.now();
        invokeFunction(time);
        
        maxWaitTimer.current = null;
    };

    const timerExpired = () => {
        const time = Date.now();
        if (trailing) {
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
        (...args: any[]) => {
            const time = Date.now();

            lastArgsRef.current = args;

            let needStartTimer = false;
            
            if (leading) {
                if (!timeoutTimer.current) {
                    invokeFunction(time);
                }
                needStartTimer = true;
            }

            if (maxWait !== undefined && !leading) {
                if (!maxWaitTimer.current) {
                    maxWaitTimer.current = setTimeout(
                        maxWaitExpired,
                        maxWait
                    );
                }
            }

            if (trailing) {
                needStartTimer = true;
            }

            if (needStartTimer) {
                startTimer();
            }

            return value;
        },
        [callback, wait, leading, maxWait, trailing]
    );

    return [debounced, cancel, flush];
}

export default useDebounce;
