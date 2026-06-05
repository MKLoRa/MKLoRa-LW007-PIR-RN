import {useCallback, useEffect, useRef} from 'react';
import {Alert} from 'react-native';
import PIRCentralManager, {
  type TabBarDisconnectListener,
} from '../sdk/PIRCentralManager';
import PIRConnectModel from '../sdk/PIRConnectModel';
import {resetToScan} from '../navigation/navigationRef';
import {
  disconnectAlertForType,
  DISCONNECT_ALERT_BT_UNAVAILABLE,
  DISCONNECT_ALERT_DEVICE_OFF,
} from '../utils/disconnectMessages';
import {prepareDisconnectUi} from '../utils/disconnectUi';

/**
 * 对齐 iOS MKPIRTabBarController：全局监听断开，点确定后一律回扫描页。
 */
export function useTabBarDisconnectAlerts() {
  const disconnectTypeHandled = useRef(false);

  const showAlert = useCallback((title: string, message: string) => {
    prepareDisconnectUi();
    Alert.alert(title || ' ', message, [
      {
        text: 'OK',
        onPress: () => {
          disconnectTypeHandled.current = false;
          // 对齐 iOS TabBar：Debugger 模式断开仅提示，不自动回扫描页
          if (!PIRConnectModel.shared().isDebuggerMode()) {
            void resetToScan();
          }
        },
      },
    ]);
  }, []);

  useEffect(() => {
    const central = PIRCentralManager.shared();
    const listener: TabBarDisconnectListener = {
      onDisconnectType: type => {
        if (PIRConnectModel.shared().isDfuInProgress()) {
          return;
        }
        disconnectTypeHandled.current = true;
        const {title, message} = disconnectAlertForType(type);
        showAlert(title, message);
      },
      onConnectStateChanged: () => {
        if (PIRConnectModel.shared().isDfuInProgress()) {
          return;
        }
        if (disconnectTypeHandled.current) {
          return;
        }
        const {title, message} = DISCONNECT_ALERT_DEVICE_OFF;
        showAlert(title, message);
      },
      onCentralStateChanged: () => {
        if (PIRConnectModel.shared().isDfuInProgress()) {
          return;
        }
        if (disconnectTypeHandled.current) {
          return;
        }
        const {title, message} = DISCONNECT_ALERT_BT_UNAVAILABLE;
        showAlert(title, message);
      },
    };
    central.setTabBarDisconnectListener(listener);
    return () => central.setTabBarDisconnectListener(null);
  }, [showAlert]);
}
