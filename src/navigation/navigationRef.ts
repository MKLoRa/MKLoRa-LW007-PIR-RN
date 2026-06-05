import {
  CommonActions,
  StackActions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import PIRCentralManager from '../sdk/PIRCentralManager';
import PIRConnectModel from '../sdk/PIRConnectModel';
import {store} from '../store';
import {setConnectedDevice} from '../store/deviceSlice';
import type {RootStackParamList} from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** 断开 BLE、清理会话并 pop 回扫描页（对齐 AE/AD/MP：从右往左 dismiss，非 push 新 Scan） */
export async function resetToScan(): Promise<void> {
  const central = PIRCentralManager.shared();
  central.stopScan();
  central.suppressNextConnectStateAlert();
  PIRConnectModel.shared().setDebuggerMode(false);
  store.dispatch(setConnectedDevice(null));
  central.clearDisconnectTypeNotified();
  if (navigationRef.isReady()) {
    const state = navigationRef.getRootState();
    const scanIsRoot =
      state.routes.length > 0 && state.routes[0].name === 'Scan';
    if (scanIsRoot && state.index > 0) {
      navigationRef.dispatch(StackActions.popToTop());
    } else {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'Scan'}],
        }),
      );
    }
  }
  await PIRConnectModel.shared().disconnectFromDevice();
}
