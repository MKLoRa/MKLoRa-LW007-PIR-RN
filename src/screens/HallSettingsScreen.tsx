import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import StackScreenLayout from '../components/StackScreenLayout';
import TextSwitchCell from '../components/cells/TextSwitchCell';
import NormalTextCell from '../components/cells/NormalTextCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import PIRCentralManager from '../sdk/PIRCentralManager';
import {
  readDoorSensorDatas,
  readHallSettings,
  saveHallSettings,
  type HallSettingsState,
} from '../utils/hallSettingsApi';
import {apiErrorMessage} from '../utils/pirApi';
import {showToast} from '../utils/toast';

const HallSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<HallSettingsState>({
    isOn: false,
    open: false,
    times: '',
  });

  const applyLoaded = useCallback((data: HallSettingsState) => {
    setState(data);
    PIRCentralManager.shared().notifyDoorSensorData(data.isOn);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await readHallSettings();
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
      onDoorSensor: ({open, times}) => {
        setState(s => ({...s, open, times}));
      },
    };
    return () => {
      central.sensorListener = prev;
      central.notifyDoorSensorData(false);
    };
  }, []);

  const onSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveHallSettings({isOn: state.isOn});
      showToast('Success');
      PIRCentralManager.shared().notifyDoorSensorData(state.isOn);
      if (state.isOn) {
        try {
          const data = await readDoorSensorDatas();
          setState(s => ({...s, ...data}));
        } catch {
          /* ignore refresh error */
        }
      } else {
        setState(s => ({...s, open: false, times: ''}));
      }
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [state.isOn]);

  const doorStatusText = !state.isOn ? '' : state.open ? 'Open' : 'Closed';
  const timesText = !state.isOn ? '' : state.times;

  return (
    <StackScreenLayout
      title="Hall Settings"
      onBack={() => navigation.goBack()}
      onSave={onSave}
      loading={loading}
      saving={saving}>
      <ScrollView style={styles.scroll}>
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
          <NormalTextCell
            label="Door Status"
            value={doorStatusText}
            leftIcon={require('../../assets/images/pir_hallSettings_doorStatusIcon.png')}
          />
          <NormalTextCell label="Total Trigger Times" value={timesText} />
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

export default HallSettingsScreen;
