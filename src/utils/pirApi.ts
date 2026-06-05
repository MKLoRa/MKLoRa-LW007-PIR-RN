/**
 * LW007-PIR BLE 读/写辅助（LoRa 连接、应用参数、BLE 设置）
 */
import PIRInterface from '../sdk/PIRInterface';
import PIRInterfaceConfig from '../sdk/PIRInterfaceConfig';
import PIRCentralManager from '../sdk/PIRCentralManager';
import {LoRaWanMessageType, LoRaWanModem} from '../sdk/PIRSDKDefines';
import {
  type ConnectionSettingsState,
  DEFAULT_CONNECTION_SETTINGS,
  SAVE_VALIDATION_MSG,
  clampDeviceRegion,
  deviceModemToUiModel,
  showCHSection,
  showDutySection,
  showJoinSection,
  uiModemToDeviceModem,
  validateConnectionSettings,
} from './connectionSettingsModel';

export type {ConnectionSettingsState} from './connectionSettingsModel';

type ReadFn = (
  suc?: (data: {result: Record<string, unknown>}) => void,
  failed?: (e: Error) => void,
) => void;

type ConfigFn = (suc?: () => void, failed?: (e: Error) => void) => void;

let bleReadChain: Promise<unknown> = Promise.resolve();

function enqueueBleRead<T>(fn: () => Promise<T>): Promise<T> {
  const run = () => bleReadChain.then(fn, fn);
  const result = run();
  bleReadChain = result.catch(() => undefined);
  return result;
}

export function readPromise(fn: ReadFn): Promise<Record<string, unknown>> {
  return enqueueBleRead(
    () =>
      new Promise((resolve, reject) => {
        fn(
          data => {
            const payload = data as {result?: Record<string, unknown>} | undefined;
            if (payload?.result != null) {
              resolve(payload.result);
              return;
            }
            reject(new Error('Request data error'));
          },
          err => reject(err),
        );
      }),
  );
}

export function configPromise(fn: ConfigFn): Promise<void> {
  return enqueueBleRead(
    () =>
      new Promise((resolve, reject) => {
        fn(
          () => resolve(),
          err => reject(err),
        );
      }),
  );
}

export async function waitForBleIdle(): Promise<void> {
  await bleReadChain;
}

export async function waitForBleReady(timeoutMs = 5000): Promise<boolean> {
  const central = PIRCentralManager.shared();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (central.isReadyToCommunicate()) {
      return true;
    }
    await new Promise<void>(r => setTimeout(r, 80));
  }
  return central.isReadyToCommunicate();
}

/** PIR 协议读命令封装 */
export const pirRead = {
  lorawanModem: () => readPromise(PIRInterface.read_lorawan_modem as ReadFn),
  lorawanRegion: () => readPromise(PIRInterface.read_lorawan_region as ReadFn),
  lorawanNetworkStatus: () =>
    readPromise(PIRInterface.read_lorawan_network_status as ReadFn),
  lorawanDevTimeSyncInterval: () =>
    readPromise(PIRInterface.read_lorawan_time_sync_interval as ReadFn),
  lorawanNetworkCheckInterval: () =>
    readPromise(PIRInterface.read_lorawan_network_check_interval as ReadFn),
  lorawanDEVEUI: () => readPromise(PIRInterface.read_lorawan_deveui as ReadFn),
  lorawanAPPEUI: () => readPromise(PIRInterface.read_lorawan_appeui as ReadFn),
  lorawanAPPKEY: () => readPromise(PIRInterface.read_lorawan_appkey as ReadFn),
  lorawanDEVADDR: () =>
    readPromise(PIRInterface.read_lorawan_devaddr as ReadFn),
  lorawanAPPSKEY: () =>
    readPromise(PIRInterface.read_lorawan_appskey as ReadFn),
  lorawanNWKSKEY: () =>
    readPromise(PIRInterface.read_lorawan_nwkskey as ReadFn),
  lorawanCH: () => readPromise(PIRInterface.read_lorawan_ch as ReadFn),
  lorawanDR: () => readPromise(PIRInterface.read_lorawan_dr as ReadFn),
  lorawanUplinkStrategy: () =>
    readPromise(PIRInterface.read_lorawan_uplink_strategy as ReadFn),
  lorawanDutyCycleStatus: () =>
    readPromise(PIRInterface.read_lorawan_duty_cycle_status as ReadFn),
  lorawanMessageType: () =>
    readPromise(PIRInterface.read_lorawan_message_type as ReadFn),
  lorawanMaxRetransmissionTimes: () =>
    readPromise(PIRInterface.read_lorawan_max_retransmission_times as ReadFn),
  deviceName: () => readPromise(PIRInterface.read_device_name as ReadFn),
  advInterval: () => readPromise(PIRInterface.read_adv_interval as ReadFn),
  deviceConnectable: () =>
    readPromise(PIRInterface.read_device_connectable as ReadFn),
  connectationNeedPassword: () =>
    readPromise(PIRInterface.read_connectation_need_password as ReadFn),
  txPower: () => readPromise(PIRInterface.read_tx_power as ReadFn),
};

/** PIR 协议写命令封装 */
export const pirConfig = {
  modem: (modem: LoRaWanModem) =>
    configPromise((s, f) => PIRInterfaceConfig.config_modem(modem, s, f)),
  region: (region: number) =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_region(clampDeviceRegion(region), s, f),
    ),
  devEUI: (v: string) =>
    configPromise((s, f) => PIRInterfaceConfig.config_deveui(v, s, f)),
  appEUI: (v: string) =>
    configPromise((s, f) => PIRInterfaceConfig.config_appeui(v, s, f)),
  appKey: (v: string) =>
    configPromise((s, f) => PIRInterfaceConfig.config_appkey(v, s, f)),
  devAddr: (v: string) =>
    configPromise((s, f) => PIRInterfaceConfig.config_devaddr(v, s, f)),
  appSkey: (v: string) =>
    configPromise((s, f) => PIRInterfaceConfig.config_appskey(v, s, f)),
  nwkSkey: (v: string) =>
    configPromise((s, f) => PIRInterfaceConfig.config_nwkskey(v, s, f)),
  ch: (chl: number, chh: number) =>
    configPromise((s, f) => PIRInterfaceConfig.config_chl(chl, chh, s, f)),
  dr: (dr: number) =>
    configPromise((s, f) => PIRInterfaceConfig.config_dr(dr, s, f)),
  uplinkStrategy: (isOn: boolean, drl: number, drh: number) =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_uplink_strategy(isOn, drl, drh, s, f),
    ),
  dutyCycle: (isOn: boolean) =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_duty_cycle_status(isOn, s, f),
    ),
  restartDevice: () =>
    configPromise((s, f) => PIRInterfaceConfig.restart_device(s, f)),
  messageType: (type: number) =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_message_type(
        type === 1 ? LoRaWanMessageType.Confirm : LoRaWanMessageType.Unconfirm,
        s,
        f,
      ),
    ),
  maxRetransmission: (deviceTimes: number) =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_lorawan_max_retransmission_times(
        deviceTimes,
        s,
        f,
      ),
    ),
  lorawanDevTimeSyncInterval: (interval: number) =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_time_sync_interval(interval, s, f),
    ),
  lorawanNetworkCheckInterval: (interval: number) =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_lorawan_network_check_interval(interval, s, f),
    ),
};

function strField(res: Record<string, unknown>, key: string): string {
  const v = res[key];
  return v != null ? String(v) : '';
}

function numField(res: Record<string, unknown>, key: string): number {
  return Number(res[key] ?? 0);
}

function boolField(res: Record<string, unknown>, key: string): boolean {
  const v = res[key];
  if (typeof v === 'boolean') {
    return v;
  }
  return Number(v) === 1;
}

async function readStep(
  msg: string,
  read: () => Promise<Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  try {
    return await read();
  } catch (e) {
    const detail = apiErrorMessage(e);
    throw new Error(detail === 'Operation failed' ? msg : `${msg}: ${detail}`);
  }
}

/** 对齐 MKPIRLoRaSettingModel（PIR 固定 Class A，不读不写 classType） */
export async function readConnectionSettings(): Promise<ConnectionSettingsState> {
  await waitForBleIdle();
  const base: ConnectionSettingsState = {...DEFAULT_CONNECTION_SETTINGS};

  const modemRes = await readStep('Read Modem Error', pirRead.lorawanModem);
  base.modem = deviceModemToUiModel(numField(modemRes, 'modem') || 1);

  const regionRes = await readStep('Read Region Error', pirRead.lorawanRegion);
  base.region = clampDeviceRegion(numField(regionRes, 'region'));

  base.devEUI = strField(
    await readStep('Read DevEUI Error', pirRead.lorawanDEVEUI),
    'devEUI',
  );
  base.appEUI = strField(
    await readStep('Read AppEUI Error', pirRead.lorawanAPPEUI),
    'appEUI',
  );
  base.appKey = strField(
    await readStep('Read AppKey Error', pirRead.lorawanAPPKEY),
    'appKey',
  );
  base.devAddr = strField(
    await readStep('Read DevAddr Error', pirRead.lorawanDEVADDR),
    'devAddr',
  );
  base.appSKey = strField(
    await readStep('Read AppSKEY Error', pirRead.lorawanAPPSKEY),
    'appSkey',
  );
  base.nwkSKey = strField(
    await readStep('Read NWKSKEY Error', pirRead.lorawanNWKSKEY),
    'nwkSkey',
  );

  const msgRes = await readStep(
    'Read Message Type Error',
    pirRead.lorawanMessageType,
  );
  base.messageType = numField(msgRes, 'messageType');
  base.classType = 0;

  const retransRes = await readStep(
    'Read Max retransmission times Error',
    pirRead.lorawanMaxRetransmissionTimes,
  );
  const deviceRetrans = numField(retransRes, 'number');
  base.maxRetransmission = Math.max(
    0,
    Math.min(7, deviceRetrans > 0 ? deviceRetrans - 1 : 0),
  );

  if (!base.needAdvanceSetting) {
    return base;
  }

  if (showCHSection(base.region)) {
    const ch = await readStep('Read CH Error', pirRead.lorawanCH);
    base.CHL = numField(ch, 'CHL');
    base.CHH = numField(ch, 'CHH');
  }
  if (showDutySection(base.region)) {
    const duty = await readStep(
      'Read Duty Cycle Error',
      pirRead.lorawanDutyCycleStatus,
    );
    base.dutyIsOn = boolField(duty, 'isOn');
  }
  if (showJoinSection(base.region)) {
    const dr = await readStep('Read Dr For Join Error', pirRead.lorawanDR);
    base.join = numField(dr, 'DR');
  }
  const uplink = await readStep(
    'Read Uplink  Strategy Error',
    pirRead.lorawanUplinkStrategy,
  );
  base.adrIsOn = boolField(uplink, 'isOn');
  base.DRL = numField(uplink, 'DRL');
  base.DRH = numField(uplink, 'DRH');

  return base;
}

export async function configConnectionSettings(
  state: ConnectionSettingsState,
): Promise<void> {
  if (!validateConnectionSettings(state)) {
    throw new Error(SAVE_VALIDATION_MSG);
  }

  const bleStepDelay = () => new Promise<void>(r => setTimeout(r, 120));

  const run = async (msg: string, fn: () => Promise<void>) => {
    try {
      await fn();
      await bleStepDelay();
    } catch (e) {
      const detail = apiErrorMessage(e);
      throw new Error(
        detail === 'Operation failed' || detail === msg
          ? msg
          : `${msg}: ${detail}`,
      );
    }
  };

  await run('Config Modem Error', () =>
    pirConfig.modem(uiModemToDeviceModem(state.modem)),
  );
  await run('Config Region Error', () => pirConfig.region(state.region));
  await run('Config DevEUI Error', () => pirConfig.devEUI(state.devEUI));
  await run('Config AppEUI Error', () => pirConfig.appEUI(state.appEUI));

  if (state.modem === 1) {
    await run('Config DevAddr Error', () => pirConfig.devAddr(state.devAddr));
    await run('Config AppSKEY Error', () => pirConfig.appSkey(state.appSKey));
    await run('Config NWKSKEY Error', () => pirConfig.nwkSkey(state.nwkSKey));
  } else {
    await run('Config AppKey Error', () => pirConfig.appKey(state.appKey));
  }

  await run('Config Message Type Error', () =>
    pirConfig.messageType(state.messageType),
  );

  if (!state.needAdvanceSetting) {
    await run('Connect network error', () => pirConfig.restartDevice());
    return;
  }

  if (showCHSection(state.region)) {
    await run('Config CH Error', () => pirConfig.ch(state.CHL, state.CHH));
  }
  if (showDutySection(state.region)) {
    await run('Config Duty Cycle Error', () => pirConfig.dutyCycle(state.dutyIsOn));
  }
  if (showJoinSection(state.region)) {
    await run('Config DR For Join Error', () => pirConfig.dr(state.join));
  }
  await run('Config Uplink  Strategy Error', () =>
    pirConfig.uplinkStrategy(state.adrIsOn, state.DRL, state.DRH),
  );
  await run('Config Max retransmission times Error', () =>
    pirConfig.maxRetransmission(state.maxRetransmission + 1),
  );
  await run('Connect network error', () => pirConfig.restartDevice());
}

export function apiErrorMessage(e: unknown): string {
  if (e instanceof Error) {
    return e.message || 'Operation failed';
  }
  return 'Operation failed';
}

export function classTypeLabel(classType: unknown): string {
  return Number(classType) === 0 ? 'ClassA' : 'ClassC';
}

export function modemLabel(modem: unknown): string {
  return Number(modem) === 1 ? 'ABP' : 'OTAA';
}

export function networkStatusLabel(status: unknown): string {
  return Number(status) === 0 ? 'Connecting' : 'Connected';
}

export function boolFromResult(v: unknown): boolean {
  return v === true || v === 1 || v === '1';
}
