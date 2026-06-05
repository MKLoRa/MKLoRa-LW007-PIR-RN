/** LW007-PIR SDK 常量（对齐 MKPIRSDK / LW007 协议 V1.2.1） */

export enum CentralManagerStatus {
  Unknown = 0,
  Enable = 1,
  Disable = 2,
}

export enum CentralConnectStatus {
  Unknown = 0,
  Connecting = 1,
  Connected = 2,
  ConnectedFailed = 3,
  Disconnect = 4,
}

export const PROTOCOL = {
  /** 扫描过滤 Service UUID（原生 scanForPeripheralsWithServices:AA05） */
  SCAN_SERVICE: 'AA05',
  SCAN_SERVICE_UUIDS: ['AA05'] as const,
  /** 广播 manufacturer 回应包头（小端 05AA） */
  MANUFACTURER_HEADER: '05aa',
  MANUFACTURER_DATA_LEN: 16,
  SERVICE_CONTROL: 'AA00',
  CHAR_PASSWORD: 'AA00',
  CHAR_DISCONNECT: 'AA01',
  CHAR_PIR_NOTIFY: 'AA02',
  CHAR_DOOR_NOTIFY: 'AA03',
  CHAR_TH_NOTIFY: 'AA04',
  /** 设备配置参数 AA05 */
  CHAR_PARAMS: 'AA05',
  /** 设备状态/控制 AA06 */
  CHAR_CONTROL: 'AA06',
  CHAR_LOG: 'AA07',
  DIS_SERVICE: '180A',
} as const;

/** 扫描列表模型（对齐 MKPIRCentralManager parseModel） */
export type ScannedDeviceModel = {
  id: string;
  deviceName: string;
  macAddress: string;
  rssi: number;
  deviceType: string;
  pirSensitivity: string;
  pirInductionState: string;
  doorSensorState: string;
  lowPower: boolean;
  lowPowerAlarmEnabled: boolean;
  temperature: string;
  humidity: string;
  battery: string;
  needPassword: boolean;
  connectable: boolean;
  txPower: number;
};

export enum LoRaWanRegion {
  AS923 = 0,
  AU915 = 1,
  CN470 = 2,
  CN779 = 3,
  EU433 = 4,
  EU868 = 5,
  KR920 = 6,
  IN865 = 7,
  US915 = 8,
  RU864 = 9,
  AS923_1 = 10,
  AS923_2 = 11,
  AS923_3 = 12,
  AS923_4 = 13,
}

/** 对齐 mk_pir_loraWanModem（配置 API 用 0/1，设备读取值为 1=ABP / 2=OTAA） */
export enum LoRaWanModem {
  ABP = 0,
  OTAA = 1,
}

export enum LoRaWanMessageType {
  Unconfirm = 0,
  Confirm = 1,
}

/** 对齐 mk_pir_txPower（slider 0~8） */
export enum TxPower {
  Neg40dBm = 0,
  Neg20dBm = 1,
  Neg16dBm = 2,
  Neg12dBm = 3,
  Neg8dBm = 4,
  Neg4dBm = 5,
  ZerodBm = 6,
  Pos3dBm = 7,
  Pos4dBm = 8,
}
