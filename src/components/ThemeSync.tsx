import { useEffect } from "react";
import { useStore } from "@/lib/store";

export function ThemeSync() {
  const dark = useStore((s) => s.dark);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return null;
}
