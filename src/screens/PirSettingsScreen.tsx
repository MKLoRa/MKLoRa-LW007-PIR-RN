import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import StackScreenLayout from '../components/StackScreenLayout';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import NormalTextCell from '../components/cells/NormalTextCell';
import NoteTextFieldCell from '../components/cells/NoteTextFieldCell';
import PickerButtonCell from '../components/cells/PickerButtonCell';
import OptionPickerModal from '../components/OptionPickerModal';
import SectionSpacer from '../components/cells/SectionSpacer';
import PIRCentralManager from '../sdk/PIRCentralManager';
import {
  PIR_LEVEL_OPTIONS,
  readPirSettings,
  readPirStatus,
  savePirSettings,
  type PirSettingsState,
} from '../utils/pirSettingsApi';
import {apiErrorMessage} from '../utils/pirApi';
import {showToast} from '../utils/toast';

const PirSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<PirSettingsState>({
    isOn: false,
    interval: '',
    sensitivityIndex: 0,
    delayIndex: 0,
    detected: false,
  });
  const [picker, setPicker] = useState<'sensitivity' | 'delay' | null>(null);

  const applyLoaded = useCallback((data: PirSettingsState) => {
    setState(data);
    PIRCentralManager.shared().notifyPirSensorData(data.isOn);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await readPirSettings();
      applyLoaded(data);
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [applyLoaded]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    const central = PIRCentralManager.shared();
    const prev = central.sensorListener;
    central.sensorListener = {
      ...prev,
      onPirStatus: detected => {
        setState(s => ({...s, detected}));
      },
    };
    return () => {
      central.sensorListener = prev;
      central.notifyPirSensorData(false);
    };
  }, []);

  const onSave = useCallback(async () => {
    setSaving(true);
    try {
      await savePirSettings(state);
      showToast('Success');
      PIRCentralManager.shared().notifyPirSensorData(state.isOn);
      if (state.isOn) {
        try {
          const detected = await readPirStatus();
          setState(s => ({...s, detected}));
        } catch {
          /* ignore refresh error */
        }
      } else {
        setState(s => ({...s, detected: false}));
      }
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [state]);

  const pirStatusText =
    !state.isOn ? '' : state.detected ? 'Motion detected' : 'Motion not detected';

  return (
    <StackScreenLayout
      title="PIR Settings"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={loading}
      saving={saving}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Function Switch"
            value={state.isOn}
            onValueChange={isOn => setState(s => ({...s, isOn}))}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <NoteTextFieldCell
            label="Report Interval"
            value={state.interval}
            placeholder="1-60"
            unit="Mins"
            maxLength={2}
            inputFilter="decimal"
            note="*Information Payload reporting interval when PIR is continuously triggered."
            onChangeText={interval => setState(s => ({...s, interval}))}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <PickerButtonCell
            label="PIR Sensitivity"
            value={PIR_LEVEL_OPTIONS[state.sensitivityIndex] ?? PIR_LEVEL_OPTIONS[0]}
            onPress={() => setPicker('sensitivity')}
          />
          <PickerButtonCell
            label="PIR Delay Time"
            value={PIR_LEVEL_OPTIONS[state.delayIndex] ?? PIR_LEVEL_OPTIONS[0]}
            onPress={() => setPicker('delay')}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <NormalTextCell
            label="PIR Status"
            value={pirStatusText}
            leftIcon={require('../../assets/images/pir_pirSettingsIcon.png')}
          />
        </View>
        <SectionSpacer />
      </ScrollView>

      <OptionPickerModal
        visible={picker === 'sensitivity'}
        title="PIR Sensitivity"
        options={[...PIR_LEVEL_OPTIONS]}
        selectedIndex={state.sensitivityIndex}
        onSelect={index => setState(s => ({...s, sensitivityIndex: index}))}
        onDismiss={() => setPicker(null)}
      />
      <OptionPickerModal
        visible={picker === 'delay'}
        title="PIR Delay Time"
        options={[...PIR_LEVEL_OPTIONS]}
        selectedIndex={state.delayIndex}
        onSelect={index => setState(s => ({...s, delayIndex: index}))}
        onDismiss={() => setPicker(null)}
      />
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
});

export default PirSettingsScreen;
