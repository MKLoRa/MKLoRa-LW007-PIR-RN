import React, {useCallback, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import TabScreenLayout from '../components/TabScreenLayout';
import NormalTextCell from '../components/cells/NormalTextCell';
import TextFieldCell from '../components/cells/TextFieldCell';
import SectionSpacer from '../components/cells/SectionSpacer';
import {useTabBackToScan} from '../hooks/useTabBackToScan';
import {
  readGeneralSettings,
  saveGeneralSettings,
} from '../utils/generalSettingsApi';
import {apiErrorMessage} from '../utils/pirApi';
import {showToast} from '../utils/toast';
import {RootStackParamList} from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const GENERAL_MENU: {label: string; route: keyof RootStackParamList}[] = [
  {label: 'PIR Settings', route: 'PirSettings'},
  {label: 'Hall Settings', route: 'HallSettings'},
  {label: 'T&H Settings', route: 'THSettings'},
];

const GeneralScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const onBack = useTabBackToScan();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heartbeatInterval, setHeartbeatInterval] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await readGeneralSettings();
      setHeartbeatInterval(data.heartbeatInterval);
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveGeneralSettings({heartbeatInterval});
      showToast('Success');
    } catch (e) {
      showToast(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [heartbeatInterval]);

  return (
    <TabScreenLayout
      title="General Settings"
      onBack={onBack}
      onSave={onSave}
      loading={loading}
      saving={saving}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <SectionSpacer />
        <View style={styles.group}>
          <TextFieldCell
            label="Heartbeat Interval"
            value={heartbeatInterval}
            placeholder="1-14400"
            unit="Mins"
            maxLength={5}
            inputFilter="decimal"
            onChangeText={setHeartbeatInterval}
          />
        </View>
        {GENERAL_MENU.map(item => (
          <React.Fragment key={item.route}>
            <SectionSpacer />
            <View style={styles.group}>
              <NormalTextCell
                label={item.label}
                showArrow
                onPress={() => navigation.navigate(item.route)}
              />
            </View>
          </React.Fragment>
        ))}
        <SectionSpacer />
      </ScrollView>
    </TabScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {flex: 1},
  group: {backgroundColor: '#fff'},
});

export default GeneralScreen;
