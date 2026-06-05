import PIRInterface from '../sdk/PIRInterface';
import PIRInterfaceConfig from '../sdk/PIRInterfaceConfig';
import {
  apiErrorMessage,
  configPromise,
  readPromise,
  waitForBleIdle,
  waitForBleReady,
} from './pirApi';
import {mapBatteryInfo, type BatteryCycleInfo} from '../types/battery';
import {isNewDeviceType} from './pirDeviceType';

type ReadFn = (
  suc?: (data: {result: Record<string, unknown>}) => void,
  failed?: (e: Error) => void,
) => void;

export type BatteryConsumptionState = {
  currentInfo: BatteryCycleInfo;
  lastInfo: BatteryCycleInfo;
  allInfo: BatteryCycleInfo;
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

async function ensureBle(): Promise<void> {
  await waitForBleIdle();
  if (!(await waitForBleReady())) {
    throw new Error('The current connection device is in disconnect');
  }
}

/** 对齐 MKPIRBatteryConsumptionModel readDataWithSucBlock（仅新设备 V2） */
export async function readBatteryConsumption(): Promise<BatteryConsumptionState> {
  if (!isNewDeviceType()) {
    throw new Error('Battery consumption is not supported on this device');
  }
  await ensureBle();

  const currentRes = await readStep(
    'Read Current Cycle Battery Information Error',
    () => readPromise(PIRInterface.read_battery_information as ReadFn),
  );
  const lastRes = await readStep(
    'Read Last Cycle Battery Information Error',
    () =>
      readPromise(PIRInterface.read_last_cycle_battery_information as ReadFn),
  );
  const allRes = await readStep('Read All Cycle Battery Information Error', () =>
    readPromise(PIRInterface.read_all_cycle_battery_information as ReadFn),
  );

  return {
    currentInfo: mapBatteryInfo(currentRes),
    lastInfo: mapBatteryInfo(lastRes),
    allInfo: mapBatteryInfo(allRes),
  };
}

export async function resetBatteryConsumption(): Promise<void> {
  await ensureBle();
  await readStep('Battery Reset Error', () =>
    configPromise((s, f) => PIRInterfaceConfig.battery_reset(s, f)).then(() => ({})),
  );
}
