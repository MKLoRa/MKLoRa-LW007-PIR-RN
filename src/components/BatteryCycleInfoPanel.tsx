import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {
  type BatteryCycleInfo,
  formatBatteryPowerMah,
} from '../types/battery';

interface Props {
  info: BatteryCycleInfo;
  title?: string;
  /** 旧版自检页短格式（无 PIR/门磁字段） */
  variant?: 'full' | 'legacy';
}

const BatteryCycleInfoPanel: React.FC<Props> = ({
  info,
  title = 'All Cycles Battery Information:',
  variant = 'full',
}) => (
  <View style={[styles.panel, variant === 'legacy' && styles.panelLegacy]}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.line}>Work Time: {info.workTimes || '—'} s</Text>
    <Text style={styles.line}>ADV Count: {info.advCount || '—'} times</Text>
    <Text style={styles.line}>
      T&H Sampling Count: {info.thSamplingCount || '—'} times
    </Text>
    {variant === 'full' ? (
      <>
        <Text style={styles.line}>
          PIR Work Times: {info.pirWorkTimes || '—'}s
        </Text>
        <Text style={styles.line}>
          Door Close Triggers: {info.doorMagneticTriggerCloseTimes || '—'}s
        </Text>
        <Text style={styles.line}>
          Door Open Triggers: {info.doorMagneticTriggerOpenTimes || '—'}s
        </Text>
      </>
    ) : null}
    <Text style={styles.line}>
      LoRa Send Count: {info.loraSendCount || '—'} times
    </Text>
    <Text style={styles.line}>
      LoRa Power Consumption: {info.loraPowerConsumption || '—'} mAS
    </Text>
    <Text style={styles.line}>
      Battery Power: {formatBatteryPowerMah(info.batteryPower)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    minHeight: 260,
  },
  panelLegacy: {minHeight: 200},
  title: {fontSize: 15, color: '#333', marginBottom: 10},
  line: {fontSize: 13, color: '#333', marginTop: 10},
});

export default BatteryCycleInfoPanel;
