import React, {useCallback, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import StackScreenLayout from '../components/StackScreenLayout';
import TextFieldCell from '../components/cells/TextFieldCell';
import StatusDigitRowCell from '../components/cells/StatusDigitRowCell';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import OptionPickerModal from '../components/OptionPickerModal';
import BatteryCycleInfoPanel from '../components/BatteryCycleInfoPanel';
import {isNewDeviceType} from '../utils/deviceInfoApi';
import {
  configSelftest,
  pcbaStatusDisplay,
  readSelftest,
  readSelftestLegacy,
  type SelftestLegacyState,
  type SelftestState,
} from '../utils/selftestApi';
import {VOLTAGE_THRESHOLD_OPTIONS, voltageThresholdLabel} from '../utils/selftestModel';
import {apiErrorMessage} from '../utils/pirApi';
import {showToast} from '../utils/toast';

const EMPTY_V2: SelftestState = {
  selftestError: false,
  gps: '0',
  acceData: '0',
  flash: '0',
  pcbaStatus: '',
  voltageThreshold1: 0,
  sampleInterval1: '',
  sampleTimes1: '',
  voltageThreshold2: 0,
  sampleInterval2: '',
  sampleTimes2: '',
};

const EMPTY_LEGACY: SelftestLegacyState = {
  pcbaStatus: '',
  workTimes: '',
  advCount: '',
  thSamplingCount: '',
  loraPowerConsumption: '',
  loraSendCount: '',
  batteryPower: '',
};

const SelftestScreen: React.FC = () => {
  const navigation = useNavigation();
  const isV2 = isNewDeviceType();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stateV2, setStateV2] = useState<SelftestState>(EMPTY_V2);
  const [stateLegacy, setStateLegacy] =
    useState<SelftestLegacyState>(EMPTY_LEGACY);
  const [thresholdPicker, setThresholdPicker] = useState(false);

  const selftestDigits = useMemo(
    () => ({
      0: !stateV2.selftestError ? '0' : '',
      1: stateV2.selftestError ? '1' : '',
    }),
    [stateV2.selftestError],
  );

  const pcbaDigitsV2 = useMemo(
    () => pcbaStatusDisplay(stateV2.pcbaStatus),
    [stateV2.pcbaStatus],
  );

  const pcbaDigitsLegacy = useMemo(
    () => pcbaStatusDisplay(stateLegacy.pcbaStatus),
    [stateLegacy.pcbaStatus],
  );

  const legacyBatteryInfo = useMemo(
    () => ({
      workTimes: stateLegacy.workTimes,
      advCount: stateLegacy.advCount,
      thSamplingCount: stateLegacy.thSamplingCount,
      pirWorkTimes: '',
      doorMagneticTriggerCloseTimes: '',
      doorMagneticTriggerOpenTimes: '',
      loraSendCount: stateLegacy.loraSendCount,
      loraPowerConsumption: stateLegacy.loraPowerConsumption,
      batteryPower: stateLegacy.batteryPower,
    }),
    [stateLegacy],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isV2) {
        const data = await readSelftest();
        setStateV2(data);
      } else {
        const data = await readSelftestLegacy();
        setStateLegacy(data);
      }
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [isV2]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onSave = useCallback(async () => {
    setSaving(true);
    try {
      await configSelftest(stateV2);
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [stateV2]);

  if (!isV2) {
    return (
      <StackScreenLayout
        title="Selftest Interface"
        onBack={() => navigation.goBack()}
        loading={loading}>
        <ScrollView style={styles.scroll}>
          <SectionSpacer />
          <View style={styles.group}>
            <StatusDigitRowCell
              label="PCBA Status:"
              activeDigits={pcbaDigitsLegacy}
              layout="pcba"
            />
          </View>
          <SectionSpacer />
          <View style={styles.group}>
            <BatteryCycleInfoPanel
              title="Battery information:"
              info={legacyBatteryInfo}
              variant="legacy"
            />
          </View>
          <SectionSpacer />
        </ScrollView>
      </StackScreenLayout>
    );
  }

  return (
    <StackScreenLayout
      title="Selftest Interface"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={loading}
      saving={saving}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <SectionSpacer />
        <View style={styles.group}>
          <StatusDigitRowCell
            label="Selftest Status:"
            activeDigits={selftestDigits}
            layout="selftest"
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <StatusDigitRowCell
            label="PCBA Status:"
            activeDigits={pcbaDigitsV2}
            layout="pcba"
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <PickerButtonCell
            label="Condition 1 Voltage Threshold"
            value={voltageThresholdLabel(stateV2.voltageThreshold1)}
            unit="V"
            onPress={() => setThresholdPicker(true)}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="Min. Sample Interval"
            value={stateV2.sampleInterval1}
            placeholder="1~1440"
            unit="Mins"
            maxLength={4}
            inputFilter="decimal"
            onChangeText={sampleInterval1 =>
              setStateV2(s => ({...s, sampleInterval1}))
            }
          />
          <TextFieldCell
            label="Sample Times"
            value={stateV2.sampleTimes1}
            placeholder="1~100"
            unit="Times"
            maxLength={3}
            inputFilter="decimal"
            onChangeText={sampleTimes1 =>
              setStateV2(s => ({...s, sampleTimes1}))
            }
          />
        </View>
        <SectionSpacer />
      </ScrollView>

      <OptionPickerModal
        visible={thresholdPicker}
        title="Condition 1 Voltage Threshold"
        options={[...VOLTAGE_THRESHOLD_OPTIONS]}
        selectedIndex={stateV2.voltageThreshold1}
        onSelect={index => {
          setStateV2(s => ({...s, voltageThreshold1: index}));
          setThresholdPicker(false);
        }}
        onDismiss={() => setThresholdPicker(false)}
      />
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
});

export default SelftestScreen;
