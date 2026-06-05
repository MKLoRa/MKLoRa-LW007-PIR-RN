/**
 * PIRCentralManager — BLE 中心管理（对齐 PIRCentralManager.m）
 */

import {
  BleManager,
  Device,
  Characteristic,
  Subscription,
  State,
} from 'react-native-ble-plx';
import {PermissionsAndroid, Platform} from 'react-native';
import {
  binaryByHex,
  getDecimalWithHex,
  getDecimalStringWithHex,
  hexStringFromData,
  signedHexTurnString,
  stringToData,
} from '../utils/BleHexUtils';
import {
  CentralConnectStatus,
  CentralManagerStatus,
  PROTOCOL,
  ScannedDeviceModel,
} from './PIRSDKDefines';
import {TaskOperationID} from './TaskOperationID';
import {
  parseReadDataWithCharacteristic,
  type TaskParseResult,
} from './PIRTaskAdopter';
import {buildPasswordCommand} from './protocol/CommandBuilder';
import {base64ToBytes, bytesToBase64, utf8Decode} from '../utils/base64';
import {
  extractPirDeviceTypeHex,
  extractPirManufacturerBytes,
  getPirScanServiceFilter,
  parsePirScanDevice,
} from '../utils/pirScanAdvertisement';

export const NOTIFICATIONS = {
  connectStateChanged: 'mk_pir_peripheralConnectStateChangedNotification',
  centralStateChanged: 'mk_pir_centralManagerStateChangedNotification',
  deviceDisconnectType: 'mk_pir_deviceDisconnectTypeNotification',
} as const;

export type SdkResponse = {msg: string; code: string; result: unknown};

type SuccessCallback = (data: SdkResponse) => void;
type FailedCallback = (error: Error) => void;

interface PendingOperation {
  operationID: TaskOperationID;
  successBlock?: SuccessCallback;
  failureBlock?: FailedCallback;
  packetChunks?: Uint8Array[];
  commandBlock?: () => Promise<void>;
  /** ee 分包配置：先按序写入多帧（间隔 50ms），再等待最终 notify */
  chunkedWrites?: string[];
}

export interface ScanDelegate {
  mk_pir_receiveDevice?: (device: ScannedDeviceModel) => void;
  mk_pir_startScan?: () => void;
  mk_pir_stopScan?: () => void;
}

export interface LogDelegate {
  mk_pir_receiveLog?: (log: string) => void;
}

export interface StorageDataDelegate {
  mk_pir_receiveStorageData?: (content: string) => void;
}

export interface PirSensorListener {
  onPirStatus?: (detected: boolean) => void;
  onDoorSensor?: (data: {open: boolean; times: string}) => void;
  onTHSensor?: (data: {temperature: string; humidity: string}) => void;
}

/** TabBar 层断开通知（对齐 MKPIRTabBarController addNotifications） */
export interface TabBarDisconnectListener {
  onDisconnectType?: (type: string) => void;
  onConnectStateChanged?: () => void;
  onCentralStateChanged?: () => void;
}

function getFullUUID(short: string): string {
  return `0000${short}-0000-1000-8000-00805f9b34fb`.toUpperCase();
}

function normalizeUuid(uuid: string): string {
  return uuid.replace(/-/g, '').toUpperCase();
}

function shortUuid(uuid: string): string {
  const n = normalizeUuid(uuid);
  return n.length >= 8 ? n.substring(4, 8) : n;
}

/** LW007-PIR 配置应答 CMD → TaskOperationID */
const CONFIG_CMD_TO_TASK: Partial<Record<string, TaskOperationID>> = {
  '01': TaskOperationID.mk_pir_taskConfigRegionOperation,
  '02': TaskOperationID.mk_pir_taskConfigModemOperation,
  '03': TaskOperationID.mk_pir_taskConfigDEVEUIOperation,
  '04': TaskOperationID.mk_pir_taskConfigAPPEUIOperation,
  '05': TaskOperationID.mk_pir_taskConfigAPPKEYOperation,
  '06': TaskOperationID.mk_pir_taskConfigDEVADDROperation,
  '07': TaskOperationID.mk_pir_taskConfigAPPSKEYOperation,
  '08': TaskOperationID.mk_pir_taskConfigNWKSKEYOperation,
  '09': TaskOperationID.mk_pir_taskConfigMessageTypeOperation,
  '0a': TaskOperationID.mk_pir_taskConfigMaxRetransmissionTimesOperation,
  '0b': TaskOperationID.mk_pir_taskConfigCHValueOperation,
  '0c': TaskOperationID.mk_pir_taskConfigDutyCycleStatusOperation,
  '0d': TaskOperationID.mk_pir_taskConfigUplinkStrategyOperation,
  '0e': TaskOperationID.mk_pir_taskConfigBeaconModeStatusOperation,
  '0f': TaskOperationID.mk_pir_taskConfigMaxRetransmissionTimesOperation,
  '10': TaskOperationID.mk_pir_taskConfigTimeSyncIntervalOperation,
  '11': TaskOperationID.mk_pir_taskConfigNetworkCheckIntervalOperation,
  '12': TaskOperationID.mk_pir_taskConfigEU868SingleChannelStatusOperation,
  '20': TaskOperationID.mk_pir_taskConfigBeaconModeStatusOperation,
  '21': TaskOperationID.mk_pir_taskConfigAdvIntervalOperation,
  '22': TaskOperationID.mk_pir_taskConfigConnectableStatusOperation,
  '23': TaskOperationID.mk_pir_taskConfigBroadcastTimeoutOperation,
  '24': TaskOperationID.mk_pir_taskConfigNeedPasswordOperation,
  '25': TaskOperationID.mk_pir_taskConfigTxPowerOperation,
  '26': TaskOperationID.mk_pir_taskConfigDeviceNameOperation,
  '30': TaskOperationID.mk_pir_taskConfigPIRFunctionStatusOperation,
  '31': TaskOperationID.mk_pir_taskConfigPIRReportIntervalOperation,
  '32': TaskOperationID.mk_pir_taskConfigPIRSensitivityOperation,
  '33': TaskOperationID.mk_pir_taskConfigPIRDelayTimeOperation,
  '34': TaskOperationID.mk_pir_taskConfigDoorSensorSwitchStatusOperation,
  '35': TaskOperationID.mk_pir_taskConfigHTSwitchStatusOperation,
  '36': TaskOperationID.mk_pir_taskConfigHTSampleRateOperation,
  '37': TaskOperationID.mk_pir_taskConfigTempThresholdAlarmStatusOperation,
  '38': TaskOperationID.mk_pir_taskConfigTempThresholdOperation,
  '3a': TaskOperationID.mk_pir_taskConfigTempChangeAlarmStatusOperation,
  '3b': TaskOperationID.mk_pir_taskConfigTempChangeAlarmDurationConditionOperation,
  '3c': TaskOperationID.mk_pir_taskConfigTempChangeAlarmChangeValueThresholdOperation,
  '3d': TaskOperationID.mk_pir_taskConfigRHThresholdAlarmStatusOperation,
  '3e': TaskOperationID.mk_pir_taskConfigRHThresholdOperation,
  '40': TaskOperationID.mk_pir_taskConfigRHChangeAlarmStatusOperation,
  '41': TaskOperationID.mk_pir_taskConfigRHChangeAlarmDurationConditionOperation,
  '42': TaskOperationID.mk_pir_taskConfigRHChangeAlarmChangeValueThresholdOperation,
  '44': TaskOperationID.mk_pir_taskConfigPasswordOperation,
  '4e': TaskOperationID.mk_pir_taskConfigTimeZoneOperation,
  '50': TaskOperationID.mk_pir_taskRestartDeviceOperation,
  '51': TaskOperationID.mk_pir_taskFactoryResetOperation,
  '52': TaskOperationID.mk_pir_taskPowerOffOperation,
  '53': TaskOperationID.mk_pir_taskConfigDeviceTimeOperation,
  '5f': TaskOperationID.mk_pir_taskBatteryResetOperation,
};

export type BleTaskChannel = 'params' | 'control';

class PIRCentralManager {
  private static instance: PIRCentralManager | null = null;
  private manager = new BleManager();
  private connectedDevice: Device | null = null;
  private subscriptions: Subscription[] = [];
  private deviceDisconnectedSub: Subscription | null = null;
  private passwordChar: Characteristic | null = null;
  /** AA05 设备配置参数 */
  private paramsChar: Characteristic | null = null;
  /** AA06 设备状态/控制 */
  private controlChar: Characteristic | null = null;
  private disconnectChar: Characteristic | null = null;
  private pirNotifyChar: Characteristic | null = null;
  private doorNotifyChar: Characteristic | null = null;
  private thNotifyChar: Characteristic | null = null;
  private logChar: Characteristic | null = null;
  private pirNotifySub: Subscription | null = null;
  private doorNotifySub: Subscription | null = null;
  private thNotifySub: Subscription | null = null;
  private logSubscription: Subscription | null = null;
  private storageSubscription: Subscription | null = null;
  private operationQueue: PendingOperation[] = [];
  private currentOperation: PendingOperation | null = null;
  private operationTimer: ReturnType<typeof setInterval> | null = null;
  private receiveTimerCount = 0;
  /** 当前任务是否已收到应答（防止 notify 早于 write 完成时提前启动下一任务） */
  private opFinished = false;
  private opWaitResolve: (() => void) | null = null;
  private opWaitReject: ((e: Error) => void) | null = null;
  private bleState: State = State.Unknown;
  private passwordResolve: ((ok: boolean) => void) | null = null;
  private isScanning = false;
  /** iOS 部分广播包 manufacturer 为空，缓存最近一次有效 content */
  private scanContentCache = new Map<string, string>();

  connectStatus: CentralConnectStatus = CentralConnectStatus.Unknown;
  delegate?: ScanDelegate;
  logDelegate?: LogDelegate;
  storageDataDelegate?: StorageDataDelegate;
  /** 对齐 iOS notifyLogData：为 false 时不向上层派发日志 */
  private logNotifyEnabled = false;
  private storageNotifyEnabled = false;
  disconnectTypeCallback?: (type: string) => void;
  /** 连接状态变化（断开时 Debugger 等页保存日志） */
  connectStateCallback?: () => void;
  sensorListener?: PirSensorListener;
  private tabBarDisconnectListener: TabBarDisconnectListener | null = null;
  private disconnectTypeNotified = false;
  private suppressConnectStateAlert = false;
  private suppressDisconnectAlertsForDfu = false;

  constructor() {
    this.attachBleStateListener();
  }

  private attachBleStateListener(): void {
    this.manager.onStateChange(state => {
      const prev = this.bleState;
      this.bleState = state;
      // 仅连接中由 PoweredOn 变为不可用才提示（避免启动时 Unknown/Resetting 误弹窗）
      if (
        prev === State.PoweredOn &&
        state !== State.PoweredOn &&
        this.connectStatus === CentralConnectStatus.Connected
      ) {
        this.tabBarDisconnectListener?.onCentralStateChanged?.();
      }
    }, true);
  }

  setTabBarDisconnectListener(listener: TabBarDisconnectListener | null): void {
    this.tabBarDisconnectListener = listener;
  }

  suppressNextConnectStateAlert(): void {
    this.suppressConnectStateAlert = true;
  }

  prepareForDfuTeardown(): void {
    this.suppressDisconnectAlertsForDfu = true;
    this.suppressNextConnectStateAlert();
  }

  /**
   * Android DFU 前释放 ble-plx（对齐原生：先断连再交给 Nordic 独占 GATT）。
   * cancelConnection 不足以释放控制器上的连接句柄，必须 destroy BleManager。
   */
  async teardownBleForDfu(): Promise<void> {
    this.prepareForDfuTeardown();
    this.stopScan();
    await this.disconnect();
    for (const sub of this.subscriptions) {
      sub.remove();
    }
    this.subscriptions = [];
    this.deviceDisconnectedSub = null;
    this.passwordChar = null;
    this.paramsChar = null;
    this.controlChar = null;
    this.disconnectChar = null;
    try {
      await this.manager.destroy();
    } catch {
      /* ignore */
    }
    this.manager = new BleManager();
    this.attachBleStateListener();
  }

  /** Android：Nordic DFU 启动前释放 ble-plx GATT，避免 GATT CONN TIMEOUT / MTU 冲突 */
  async disconnectForDfu(): Promise<void> {
    await this.teardownBleForDfu();
  }

  clearDisconnectTypeNotified(): void {
    this.disconnectTypeNotified = false;
  }

  private notifyDisconnectType(type: string): void {
    this.disconnectTypeNotified = true;
    this.disconnectTypeCallback?.(type);
    this.tabBarDisconnectListener?.onDisconnectType?.(type);
  }

  private notifyConnectStateChangedIfNeeded(): void {
    if (this.suppressDisconnectAlertsForDfu) {
      this.suppressDisconnectAlertsForDfu = false;
      this.suppressConnectStateAlert = false;
      return;
    }
    if (this.suppressConnectStateAlert || this.disconnectTypeNotified) {
      this.suppressConnectStateAlert = false;
      return;
    }
    this.tabBarDisconnectListener?.onConnectStateChanged?.();
    this.connectStateCallback?.();
    this.suppressConnectStateAlert = false;
  }

  private attachDeviceDisconnectMonitor(device: Device): void {
    this.deviceDisconnectedSub?.remove();
    this.deviceDisconnectedSub = device.onDisconnected(() => {
      void this.handleUnexpectedDisconnect();
    });
  }

  private clearConnectionResources(): void {
    this.stopReceiveTimer();
    const disconnectErr = new Error('Device disconnected');
    const activeOp = this.currentOperation;
    const queuedOps = this.operationQueue.splice(0);
    if (activeOp) {
      activeOp.failureBlock?.(disconnectErr);
    }
    for (const op of queuedOps) {
      op.failureBlock?.(disconnectErr);
    }
    this.opFinished = true;
    this.opWaitReject?.(disconnectErr);
    this.opWaitResolve = null;
    this.opWaitReject = null;
    this.deviceDisconnectedSub?.remove();
    this.deviceDisconnectedSub = null;
    this.subscriptions.forEach(s => s.remove());
    this.subscriptions = [];
    this.currentOperation = null;
    this.passwordResolve = null;
    this.connectedDevice = null;
    this.passwordChar = null;
    this.paramsChar = null;
    this.controlChar = null;
    this.disconnectChar = null;
    this.pirNotifyChar = null;
    this.doorNotifyChar = null;
    this.thNotifyChar = null;
    this.logChar = null;
    this.pirNotifySub?.remove();
    this.pirNotifySub = null;
    this.doorNotifySub?.remove();
    this.doorNotifySub = null;
    this.thNotifySub?.remove();
    this.thNotifySub = null;
    this.logSubscription?.remove();
    this.logSubscription = null;
    this.logNotifyEnabled = false;
    this.storageSubscription?.remove();
    this.storageSubscription = null;
    this.storageNotifyEnabled = false;
    this.connectStatus = CentralConnectStatus.Disconnect;
  }

  private async handleUnexpectedDisconnect(): Promise<void> {
    if (this.connectStatus === CentralConnectStatus.Disconnect) {
      return;
    }
    const shouldNotify =
      this.connectStatus === CentralConnectStatus.Connected;
    this.clearConnectionResources();
    if (shouldNotify) {
      this.notifyConnectStateChangedIfNeeded();
    }
  }

  static shared(): PIRCentralManager {
    if (!PIRCentralManager.instance) {
      PIRCentralManager.instance = new PIRCentralManager();
    }
    return PIRCentralManager.instance;
  }

  static sharedDealloc(): void {
    const inst = PIRCentralManager.instance;
    if (!inst) {
      return;
    }
    PIRCentralManager.instance = null;
    if (Platform.OS === 'android') {
      void inst.teardownBleForDfu();
      return;
    }
    inst.prepareForDfuTeardown();
    inst.stopScan();
    void inst.disconnect();
  }

  centralStatus(): CentralManagerStatus {
    return this.bleState === State.PoweredOn
      ? CentralManagerStatus.Enable
      : CentralManagerStatus.Disable;
  }

  getPeripheral(): Device | null {
    return this.connectedDevice;
  }

  isReadyToCommunicate(): boolean {
    return (
      this.connectStatus === CentralConnectStatus.Connected &&
      this.connectedDevice !== null &&
      this.paramsChar !== null &&
      this.controlChar !== null
    );
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return Object.values(granted).every(
      v => v === PermissionsAndroid.RESULTS.GRANTED,
    );
  }

  /** 等待蓝牙就绪（参考 MKBXPBDBleManager.state / onStateChange） */
  async ensureBluetoothReady(): Promise<boolean> {
    const current = await this.manager.state();
    this.bleState = current;
    if (current === State.PoweredOn) {
      return true;
    }
    if (Platform.OS === 'android') {
      try {
        await this.manager.enable();
      } catch {
        /* ignore */
      }
    }
    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        sub.remove();
        resolve(false);
      }, 12000);
      const sub = this.manager.onStateChange(state => {
        this.bleState = state;
        if (state === State.PoweredOn) {
          clearTimeout(timeout);
          sub.remove();
          resolve(true);
        }
      }, true);
    });
  }

  async startScan(): Promise<void> {
    const permitted = await this.requestPermissions();
    if (!permitted) {
      return;
    }
    const ready = await this.ensureBluetoothReady();
    if (!ready) {
      return;
    }
    if (this.isScanning) {
      this.manager.stopDeviceScan();
    }
    this.isScanning = true;
    this.delegate?.mk_pir_startScan?.();

    // 对齐 MKPIRCentralManager.m startScan → scanForPeripheralsWithServices:AA05
    const serviceFilter = getPirScanServiceFilter();

    this.manager.startDeviceScan(
      serviceFilter,
      {allowDuplicates: true},
      (error, device) => {
        if (error || !device) {
          return;
        }
        const model = this.parseAdvertisement(device);
        if (model) {
          this.delegate?.mk_pir_receiveDevice?.(model);
        }
      },
    );
  }

  stopScan(): void {
    if (!this.isScanning) {
      return;
    }
    this.isScanning = false;
    this.scanContentCache.clear();
    this.manager.stopDeviceScan();
    this.delegate?.mk_pir_stopScan?.();
  }

  private formatMacFromHex(macHex: string): string {
    const pairs: string[] = [];
    for (let i = 0; i < 12; i += 2) {
      pairs.push(macHex.substring(i, i + 2));
    }
    return pairs.join(':');
  }

  private parseAdvertisement(device: Device): ScannedDeviceModel | null {
    const rssi = device.rssi;
    if (rssi == null || rssi === 127) {
      return null;
    }
    let mfg = extractPirManufacturerBytes(device);
    if (mfg) {
      this.scanContentCache.set(device.id, hexStringFromData(mfg));
    } else {
      const cached = this.scanContentCache.get(device.id);
      if (cached) {
        const bytes = new Uint8Array(cached.length / 2);
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = parseInt(cached.substring(i * 2, i * 2 + 2), 16);
        }
        mfg = bytes;
      }
    }
    if (!mfg) {
      return null;
    }
    return parsePirScanDevice(
      device,
      rssi,
      mfg,
      extractPirDeviceTypeHex(device),
    );
  }

  async connectPeripheral(deviceId: string, password?: string): Promise<Device> {
    this.suppressNextConnectStateAlert();
    this.stopScan();
    try {
      this.connectStatus = CentralConnectStatus.Connecting;
      if (this.connectedDevice?.id !== deviceId) {
        await this.disconnect();
      }
      this.connectedDevice = await this.manager.connectToDevice(deviceId, {
        timeout: 15000,
      });
      await this.connectedDevice.discoverAllServicesAndCharacteristics();
      await this.setupCharacteristics();

      if (password && password.length === 8) {
        const ok = await this.sendPassword(password);
        if (!ok) {
          throw new Error('Password Error');
        }
      }

      this.connectStatus = CentralConnectStatus.Connected;
      this.clearDisconnectTypeNotified();
      this.attachDeviceDisconnectMonitor(this.connectedDevice);
      return this.connectedDevice;
    } catch (e) {
      this.connectStatus = CentralConnectStatus.ConnectedFailed;
      await this.disconnect();
      throw e instanceof Error ? e : new Error(String(e));
    }
  }

  private async setupCharacteristics(): Promise<void> {
    if (!this.connectedDevice) {
      return;
    }
    this.passwordChar = null;
    this.paramsChar = null;
    this.controlChar = null;
    this.disconnectChar = null;
    this.pirNotifyChar = null;
    this.doorNotifyChar = null;
    this.thNotifyChar = null;
    this.logChar = null;

    const services = await this.connectedDevice.services();
    for (const service of services) {
      const chars = await service.characteristics();
      for (const char of chars) {
        const short = shortUuid(char.uuid);
        if (short === PROTOCOL.CHAR_PASSWORD) {
          this.passwordChar = char;
          if (char.isNotifiable) {
            const sub = char.monitor((err, c) => {
              if (!err && c?.value) {
                this.onCharacteristicNotify(short, base64ToBytes(c.value));
              }
            });
            this.subscriptions.push(sub);
          }
        } else if (short === PROTOCOL.CHAR_PARAMS) {
          this.paramsChar = char;
          if (char.isNotifiable) {
            const sub = char.monitor((err, c) => {
              if (!err && c?.value) {
                this.onCharacteristicNotify(short, base64ToBytes(c.value));
              }
            });
            this.subscriptions.push(sub);
          }
        } else if (short === PROTOCOL.CHAR_CONTROL) {
          this.controlChar = char;
          if (char.isNotifiable) {
            const sub = char.monitor((err, c) => {
              if (!err && c?.value) {
                this.onCharacteristicNotify(short, base64ToBytes(c.value));
              }
            });
            this.subscriptions.push(sub);
          }
        } else if (short === PROTOCOL.CHAR_DISCONNECT) {
          this.disconnectChar = char;
          if (char.isNotifiable) {
            const sub = char.monitor((err, c) => {
              if (!err && c?.value) {
                this.onCharacteristicNotify(short, base64ToBytes(c.value));
              }
            });
            this.subscriptions.push(sub);
          }
        } else if (short === PROTOCOL.CHAR_PIR_NOTIFY) {
          this.pirNotifyChar = char;
        } else if (short === PROTOCOL.CHAR_DOOR_NOTIFY) {
          this.doorNotifyChar = char;
        } else if (short === PROTOCOL.CHAR_TH_NOTIFY) {
          this.thNotifyChar = char;
        } else if (short === PROTOCOL.CHAR_LOG) {
          this.logChar = char;
        }
      }
    }

    if (!this.paramsChar || !this.controlChar) {
      throw new Error('AA05/AA06 characteristics not found');
    }
  }

  private onCharacteristicNotify(shortUuid: string, data: Uint8Array): void {
    if (shortUuid === PROTOCOL.CHAR_DISCONNECT) {
      const hex = hexStringFromData(data);
      if (hex.length >= 12) {
        const type = hex.substring(10, 12);
        this.notifyDisconnectType(type);
      }
      return;
    }

    if (shortUuid === PROTOCOL.CHAR_PIR_NOTIFY) {
      const hex = hexStringFromData(data);
      if (hex.length >= 10) {
        const detected = hex.substring(8, 10) === '01';
        this.sensorListener?.onPirStatus?.(detected);
      }
      return;
    }

    if (shortUuid === PROTOCOL.CHAR_DOOR_NOTIFY) {
      const hex = hexStringFromData(data);
      if (hex.length >= 14) {
        const open = hex.substring(8, 10) === '01';
        const times = getDecimalStringWithHex(hex, 10, 4);
        this.sensorListener?.onDoorSensor?.({open, times});
      }
      return;
    }

    if (shortUuid === PROTOCOL.CHAR_TH_NOTIFY) {
      const hex = hexStringFromData(data);
      if (hex.length >= 16) {
        const temp = getDecimalWithHex(hex, 8, 4);
        const rh = getDecimalWithHex(hex, 12, 4);
        this.sensorListener?.onTHSensor?.({
          temperature: `${(temp * 0.1 - 30).toFixed(1)}`,
          humidity: `${(rh * 0.1).toFixed(1)}`,
        });
      }
      return;
    }

    const parsed = parseReadDataWithCharacteristic(shortUuid, data);
    if (!('operationID' in parsed)) {
      return;
    }

    const operationID = this.resolveNotifyOperationId(parsed, data);

    if (operationID === TaskOperationID.mk_pir_connectPasswordOperation) {
      const state = parsed.result.state as string | undefined;
      const ok = state === '01';
      if (this.passwordResolve) {
        this.passwordResolve(ok);
        this.passwordResolve = null;
      }
      return;
    }

    this.dataParserReceivedData(operationID, parsed.result);
  }

  /** 配置应答若 parser 未识别 cmd，用 1 字节 CMD 映射当前任务 */
  private resolveNotifyOperationId(
    parsed: TaskParseResult,
    data: Uint8Array,
  ): TaskOperationID {
    if (!('operationID' in parsed)) {
      return TaskOperationID.mk_pir_defaultTaskOperationID;
    }
    let opId = parsed.operationID;
    if (
      opId !== TaskOperationID.mk_pir_defaultTaskOperationID ||
      !this.currentOperation ||
      !('success' in parsed.result)
    ) {
      return opId;
    }
    const hex = hexStringFromData(data);
    if (hex.length < 6 || !hex.startsWith('ed')) {
      return opId;
    }
    const cmd = hex.substring(4, 6);
    const expected = CONFIG_CMD_TO_TASK[cmd];
    if (expected === this.currentOperation.operationID) {
      return expected;
    }
    return opId;
  }

  private dataParserReceivedData(
    operationID: TaskOperationID,
    returnData: Record<string, unknown>,
  ): void {
    if (!this.currentOperation || this.currentOperation.operationID !== operationID) {
      return;
    }
    this.receiveTimerCount = 0;
    this.completeOperation(null, returnData);
  }

  private async sendPassword(password: string): Promise<boolean> {
    const char = this.passwordChar;
    if (!char) {
      throw new Error('Password characteristic not found');
    }
    const cmd = buildPasswordCommand(password);
    const bytes = stringToData(cmd);

    return new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.passwordResolve = null;
        reject(new Error('Password verification timeout'));
      }, 5000);

      this.passwordResolve = ok => {
        clearTimeout(timeout);
        resolve(ok);
      };

      const write = char.isWritableWithResponse
        ? char.writeWithResponse(bytesToBase64(bytes))
        : char.writeWithoutResponse(bytesToBase64(bytes));

      write.catch(err => {
        clearTimeout(timeout);
        this.passwordResolve = null;
        reject(err);
      });
    });
  }

  addTaskWithTaskID(
    operationID: TaskOperationID,
    commandData: string,
    successBlock?: SuccessCallback,
    failureBlock?: FailedCallback,
    channel: BleTaskChannel = 'params',
  ): void {
    if (!this.isReadyToCommunicate()) {
      failureBlock?.(new Error('The current connection device is in disconnect'));
      return;
    }
    if (!commandData) {
      failureBlock?.(new Error('The data sent to the device cannot be empty'));
      return;
    }
    const char = channel === 'control' ? this.controlChar : this.paramsChar;
    if (!char) {
      failureBlock?.(new Error('Characteristic error'));
      return;
    }
    const op: PendingOperation = {
      operationID,
      successBlock,
      failureBlock,
      commandBlock: async () => {
        const bytes = stringToData(commandData);
        if (char.isWritableWithResponse) {
          await char.writeWithResponse(bytesToBase64(bytes));
        } else {
          await char.writeWithoutResponse(bytesToBase64(bytes));
        }
      },
    };
    this.enqueueOperation(op);
  }

  /** 分包配置：连发 chunkedWrites 后等待最终 notify 应答 */
  addChunkedConfigTask(
    operationID: TaskOperationID,
    chunkedWrites: string[],
    successBlock?: SuccessCallback,
    failureBlock?: FailedCallback,
  ): void {
    if (!this.isReadyToCommunicate()) {
      failureBlock?.(new Error('The current connection device is in disconnect'));
      return;
    }
    if (!chunkedWrites.length || !this.paramsChar) {
      failureBlock?.(new Error('Characteristic error'));
      return;
    }
    const op: PendingOperation = {
      operationID,
      successBlock,
      failureBlock,
      chunkedWrites,
      commandBlock: async () => {
        /* 数据已在 preflight 写入，此处只等待 notify */
      },
    };
    this.enqueueOperation(op);
  }

  private async writeCommandHex(
    commandData: string,
    channel: BleTaskChannel = 'params',
  ): Promise<void> {
    const char = channel === 'control' ? this.controlChar : this.paramsChar;
    if (!char) {
      throw new Error('Characteristic error');
    }
    const bytes = stringToData(commandData);
    if (char.isWritableWithResponse) {
      await char.writeWithResponse(bytesToBase64(bytes));
    } else {
      await char.writeWithoutResponse(bytesToBase64(bytes));
    }
  }

  addReadTaskWithTaskID(
    operationID: TaskOperationID,
    characteristicUuid: string,
    successBlock?: SuccessCallback,
    failureBlock?: FailedCallback,
  ): void {
    if (!this.connectedDevice) {
      failureBlock?.(new Error('Device disconnected'));
      return;
    }
    const op: PendingOperation = {
      operationID,
      successBlock,
      failureBlock,
      commandBlock: async () => {
        const target = characteristicUuid.toUpperCase();
        const services = await this.connectedDevice!.services();
        for (const s of services) {
          const chars = await s.characteristics();
          for (const c of chars) {
            if (normalizeUuid(c.uuid).includes(target)) {
              const data = await c.read();
              if (data?.value) {
                this.onCharacteristicNotify(shortUuid(c.uuid), base64ToBytes(data.value));
              }
              return;
            }
          }
        }
        throw new Error('Characteristic not found');
      },
    };
    this.enqueueOperation(op);
  }

  private enqueueOperation(op: PendingOperation): void {
    this.operationQueue.push(op);
    if (!this.currentOperation) {
      this.runNextOperation();
    }
  }

  private async runNextOperation(): Promise<void> {
    const op = this.operationQueue.shift();
    if (!op) {
      return;
    }
    this.currentOperation = op;
    this.opFinished = false;
    this.opWaitResolve = null;
    this.opWaitReject = null;
    this.receiveTimerCount = 0;
    this.startReceiveTimer();
    try {
      if (op.chunkedWrites?.length) {
        for (let i = 0; i < op.chunkedWrites.length; i++) {
          await this.writeCommandHex(op.chunkedWrites[i]);
          if (i < op.chunkedWrites.length - 1) {
            await new Promise<void>(r => setTimeout(r, 50));
          }
        }
      } else if (op.commandBlock) {
        await op.commandBlock();
      }
      if (!this.opFinished) {
        await new Promise<void>((resolve, reject) => {
          this.opWaitResolve = resolve;
          this.opWaitReject = reject;
        });
      }
    } catch (e) {
      if (!this.opFinished) {
        this.finishCurrentOperation(e as Error, null);
      }
    } finally {
      this.opWaitResolve = null;
      this.opWaitReject = null;
      this.runNextIfQueued();
    }
  }

  private startReceiveTimer(): void {
    this.stopReceiveTimer();
    this.operationTimer = setInterval(() => {
      this.receiveTimerCount += 1;
      if (this.receiveTimerCount >= 50) {
        this.completeOperation(new Error('Communication timeout'), null);
      }
    }, 100);
  }

  private stopReceiveTimer(): void {
    if (this.operationTimer) {
      clearInterval(this.operationTimer);
      this.operationTimer = null;
    }
  }

  private completeOperation(error: Error | null, returnData: unknown): void {
    this.finishCurrentOperation(error, returnData);
  }

  /** 结束当前 BLE 任务；下一任务仅在 runNextOperation 的 finally 中启动（对齐 iOS NSOperation 串行） */
  private finishCurrentOperation(error: Error | null, returnData: unknown): void {
    if (this.opFinished) {
      return;
    }
    this.opFinished = true;
    this.stopReceiveTimer();
    const op = this.currentOperation;
    this.currentOperation = null;
    if (!op) {
      this.opWaitReject?.(error ?? new Error('Request data error'));
      return;
    }
    if (error) {
      op.failureBlock?.(error);
      this.opWaitReject?.(error);
    } else if (returnData !== null && returnData !== undefined) {
      op.successBlock?.({msg: 'success', code: '1', result: returnData});
      this.opWaitResolve?.();
    } else {
      const reqErr = new Error('Request data error');
      op.failureBlock?.(reqErr);
      this.opWaitReject?.(reqErr);
    }
  }

  private runNextIfQueued(): void {
    if (this.operationQueue.length > 0 && !this.currentOperation) {
      this.runNextOperation();
    }
  }

  async disconnect(): Promise<void> {
    const wasConnected =
      this.connectStatus === CentralConnectStatus.Connected;
    if (this.connectedDevice) {
      try {
        await this.manager.cancelDeviceConnection(this.connectedDevice.id);
      } catch {
        /* ignore */
      }
    }
    this.clearConnectionResources();
    if (wasConnected) {
      this.notifyConnectStateChangedIfNeeded();
    } else {
      this.suppressConnectStateAlert = false;
    }
  }

  /** 对齐 MKPIRCentralManager notifyLogData（AA07 UTF-8 日志） */
  notifyLogData(enable: boolean): boolean {
    if (
      this.connectStatus !== CentralConnectStatus.Connected ||
      !this.logChar
    ) {
      return false;
    }
    this.logNotifyEnabled = enable;
    if (enable) {
      if (!this.logSubscription) {
        this.logSubscription = this.logChar.monitor((err, c) => {
          if (!err && c?.value && this.logNotifyEnabled) {
            const text = utf8Decode(base64ToBytes(c.value));
            if (text) {
              this.logDelegate?.mk_pir_receiveLog?.(text);
            }
          }
        });
      }
    } else {
      this.logSubscription?.remove();
      this.logSubscription = null;
    }
    return true;
  }

  notifyStorageData(_enable: boolean): boolean {
    return false;
  }

  /** 对齐 MKPIRCentralManager notifyPirSensorData */
  notifyPirSensorData(enable: boolean): boolean {
    if (
      this.connectStatus !== CentralConnectStatus.Connected ||
      !this.pirNotifyChar
    ) {
      return false;
    }
    if (enable) {
      if (!this.pirNotifySub) {
        this.pirNotifySub = this.pirNotifyChar.monitor((err, c) => {
          if (!err && c?.value) {
            this.onCharacteristicNotify(
              PROTOCOL.CHAR_PIR_NOTIFY,
              base64ToBytes(c.value),
            );
          }
        });
      }
    } else {
      this.pirNotifySub?.remove();
      this.pirNotifySub = null;
    }
    return true;
  }

  notifyDoorSensorData(enable: boolean): boolean {
    if (
      this.connectStatus !== CentralConnectStatus.Connected ||
      !this.doorNotifyChar
    ) {
      return false;
    }
    if (enable) {
      if (!this.doorNotifySub) {
        this.doorNotifySub = this.doorNotifyChar.monitor((err, c) => {
          if (!err && c?.value) {
            this.onCharacteristicNotify(
              PROTOCOL.CHAR_DOOR_NOTIFY,
              base64ToBytes(c.value),
            );
          }
        });
      }
    } else {
      this.doorNotifySub?.remove();
      this.doorNotifySub = null;
    }
    return true;
  }

  notifyTHSensorData(enable: boolean): boolean {
    if (
      this.connectStatus !== CentralConnectStatus.Connected ||
      !this.thNotifyChar
    ) {
      return false;
    }
    if (enable) {
      if (!this.thNotifySub) {
        this.thNotifySub = this.thNotifyChar.monitor((err, c) => {
          if (!err && c?.value) {
            this.onCharacteristicNotify(
              PROTOCOL.CHAR_TH_NOTIFY,
              base64ToBytes(c.value),
            );
          }
        });
      }
    } else {
      this.thNotifySub?.remove();
      this.thNotifySub = null;
    }
    return true;
  }
}

export default PIRCentralManager;
