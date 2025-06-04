import { debounceTime, Subject, startWith } from "rxjs";

export function quadraticEase(
  startValue: number,
  endValue: number,
  durationMs: number = 200,
  easing: "easeIn" | "easeOut" | "easeInOut" = "easeIn",
  onUpdate?: (n: number) => void,
  onComplete?: () => void
) {
  const startTime = performance.now();
  const changeInValue = endValue - startValue;

  const easeFunctions: any = {
    easeIn: (t: number) => t * t,
    easeOut: (t: number) => t * (2 - t),
    easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  };

  const ease = easeFunctions[easing] || easeFunctions.easeIn;

  function animate(currentTime: any) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / durationMs, 1);
    const easedProgress = ease(progress);

    const currentValue = startValue + changeInValue * easedProgress;
    if (onUpdate) onUpdate(currentValue);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else if (onComplete) {
      onComplete();
    }
  }

  requestAnimationFrame(animate);
}

type EaseParams = {
  startValue: number;
  endValue: number;
  easing?: "easeIn" | "easeOut" | "easeInOut";
  onUpdate?: (n: number) => void;
  onComplete?: () => void;
};

export function createDebouncedEase(debounceMs: number = 100) {
  let firstCall = true;
  const subject = new Subject<EaseParams>();

  subject
    .pipe(startWith(null), debounceTime(firstCall ? 0 : debounceMs))
    .subscribe((params) => {
      if (params) {
        quadraticEase(
          params.startValue,
          params.endValue,
          debounceMs,
          params.easing,
          params.onUpdate,
          params.onComplete
        );
      }
      firstCall = false;
    });

  return (params: EaseParams) => {
    subject.next(params);
  };
}

