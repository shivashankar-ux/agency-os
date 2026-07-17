"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
  resistance?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
  resistance = 2.5,
}: PullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);

  const startY = useRef(0);
  const currentY = useRef(0);
  const elementRef = useRef<HTMLElement>(null);
  const animationFrame = useRef<number>(0);

  const triggerHaptic = useCallback((type: "light" | "medium" | "heavy" = "light") => {
    if ("vibrate" in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30],
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshing) return;
    
    const scrollTop = elementRef.current?.scrollTop || 0;
    if (scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const delta = currentY.current - startY.current;
    
    if (delta <= 0) {
      setIsPulling(false);
      return;
    }

    e.preventDefault();
    
    const distance = Math.min(delta / resistance, maxPull);
    setPullDistance(distance);
    setShowIndicator(distance > threshold * 0.5);
  }, [isPulling, isRefreshing, maxPull, resistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || isRefreshing) return;

    const distance = pullDistance;
    setIsPulling(false);
    setShowIndicator(false);
    setPullDistance(0);

    if (distance >= threshold) {
      triggerHaptic("medium");
      setIsRefreshing(true);
      
      try {
        await onRefresh();
        triggerHaptic("light");
      } catch (error) {
        triggerHaptic("heavy");
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [isPulling, isRefreshing, pullDistance, threshold, onRefresh, triggerHaptic]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    ref: elementRef,
    isPulling,
    pullDistance,
    isRefreshing,
    showIndicator,
    progress: Math.min(pullDistance / threshold, 1),
    triggerHaptic,
  };
}

export function useHapticFeedback() {
  const trigger = useCallback((type: "light" | "medium" | "heavy" | "selection" = "light") => {
    if (!("vibrate" in navigator)) return;

    const patterns = {
      light: [5],
      medium: [10],
      heavy: [20, 10, 20],
      selection: [1],
    };

    navigator.vibrate(patterns[type]);
  }, []);

  return { trigger };
}

// Wrapper component for easy use
export function PullToRefreshWrapper({
  children,
  onRefresh,
  ...options
}: PullToRefreshOptions & { children: React.ReactNode }) {
  const { ref, isPulling, pullDistance, isRefreshing, showIndicator, progress } = usePullToRefresh({ onRefresh, ...options });
  const divRef = ref as React.RefObject<HTMLDivElement>;

  return (
    <div ref={divRef} className="relative overflow-y-auto -webkit-overflow-scrolling-touch h-full">
      {showIndicator && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center h-16 pointer-events-none z-10"
          style={{ transform: `translateY(${Math.max(0, pullDistance - 60)}px)` }}
        >
          <div className="relative">
            <div
              className="w-8 h-8 border-2 border-indigo-500 rounded-full border-t-transparent animate-spin"
              style={{ opacity: progress }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-indigo-400" style={{ opacity: progress }}>
                {progress >= 1 ? "Release" : "Pull to refresh"}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-8 h-8 border-2 border-indigo-500 rounded-full border-t-transparent animate-spin" />
        </div>
      )}

      <div className="pt-16">{children}</div>
    </div>
  );
}
