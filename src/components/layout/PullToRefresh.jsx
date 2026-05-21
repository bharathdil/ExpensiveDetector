import { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 72;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pulling = useRef(false);

  const getScrollTop = () => {
    const scroller = document.querySelector('.mobile-shell');
    return scroller?.scrollTop ?? window.scrollY;
  };

  const onTouchStart = useCallback((e) => {
    if (getScrollTop() <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current || startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      e.preventDefault();
      setPullY(Math.min(delta * 0.45, THRESHOLD + 20));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullY >= THRESHOLD) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      await onRefresh?.();
      setRefreshing(false);
    }
    setPullY(0);
    startY.current = null;
  }, [pullY, onRefresh]);

  const progress = Math.min(pullY / THRESHOLD, 1);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative"
    >
      {/* Indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-card border border-border shadow-md transition-all duration-150"
        style={{
          top: pullY > 4 ? pullY - 44 : -40,
          opacity: progress,
        }}
      >
        <RefreshCw
          className={`w-4 h-4 text-primary ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: `rotate(${progress * 360}deg)` }}
        />
      </div>
      <div style={{ transform: `translateY(${pullY}px)`, transition: pullY === 0 ? 'transform 0.3s ease' : 'none' }}>
        {children}
      </div>
    </div>
  );
}
