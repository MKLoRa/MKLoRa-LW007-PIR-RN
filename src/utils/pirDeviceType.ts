import PIRConnectModel from '../sdk/PIRConnectModel';

/**
 * 扫描广播 AA05 Service Data 十六进制字符串 → 设备类型整数。
 * 对齐 MKPIRConnectModel.m `[deviceType integerValue]`（十进制前缀解析，非 hex）。
 * 文档约定：旧设备 "00"→0，新设备 V2 "01"→1。
 */
export function pirDeviceTypeFromScanHex(hex: string): number {
  const trimmed = (hex || '00').trim();
  if (!trimmed) {
    return 0;
  }
  const n = parseInt(trimmed, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** 新设备 V2（LW007-PIR 扩展协议） */
export function isNewPirDeviceType(type: number): boolean {
  return type === 1;
}

/** 当前已连接设备的类型判断（对齐 MKPIRConnectModel.deviceType == 1） */
export function isNewDeviceType(): boolean {
  return isNewPirDeviceType(PIRConnectModel.shared().deviceType);
}
