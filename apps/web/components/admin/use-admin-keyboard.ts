"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAdminKeyboard() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.metaKey && !e.ctrlKey) return;
      if (e.key === "n") { e.preventDefault(); router.push("/admin/days/new"); }
      if (e.key === "k") { e.preventDefault(); router.push("/admin"); }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}
