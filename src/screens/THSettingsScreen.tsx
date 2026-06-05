import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import StackScreenLayout from '../components/StackScreenLayout';
import THSettingsHeader from '../components/THSettingsHeader';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import TextFieldCell from '../components/cells/TextFieldCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import PIRCentralManager from '../sdk/PIRCentralManager';
import {
  readTHLiveData,
  readTHSettings,
  saveTHSettings,
  type THSettingsState,
} from '../utils/thSettingsApi';
import {apiErrorMessage} from '../utils/pirApi';
import {showToast} from '../utils/toast';

const EMPTY_TH_STATE: THSettingsState = {
  isOn: false,
  sampleRate: '',
  temperature: '',
  humidity: '',
  tempThresholdAlarm: false,
  tempMax: '',
  tempMin: '',
  tempChangeAlarm: false,
  tempDuration: '',
  tempChangeValueThreshold: '',
  rhThresholdAlarm: false,
  rhMax: '',
  rhMin: '',
  rhChangeAlarm: false,
  rhDuration: '',
  rhChangeValueThreshold: '',
};

const THSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<THSettingsState>(EMPTY_TH_STATE);

  const applyLoaded = useCallback((data: THSettingsState) => {
    setState(data);
    PIRCentralManager.shared().notifyTHSensorData(data.isOn);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await readTHSettings();
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
      onTHSensor: ({temperature, humidity}) => {
        setState(s => ({...s, temperature, humidity}));
      },
    };
    return () => {
      central.sensorListener = prev;
      central.notifyTHSensorData(false);
    };
  }, []);

  const onSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveTHSettings(state);
      showToast('Success');
      PIRCentralManager.shared().notifyTHSensorData(state.isOn);
      if (state.isOn) {
        try {
          const live = await readTHLiveData();
          setState(s => ({...s, ...live}));
        } catch {
          /* ignore refresh error */
        }
      } else {
        setState(s => ({...s, temperature: '', humidity: ''}));
      }
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [state]);

  const patch = useCallback(
    (patchState: Partial<THSettingsState>) =>
      setState(s => ({...s, ...patchState})),
    [],
  );

  return (
    <StackScreenLayout
      title="T&H Settings"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={loading}
      saving={saving}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <THSettingsHeader
          isOn={state.isOn}
          sampleRate={state.sampleRate}
          temperature={state.temperature}
          humidity={state.humidity}
          onIsOnChange={isOn =>
            patch({
              isOn,
              temperature: isOn ? state.temperature : '',
              humidity: isOn ? state.humidity : '',
            })
          }
          onSampleRateChange={sampleRate => patch({sampleRate})}
        />
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Temp Threshold Alarm"
            value={state.tempThresholdAlarm}
            onValueChange={tempThresholdAlarm => patch({tempThresholdAlarm})}
          />
        </View>
        <View style={styles.group}>
          <TextFieldCell
            label="Max."
            value={state.tempMax}
            placeholder="-30~60"
            unit="℃"
            maxLength={3}
            keyboardType="default"
            onChangeText={tempMax => patch({tempMax})}
          />
          <TextFieldCell
            label="Min."
            value={state.tempMin}
            placeholder="-30~60"
            unit="℃"
            maxLength={3}
            keyboardType="default"
            onChangeText={tempMin => patch({tempMin})}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="Temp Change Alarm"
            value={state.tempChangeAlarm}
            onValueChange={tempChangeAlarm => patch({tempChangeAlarm})}
          />
        </View>
        <View style={styles.group}>
          <TextFieldCell
            label="Duration Condition"
            value={state.tempDuration}
            placeholder="1 ~ 24"
            unit="H"
            maxLength={2}
            inputFilter="decimal"
            onChangeText={tempDuration => patch({tempDuration})}
          />
          <TextFieldCell
            label="Change Value Threshold"
            value={state.tempChangeValueThreshold}
            placeholder="1 ~ 20"
            unit="℃"
            maxLength={2}
            inputFilter="decimal"
            onChangeText={tempChangeValueThreshold =>
              patch({tempChangeValueThreshold})
            }
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="RH Threshold Alarm"
            value={state.rhThresholdAlarm}
            onValueChange={rhThresholdAlarm => patch({rhThresholdAlarm})}
          />
        </View>
        <View style={styles.group}>
          <TextFieldCell
            label="Max."
            value={state.rhMax}
            placeholder="0 ~ 100"
            unit="%"
            maxLength={3}
            inputFilter="decimal"
            onChangeText={rhMax => patch({rhMax})}
          />
          <TextFieldCell
            label="Min."
            value={state.rhMin}
            placeholder="0 ~ 100"
            unit="%"
            maxLength={3}
            inputFilter="decimal"
            onChangeText={rhMin => patch({rhMin})}
          />
        </View>
        <SectionSpacer />
        <View style={styles.group}>
          <TextSwitchCell
            label="RH Change Alarm"
            value={state.rhChangeAlarm}
            onValueChange={rhChangeAlarm => patch({rhChangeAlarm})}
          />
        </View>
        <View style={styles.group}>
          <TextFieldCell
            label="Duration Condition"
            value={state.rhDuration}
            placeholder="1 ~ 24"
            unit="H"
            maxLength={2}
            inputFilter="decimal"
            onChangeText={rhDuration => patch({rhDuration})}
          />
          <TextFieldCell
            label="Change Value Threshold"
            value={state.rhChangeValueThreshold}
            placeholder="1 ~ 100"
            unit="%"
            maxLength={3}
            inputFilter="decimal"
            onChangeText={rhChangeValueThreshold =>
              patch({rhChangeValueThreshold})
            }
          />
        </View>
        <SectionSpacer />
      </ScrollView>
    </StackScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
});

export default THSettingsScreen;
