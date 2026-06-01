import { describe, expect, it } from 'vitest';
import { shouldUpdateDynamicCabinetLivePreview } from '../src/ui/dynamicCabinetLivePreview';

describe('dynamic cabinet live preview', () => {
  it('updates the generated cabinet model only when the window is open and live preview is enabled', () => {
    expect(shouldUpdateDynamicCabinetLivePreview({ windowOpen: true, livePreview: true })).toBe(true);
    expect(shouldUpdateDynamicCabinetLivePreview({ windowOpen: false, livePreview: true })).toBe(false);
    expect(shouldUpdateDynamicCabinetLivePreview({ windowOpen: true, livePreview: false })).toBe(false);
  });
});
