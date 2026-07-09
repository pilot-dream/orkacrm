import { useCallback, useRef, useState } from 'react';

interface UseLongPressOptions {
  shouldPreventDefault?: boolean;
  delay?: number;
}

export const useLongPress = (
  onLongPress: (e: React.MouseEvent | React.TouchEvent) => void,
  onClick: () => void,
  { shouldPreventDefault = true, delay = 600 }: UseLongPressOptions = {}
) => {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const target = useRef<EventTarget | null>(null);

  const start = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (shouldPreventDefault && event.target) {
        event.target.addEventListener('touchend', preventDefault, {
          passive: false
        });
        target.current = event.target;
      }
      timeout.current = setTimeout(() => {
        if (navigator.vibrate) {
          navigator.vibrate(50); // Haptic feedback
        }
        onLongPress(event);
        setLongPressTriggered(true);
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const clear = useCallback(
    (shouldTriggerClick = true) => {
      timeout.current && clearTimeout(timeout.current);
      shouldTriggerClick && !longPressTriggered && onClick();
      setLongPressTriggered(false);
      if (shouldPreventDefault && target.current) {
        target.current.removeEventListener('touchend', preventDefault);
      }
    },
    [onClick, longPressTriggered, shouldPreventDefault]
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: () => clear(),
    onMouseLeave: () => clear(false),
    onTouchEnd: () => clear(),
    onTouchMove: () => clear(false) // Cancel long press if user scrolls
  };
};

const isTouchEvent = (event: Event): event is TouchEvent => {
  return 'touches' in event;
};

const preventDefault = (event: Event) => {
  if (!isTouchEvent(event)) return;
  
  if (event.touches.length < 2 && event.preventDefault) {
    event.preventDefault();
  }
};
