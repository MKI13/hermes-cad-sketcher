export type DynamicCabinetLivePreviewState = {
  windowOpen: boolean;
  livePreview: boolean;
};

export function shouldUpdateDynamicCabinetLivePreview(state: DynamicCabinetLivePreviewState): boolean {
  return state.windowOpen && state.livePreview;
}
