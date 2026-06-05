import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import TabScreenLayout from '../components/TabScreenLayout';
import NormalTextCell from '../components/cells/NormalTextCell';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import ButtonNoteCell from '../components/cells/ButtonNoteCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import {useTabBackToScan} from '../hooks/useTabBackToScan';
import {TIME_ZONE_LIST} from '../constants/timeZones';
import {
  batteryResetDevice,
  configDeviceTimeZone,
  configLowPowerPayload,
  factoryResetDevice,
  powerOffDevice,
  readDeviceSettings,
} from '../utils/deviceSettingsApi';
import {apiErrorMessage} from '../utils/pirApi';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** 对齐 MKPIRDeviceSettingController 六段功能 */
const DeviceSettingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const onBack = useTabBackToScan();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyText, setBusyText] = useState('Reading...');
  const [timeZone, setTimeZone] = useState(24);
  const [lowPowerPayload, setLowPowerPayload] = useState(false);
  const [powerOffSwitch, setPowerOffSwitch] = useState(false);
  const [timezonePicker, setTimezonePicker] = useState(false);

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readDeviceSettings();
      if (!cancelled()) {
        setTimeZone(data.timeZoneIndex);
        setLowPowerPayload(data.lowPowerPayload);
        setPowerOffSwitch(false);
      }
    } catch (e) {
      if (!cancelled()) {
        showToast(apiErrorMessage(e));
      }
    } finally {
      if (!cancelled()) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      readData(() => cancelled);
      return () => {
        cancelled = true;
      };
    }, [readData]),
  );

  const overlayBusy = loading || saving;

  const runBusy = async (
    text: string,
    action: () => Promise<void>,
    onError?: () => void,
  ) => {
    setBusyText(text);
    setSaving(true);
    try {
      await action();
    } catch (e) {
      showToast(apiErrorMessage(e));
      onError?.();
    } finally {
      setSaving(false);
      setBusyText('Reading...');
    }
  };

  const onTimeZoneSelect = async (index: number) => {
    setTimeZone(index);
    setTimezonePicker(false);
    await runBusy('Config...', async () => {
      await configDeviceTimeZone(index);
      showToast('Success');
    }, () => readData(() => false));
  };

  const onLowPowerPayloadChange = async (isOn: boolean) => {
    if (overlayBusy) {
      return;
    }
    setLowPowerPayload(isOn);
    await runBusy('Config...', async () => {
      await configLowPowerPayload(isOn);
      showToast('Success');
    }, () => setLowPowerPayload(!isOn));
  };

  const onPowerOffChange = (isOn: boolean) => {
    if (overlayBusy) {
      return;
    }
    if (!isOn) {
      setPowerOffSwitch(false);
      return;
    }
    setPowerOffSwitch(true);
    Alert.alert(
      'Warning!',
      'Are you sure to turn off the device? Please make sure the device has a button to turn on!',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setPowerOffSwitch(false),
        },
        {
          text: 'OK',
          onPress: () => {
            void runBusy('Setting...', async () => {
              await powerOffDevice();
            });
          },
        },
      ],
    );
  };

  const factoryReset = () => {
    Alert.alert(
      'Factory Reset',
      'After factory reset,all the data will be reseted to the factory values.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'OK',
          onPress: () => {
            void runBusy('Setting...', async () => {
              await factoryResetDevice();
            });
          },
        },
      ],
    );
  };

  const batteryReset = () => {
    Alert.alert('Warning!', 'Are you sure to reset battery?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'OK',
        onPress: () => {
          void runBusy('Setting...', async () => {
            await batteryResetDevice();
            await readData(() => false);
          });
        },
      },
    ]);
  };

  return (
    <TabScreenLayout
      title="Device Settings"
      onBack={onBack}
      loading={loading}
      saving={saving}
      loadingText={busyText}
      backgroundColor="#F2F2F2">
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <PickerButtonCell
            label="Current Time Zone"
            value={TIME_ZONE_LIST[timeZone] ?? TIME_ZONE_LIST[24]}
            onPress={() => !overlayBusy && setTimezonePicker(true)}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Low Power Payload"
            value={lowPowerPayload}
            onValueChange={onLowPowerPayloadChange}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Power Off"
            value={powerOffSwitch}
            onValueChange={onPowerOffChange}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="Factory Reset"
            showArrow
            onPress={overlayBusy ? undefined : factoryReset}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="Device Information"
            showArrow
            onPress={
              overlayBusy ? undefined : () => navigation.navigate('DeviceInfo')
            }
          />
        </View>
        <SectionSpacer />
        <ButtonNoteCell
          label="Battery Reset"
          buttonTitle="Reset"
          note='*After replace with the new battery, need to click "Reset", otherwise the low power prompt will be unnormal.'
          disabled={overlayBusy}
          onPress={batteryReset}
        />
        <View style={styles.bottom} />
      </KeyboardFormScrollView>

      <OptionPickerModal
        visible={timezonePicker}
        title="Current Time Zone"
        options={TIME_ZONE_LIST}
        selectedIndex={timeZone}
        onSelect={onTimeZoneSelect}
        onDismiss={() => setTimezonePicker(false)}
      />
    </TabScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
  bottom: {height: 24},
});

export default DeviceSettingScreen;
