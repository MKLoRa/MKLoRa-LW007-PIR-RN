import PIRInterface from '../sdk/PIRInterface';
import PIRInterfaceConfig from '../sdk/PIRInterfaceConfig';
import {boolFromResult, configPromise, readPromise} from './pirApi';

type ReadFn = (
  suc?: (data: {result: Record<string, unknown>}) => void,
  failed?: (e: Error) => void,
) => void;

export type HallSettingsState = {
  isOn: boolean;
  open: boolean;
  times: string;
};

function readStep(
  msg: string,
  read: () => Promise<Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  return read().catch(e => {
    const detail = e instanceof Error ? e.message : 'Operation failed';
    throw new Error(detail === 'Operation failed' ? msg : `${msg}: ${detail}`);
  });
}

/** 对齐 MKPIRHallSettingsModel.readData */
export async function readHallSettings(): Promise<HallSettingsState> {
  const sw = await readStep('Read Function Switch Error', () =>
    readPromise(PIRInterface.read_door_sensor_switch_status as ReadFn),
  );
  const data = await readStep('Read Door Sensor Datas Error', () =>
    readPromise(PIRInterface.read_door_sensor_datas as ReadFn),
  );

  return {
    isOn: boolFromResult(sw.isOn),
    open: boolFromResult(data.open),
    times: String(data.times ?? ''),
  };
}

/** 对齐 MKPIRHallSettingsModel.configData */
export async function saveHallSettings(state: Pick<HallSettingsState, 'isOn'>): Promise<void> {
  await configPromise((s, f) =>
    PIRInterfaceConfig.config_door_sensor_switch_status(state.isOn, s, f),
  );
}

export async function readDoorSensorDatas(): Promise<Pick<HallSettingsState, 'open' | 'times'>> {
  const data = await readPromise(PIRInterface.read_door_sensor_datas as ReadFn);
  return {
    open: boolFromResult(data.open),
    times: String(data.times ?? ''),
  };
}
