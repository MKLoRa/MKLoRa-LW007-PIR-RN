/** Auto-generated from MKPIRInterface.m */
import PIRCentralManager from "./PIRCentralManager";
import {TaskOperationID} from "./TaskOperationID";
import {buildReadCommand} from "./protocol/CommandBuilder";

type SucBlock = (data: {msg: string; code: string; result: unknown}) => void;
type FailedBlock = (error: Error) => void;

const central = () => PIRCentralManager.shared();

function readParams(
  taskID: TaskOperationID,
  cmdFlag: string,
  suc?: SucBlock,
  failed?: FailedBlock,
) {
  central().addTaskWithTaskID(
    taskID,
    buildReadCommand(cmdFlag),
    suc,
    failed,
    "params",
  );
}

function readControl(
  taskID: TaskOperationID,
  cmdFlag: string,
  suc?: SucBlock,
  failed?: FailedBlock,
) {
  central().addTaskWithTaskID(
    taskID,
    buildReadCommand(cmdFlag),
    suc,
    failed,
    "control",
  );
}

function readGatt(
  taskID: TaskOperationID,
  uuid: string,
  suc?: SucBlock,
  failed?: FailedBlock,
) {
  central().addReadTaskWithTaskID(taskID, uuid, suc, failed);
}

export const PIRInterface = {
  read_adv_interval(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadAdvIntervalOperation, "21", suc, failed);
  },
  read_all_cycle_battery_information(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_pir_taskReadAllCycleBatteryInformationOperation, "61", suc, failed);
  },
  read_battery_information(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_pir_taskReadBatteryInformationOperation, "5e", suc, failed);
  },
  read_battery_voltage(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_pir_taskReadBatteryVoltageOperation, "56", suc, failed);
  },
  read_beacon_mode_status(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadBeaconModeStatusOperation, "20", suc, failed);
  },
  read_broadcast_timeout(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadBroadcastTimeoutOperation, "23", suc, failed);
  },
  read_connectation_need_password(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadConnectationNeedPasswordOperation, "24", suc, failed);
  },
  read_device_connectable(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadDeviceConnectableOperation, "22", suc, failed);
  },
  read_device_model(suc?: SucBlock, failed?: FailedBlock) {
    readGatt(TaskOperationID.mk_pir_taskReadDeviceModelOperation, "2A24", suc, failed);
  },
  read_device_name(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadDeviceNameOperation, "26", suc, failed);
  },
  read_door_sensor_datas(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_pir_taskReadDoorSensorDatasOperation, "59", suc, failed);
  },
  read_door_sensor_switch_status(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadDoorSensorSwitchStatusOperation, "34", suc, failed);
  },
  read_eu868_single_channel_selection(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadEU868SingleChannelSelectionOperation, "12", suc, failed);
  },
  read_eu868_single_channel_status(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadEU868SingleChannelStatusOperation, "11", suc, failed);
  },
  read_firmware(suc?: SucBlock, failed?: FailedBlock) {
    readGatt(TaskOperationID.mk_pir_taskReadFirmwareOperation, "2A26", suc, failed);
  },
  read_hardware(suc?: SucBlock, failed?: FailedBlock) {
    readGatt(TaskOperationID.mk_pir_taskReadHardwareOperation, "2A27", suc, failed);
  },
  read_heartbeat_interval(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadHeartbeatIntervalOperation, "46", suc, failed);
  },
  read_ht_sample_rate(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadHTSampleRateOperation, "36", suc, failed);
  },
  read_ht_switch_status(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadHTSwitchStatusOperation, "35", suc, failed);
  },
  read_last_cycle_battery_information(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_pir_taskReadLastCycleBatteryInformationOperation, "60", suc, failed);
  },
  read_lorawan_appeui(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLorawanAPPEUIOperation, "04", suc, failed);
  },
  read_lorawan_appkey(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLorawanAPPKEYOperation, "05", suc, failed);
  },
  read_lorawan_appskey(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLorawanAPPSKEYOperation, "07", suc, failed);
  },
  read_lorawan_ch(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLorawanCHOperation, "0b", suc, failed);
  },
  read_lorawan_devaddr(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLorawanDEVADDROperation, "06", suc, failed);
  },
  read_lorawan_deveui(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLorawanDEVEUIOperation, "03", suc, failed);
  },
  read_lorawan_dr(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLorawanDROperation, "0c", suc, failed);
  },
  read_lorawan_duty_cycle_status(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLorawanDutyCycleStatusOperation, "0e", suc, failed);
  },
  read_lorawan_max_retransmission_times(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLorawanMaxRetransmissionTimesOperation, "0a", suc, failed);
  },
  read_lorawan_message_type(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLorawanMessageTypeOperation, "09", suc, failed);
  },
  read_lorawan_modem(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLorawanModemOperation, "02", suc, failed);
  },
  read_lorawan_network_check_interval(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLorawanNetworkCheckIntervalOperation, "10", suc, failed);
  },
  read_lorawan_network_status(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_pir_taskReadLorawanNetworkStatusOperation, "54", suc, failed);
  },
  read_lorawan_nwkskey(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLorawanNWKSKEYOperation, "08", suc, failed);
  },
  read_lorawan_region(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLorawanRegionOperation, "01", suc, failed);
  },
  read_lorawan_time_sync_interval(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLorawanDevTimeSyncIntervalOperation, "0f", suc, failed);
  },
  read_lorawan_uplink_strategy(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLorawanUplinkStrategyOperation, "0d", suc, failed);
  },
  read_low_power_condition1_min_sample_interval(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLowPowerCondition1MinSampleIntervalOperation, "4c", suc, failed);
  },
  read_low_power_condition1_sample_times(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLowPowerCondition1SampleTimesOperation, "4d", suc, failed);
  },
  read_low_power_condition1_voltage_threshold(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLowPowerCondition1VoltageThresholdOperation, "4b", suc, failed);
  },
  read_low_power_payload(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLowPowerPayloadOperation, "48", suc, failed);
  },
  read_low_power_prompt(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadLowPowerPromptOperation, "47", suc, failed);
  },
  read_mac_address(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_pir_taskReadMacAddressOperation, "57", suc, failed);
  },
  read_manufacturer(suc?: SucBlock, failed?: FailedBlock) {
    readGatt(TaskOperationID.mk_pir_taskReadManufacturerOperation, "2A29", suc, failed);
  },
  read_password(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadPasswordOperation, "44", suc, failed);
  },
  read_pcba_status(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_pir_taskReadPCBAStatusOperation, "5c", suc, failed);
  },
  read_pir_delay_time(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadPIRDelayTimeOperation, "33", suc, failed);
  },
  read_pir_function_status(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadPIRFunctionStatusOperation, "30", suc, failed);
  },
  read_pir_report_interval(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadPIRReportIntervalOperation, "31", suc, failed);
  },
  read_pir_sensitivity(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadPIRSensitivityOperation, "32", suc, failed);
  },
  read_pir_status(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_pir_taskReadPIRStatusOperation, "58", suc, failed);
  },
  read_rh_change_alarm_change_value_threshold(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadRHChangeAlarmChangeValueThresholdOperation, "42", suc, failed);
  },
  read_rh_change_alarm_duration_condition(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadRHChangeAlarmDurationConditionOperation, "41", suc, failed);
  },
  read_rh_change_alarm_status(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadRHChangeAlarmStatusOperation, "40", suc, failed);
  },
  read_rh_threshold(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadRHThresholdOperation, "3e", suc, failed);
  },
  read_rh_threshold_alarm_status(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadRHThresholdAlarmStatusOperation, "3d", suc, failed);
  },
  read_selftest_status(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_pir_taskReadSelftestStatusOperation, "5d", suc, failed);
  },
  read_software(suc?: SucBlock, failed?: FailedBlock) {
    readGatt(TaskOperationID.mk_pir_taskReadSoftwareOperation, "2A28", suc, failed);
  },
  read_temp_change_alarm_change_value_threshold(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadTempChangeAlarmChangeValueThresholdOperation, "3c", suc, failed);
  },
  read_temp_change_alarm_duration_condition(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadTempChangeAlarmDurationConditionOperation, "3b", suc, failed);
  },
  read_temp_change_alarm_status(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadTempChangeAlarmStatusOperation, "3a", suc, failed);
  },
  read_temp_threshold(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadTempThresholdOperation, "38", suc, failed);
  },
  read_temp_threshold_alarm_status(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadTempThresholdAlarmStatusOperation, "37", suc, failed);
  },
  read_th_datas(suc?: SucBlock, failed?: FailedBlock) {
    readControl(TaskOperationID.mk_pir_taskReadTHDatasSensorDatasOperation, "5a", suc, failed);
  },
  read_time_zone(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadTimeZoneOperation, "43", suc, failed);
  },
  read_tx_power(suc?: SucBlock, failed?: FailedBlock) {
    readParams(TaskOperationID.mk_pir_taskReadTxPowerOperation, "25", suc, failed);
  },
};

export default PIRInterface;
