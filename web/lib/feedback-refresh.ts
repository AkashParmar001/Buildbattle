// Tiny pub-sub so drawers can refetch after submit/import/track actions
// without coupling those components to the drawer internals.

const EVENT = "feedback:changed";
const target = new EventTarget();

export function notifyFeedbackChanged(): void {
  target.dispatchEvent(new Event(EVENT));
}

export function onFeedbackChanged(handler: () => void): () => void {
  target.addEventListener(EVENT, handler);
  return () => target.removeEventListener(EVENT, handler);
}
