import {Alert} from 'react-native';
import {prepareDisconnectUi} from './disconnectUi';

let lastAlertAt = 0;

/** 全局断开弹窗（Debugger / TabBar 共用，避免重复弹出） */
export function showGlobalDisconnectAlert(
  title: string,
  message: string,
  onOk?: () => void,
): void {
  const now = Date.now();
  if (now - lastAlertAt < 800) {
    return;
  }
  lastAlertAt = now;
  prepareDisconnectUi();
  Alert.alert(title || ' ', message, [
    {
      text: 'OK',
      onPress: onOk,
    },
  ]);
}
