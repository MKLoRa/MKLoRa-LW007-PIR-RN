import PIRInterface from '../sdk/PIRInterface';
import PIRInterfaceConfig from '../sdk/PIRInterfaceConfig';
import {
  apiErrorMessage,
  boolFromResult,
  configPromise,
  readPromise,
  waitForBleIdle,
  waitForBleReady,
} from './pirApi';

type ReadFn = (
  suc?: (data: {result: Record<string, unknown>}) => void,
  failed?: (e: Error) => void,
) => void;

export type DeviceSettingsState = {
  /** 对齐 MKPIRDeviceSettingModel.timeZone，TIME_ZONE_LIST 下标 */
  timeZoneIndex: number;
  /** 对齐 MKPIRDeviceSettingModel.payload */
  lowPowerPayload: boolean;
};

async function readStep(
  msg: string,
  fn: () => Promise<Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  try {
    return await fn();
  } catch (e) {
    const detail = apiErrorMessage(e);
    throw new Error(detail === 'Operation failed' ? msg : `${msg}: ${detail}`);
  }
}

async function configStep(msg: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (e) {
    const detail = apiErrorMessage(e);
    throw new Error(detail === 'Operation failed' ? msg : `${msg}: ${detail}`);
  }
}

async function ensureBleReady(): Promise<void> {
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }
}

/** 对齐 MKPIRDeviceSettingModel readDataWithSucBlock */
export async function readDeviceSettings(): Promise<DeviceSettingsState> {
  await ensureBleReady();

  const tzRes = await readStep('Read Time Zone Error', () =>
    readPromise(PIRInterface.read_time_zone as ReadFn),
  );
  const payloadRes = await readStep('Read Low Power Payload Error', () =>
    readPromise(PIRInterface.read_low_power_payload as ReadFn),
  );

  const tz = Number(tzRes.timeZone ?? 0);
  return {
    timeZoneIndex: tz + 24,
    lowPowerPayload: boolFromResult(payloadRes.isOn),
  };
}

/** 对齐 MKPIRDeviceSettingController configTimeZone */
export async function configDeviceTimeZone(timeZoneIndex: number): Promise<void> {
  const timeZone = timeZoneIndex - 24;
  if (timeZone < -24 || timeZone > 28) {
    throw new Error('Config Time Zone Error');
  }
  await ensureBleReady();
  await configStep('Config Time Zone Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_time_zone(timeZone, s, f),
    ),
  );
}

/** 对齐 MKPIRDeviceSettingController configLowPowerPayload */
export async function configLowPowerPayload(isOn: boolean): Promise<void> {
  await ensureBleReady();
  await configStep('Config Low Power Payload Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_low_power_payload(isOn, s, f),
    ),
  );
}

/** 对齐 MKPIRDeviceSettingController sendPowerOffCommandToDevice */
export async function powerOffDevice(): Promise<void> {
  await ensureBleReady();
  await configStep('Power Off Error', () =>
    configPromise((s, f) => PIRInterfaceConfig.power_off(s, f)),
  );
}

/** 对齐 MKPIRDeviceSettingController sendResetCommandToDevice */
export async function factoryResetDevice(): Promise<void> {
  await ensureBleReady();
  await configStep('Factory Reset Error', () =>
    configPromise((s, f) => PIRInterfaceConfig.factory_reset(s, f)),
  );
}

/** 对齐 MKPIRDeviceSettingController sendBatteryResetCommandToDevice */
export async function batteryResetDevice(): Promise<void> {
  await ensureBleReady();
  await configStep('Battery Reset Error', () =>
    configPromise((s, f) => PIRInterfaceConfig.battery_reset(s, f)),
  );
}
