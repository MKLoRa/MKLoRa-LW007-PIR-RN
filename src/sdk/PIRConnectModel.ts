/**
 * PIRConnectModel — 连接 + 时间同步（对齐 iOS ConnectModule）
 */

import PIRCentralManager from './PIRCentralManager';
import PIRInterfaceConfig from './PIRInterfaceConfig';
import {ScannedDeviceModel} from './PIRSDKDefines';
import {
  clearConnectedMacAddress,
  getConnectedMacAddress,
  setConnectedMacAddress,
} from '../utils/pirSession';
import {
  clearSyncDataList,
  clearSyncSessionPrefs,
} from '../utils/syncDataStorage';
import {pirDeviceTypeFromScanHex} from '../utils/pirDeviceType';

export interface ConnectOptions {
  deviceId: string;
  password?: string;
  deviceType?: string;
}

class PIRConnectModel {
  private static instance: PIRConnectModel | null = null;
  hasPassword = false;
  /** 对齐 MKPIRConnectModel NSInteger deviceType：0=旧设备，1=新设备 */
  deviceType = 0;
  /** 对齐 iOS TabBar isDebugger：调试模式下断开不自动回扫描页 */
  private debuggerMode = false;
  /** 对齐 mk_pir_startDfuProcessNotification：从 DFU 返回设备信息页不重复读取 */
  private dfuInProgress = false;
  static shared(): PIRConnectModel {
    if (!PIRConnectModel.instance) {
      PIRConnectModel.instance = new PIRConnectModel();
    }
    return PIRConnectModel.instance;
  }

  async connectDevice(
    device: ScannedDeviceModel,
    password: string,
  ): Promise<void> {
    const needPwd = device.needPassword;
    const pwd = needPwd ? password : undefined;
    if (needPwd && (!pwd || pwd.length !== 8)) {
      throw new Error('The password should be 8 characters.');
    }

    const central = PIRCentralManager.shared();
    await central.connectPeripheral(device.id, pwd);
    this.hasPassword = !!needPwd && !!pwd;
    this.deviceType = pirDeviceTypeFromScanHex(device.deviceType ?? '00');

    setConnectedMacAddress(device.macAddress ?? '');

    const synced = await this.configDate();
    if (!synced) {
      clearConnectedMacAddress();
      await central.disconnect();
      throw new Error('Config Date Error');
    }

    // 对齐 MKPIRScanController configParams：新连接成功后清空 sync 缓存
    await clearSyncSessionPrefs();
    await clearSyncDataList();
  }

  setDebuggerMode(enabled: boolean): void {
    this.debuggerMode = enabled;
  }

  isDebuggerMode(): boolean {
    return this.debuggerMode;
  }

  setDfuInProgress(inProgress: boolean): void {
    this.dfuInProgress = inProgress;
  }

  isDfuInProgress(): boolean {
    return this.dfuInProgress;
  }

  /** 对齐 iOS TabBar viewDidDisappear / 返回扫描前断开连接 */
  async disconnectFromDevice(): Promise<void> {
    PIRCentralManager.shared().suppressNextConnectStateAlert();
    await PIRCentralManager.shared().disconnect();
    this.hasPassword = false;
    this.deviceType = 0;
    clearConnectedMacAddress();
  }

  private configDate(): Promise<boolean> {
    const timestamp = Math.floor(Date.now() / 1000);
    return new Promise(resolve => {
      PIRInterfaceConfig.config_device_time(
        timestamp,
        () => resolve(true),
        () => resolve(false),
      );
    });
  }
}

export default PIRConnectModel;
