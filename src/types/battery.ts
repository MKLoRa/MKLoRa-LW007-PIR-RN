/** LW007-PIR 电池周期数据（对齐 MKPIRTaskAdopter 5e/60/61） */

export type BatteryCycleInfo = {
  workTimes: string;
  advCount: string;
  thSamplingCount: string;
  pirWorkTimes: string;
  doorMagneticTriggerCloseTimes: string;
  doorMagneticTriggerOpenTimes: string;
  loraSendCount: string;
  loraPowerConsumption: string;
  batteryPower: string;
};

export function formatBatteryPowerMah(power: string): string {
  const n = parseInt(power, 10);
  if (Number.isNaN(n)) {
    return power ? `${power} mAH` : '—';
  }
  return `${(n * 0.001).toFixed(3)} mAH`;
}

export function mapBatteryInfo(res: Record<string, unknown>): BatteryCycleInfo {
  const str = (key: string) => {
    const v = res[key];
    return v != null ? String(v) : '';
  };
  return {
    workTimes: str('workTimes'),
    advCount: str('advCount'),
    thSamplingCount: str('thSamplingCount'),
    pirWorkTimes: str('pirWorkTimes'),
    doorMagneticTriggerCloseTimes: str('doorMagneticTriggerCloseTimes'),
    doorMagneticTriggerOpenTimes: str('doorMagneticTriggerOpenTimes'),
    loraSendCount: str('loraSendCount'),
    loraPowerConsumption: str('loraPowerConsumption'),
    batteryPower: str('batteryPower'),
  };
}
