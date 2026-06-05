/**
 * Auto-generated from MKPIRInterface+MKPIRConfig.m (LW007-PIR, 1-byte CMD)
 */
import {TaskOperationID} from './TaskOperationID';
import {fetchHexValue, hexStringFromSignedNumber} from '../utils/BleHexUtils';
// hexStringFromSignedNumber used for timezone
import {
  LoRaWanMessageType,
  LoRaWanModem,
  LoRaWanRegion,
  TxPower,
} from './PIRSDKDefines';
import {fetchTxPower, lorawanRegionString, passwordToHex} from './PIRSDKDataAdopter';
import {configControl, configData, paramsError, type FailedBlock, type SucBlock} from './PIRConfigSupport';

export const PIRInterfaceConfig = {

  config_region(region: LoRaWanRegion, suc?: SucBlock, failed?: FailedBlock) {
    configData(TaskOperationID.mk_pir_taskConfigRegionOperation, `ed010101${lorawanRegionString(region)}`, suc, failed);
  },
  config_modem(modem: LoRaWanModem, suc?: SucBlock, failed?: FailedBlock) {
    const cmd = modem === LoRaWanModem.ABP ? 'ed01020101' : 'ed01020102';
    configData(TaskOperationID.mk_pir_taskConfigModemOperation, cmd, suc, failed);
  },
  config_deveui(devEUI: string, suc?: SucBlock, failed?: FailedBlock) {
    if (devEUI.length !== 16) return paramsError(failed);
    configData(TaskOperationID.mk_pir_taskConfigDEVEUIOperation, `ed010308${devEUI.toLowerCase()}`, suc, failed);
  },
  config_appeui(appEUI: string, suc?: SucBlock, failed?: FailedBlock) {
    if (appEUI.length !== 16) return paramsError(failed);
    configData(TaskOperationID.mk_pir_taskConfigAPPEUIOperation, `ed010408${appEUI.toLowerCase()}`, suc, failed);
  },
  config_appkey(appKey: string, suc?: SucBlock, failed?: FailedBlock) {
    if (appKey.length !== 32) return paramsError(failed);
    configData(TaskOperationID.mk_pir_taskConfigAPPKEYOperation, `ed010510${appKey.toLowerCase()}`, suc, failed);
  },
  config_devaddr(devAddr: string, suc?: SucBlock, failed?: FailedBlock) {
    if (devAddr.length !== 8) return paramsError(failed);
    configData(TaskOperationID.mk_pir_taskConfigDEVADDROperation, `ed010604${devAddr.toLowerCase()}`, suc, failed);
  },
  config_appskey(appSkey: string, suc?: SucBlock, failed?: FailedBlock) {
    if (appSkey.length !== 32) return paramsError(failed);
    configData(TaskOperationID.mk_pir_taskConfigAPPSKEYOperation, `ed010710${appSkey.toLowerCase()}`, suc, failed);
  },
  config_nwkskey(nwkSkey: string, suc?: SucBlock, failed?: FailedBlock) {
    if (nwkSkey.length !== 32) return paramsError(failed);
    configData(TaskOperationID.mk_pir_taskConfigNWKSKEYOperation, `ed010810${nwkSkey.toLowerCase()}`, suc, failed);
  },
  config_message_type(messageType: LoRaWanMessageType, suc?: SucBlock, failed?: FailedBlock) {
    const cmd = messageType === LoRaWanMessageType.Unconfirm ? 'ed01090100' : 'ed01090101';
    configData(TaskOperationID.mk_pir_taskConfigMessageTypeOperation, cmd, suc, failed);
  },
  config_chl(chl: number, chh: number, suc?: SucBlock, failed?: FailedBlock) {
    if (chl < 0 || chl > 95 || chh < chl || chh > 95) return paramsError(failed);
    configData(
      TaskOperationID.mk_pir_taskConfigCHValueOperation,
      `ed010b02${fetchHexValue(chl, 1)}${fetchHexValue(chh, 1)}`,
      suc,
      failed,
    );
  },
  config_duty_cycle_status(isOn: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configData(TaskOperationID.mk_pir_taskConfigDutyCycleStatusOperation, isOn ? 'ed010e0101' : 'ed010e0100', suc, failed);
  },
  config_dr(dr: number, suc?: SucBlock, failed?: FailedBlock) {
    if (dr < 0 || dr > 5) return paramsError(failed);
    configData(TaskOperationID.mk_pir_taskConfigDRValueOperation, `ed010c01${fetchHexValue(dr, 1)}`, suc, failed);
  },
  config_uplink_strategy(isOn: boolean, drl: number, drh: number, suc?: SucBlock, failed?: FailedBlock) {
    if (isOn && (drl < 0 || drl > 6 || drh < drl || drh > 6)) return paramsError(failed);
    configData(
      TaskOperationID.mk_pir_taskConfigUplinkStrategyOperation,
      `ed010d03${isOn ? '01' : '00'}${fetchHexValue(drl, 1)}${fetchHexValue(drh, 1)}`,
      suc,
      failed,
    );
  },
  config_lorawan_max_retransmission_times(times: number, suc?: SucBlock, failed?: FailedBlock) {
    if (times < 1 || times > 8) return paramsError(failed);
    configData(TaskOperationID.mk_pir_taskConfigMaxRetransmissionTimesOperation, `ed010a01${fetchHexValue(times, 1)}`, suc, failed);
  },
  config_time_sync_interval(interval: number, suc?: SucBlock, failed?: FailedBlock) {
    if (interval < 0 || interval > 255) return paramsError(failed);
    configData(TaskOperationID.mk_pir_taskConfigTimeSyncIntervalOperation, `ed010f01${fetchHexValue(interval, 1)}`, suc, failed);
  },
  config_lorawan_network_check_interval(interval: number, suc?: SucBlock, failed?: FailedBlock) {
    if (interval < 0 || interval > 255) return paramsError(failed);
    configData(TaskOperationID.mk_pir_taskConfigNetworkCheckIntervalOperation, `ed011001${fetchHexValue(interval, 1)}`, suc, failed);
  },
  config_eu868_single_channel_status(isOn: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configData(
      TaskOperationID.mk_pir_taskConfigEU868SingleChannelStatusOperation,
      isOn ? 'ed01110101' : 'ed01110100',
      suc,
      failed,
    );
  },
  config_eu868_single_channel_selection(channel: number, suc?: SucBlock, failed?: FailedBlock) {
    configData(
      TaskOperationID.mk_pir_taskConfigEU868SingleChannelSelectionOperation,
      `ed011201${fetchHexValue(channel, 1)}`,
      suc,
      failed,
    );
  },
  config_device_name(deviceName: string, suc?: SucBlock, failed?: FailedBlock) {
    if (!deviceName || deviceName.length > 16) return paramsError(failed);
    let data = '';
    for (let i = 0; i < deviceName.length; i++) {
      data += fetchHexValue(deviceName.charCodeAt(i), 1);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigDeviceNameOperation,
      `ed0126${fetchHexValue(deviceName.length, 1)}${data}`,
      suc,
      failed,
    );
  },
  config_adv_interval(interval: number, suc?: SucBlock, failed?: FailedBlock) {
    if (interval < 1 || interval > 100) return paramsError(failed);
    configData(
      TaskOperationID.mk_pir_taskConfigAdvIntervalOperation,
      `ed012101${fetchHexValue(interval, 1)}`,
      suc,
      failed,
    );
  },
  config_connectable_status(connectable: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configData(TaskOperationID.mk_pir_taskConfigConnectableStatusOperation, connectable ? 'ed01220101' : 'ed01220100', suc, failed);
  },
  config_broadcast_timeout(timeout: number, suc?: SucBlock, failed?: FailedBlock) {
    if (timeout < 0 || timeout > 255) return paramsError(failed);
    configData(TaskOperationID.mk_pir_taskConfigBroadcastTimeoutOperation, `ed012301${fetchHexValue(timeout, 1)}`, suc, failed);
  },
  config_need_password(need: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configData(TaskOperationID.mk_pir_taskConfigNeedPasswordOperation, need ? 'ed01240101' : 'ed01240100', suc, failed);
  },
  config_tx_power(txPower: TxPower, suc?: SucBlock, failed?: FailedBlock) {
    configData(TaskOperationID.mk_pir_taskConfigTxPowerOperation, `ed012501${fetchTxPower(txPower)}`, suc, failed);
  },
  config_password(password: string, suc?: SucBlock, failed?: FailedBlock) {
    if (password.length !== 8) return paramsError(failed);
    configData(TaskOperationID.mk_pir_taskConfigPasswordOperation, `ed014408${passwordToHex(password)}`, suc, failed);
  },
  config_pir_function_status(isOn: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configData(
      TaskOperationID.mk_pir_taskConfigPIRFunctionStatusOperation,
      isOn ? 'ed01300101' : 'ed01300100',
      suc,
      failed,
    );
  },
  config_door_sensor_switch_status(isOn: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configData(
      TaskOperationID.mk_pir_taskConfigDoorSensorSwitchStatusOperation,
      isOn ? 'ed01340101' : 'ed01340100',
      suc,
      failed,
    );
  },
  config_ht_switch_status(isOn: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configData(
      TaskOperationID.mk_pir_taskConfigHTSwitchStatusOperation,
      isOn ? 'ed01350101' : 'ed01350100',
      suc,
      failed,
    );
  },
  config_pir_report_interval(interval: number, suc?: SucBlock, failed?: FailedBlock) {
    if (interval < 1 || interval > 60) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigPIRReportIntervalOperation,
      `ed013101${fetchHexValue(interval, 1)}`,
      suc,
      failed,
    );
  },
  config_pir_sensitivity(sensitivity: number, suc?: SucBlock, failed?: FailedBlock) {
    if (sensitivity < 0 || sensitivity > 2) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigPIRSensitivityOperation,
      `ed013201${fetchHexValue(sensitivity + 1, 1)}`,
      suc,
      failed,
    );
  },
  config_pir_delay_time(delay: number, suc?: SucBlock, failed?: FailedBlock) {
    if (delay < 0 || delay > 2) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigPIRDelayTimeOperation,
      `ed013301${fetchHexValue(delay + 1, 1)}`,
      suc,
      failed,
    );
  },
  config_ht_sample_rate(rate: number, suc?: SucBlock, failed?: FailedBlock) {
    if (rate < 1 || rate > 60) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigHTSampleRateOperation,
      `ed013601${fetchHexValue(rate, 1)}`,
      suc,
      failed,
    );
  },
  config_temp_threshold_alarm_status(isOn: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configData(
      TaskOperationID.mk_pir_taskConfigTempThresholdAlarmStatusOperation,
      isOn ? 'ed01370101' : 'ed01370100',
      suc,
      failed,
    );
  },
  config_temp_threshold(
    maxThreshold: number,
    minThreshold: number,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    if (
      minThreshold < -30 ||
      minThreshold >= maxThreshold ||
      maxThreshold > 60
    ) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigTempThresholdOperation,
      `ed013802${hexStringFromSignedNumber(minThreshold)}${hexStringFromSignedNumber(maxThreshold)}`,
      suc,
      failed,
    );
  },
  config_temp_change_alarm_status(isOn: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configData(
      TaskOperationID.mk_pir_taskConfigTempChangeAlarmStatusOperation,
      isOn ? 'ed013a0101' : 'ed013a0100',
      suc,
      failed,
    );
  },
  config_temp_change_alarm_duration(duration: number, suc?: SucBlock, failed?: FailedBlock) {
    if (duration < 1 || duration > 24) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigTempChangeAlarmDurationConditionOperation,
      `ed013b01${fetchHexValue(duration, 1)}`,
      suc,
      failed,
    );
  },
  config_temp_change_alarm_threshold(threshold: number, suc?: SucBlock, failed?: FailedBlock) {
    if (threshold < 1 || threshold > 20) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigTempChangeAlarmChangeValueThresholdOperation,
      `ed013c01${fetchHexValue(threshold, 1)}`,
      suc,
      failed,
    );
  },
  config_rh_threshold_alarm_status(isOn: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configData(
      TaskOperationID.mk_pir_taskConfigRHThresholdAlarmStatusOperation,
      isOn ? 'ed013d0101' : 'ed013d0100',
      suc,
      failed,
    );
  },
  config_rh_threshold(
    maxThreshold: number,
    minThreshold: number,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    if (minThreshold < 0 || minThreshold >= maxThreshold || maxThreshold > 100) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigRHThresholdOperation,
      `ed013e02${fetchHexValue(minThreshold, 1)}${fetchHexValue(maxThreshold, 1)}`,
      suc,
      failed,
    );
  },
  config_rh_change_alarm_status(isOn: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configData(
      TaskOperationID.mk_pir_taskConfigRHChangeAlarmStatusOperation,
      isOn ? 'ed01400101' : 'ed01400100',
      suc,
      failed,
    );
  },
  config_rh_change_alarm_duration(duration: number, suc?: SucBlock, failed?: FailedBlock) {
    if (duration < 1 || duration > 24) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigRHChangeAlarmDurationConditionOperation,
      `ed014101${fetchHexValue(duration, 1)}`,
      suc,
      failed,
    );
  },
  config_rh_change_alarm_threshold(threshold: number, suc?: SucBlock, failed?: FailedBlock) {
    if (threshold < 1 || threshold > 100) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigRHChangeAlarmChangeValueThresholdOperation,
      `ed014201${fetchHexValue(threshold, 1)}`,
      suc,
      failed,
    );
  },
  restart_device(suc?: SucBlock, failed?: FailedBlock) {
    configControl(TaskOperationID.mk_pir_taskRestartDeviceOperation, 'ed015000', suc, failed);
  },
  factory_reset(suc?: SucBlock, failed?: FailedBlock) {
    configControl(TaskOperationID.mk_pir_taskFactoryResetOperation, 'ed015100', suc, failed);
  },
  power_off(suc?: SucBlock, failed?: FailedBlock) {
    configControl(TaskOperationID.mk_pir_taskPowerOffOperation, 'ed015200', suc, failed);
  },
  config_device_time(timestamp: number, suc?: SucBlock, failed?: FailedBlock) {
    const hex = fetchHexValue(timestamp, 4);
    configControl(TaskOperationID.mk_pir_taskConfigDeviceTimeOperation, `ed015304${hex}`, suc, failed);
  },
  battery_reset(suc?: SucBlock, failed?: FailedBlock) {
    configControl(TaskOperationID.mk_pir_taskBatteryResetOperation, 'ed015f00', suc, failed);
  },
  config_time_zone(timeZone: number, suc?: SucBlock, failed?: FailedBlock) {
    if (timeZone < -24 || timeZone > 28) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigTimeZoneOperation,
      `ed014301${hexStringFromSignedNumber(timeZone)}`,
      suc,
      failed,
    );
  },
  config_low_power_condition1_voltage_threshold(
    threshold: number,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    if (threshold < 44 || threshold > 64) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigLowPowerCondition1VoltageThresholdOperation,
      `ed014b01${fetchHexValue(threshold, 1)}`,
      suc,
      failed,
    );
  },
  config_low_power_condition1_min_sample_interval(
    interval: number,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    if (interval < 1 || interval > 1440) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigLowPowerCondition1MinSampleIntervalOperation,
      `ed014c02${fetchHexValue(interval, 2)}`,
      suc,
      failed,
    );
  },
  config_low_power_condition1_sample_times(
    times: number,
    suc?: SucBlock,
    failed?: FailedBlock,
  ) {
    if (times < 1 || times > 100) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigLowPowerCondition1SampleTimesOperation,
      `ed014d01${fetchHexValue(times, 1)}`,
      suc,
      failed,
    );
  },
  config_heartbeat_interval(interval: number, suc?: SucBlock, failed?: FailedBlock) {
    if (interval < 1 || interval > 14400) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigHeartbeatIntervalOperation,
      `ed014602${fetchHexValue(interval, 2)}`,
      suc,
      failed,
    );
  },
  config_low_power_prompt(value: number, suc?: SucBlock, failed?: FailedBlock) {
    if (value < 0 || value > 1) {
      return paramsError(failed);
    }
    configData(
      TaskOperationID.mk_pir_taskConfigLowPowerPromptOperation,
      `ed014701${fetchHexValue(value, 1)}`,
      suc,
      failed,
    );
  },
  config_low_power_payload(isOn: boolean, suc?: SucBlock, failed?: FailedBlock) {
    configData(
      TaskOperationID.mk_pir_taskConfigLowPowerPayloadOperation,
      isOn ? 'ed01480101' : 'ed01480100',
      suc,
      failed,
    );
  },

};
export default PIRInterfaceConfig;
