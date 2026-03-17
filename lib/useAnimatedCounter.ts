import { useState, useEffect, useRef } from 'react';

/**
 * useAnimatedCounter
 * Animates a number from 0 to the target value with easing.
 * Usage: const value = useAnimatedCounter(1234.56, { duration: 800 });
 */
export function useAnimatedCounter(
    target: number,
    options?: { duration?: number; decimals?: number }
): number {
    const { duration = 600, decimals = 0 } = options || {};
    const [current, setCurrent] = useState(0);
    const frameRef = useRef<number>(0);
    const startRef = useRef<number>(0);
    const prevTarget = useRef<number>(0);

    useEffect(() => {
        const from = prevTarget.current;
        prevTarget.current = target;
        startRef.current = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startRef.current;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = from + (target - from) * eased;
            setCurrent(Number(value.toFixed(decimals)));

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            }
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, [target, duration, decimals]);

    return current;
}
