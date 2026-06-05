import {ScannedDeviceModel} from '../sdk/PIRSDKDefines';

export interface ScanListItem extends ScannedDeviceModel {
  scanTime: string;
  lastScanDate: number;
}
