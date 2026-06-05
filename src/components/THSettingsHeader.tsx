import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import TextSwitchCell from './cells/TextSwitchCell';
import TextFieldCell from './cells/TextFieldCell';

interface Props {
  isOn: boolean;
  sampleRate: string;
  temperature: string;
  humidity: string;
  onIsOnChange: (v: boolean) => void;
  onSampleRateChange: (v: string) => void;
}

/** 对齐 MKPIRTHSettingsHeaderView */
const THSettingsHeader: React.FC<Props> = ({
  isOn,
  sampleRate,
  temperature,
  humidity,
  onIsOnChange,
  onSampleRateChange,
}) => (
  <View style={styles.wrap}>
    <TextSwitchCell
      label="Function Switch"
      value={isOn}
      onValueChange={onIsOnChange}
    />
    <TextFieldCell
      label="Sample Rate"
      value={sampleRate}
      placeholder="1 ~ 60"
      unit="S"
      maxLength={2}
      inputFilter="decimal"
      onChangeText={onSampleRateChange}
    />
    <View style={styles.metricsRow}>
      <Text style={styles.metricLabel}>Temp:</Text>
      <Image
        source={require('../../assets/images/pir_scan_temperature.png')}
        style={styles.metricIcon}
        resizeMode="contain"
      />
      <Text style={styles.metricValue}>{isOn ? temperature : ''}</Text>
      <Text style={[styles.metricLabel, styles.humidityLabel]}>Humidity:</Text>
      <Image
        source={require('../../assets/images/pir_scan_humidity.png')}
        style={styles.metricIcon}
        resizeMode="contain"
      />
      <Text style={styles.metricValue}>{isOn ? humidity : ''}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: {backgroundColor: '#fff'},
  metricsRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8e8e8',
  },
  metricLabel: {fontSize: 15, color: '#333'},
  humidityLabel: {marginLeft: 8},
  metricIcon: {width: 20, height: 20, marginLeft: 5},
  metricValue: {
    fontSize: 11,
    color: '#333',
    marginLeft: 5,
    minWidth: 36,
  },
});

export default THSettingsHeader;
