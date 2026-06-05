import PIRInterface from '../sdk/PIRInterface';
import PIRInterfaceConfig from '../sdk/PIRInterfaceConfig';
import {boolFromResult, configPromise, readPromise} from './pirApi';

type ReadFn = (
  suc?: (data: {result: Record<string, unknown>}) => void,
  failed?: (e: Error) => void,
) => void;

export const SAVE_VALIDATION_MSG_TH =
  'Opps！Save failed. Please check the input characters and try again.';

export type THSettingsState = {
  isOn: boolean;
  sampleRate: string;
  temperature: string;
  humidity: string;
  tempThresholdAlarm: boolean;
  tempMax: string;
  tempMin: string;
  tempChangeAlarm: boolean;
  tempDuration: string;
  tempChangeValueThreshold: string;
  rhThresholdAlarm: boolean;
  rhMax: string;
  rhMin: string;
  rhChangeAlarm: boolean;
  rhDuration: string;
  rhChangeValueThreshold: string;
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

function strField(res: Record<string, unknown>, key: string): string {
  const v = res[key];
  return v != null ? String(v) : '';
}

export function validateTHSettings(state: THSettingsState): boolean {
  const sample = parseInt(state.sampleRate, 10);
  if (state.sampleRate === '' || Number.isNaN(sample) || sample < 1 || sample > 60) {
    return false;
  }
  const tempMin = parseInt(state.tempMin, 10);
  const tempMax = parseInt(state.tempMax, 10);
  if (state.tempMin === '' || state.tempMax === '') {
    return false;
  }
  if (tempMin < -30 || tempMax > 60 || tempMin >= tempMax) {
    return false;
  }
  const tempDuration = parseInt(state.tempDuration, 10);
  if (
    state.tempDuration === '' ||
    Number.isNaN(tempDuration) ||
    tempDuration < 1 ||
    tempDuration > 24
  ) {
    return false;
  }
  const tempChange = parseInt(state.tempChangeValueThreshold, 10);
  if (
    state.tempChangeValueThreshold === '' ||
    Number.isNaN(tempChange) ||
    tempChange < 1 ||
    tempChange > 20
  ) {
    return false;
  }
  const rhMin = parseInt(state.rhMin, 10);
  const rhMax = parseInt(state.rhMax, 10);
  if (state.rhMin === '' || state.rhMax === '') {
    return false;
  }
  if (rhMin < 0 || rhMax > 100 || rhMin >= rhMax) {
    return false;
  }
  const rhDuration = parseInt(state.rhDuration, 10);
  if (
    state.rhDuration === '' ||
    Number.isNaN(rhDuration) ||
    rhDuration < 1 ||
    rhDuration > 24
  ) {
    return false;
  }
  const rhChange = parseInt(state.rhChangeValueThreshold, 10);
  if (
    state.rhChangeValueThreshold === '' ||
    Number.isNaN(rhChange) ||
    rhChange < 1 ||
    rhChange > 100
  ) {
    return false;
  }
  return true;
}

/** 对齐 MKPIRTHSettingsModel.readData */
export async function readTHSettings(): Promise<THSettingsState> {
  const sw = await readStep('Read Function Switch Error', () =>
    readPromise(PIRInterface.read_ht_switch_status as ReadFn),
  );
  const rate = await readStep('Read Sample Rate Error', () =>
    readPromise(PIRInterface.read_ht_sample_rate as ReadFn),
  );
  const th = await readStep('Read HT Data Error', () =>
    readPromise(PIRInterface.read_th_datas as ReadFn),
  );
  const tempAlarm = await readStep('Read Temp Threshold Alarm Error', () =>
    readPromise(PIRInterface.read_temp_threshold_alarm_status as ReadFn),
  );
  const tempThreshold = await readStep('Read Temp Threshold Error', () =>
    readPromise(PIRInterface.read_temp_threshold as ReadFn),
  );
  const tempChangeAlarm = await readStep('Read Temp Change Alarm Error', () =>
    readPromise(PIRInterface.read_temp_change_alarm_status as ReadFn),
  );
  const tempDuration = await readStep('Read Temp Duration Condition Error', () =>
    readPromise(PIRInterface.read_temp_change_alarm_duration_condition as ReadFn),
  );
  const tempChangeThreshold = await readStep(
    'Read Temp Change Value Threshold Error',
    () =>
      readPromise(
        PIRInterface.read_temp_change_alarm_change_value_threshold as ReadFn,
      ),
  );
  const rhAlarm = await readStep('Read RH Threshold Alarm Error', () =>
    readPromise(PIRInterface.read_rh_threshold_alarm_status as ReadFn),
  );
  const rhThreshold = await readStep('Read RH Threshold Error', () =>
    readPromise(PIRInterface.read_rh_threshold as ReadFn),
  );
  const rhChangeAlarm = await readStep('Read RH Change Alarm Error', () =>
    readPromise(PIRInterface.read_rh_change_alarm_status as ReadFn),
  );
  const rhDuration = await readStep('Read RH Duration Condition Error', () =>
    readPromise(PIRInterface.read_rh_change_alarm_duration_condition as ReadFn),
  );
  const rhChangeThreshold = await readStep(
    'Read Temp Change Value Threshold Error',
    () =>
      readPromise(
        PIRInterface.read_rh_change_alarm_change_value_threshold as ReadFn,
      ),
  );

  const isOn = boolFromResult(sw.isOn);
  return {
    isOn,
    sampleRate: strField(rate, 'interval'),
    temperature: isOn ? strField(th, 'temperature') : '',
    humidity: isOn ? strField(th, 'humidity') : '',
    tempThresholdAlarm: boolFromResult(tempAlarm.isOn),
    tempMax: strField(tempThreshold, 'maxValue'),
    tempMin: strField(tempThreshold, 'minValue'),
    tempChangeAlarm: boolFromResult(tempChangeAlarm.isOn),
    tempDuration: strField(tempDuration, 'duration'),
    tempChangeValueThreshold: strField(tempChangeThreshold, 'threshold'),
    rhThresholdAlarm: boolFromResult(rhAlarm.isOn),
    rhMax: strField(rhThreshold, 'maxValue'),
    rhMin: strField(rhThreshold, 'minValue'),
    rhChangeAlarm: boolFromResult(rhChangeAlarm.isOn),
    rhDuration: strField(rhDuration, 'duration'),
    rhChangeValueThreshold: strField(rhChangeThreshold, 'threshold'),
  };
}

/** 对齐 MKPIRTHSettingsModel.configData */
export async function saveTHSettings(state: THSettingsState): Promise<void> {
  if (!validateTHSettings(state)) {
    throw new Error(SAVE_VALIDATION_MSG_TH);
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
      PIRInterfaceConfig.config_ht_switch_status(state.isOn, s, f),
    ),
  );
  await run('Config Sample Rate Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_ht_sample_rate(parseInt(state.sampleRate, 10), s, f),
    ),
  );
  await run('Config Temp Threshold Alarm Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_temp_threshold_alarm_status(
        state.tempThresholdAlarm,
        s,
        f,
      ),
    ),
  );
  await run('Config Temp Threshold Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_temp_threshold(
        parseInt(state.tempMax, 10),
        parseInt(state.tempMin, 10),
        s,
        f,
      ),
    ),
  );
  await run('Config Temp Change Alarm Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_temp_change_alarm_status(
        state.tempChangeAlarm,
        s,
        f,
      ),
    ),
  );
  await run('Config Temp Duration Condition Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_temp_change_alarm_duration(
        parseInt(state.tempDuration, 10),
        s,
        f,
      ),
    ),
  );
  await run('Config Temp Change Value Threshold Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_temp_change_alarm_threshold(
        parseInt(state.tempChangeValueThreshold, 10),
        s,
        f,
      ),
    ),
  );
  await run('Config RH Threshold Alarm Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_rh_threshold_alarm_status(
        state.rhThresholdAlarm,
        s,
        f,
      ),
    ),
  );
  await run('Config RH Threshold Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_rh_threshold(
        parseInt(state.rhMax, 10),
        parseInt(state.rhMin, 10),
        s,
        f,
      ),
    ),
  );
  await run('Config RH Change Alarm Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_rh_change_alarm_status(state.rhChangeAlarm, s, f),
    ),
  );
  await run('Config RH Duration Condition Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_rh_change_alarm_duration(
        parseInt(state.rhDuration, 10),
        s,
        f,
      ),
    ),
  );
  await run('Config RH Change Value Threshold Error', () =>
    configPromise((s, f) =>
      PIRInterfaceConfig.config_rh_change_alarm_threshold(
        parseInt(state.rhChangeValueThreshold, 10),
        s,
        f,
      ),
    ),
  );
}

/** 对齐 MKPIRTHSettingsModel.readTHDatas */
export async function readTHLiveData(): Promise<{temperature: string; humidity: string}> {
  const th = await readStep('Read HT Data Error', () =>
    readPromise(PIRInterface.read_th_datas as ReadFn),
  );
  return {
    temperature: strField(th, 'temperature'),
    humidity: strField(th, 'humidity'),
  };
}
