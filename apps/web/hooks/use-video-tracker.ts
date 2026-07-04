"use client";

import { useEffect, useRef, useCallback, useState } from "react";

function useVideoTracker({
  subscriberId,
  dayId,
  targetSeconds,
  onComplete,
}: {
  subscriberId: string;
  dayId: string;
  targetSeconds: number;
  onComplete: () => void;
}) {
  const accumulatedRef = useRef(0);
  const [completed, setCompleted] = useState(false);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const completedRef = useRef(false);

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
    const interval = setInterval(() => {
      if (document.hidden) return;

      accumulatedRef.current += 1;
      setWatchSeconds(Math.floor(accumulatedRef.current));

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(accumulatedRef.current), 10000);

      if (!completedRef.current && accumulatedRef.current >= targetSeconds) {
        completedRef.current = true;
        setCompleted(true);
        save(accumulatedRef.current);
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
