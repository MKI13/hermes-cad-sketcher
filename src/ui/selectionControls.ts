type KeyboardLikeEvent = {
  key: string;
  target?: EventTarget | null | { tagName?: string; isContentEditable?: boolean };
};

export function shouldDeleteSelectionFromKey(event: KeyboardLikeEvent): boolean {
  if (event.key !== 'Delete' && event.key !== 'Backspace') return false;
  const target = event.target;
  if (!target || typeof target !== 'object') return true;
  const editable = 'isContentEditable' in target && target.isContentEditable === true;
  const tagName = 'tagName' in target && typeof target.tagName === 'string' ? target.tagName.toUpperCase() : '';
  return !editable && tagName !== 'INPUT' && tagName !== 'TEXTAREA' && tagName !== 'SELECT';
}
