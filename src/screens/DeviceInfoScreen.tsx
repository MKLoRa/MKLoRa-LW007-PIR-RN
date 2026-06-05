import React, {useCallback, useRef, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import StackScreenLayout from '../components/StackScreenLayout';
import KeyboardFormScrollView from '../components/KeyboardFormScrollView';
import NormalTextCell from '../components/cells/NormalTextCell';
import InfoButtonCell from '../components/cells/InfoButtonCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {
  isNewDeviceType,
  readDeviceInfo,
  type DeviceInfoState,
} from '../utils/deviceInfoApi';
import {apiErrorMessage} from '../utils/pirApi';
import {showToast} from '../utils/toast';
import PIRConnectModel from '../sdk/PIRConnectModel';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const EMPTY: DeviceInfoState = {
  software: '',
  firmware: '',
  hardware: '',
  voltage: '',
  macAddress: '',
  productModel: '',
  manufacturer: '',
};

const DeviceInfoScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<DeviceInfoState>(EMPTY);
  const skipReadRef = useRef(false);
  const selftestTapRef = useRef(0);
  const selftestTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const readData = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    try {
      const data = await readDeviceInfo();
      if (!cancelled()) {
        setState(data);
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
      if (PIRConnectModel.shared().isDfuInProgress()) {
        PIRConnectModel.shared().setDfuInProgress(false);
        skipReadRef.current = true;
      }
      if (skipReadRef.current) {
        skipReadRef.current = false;
        return undefined;
      }
      let cancelled = false;
      readData(() => cancelled);
      return () => {
        cancelled = true;
      };
    }, [readData]),
  );

  const onSelftestTap = () => {
    selftestTapRef.current += 1;
    if (selftestTapTimerRef.current) {
      clearTimeout(selftestTapTimerRef.current);
    }
    if (selftestTapRef.current >= 3) {
      selftestTapRef.current = 0;
      navigation.navigate('Selftest');
      return;
    }
    selftestTapTimerRef.current = setTimeout(() => {
      selftestTapRef.current = 0;
    }, 600);
  };

  return (
    <Pressable style={styles.root} onPress={onSelftestTap}>
    <StackScreenLayout
      title="Device Information"
      onBack={() => navigation.goBack()}
      loading={loading}>
      <KeyboardFormScrollView style={styles.scroll}>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="Software Version"
            value={state.software || undefined}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <InfoButtonCell
            label="Firmware Version"
            value={state.firmware || undefined}
            buttonTitle="DFU"
            onPress={() => navigation.navigate('Update')}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="Hardware Version"
            value={state.hardware || undefined}
          />
        </View>
        {isNewDeviceType() ? (
          <>
            <SectionSpacer />
            <View style={styles.group}>
              <NormalTextCell
                label="Battery Voltage"
                value={state.voltage || undefined}
              />
            </View>
          </>
        ) : null}
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="MAC Address"
            value={state.macAddress || undefined}
          />
          <View style={styles.line} />
          <NormalTextCell
            label="Product Model"
            value={state.productModel || undefined}
          />
          <View style={styles.line} />
          <NormalTextCell
            label="Manufacturer"
            value={state.manufacturer || undefined}
          />
        </View>
        {isNewDeviceType() ? (
          <>
            <SectionSpacer />
            <View style={styles.group}>
              <NormalTextCell
                label="Battery Consumption Information"
                showArrow
                onPress={() => navigation.navigate('BatteryConsumption')}
              />
            </View>
          </>
        ) : null}
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="Debugger Mode"
            showArrow
            onPress={() =>
              navigation.navigate('Debugger', {macAddress: state.macAddress})
            }
          />
        </View>
        <View style={styles.bottom} />
      </KeyboardFormScrollView>
    </StackScreenLayout>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#eee',
    marginLeft: 15,
  },
  bottom: {height: 24},
});

export default DeviceInfoScreen;
