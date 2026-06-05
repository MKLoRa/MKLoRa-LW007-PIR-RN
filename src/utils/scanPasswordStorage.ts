import AsyncStorage from '@react-native-async-storage/async-storage';

/** 对齐 iOS MKPIRScanController localPasswordKey */
const PASSWORD_KEY = 'mk_pir_passwordKey';

export async function loadSavedPassword(): Promise<string> {
  const value = await AsyncStorage.getItem(PASSWORD_KEY);
  return value ?? '';
}

export async function savePassword(password: string): Promise<void> {
  await AsyncStorage.setItem(PASSWORD_KEY, password);
}
