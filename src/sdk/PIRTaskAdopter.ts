/**
 * PIRTaskAdopter — TypeScript port of MKPIRTaskAdopter.m
 */

import {
  hexStringFromData,
  getDecimalWithHex,
  getDecimalStringWithHex,
  signedHexTurnString,
} from '../utils/BleHexUtils';
import {TaskOperationID} from './TaskOperationID';
import {fetchTxPowerValueString} from './PIRSDKDataAdopter';
import {utf8Decode} from '../utils/base64';

export type TaskParseResult =
  | {operationID: TaskOperationID; result: Record<string, unknown>}
  | {};

function normalizeUuid(uuid: string): string {
  return uuid.replace(/-/g, '').toUpperCase();
}

function hexSubstring(hex: string, start: number, length: number): string {
  return hex.substring(start, start + length);
}

function utf8StringFromData(data: Uint8Array, start: number): string {
  try {
    return utf8Decode(data, start);
  } catch {
    return '';
  }
}

function isValidStr(value: string | null | undefined): boolean {
  return typeof value === 'string' && value !== '';
}

function dataParserGetDataSuccess(
  returnData: Record<string, unknown> | null | undefined,
  operationID: TaskOperationID,
): TaskParseResult {
  if (!returnData) {
    return {};
  }
  return {operationID, result: returnData};
}

/** MP 帧：ED + FLAG(1) + CMD(1) + LEN(1) + DATA */
function parseCustomData(readData: Uint8Array): TaskParseResult {
  const readString = hexStringFromData(readData);
  if (!readString.startsWith('ed')) {
    return {};
  }
  const dataLen = getDecimalWithHex(readString, 6, 2);
  if (readData.length !== dataLen + 4) {
    return {};
  }
  const flag = readString.substring(2, 4);
  const cmd = readString.substring(4, 6);
  const content = readString.substring(8, 8 + dataLen * 2);
  if (flag === '00') {
    return parseCustomReadData(content, cmd, readData);
  }
  if (flag === '01') {
    return parseCustomConfigData(content, cmd);
  }
  return {};
}

function parsePirBatteryPayload(content: string): Record<string, unknown> {
  if (content.length === 48) {
    let index = 0;
    const take = (len: number) => {
      const v = getDecimalStringWithHex(content, index, len);
      index += len;
      return v;
    };
    return {
      workTimes: take(8),
      advCount: take(8),
      thSamplingCount: take(8),
      loraPowerConsumption: take(8),
      loraSendCount: take(8),
      batteryPower: take(8),
      pirWorkTimes: '',
      doorMagneticTriggerCloseTimes: '',
      doorMagneticTriggerOpenTimes: '',
    };
  }
  let index = 0;
  const take = (len: number) => {
    const v = getDecimalStringWithHex(content, index, len);
    index += len;
    return v;
  };
  return {
    workTimes: take(8),
    advCount: take(8),
    thSamplingCount: take(8),
    pirWorkTimes: take(8),
    doorMagneticTriggerCloseTimes: take(8),
    doorMagneticTriggerOpenTimes: take(8),
    loraSendCount: take(8),
    loraPowerConsumption: take(8),
    batteryPower: take(8),
  };
}

function parseCustomReadData(
  content: string,
  cmd: string,
  data: Uint8Array,
): TaskParseResult {
  let operationID = TaskOperationID.mk_pir_defaultTaskOperationID;
  let result: Record<string, unknown> = {};


      if (cmd === '01') {
          result = {
              region:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadLorawanRegionOperation;
      }else if (cmd === '02') {
          result = {
              modem:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadLorawanModemOperation;
      }else if (cmd === '03') {
          result = {devEUI:content};
          operationID = TaskOperationID.mk_pir_taskReadLorawanDEVEUIOperation;
      }else if (cmd === '04') {
          result = {appEUI:content};
          operationID = TaskOperationID.mk_pir_taskReadLorawanAPPEUIOperation;
      }else if (cmd === '05') {
          result = {appKey:content};
          operationID = TaskOperationID.mk_pir_taskReadLorawanAPPKEYOperation;
      }else if (cmd === '06') {
          result = {devAddr:content};
          operationID = TaskOperationID.mk_pir_taskReadLorawanDEVADDROperation;
      }else if (cmd === '07') {
          result = {appSkey:content};
          operationID = TaskOperationID.mk_pir_taskReadLorawanAPPSKEYOperation;
      }else if (cmd === '08') {
          result = {nwkSkey:content};
          operationID = TaskOperationID.mk_pir_taskReadLorawanNWKSKEYOperation;
      }else if (cmd === '09') {
          result = {
              messageType:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadLorawanMessageTypeOperation;
      }else if (cmd === '0a') {
          result = {
              number:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadLorawanMaxRetransmissionTimesOperation;
      }else if (cmd === '0b') {
          result = {
              CHL:getDecimalStringWithHex(content, 0, 2),
              CHH:getDecimalStringWithHex(content, 2, 2),
          };
          operationID = TaskOperationID.mk_pir_taskReadLorawanCHOperation;
      }else if (cmd === '0c') {
          result = {
              DR:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadLorawanDROperation;
      }else if (cmd === '0d') {
          const isOn = hexSubstring(content, 0, 2) === '01';
          result = {
              isOn:isOn,
              DRL:getDecimalStringWithHex(content, 2, 2),
              DRH:getDecimalStringWithHex(content, 4, 2),
          };
          operationID = TaskOperationID.mk_pir_taskReadLorawanUplinkStrategyOperation;
      }else if (cmd === '0e') {
          const isOn = content === '01';
          result = {isOn:isOn};
          operationID = TaskOperationID.mk_pir_taskReadLorawanDutyCycleStatusOperation;
      }else if (cmd === '0f') {
          result = {
              interval:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadLorawanDevTimeSyncIntervalOperation;
      }else if (cmd === '10') {
          result = {
              interval:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadLorawanNetworkCheckIntervalOperation;
      }else if (cmd === '11') {
          const isOn = content === '01';
          result = {isOn:isOn};
          operationID = TaskOperationID.mk_pir_taskReadEU868SingleChannelStatusOperation;
      }else if (cmd === '12') {
          result = {
              channel:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadEU868SingleChannelSelectionOperation;
      }else if (cmd === '20') {
          const isOn = content === '01';
          result = {isOn:isOn};
          operationID = TaskOperationID.mk_pir_taskReadBeaconModeStatusOperation;
      }else if (cmd === '21') {
          result = {
              interval:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadAdvIntervalOperation;
      }else if (cmd === '22') {
          const connectable = content === '01';
          result = {connectable:connectable};
          operationID = TaskOperationID.mk_pir_taskReadDeviceConnectableOperation;
      }else if (cmd === '23') {
          result = {
              timeout:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadBroadcastTimeoutOperation;
      }else if (cmd === '24') {
          const need = content === '01';
          result = {need:need};
          operationID = TaskOperationID.mk_pir_taskReadConnectationNeedPasswordOperation;
      }else if (cmd === '25') {
          const txPower = fetchTxPowerValueString(content);
          result = {txPower:txPower};
          operationID = TaskOperationID.mk_pir_taskReadTxPowerOperation;
      }else if (cmd === '26') {
          const deviceName = utf8StringFromData(data, 4);
          result = {
              deviceName:(isValidStr(deviceName) ? deviceName : ''),
          };
          operationID = TaskOperationID.mk_pir_taskReadDeviceNameOperation;
      }else if (cmd === '30') {
          const isOn = content === '01';
          result = {isOn:isOn};
          operationID = TaskOperationID.mk_pir_taskReadPIRFunctionStatusOperation;
      }else if (cmd === '31') {
          result = {
              interval:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadPIRReportIntervalOperation;
      }else if (cmd === '32') {
          const value = getDecimalWithHex(content, 0, content.length) - 1;
          result = {value:String(value)};
          operationID = TaskOperationID.mk_pir_taskReadPIRSensitivityOperation;
      }else if (cmd === '33') {
          const value = getDecimalWithHex(content, 0, content.length) - 1;
          result = {value:String(value)};
          operationID = TaskOperationID.mk_pir_taskReadPIRDelayTimeOperation;
      }else if (cmd === '34') {
          const isOn = content === '01';
          result = {isOn:isOn};
          operationID = TaskOperationID.mk_pir_taskReadDoorSensorSwitchStatusOperation;
      }else if (cmd === '35') {
          const isOn = content === '01';
          result = {isOn:isOn};
          operationID = TaskOperationID.mk_pir_taskReadHTSwitchStatusOperation;
      }else if (cmd === '36') {
          result = {
              interval:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadHTSampleRateOperation;
      }else if (cmd === '37') {
          const isOn = content === '01';
          result = {isOn:isOn};
          operationID = TaskOperationID.mk_pir_taskReadTempThresholdAlarmStatusOperation;
      }else if (cmd === '38') {
          result = {
              minValue:signedHexTurnString(hexSubstring(content, 0, 2)),
              maxValue:signedHexTurnString(hexSubstring(content, 2, 2)),
          };
          operationID = TaskOperationID.mk_pir_taskReadTempThresholdOperation;
      }else if (cmd === '3a') {
          const isOn = content === '01';
          result = {isOn:isOn};
          operationID = TaskOperationID.mk_pir_taskReadTempChangeAlarmStatusOperation;
      }else if (cmd === '3b') {
          result = {
              duration:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadTempChangeAlarmDurationConditionOperation;
      }else if (cmd === '3c') {
          result = {
              threshold:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadTempChangeAlarmChangeValueThresholdOperation;
      }else if (cmd === '3d') {
          const isOn = content === '01';
          result = {isOn:isOn};
          operationID = TaskOperationID.mk_pir_taskReadRHThresholdAlarmStatusOperation;
      }else if (cmd === '3e') {
          result = {
              minValue:getDecimalStringWithHex(content, 0, 2),
              maxValue:getDecimalStringWithHex(content, 2, 2),
          };
          operationID = TaskOperationID.mk_pir_taskReadRHThresholdOperation;
      }else if (cmd === '40') {
          const isOn = content === '01';
          result = {isOn:isOn};
          operationID = TaskOperationID.mk_pir_taskReadRHChangeAlarmStatusOperation;
      }else if (cmd === '41') {
          result = {
              duration:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadRHChangeAlarmDurationConditionOperation;
      }else if (cmd === '42') {
          result = {
              threshold:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadRHChangeAlarmChangeValueThresholdOperation;
      }else if (cmd === '43') {
          result = {
              timeZone:signedHexTurnString(content),
          };
          operationID = TaskOperationID.mk_pir_taskReadTimeZoneOperation;
      }else if (cmd === '44') {
          const password = utf8StringFromData(data, 4);
          result = {
              password:(isValidStr(password) ? password : ''),
          };
          operationID = TaskOperationID.mk_pir_taskReadPasswordOperation;
      }else if (cmd === '46') {
          result = {
              interval:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadHeartbeatIntervalOperation;
      }else if (cmd === '47') {
          result = {
              value:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadLowPowerPromptOperation;
      }else if (cmd === '48') {
          const isOn = content === '01';
          result = {isOn:isOn};
          operationID = TaskOperationID.mk_pir_taskReadLowPowerPayloadOperation;
      }else if (cmd === '4b') {
          result = {
              threshold:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadLowPowerCondition1VoltageThresholdOperation;
      }else if (cmd === '4c') {
          result = {
              interval:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadLowPowerCondition1MinSampleIntervalOperation;
      }else if (cmd === '4d') {
          result = {
              times:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadLowPowerCondition1SampleTimesOperation;
      }else if (cmd === '54') {
          result = {
              status:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadLorawanNetworkStatusOperation;
      }else if (cmd === '56') {
          result = {
              voltage:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadBatteryVoltageOperation;
      }else if (cmd === '57') {
          const macAddress = `${hexSubstring(content, 0, 2)}:${hexSubstring(content, 2, 2)}:${hexSubstring(content, 4, 2)}:${hexSubstring(content, 6, 2)}:${hexSubstring(content, 8, 2)}:${hexSubstring(content, 10, 2)}`;
          result = {macAddress: macAddress.toUpperCase()};
          operationID = TaskOperationID.mk_pir_taskReadMacAddressOperation;
      }else if (cmd === '58') {
          const detected = content === '01';
          result = {detected:detected};
          operationID = TaskOperationID.mk_pir_taskReadPIRStatusOperation;
      }else if (cmd === '59') {
          const open = hexSubstring(content, 0, 2) === '01';
          const times = getDecimalStringWithHex(content, 2, 4);
          result = {
              open:open,
              times:times,
              doorStatus:open ? '1' : '0',
          };
          operationID = TaskOperationID.mk_pir_taskReadDoorSensorDatasOperation;
      }else if (cmd === '5a') {
          const temp = getDecimalWithHex(content, 0, 4);
          const rh = getDecimalWithHex(content, 4, 4);
          result = {
              temperature: `${(temp * 0.1 - 30).toFixed(1)}`,
              humidity: `${(rh * 0.1).toFixed(1)}`,
          };
          operationID = TaskOperationID.mk_pir_taskReadTHDatasSensorDatasOperation;
      }else if (cmd === '5c') {
          result = {
              status:getDecimalStringWithHex(content, 0, content.length),
          };
          operationID = TaskOperationID.mk_pir_taskReadPCBAStatusOperation;
      }else if (cmd === '5d') {
          result = {status: content};
          operationID = TaskOperationID.mk_pir_taskReadSelftestStatusOperation;
      }else if (cmd === '5e') {
          result = parsePirBatteryPayload(content);
          operationID = TaskOperationID.mk_pir_taskReadBatteryInformationOperation;
      }else if (cmd === '60') {
          result = parsePirBatteryPayload(content);
          operationID = TaskOperationID.mk_pir_taskReadLastCycleBatteryInformationOperation;
      }else if (cmd === '61') {
          result = parsePirBatteryPayload(content);
          operationID = TaskOperationID.mk_pir_taskReadAllCycleBatteryInformationOperation;
      }else if (cmd === '68') {
          const macAddress = `${hexSubstring(content, 0, 2)}:${hexSubstring(content, 2, 2)}:${hexSubstring(content, 4, 2)}:${hexSubstring(content, 6, 2)}:${hexSubstring(content, 8, 2)}:${hexSubstring(content, 10, 2)}`;
          result = {macAddress: macAddress.toUpperCase()};
          operationID = TaskOperationID.mk_pir_taskReadMacAddressOperation;
      }

  return dataParserGetDataSuccess(result, operationID);
}

function parseCustomConfigData(content: string, cmd: string): TaskParseResult {
  let operationID = TaskOperationID.mk_pir_defaultTaskOperationID;
  const success = content === '01';

      if (cmd === '01') {
          operationID = TaskOperationID.mk_pir_taskConfigRegionOperation;
      }else if (cmd === '02') {
          operationID = TaskOperationID.mk_pir_taskConfigModemOperation;
      }else if (cmd === '03') {
          operationID = TaskOperationID.mk_pir_taskConfigDEVEUIOperation;
      }else if (cmd === '04') {
          operationID = TaskOperationID.mk_pir_taskConfigAPPEUIOperation;
      }else if (cmd === '05') {
          operationID = TaskOperationID.mk_pir_taskConfigAPPKEYOperation;
      }else if (cmd === '06') {
          operationID = TaskOperationID.mk_pir_taskConfigDEVADDROperation;
      }else if (cmd === '07') {
          operationID = TaskOperationID.mk_pir_taskConfigAPPSKEYOperation;
      }else if (cmd === '08') {
          operationID = TaskOperationID.mk_pir_taskConfigNWKSKEYOperation;
      }else if (cmd === '09') {
          operationID = TaskOperationID.mk_pir_taskConfigMessageTypeOperation;
      }else if (cmd === '0a') {
          operationID = TaskOperationID.mk_pir_taskConfigMaxRetransmissionTimesOperation;
      }else if (cmd === '0b') {
          operationID = TaskOperationID.mk_pir_taskConfigCHValueOperation;
      }else if (cmd === '0c') {
          operationID = TaskOperationID.mk_pir_taskConfigDRValueOperation;
      }else if (cmd === '0d') {
          operationID = TaskOperationID.mk_pir_taskConfigUplinkStrategyOperation;
      }else if (cmd === '0e') {
          operationID = TaskOperationID.mk_pir_taskConfigDutyCycleStatusOperation;
      }else if (cmd === '0f') {
          operationID = TaskOperationID.mk_pir_taskConfigTimeSyncIntervalOperation;
      }else if (cmd === '10') {
          operationID = TaskOperationID.mk_pir_taskConfigNetworkCheckIntervalOperation;
      }else if (cmd === '11') {
          operationID = TaskOperationID.mk_pir_taskConfigEU868SingleChannelStatusOperation;
      }else if (cmd === '12') {
          operationID = TaskOperationID.mk_pir_taskConfigEU868SingleChannelSelectionOperation;
      }else if (cmd === '20') {
          operationID = TaskOperationID.mk_pir_taskConfigBeaconModeStatusOperation;
      }else if (cmd === '21') {
          operationID = TaskOperationID.mk_pir_taskConfigAdvIntervalOperation;
      }else if (cmd === '22') {
          operationID = TaskOperationID.mk_pir_taskConfigConnectableStatusOperation;
      }else if (cmd === '23') {
          operationID = TaskOperationID.mk_pir_taskConfigBroadcastTimeoutOperation;
      }else if (cmd === '24') {
          operationID = TaskOperationID.mk_pir_taskConfigNeedPasswordOperation;
      }else if (cmd === '25') {
          operationID = TaskOperationID.mk_pir_taskConfigTxPowerOperation;
      }else if (cmd === '26') {
          operationID = TaskOperationID.mk_pir_taskConfigDeviceNameOperation;
      }else if (cmd === '30') {
          operationID = TaskOperationID.mk_pir_taskConfigPIRFunctionStatusOperation;
      }else if (cmd === '31') {
          operationID = TaskOperationID.mk_pir_taskConfigPIRReportIntervalOperation;
      }else if (cmd === '32') {
          operationID = TaskOperationID.mk_pir_taskConfigPIRSensitivityOperation;
      }else if (cmd === '33') {
          operationID = TaskOperationID.mk_pir_taskConfigPIRDelayTimeOperation;
      }else if (cmd === '34') {
          operationID = TaskOperationID.mk_pir_taskConfigDoorSensorSwitchStatusOperation;
      }else if (cmd === '35') {
          operationID = TaskOperationID.mk_pir_taskConfigHTSwitchStatusOperation;
      }else if (cmd === '36') {
          operationID = TaskOperationID.mk_pir_taskConfigHTSampleRateOperation;
      }else if (cmd === '37') {
          operationID = TaskOperationID.mk_pir_taskConfigTempThresholdAlarmStatusOperation;
      }else if (cmd === '38') {
          operationID = TaskOperationID.mk_pir_taskConfigTempThresholdOperation;
      }else if (cmd === '3a') {
          operationID = TaskOperationID.mk_pir_taskConfigTempChangeAlarmStatusOperation;
      }else if (cmd === '3b') {
          operationID = TaskOperationID.mk_pir_taskConfigTempChangeAlarmDurationConditionOperation;
      }else if (cmd === '3c') {
          operationID = TaskOperationID.mk_pir_taskConfigTempChangeAlarmChangeValueThresholdOperation;
      }else if (cmd === '3d') {
          operationID = TaskOperationID.mk_pir_taskConfigRHThresholdAlarmStatusOperation;
      }else if (cmd === '3e') {
          operationID = TaskOperationID.mk_pir_taskConfigRHThresholdOperation;
      }else if (cmd === '40') {
          operationID = TaskOperationID.mk_pir_taskConfigRHChangeAlarmStatusOperation;
      }else if (cmd === '41') {
          operationID = TaskOperationID.mk_pir_taskConfigRHChangeAlarmDurationConditionOperation;
      }else if (cmd === '42') {
          operationID = TaskOperationID.mk_pir_taskConfigRHChangeAlarmChangeValueThresholdOperation;
      }else if (cmd === '43') {
          operationID = TaskOperationID.mk_pir_taskConfigTimeZoneOperation;
      }else if (cmd === '44') {
          operationID = TaskOperationID.mk_pir_taskConfigPasswordOperation;
      }else if (cmd === '46') {
          operationID = TaskOperationID.mk_pir_taskConfigHeartbeatIntervalOperation;
      }else if (cmd === '47') {
          operationID = TaskOperationID.mk_pir_taskConfigLowPowerPromptOperation;
      }else if (cmd === '48') {
          operationID = TaskOperationID.mk_pir_taskConfigLowPowerPayloadOperation;
      }else if (cmd === '4b') {
          operationID = TaskOperationID.mk_pir_taskConfigLowPowerCondition1VoltageThresholdOperation;
      }else if (cmd === '4c') {
          operationID = TaskOperationID.mk_pir_taskConfigLowPowerCondition1MinSampleIntervalOperation;
      }else if (cmd === '4d') {
          operationID = TaskOperationID.mk_pir_taskConfigLowPowerCondition1SampleTimesOperation;
      }else if (cmd === '50') {
          operationID = TaskOperationID.mk_pir_taskRestartDeviceOperation;
      }else if (cmd === '51') {
          operationID = TaskOperationID.mk_pir_taskFactoryResetOperation;
      }else if (cmd === '52') {
          operationID = TaskOperationID.mk_pir_taskPowerOffOperation;
      }else if (cmd === '53') {
          operationID = TaskOperationID.mk_pir_taskConfigDeviceTimeOperation;
      }else if (cmd === '5f') {
          operationID = TaskOperationID.mk_pir_taskBatteryResetOperation;
      }

  return dataParserGetDataSuccess({success}, operationID);
}

export function parseReadDataWithCharacteristic(
  uuid: string,
  data: Uint8Array,
): TaskParseResult {
  const normalized = normalizeUuid(uuid);
  if (normalized === '2A24') {
    const modeID = utf8StringFromData(data, 0);
    return dataParserGetDataSuccess(
      {modeID},
      TaskOperationID.mk_pir_taskReadDeviceModelOperation,
    );
  }
  if (normalized === '2A26') {
    const firmware = utf8StringFromData(data, 0);
    return dataParserGetDataSuccess(
      {firmware},
      TaskOperationID.mk_pir_taskReadFirmwareOperation,
    );
  }
  if (normalized === '2A27') {
    const hardware = utf8StringFromData(data, 0);
    return dataParserGetDataSuccess(
      {hardware},
      TaskOperationID.mk_pir_taskReadHardwareOperation,
    );
  }
  if (normalized === '2A28') {
    const software = utf8StringFromData(data, 0);
    return dataParserGetDataSuccess(
      {software},
      TaskOperationID.mk_pir_taskReadSoftwareOperation,
    );
  }
  if (normalized === '2A29') {
    const manufacturer = utf8StringFromData(data, 0);
    return dataParserGetDataSuccess(
      {manufacturer},
      TaskOperationID.mk_pir_taskReadManufacturerOperation,
    );
  }
  if (normalized === 'AA00') {
    const hexContent = hexStringFromData(data);
    let state = '';
    if (hexContent.length === 10) {
      state = hexContent.substring(8, 10);
    }
    return dataParserGetDataSuccess(
      {state},
      TaskOperationID.mk_pir_connectPasswordOperation,
    );
  }
  if (normalized === 'AA05' || normalized === 'AA06') {
    return parseCustomData(data);
  }
  return {};
}

export function parseWriteDataWithCharacteristic(
  _uuid: string,
  _data: Uint8Array,
): TaskParseResult {
  return {};
}
