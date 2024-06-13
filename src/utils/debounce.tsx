type Func = (...args: any[]) => void;

function debounce(func: Func, delay: number): Func {
  let timeoutId: NodeJS.Timeout | null;

  return function(this: any, ...args: any[]) {
    const context = this;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}

export default debounce;