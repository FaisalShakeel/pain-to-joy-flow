import { useEffect } from "react";
import { unlockAudio } from "@/lib/feedback";

/**
 * Unlocks WebAudio on the first user gesture (required on iOS/Safari).
 * Mounted once near the app root.
 */
const SfxLoader = () => {
  useEffect(() => {
    const onGesture = () => {
      unlockAudio();
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("touchstart", onGesture);
    };
    window.addEventListener("pointerdown", onGesture, { once: false });
    window.addEventListener("keydown", onGesture, { once: false });
    window.addEventListener("touchstart", onGesture, { once: false });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("touchstart", onGesture);
    };
  }, []);
  return null;
};

export default SfxLoader;