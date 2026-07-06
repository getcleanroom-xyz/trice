"use client";

import { useEffect, useRef, useCallback, useState } from "react";

function useVideoTracker({
  subscriberId,
  dayId,
  targetSeconds,
  initialSeconds = 0,
  onComplete,
}: {
  subscriberId: string;
  dayId: string;
  targetSeconds: number;
  initialSeconds?: number;
  onComplete: () => void;
}) {
  const accumulatedRef = useRef(initialSeconds);
  const [completed, setCompleted] = useState(() => initialSeconds >= targetSeconds && targetSeconds > 0);
  const [watchSeconds, setWatchSeconds] = useState(Math.floor(initialSeconds));
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const completedRef = useRef(initialSeconds >= targetSeconds && targetSeconds > 0);
  const syncedRef = useRef(false);

  const save = useCallback((seconds: number) => {
    if (completedRef.current) return;
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscriberId,
        dayId,
        watchSeconds: Math.floor(seconds),
        targetSeconds,
      }),
    }).catch(() => {});
  }, [subscriberId, dayId, targetSeconds]);

  useEffect(() => {
    if (syncedRef.current) return;
    if (initialSeconds > 0) {
      accumulatedRef.current = initialSeconds;
      setWatchSeconds(Math.floor(initialSeconds));
      syncedRef.current = true;
      if (initialSeconds >= targetSeconds && targetSeconds > 0) {
        completedRef.current = true;
        setCompleted(true);
      }
    }
  }, [initialSeconds, targetSeconds]);

  useEffect(() => {
    if (completedRef.current) return;

    const interval = setInterval(() => {
      if (document.hidden) return;

      accumulatedRef.current += 1;
      setWatchSeconds(Math.floor(accumulatedRef.current));

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(accumulatedRef.current), 10000);

      if (targetSeconds > 0 && accumulatedRef.current >= targetSeconds) {
        save(accumulatedRef.current);
        completedRef.current = true;
        setCompleted(true);
        onComplete();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      save(accumulatedRef.current);
    };
  }, [targetSeconds, save, onComplete]);

  return { completed, watchSeconds, targetSeconds };
}

export { useVideoTracker };
