import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

interface Props {
  label: string;
  value: string;
  onPress: () => void;
  unit?: string;
}

const PickerButtonCell: React.FC<Props> = ({label, value, onPress, unit}) => (
  <Pressable style={styles.row} onPress={onPress}>
    <Text style={styles.label} numberOfLines={2}>
      {label}
    </Text>
    <View style={styles.valueWrap}>
      <View style={[styles.btn, unit ? styles.btnCompact : styles.btnWide]}>
        <Text
          style={styles.btnText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}>
          {value}
        </Text>
      </View>
      {unit ? <Text style={styles.unit}>{unit}</Text> : null}
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    flexShrink: 1,
    marginRight: 10,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  unit: {fontSize: 13, color: '#333', width: 15},
  btn: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 8,
    minHeight: 30,
    justifyContent: 'center',
  },
  /** 对齐 MKTextButtonCell selectButtonWidth = 130 */
  btnWide: {width: 130},
  /** 对齐 MKPIRSelftestVoltageThresholdCell selectedButton width = 50 */
  btnCompact: {width: 50},
  btnText: {fontSize: 14, color: '#333', textAlign: 'center'},
});

export default PickerButtonCell;
