/**
 * LW007-PIR 扫描广播解析（对齐 MKPIRCentralManager.m parseModelWithRssi）
 */
import {Platform} from 'react-native';
import {Device} from 'react-native-ble-plx';
import {PROTOCOL, type ScannedDeviceModel} from '../sdk/PIRSDKDefines';
import {
  binaryByHex,
  getDecimalWithHex,
  hexStringFromData,
  signedHexTurnString,
} from './BleHexUtils';
import {base64ToBytes, utf8Decode} from './base64';

export const PIR_CONTENT_HEX_LEN = (PROTOCOL.MANUFACTURER_DATA_LEN - 2) * 2;

export function getPirScanServiceUuids(): string[] {
  return [...PROTOCOL.SCAN_SERVICE_UUIDS];
}

/** iOS 按 AA05 过滤（对齐 MKPIRCentralManager.m）；Android 全扫 + manufacturer 解析（对齐 MP） */
export function getPirScanServiceFilter(): string[] | null {
  return Platform.OS === 'ios' ? getPirScanServiceUuids() : null;
}

export function bytesFromManufacturerField(raw: unknown): Uint8Array | null {
  if (typeof raw === 'string') {
    const bytes = base64ToBytes(raw);
    return bytes.length > 0 ? bytes : null;
  }
  if (raw instanceof Uint8Array) {
    return raw.length > 0 ? raw : null;
  }
  if (Array.isArray(raw)) {
    const bytes = Uint8Array.from(raw);
    return bytes.length > 0 ? bytes : null;
  }
  return null;
}

export function normalizePirManufacturerBytes(bytes: Uint8Array): Uint8Array | null {
  let slice = bytes;
  if (bytes.length > PROTOCOL.MANUFACTURER_DATA_LEN) {
    slice = bytes.subarray(0, PROTOCOL.MANUFACTURER_DATA_LEN);
  }
  if (slice.length === PROTOCOL.MANUFACTURER_DATA_LEN) {
    const hex = hexStringFromData(slice);
    return hex.startsWith(PROTOCOL.MANUFACTURER_HEADER) ? slice : null;
  }
  if (bytes.length === PROTOCOL.MANUFACTURER_DATA_LEN - 2) {
    const out = new Uint8Array(PROTOCOL.MANUFACTURER_DATA_LEN);
    out[0] = 0x05;
    out[1] = 0xaa;
    out.set(bytes, 2);
    const hex = hexStringFromData(out);
    return hex.startsWith(PROTOCOL.MANUFACTURER_HEADER) ? out : null;
  }
  return null;
}

function contentHexFromManufacturer(bytes: Uint8Array): string | null {
  if (bytes.length !== PROTOCOL.MANUFACTURER_DATA_LEN) {
    return null;
  }
  const hex = hexStringFromData(bytes);
  if (hex.substring(0, 4).toLowerCase() !== PROTOCOL.MANUFACTURER_HEADER) {
    return null;
  }
  const content = hex.substring(4);
  return content.length >= PIR_CONTENT_HEX_LEN ? content : null;
}

function extractManufacturerFromIosBlePlxJson(
  rawScanRecord: string,
): Uint8Array | null {
  if (Platform.OS !== 'ios') {
    return null;
  }
  try {
    const jsonText = utf8Decode(base64ToBytes(rawScanRecord));
    const payload = JSON.parse(jsonText) as {manufacturerData?: unknown};
    const nested = bytesFromManufacturerField(payload.manufacturerData);
    if (!nested) {
      return null;
    }
    return (
      normalizePirManufacturerBytes(nested) ??
      (nested.length === PROTOCOL.MANUFACTURER_DATA_LEN ? nested : null)
    );
  } catch {
    return null;
  }
}

export function extractManufacturerFromRawScanRecord(
  rawScanRecord: string,
): Uint8Array | null {
  const raw = base64ToBytes(rawScanRecord);
  let offset = 0;
  while (offset < raw.length) {
    const len = raw[offset];
    if (len === 0) {
      break;
    }
    if (offset + 1 + len > raw.length) {
      break;
    }
    const type = raw[offset + 1];
    if (type === 0xff) {
      const mfg = raw.subarray(offset + 2, offset + 1 + len);
      const normalized = normalizePirManufacturerBytes(mfg);
      if (normalized) {
        return normalized;
      }
    }
    offset += len + 1;
  }
  return null;
}

function getPirManufacturerBytes(device: Device): Uint8Array | null {
  if (Platform.OS === 'ios' && device.rawScanRecord) {
    const fromJson = extractManufacturerFromIosBlePlxJson(device.rawScanRecord);
    if (fromJson) {
      return fromJson;
    }
  }
  const fromField = bytesFromManufacturerField(device.manufacturerData);
  if (fromField) {
    const normalized =
      normalizePirManufacturerBytes(fromField) ??
      (fromField.length === PROTOCOL.MANUFACTURER_DATA_LEN ? fromField : null);
    if (normalized) {
      return normalized;
    }
  }
  if (device.rawScanRecord && Platform.OS === 'android') {
    return extractManufacturerFromRawScanRecord(device.rawScanRecord);
  }
  return null;
}

export function extractPirManufacturerBytes(device: Device): Uint8Array | null {
  return getPirManufacturerBytes(device);
}

function shortServiceUuid(uuid: string): string {
  const normalized = uuid.replace(/-/g, '').toUpperCase();
  return normalized.length >= 8 ? normalized.substring(4, 8) : normalized;
}

/** 广播 0x16 Service Data AA05 → 设备类型（对齐 MKPIRCentralManager.m） */
export function extractPirDeviceTypeHex(device: Device): string {
  const serviceData = device.serviceData;
  if (!serviceData) {
    return '';
  }
  for (const [uuid, encoded] of Object.entries(serviceData)) {
    if (shortServiceUuid(uuid) !== PROTOCOL.SCAN_SERVICE) {
      continue;
    }
    return hexStringFromData(base64ToBytes(encoded));
  }
  return '';
}

export function parsePirScanDevice(
  device: Device,
  rssi: number,
  manufacturerBytes: Uint8Array | null,
  deviceTypeHex = '',
): ScannedDeviceModel | null {
  if (!manufacturerBytes) {
    return null;
  }
  const normalized = normalizePirManufacturerBytes(manufacturerBytes);
  if (!normalized) {
    return null;
  }
  const content = contentHexFromManufacturer(normalized);
  if (!content) {
    return null;
  }

  const stateHex = content.substring(0, 2);
  const binary = binaryByHex(stateHex);
  const pirSensitivity = binary.substring(6, 8);
  const pirInductionState = binary.substring(4, 6);
  const doorSensorState = binary.substring(2, 4);
  const lowPower = binary.charAt(1) === '1';
  const lowPowerAlarmEnabled = binary.charAt(0) === '1';

  let temperature = '—';
  const tempHex = content.substring(2, 6);
  if (tempHex.toLowerCase() !== 'ffff') {
    const v = getDecimalWithHex(tempHex, 0, 4);
    temperature = `${(v * 0.1 - 30).toFixed(1)}`;
  }

  let humidity = '—';
  const humHex = content.substring(6, 10);
  if (humHex.toLowerCase() !== 'ffff') {
    const v = getDecimalWithHex(humHex, 0, 4);
    humidity = `${(v * 0.1).toFixed(1)}`;
  }

  const batteryVal = getDecimalWithHex(content, 10, 2);
  const battery = `${(batteryVal * 0.1 + 2.2).toFixed(1)}`;

  const txPower = parseInt(signedHexTurnString(content.substring(12, 14)), 10);
  const tempMac = content.substring(14, 26).toUpperCase();
  const macAddress = [
    tempMac.slice(0, 2),
    tempMac.slice(2, 4),
    tempMac.slice(4, 6),
    tempMac.slice(6, 8),
    tempMac.slice(8, 10),
    tempMac.slice(10, 12),
  ].join(':');

  const pwdBinary = binaryByHex(content.substring(26, 28));
  const needPassword = pwdBinary.charAt(7) === '1';

  return {
    id: device.id,
    rssi,
    deviceName: device.localName ?? device.name ?? '',
    macAddress,
    deviceType: deviceTypeHex,
    pirSensitivity,
    pirInductionState,
    doorSensorState,
    lowPower,
    lowPowerAlarmEnabled,
    temperature,
    humidity,
    battery,
    needPassword,
    connectable: device.isConnectable ?? true,
    txPower,
  };
}
