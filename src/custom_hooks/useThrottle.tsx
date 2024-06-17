import { useRef, useState, useEffect, useCallback } from "react";

interface ThrottleOptions {
	leading?: boolean;
	trailing?: boolean;
}

function useThrottle<T extends (...args: any[]) => any>(
	callback: T,
	wait = 0,
	options: ThrottleOptions = { leading: false, trailing: true }
	) {
	const { leading, trailing} = options;

	const [value, setValue] = useState<ReturnType<T>>();
	const [delayedCount, setDelayedCount] = useState(0);

	const timeoutRef = useRef<number | null>(null);
	const lastArgsRef = useRef<Parameters<T> | null>(null);

	const invokeFunc = useCallback((time: number) => {
		const args = lastArgsRef.current || [];
		setValue(callback.apply(null, args));
		timeoutRef.current = null;
		lastArgsRef.current = null;
	}, [callback]);

  const timeExpired = useCallback(() => {
	if (timeoutRef.current && trailing && lastArgsRef.current) {
		if (!(leading && delayedCount === 0)) {
			invokeFunc(Date.now());
		}
	}
	timeoutRef.current = null;
	},
	[trailing, leading, delayedCount, invokeFunc]);

  const startTimer = useCallback(() => {
	if (timeoutRef.current !== null) {
		return;
	}
	setDelayedCount(0);
	timeoutRef.current = window.setTimeout(timeExpired, wait);
	}, [timeExpired, wait]);

  const throttled = useCallback(
	(...args: Parameters<T>): ReturnType<T> | undefined => {
	const time = Date.now();

	lastArgsRef.current = args;

	if (timeoutRef.current === null) {
		if (leading) {
		  invokeFunc(time);
		}
		startTimer();
	} else {
		setDelayedCount((prev) => prev + 1);
	}
	return value;}, [callback, wait, leading, trailing, startTimer, invokeFunc]
  );

	const cancel = useCallback(() => {
		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		lastArgsRef.current = null;
	}, []);

	const flush = useCallback(() => {
		timeExpired();
		return value;
	}, [timeExpired]);

	useEffect(() => {
		return () => {
			cancel();
		};
	}, [cancel]);

	return [throttled, cancel, flush];
}

export default useThrottle;

