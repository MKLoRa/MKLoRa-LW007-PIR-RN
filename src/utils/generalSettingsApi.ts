import PIRInterface from '../sdk/PIRInterface';
import PIRInterfaceConfig from '../sdk/PIRInterfaceConfig';
import {configPromise, readPromise} from './pirApi';

type ReadFn = (
  suc?: (data: {result: Record<string, unknown>}) => void,
  failed?: (e: Error) => void,
) => void;

export const SAVE_VALIDATION_MSG_GENERAL =
  'Opps！Save failed. Please check the input characters and try again.';

export function validateHeartbeatInterval(interval: string): boolean {
  const n = parseInt(interval, 10);
  return interval !== '' && !Number.isNaN(n) && n >= 1 && n <= 14400;
}

/** 对齐 MKPIRGeneralModel */
export async function readGeneralSettings(): Promise<{heartbeatInterval: string}> {
  const res = await readPromise(PIRInterface.read_heartbeat_interval as ReadFn);
  const interval = res.interval;
  return {
    heartbeatInterval: interval != null ? String(interval) : '',
  };
}

export async function saveGeneralSettings(state: {
  heartbeatInterval: string;
}): Promise<void> {
  if (!validateHeartbeatInterval(state.heartbeatInterval)) {
    throw new Error(SAVE_VALIDATION_MSG_GENERAL);
  }
  await configPromise((s, f) =>
    PIRInterfaceConfig.config_heartbeat_interval(
      parseInt(state.heartbeatInterval, 10),
      s,
      f,
    ),
  );
}
