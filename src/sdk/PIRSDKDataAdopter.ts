/**
 * PIRSDKDataAdopter — 对齐 MKPIRSDKDataAdopter.m
 */

import {fetchHexValue} from '../utils/BleHexUtils';
import {LoRaWanRegion, TxPower} from './PIRSDKDefines';

export function lorawanRegionString(region: LoRaWanRegion): string {
  const map: Partial<Record<LoRaWanRegion, string>> = {
    [LoRaWanRegion.AS923]: '00',
    [LoRaWanRegion.AU915]: '01',
    [LoRaWanRegion.CN470]: '02',
    [LoRaWanRegion.CN779]: '03',
    [LoRaWanRegion.EU433]: '04',
    [LoRaWanRegion.EU868]: '05',
    [LoRaWanRegion.KR920]: '06',
    [LoRaWanRegion.IN865]: '07',
    [LoRaWanRegion.US915]: '08',
    [LoRaWanRegion.RU864]: '09',
    [LoRaWanRegion.AS923_1]: '0a',
    [LoRaWanRegion.AS923_2]: '0b',
    [LoRaWanRegion.AS923_3]: '0c',
    [LoRaWanRegion.AS923_4]: '0d',
  };
  return map[region] ?? '05';
}

export function fetchTxPower(txPower: TxPower): string {
  const map: Partial<Record<TxPower, string>> = {
    [TxPower.Pos4dBm]: '04',
    [TxPower.Pos3dBm]: '03',
    [TxPower.ZerodBm]: '00',
    [TxPower.Neg4dBm]: 'fc',
    [TxPower.Neg8dBm]: 'f8',
    [TxPower.Neg12dBm]: 'f4',
    [TxPower.Neg16dBm]: 'f0',
    [TxPower.Neg20dBm]: 'ec',
    [TxPower.Neg40dBm]: 'd8',
  };
  return map[txPower] ?? '00';
}

export function fetchTxPowerValueString(content: string): string {
  const map: Record<string, string> = {
    '08': '8dBm',
    '07': '7dBm',
    '06': '6dBm',
    '05': '5dBm',
    '04': '4dBm',
    '03': '3dBm',
    '02': '2dBm',
    '00': '0dBm',
    fc: '-4dBm',
    f8: '-8dBm',
    f4: '-12dBm',
    f0: '-16dBm',
    ec: '-20dBm',
    d8: '-40dBm',
  };
  return map[content.toLowerCase()] ?? `${content}dBm`;
}

export function passwordToHex(password: string): string {
  let hex = '';
  for (let i = 0; i < password.length; i++) {
    hex += fetchHexValue(password.charCodeAt(i), 1);
  }
  return hex;
}

