export type MainTabParamList = {
  LORA: undefined;
  GENERAL: undefined;
  BLE: undefined;
  DEVICE: undefined;
};

export type RootStackParamList = {
  Scan: undefined;
  MainTabs: undefined;
  LoRaSettings: undefined;
  LoRaApp: undefined;
  PirSettings: undefined;
  HallSettings: undefined;
  THSettings: undefined;
  DeviceInfo: undefined;
  Update: undefined;
  Debugger: {macAddress?: string} | undefined;
  BatteryConsumption: undefined;
  Selftest: undefined;
  About: undefined;
};
