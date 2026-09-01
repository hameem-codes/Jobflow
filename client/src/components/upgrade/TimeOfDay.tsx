import { useEffect } from "react";

/**
 * #24 — Time-of-day paper warming.
 * Sets `body[data-tod]` based on local hour. Subtle: only the paper tones shift.
 */
export function TimeOfDay() {
  useEffect(() => {
    const h = new Date().getHours();
    let tod: "morning" | "evening" | "night";
    if (h >= 6 && h < 12) tod = "morning";
    else if (h >= 12 && h < 19) tod = "evening";
    else tod = "night";
    document.body.setAttribute("data-tod", tod);
  }, []);
  return null;
}