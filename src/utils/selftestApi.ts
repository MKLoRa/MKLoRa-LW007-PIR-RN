import PIRInterface from '../sdk/PIRInterface';
import PIRInterfaceConfig from '../sdk/PIRInterfaceConfig';
import {
  apiErrorMessage,
  configPromise,
  readPromise,
  waitForBleIdle,
  waitForBleReady,
} from './pirApi';
import {
  type SelftestFormState,
  validateSelftestParams,
} from './selftestModel';

export type {BatteryCycleInfo} from '../types/battery';
export {mapBatteryInfo} from '../types/battery';

type ReadFn = (
  suc?: (data: {result: Record<string, unknown>}) => void,
  failed?: (e: Error) => void,
) => void;

export type SelftestState = SelftestFormState;

export type SelftestLegacyState = {
  pcbaStatus: string;
  workTimes: string;
  advCount: string;
  thSamplingCount: string;
  loraPowerConsumption: string;
  loraSendCount: string;
  batteryPower: string;
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

function strField(res: Record<string, unknown>, key: string): string {
  const v = res[key];
  return v != null ? String(v) : '';
}

function thresholdIndex(res: Record<string, unknown>): number {
  const raw = parseInt(strField(res, 'threshold'), 10);
  if (Number.isNaN(raw)) {
    return 0;
  }
  const index = raw - 44;
  return index < 0 ? 0 : index > 20 ? 20 : index;
}

async function ensureBle(): Promise<void> {
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }
}

/** 对齐 MKPIRSelftestV2Model（LW007 仅低电条件 4b/4c/4d） */
export async function readSelftest(): Promise<SelftestState> {
  await ensureBle();

  const pcbaRes = await readStep('Read PCBA Status Error', () =>
    readPromise(PIRInterface.read_pcba_status as ReadFn),
  );
  const selfRes = await readStep('Read Self Test Status Error', () =>
    readPromise(PIRInterface.read_selftest_status as ReadFn),
  );
  const th1Res = await readStep('Read Condition1 Voltage Threshold Error', () =>
    readPromise(
      PIRInterface.read_low_power_condition1_voltage_threshold as ReadFn,
    ),
  );
  const int1Res = await readStep('Read Condition1 Sample Interval Error', () =>
    readPromise(
      PIRInterface.read_low_power_condition1_min_sample_interval as ReadFn,
    ),
  );
  const times1Res = await readStep('Read Condition1 Sample Times Error', () =>
    readPromise(
      PIRInterface.read_low_power_condition1_sample_times as ReadFn,
    ),
  );

  const statusHex = strField(selfRes, 'status');
  const selftestError = parseInt(statusHex, 10) === 1;

  return {
    selftestError,
    pcbaStatus: strField(pcbaRes, 'status'),
    gps: '0',
    acceData: '0',
    flash: '0',
    voltageThreshold1: thresholdIndex(th1Res),
    sampleInterval1: strField(int1Res, 'interval'),
    sampleTimes1: strField(times1Res, 'times'),
    voltageThreshold2: 0,
    sampleInterval2: '',
    sampleTimes2: '',
  };
}

/** 对齐 MKPIRSelftestModel（旧设备只读） */
export async function readSelftestLegacy(): Promise<SelftestLegacyState> {
  await ensureBle();

  const pcbaRes = await readStep('Read PCBA Status Error', () =>
    readPromise(PIRInterface.read_pcba_status as ReadFn),
  );
  const batRes = await readStep('Read Battery Datas Error', () =>
    readPromise(PIRInterface.read_battery_information as ReadFn),
  );

  return {
    pcbaStatus: strField(pcbaRes, 'status'),
    workTimes: strField(batRes, 'workTimes'),
    advCount: strField(batRes, 'advCount'),
    thSamplingCount: strField(batRes, 'thSamplingCount'),
    loraPowerConsumption: strField(batRes, 'loraPowerConsumption'),
    loraSendCount: strField(batRes, 'loraSendCount'),
    batteryPower: strField(batRes, 'batteryPower'),
  };
}

export async function configSelftest(state: SelftestState): Promise<void> {
  if (!validateSelftestParams(state)) {
    throw new Error(
      'Opps！Save failed. Please check the input characters and try again.',
    );
  }
  await ensureBle();

  await readStep('Config Condition1 Voltage Threshold Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_low_power_condition1_voltage_threshold(
        state.voltageThreshold1 + 44,
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Condition1 Sample Interval Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_low_power_condition1_min_sample_interval(
        parseInt(state.sampleInterval1, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
  await readStep('Config Condition1 Sample Times Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_low_power_condition1_sample_times(
        parseInt(state.sampleTimes1, 10),
        s,
        f,
      ),
    ).then(() => ({})),
  );
}

export function selftestStatusDisplay(
  gps: string,
  acceData: string,
  flash: string,
): Record<number, string> {
  return {
    5: flash === '1' ? '1' : '',
    6: acceData === '1' ? '1' : '',
    7: gps === '1' ? '1' : '',
  };
}

export function pcbaStatusDisplay(status: string): Record<number, string> {
  const n = parseInt(status, 10);
  const out: Record<number, string> = {};
  if (n === 0) {
    out[0] = '0';
  } else if (n === 1) {
    out[1] = '1';
  } else if (n === 2) {
    out[2] = '2';
  }
  return out;
}
