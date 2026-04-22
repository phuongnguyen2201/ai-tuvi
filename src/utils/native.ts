// Native helpers — no-op stubs for web preview.
// On web there is no Capacitor bridge, so haptic calls silently resolve.

export async function hapticImpact(_style?: "light" | "medium" | "heavy"): Promise<void> {
  // Optional: vibrate API fallback
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate?.(10);
    } catch {
      /* ignore */
    }
  }
}

export async function hapticSuccess(): Promise<void> {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate?.([10, 30, 10]);
    } catch {
      /* ignore */
    }
  }
}