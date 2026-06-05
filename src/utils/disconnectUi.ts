/** 断开弹窗前关闭页面内 Picker/Modal（对齐 iOS mk_customUIModule_dismissPickView） */
type Listener = () => void;
const listeners = new Set<Listener>();

export function onDisconnectUiPrepare(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function prepareDisconnectUi(): void {
  listeners.forEach(listener => listener());
}
