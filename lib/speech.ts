/** Thin, SSR-safe helpers around the Web Speech API for read-aloud. */

export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

export interface SpeakOptions {
  /** 0.1–10; we default slow for a soothing bedtime pace. */
  rate?: number;
  onEnd?: () => void;
}

/**
 * Read the given text aloud, cancelling anything already speaking.
 * Returns the utterance (or null if unsupported) so callers can track it.
 */
export function speak(
  text: string,
  { rate = 0.9, onEnd }: SpeakOptions = {},
): SpeechSynthesisUtterance | null {
  if (!isSpeechSupported()) return null;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 1;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function cancelSpeech(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}
