import PIRInterface from '../sdk/PIRInterface';
import PIRInterfaceConfig from '../sdk/PIRInterfaceConfig';
import {boolFromResult, configPromise, readPromise} from './pirApi';

type ReadFn = (
  suc?: (data: {result: Record<string, unknown>}) => void,
  failed?: (e: Error) => void,
) => void;

export const SAVE_VALIDATION_MSG_PIR =
  'Opps！Save failed. Please check the input characters and try again.';

export const PIR_LEVEL_OPTIONS = ['Low', 'Medium', 'High'] as const;

export type PirSettingsState = {
  isOn: boolean;
  interval: string;
  sensitivityIndex: number;
  delayIndex: number;
  detected: boolean;
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

function intField(res: Record<string, unknown>, key: string): number {
  return parseInt(String(res[key] ?? '0'), 10);
}

export function validatePirSettings(state: Pick<PirSettingsState, 'interval'>): boolean {
  const n = parseInt(state.interval, 10);
  return state.interval !== '' && !Number.isNaN(n) && n >= 1 && n <= 60;
}

/** 对齐 MKPIRPirSettingsModel.readData */
export async function readPirSettings(): Promise<PirSettingsState> {
  const status = await readStep('Read Function Switch Error', () =>
    readPromise(PIRInterface.read_pir_function_status as ReadFn),
  );
  const intervalRes = await readStep('Read Report Interval Error', () =>
    readPromise(PIRInterface.read_pir_report_interval as ReadFn),
  );
  const sensitivityRes = await readStep('Read PIR Sensitivity Error', () =>
    readPromise(PIRInterface.read_pir_sensitivity as ReadFn),
  );
  const delayRes = await readStep('Read PIR Delay Time Error', () =>
    readPromise(PIRInterface.read_pir_delay_time as ReadFn),
  );
  const statusRes = await readStep('Read PIR Status Error', () =>
    readPromise(PIRInterface.read_pir_status as ReadFn),
  );

  return {
    isOn: boolFromResult(status.isOn),
    interval: String(intervalRes.interval ?? ''),
    sensitivityIndex: intField(sensitivityRes, 'value'),
    delayIndex: intField(delayRes, 'value'),
    detected: boolFromResult(statusRes.detected),
  };
}

/** 对齐 MKPIRPirSettingsModel.configData */
export async function savePirSettings(state: PirSettingsState): Promise<void> {
  if (!validatePirSettings(state)) {
    throw new Error(SAVE_VALIDATION_MSG_PIR);
  }

  const delay = () => new Promise<void>(r => setTimeout(r, 120));
  const run = async (msg: string, fn: () => Promise<void>) => {
    try {
      await fn();
      await delay();
    } catch (e) {
      const detail = e instanceof Error ? e.message : 'Operation failed';
      throw new Error(detail === 'Operation failed' ? msg : `${msg}: ${detail}`);
    }
  };

  await run('Config Function Switch Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_pir_function_status(state.isOn, s, f),
    ),
  );
  await run('Config Report Interval Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_pir_report_interval(
        parseInt(state.interval, 10),
        s,
        f,
      ),
    ),
  );
  await run('Config PIR Sensitivity Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_pir_sensitivity(state.sensitivityIndex, s, f),
    ),
  );
  await run('Config PIR Delay Time Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_pir_delay_time(state.delayIndex, s, f),
    ),
  );
}

export async function readPirStatus(): Promise<boolean> {
  const res = await readPromise(PIRInterface.read_pir_status as ReadFn);
  return boolFromResult(res.detected);
}
