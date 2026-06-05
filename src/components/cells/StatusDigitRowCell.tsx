import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

interface Props {
  label: string;
  /** 列下标对应的显示字符 */
  activeDigits: Record<number, string>;
  /** selftest：0 与标签同行，1–7 在第二行；pcba：0–2 与标签同行 */
  layout?: 'default' | 'selftest' | 'pcba';
}

/** 对齐 MKPIRSelftestCell / MKPIRPCBAStatusCell 数字高亮行 */
const StatusDigitRowCell: React.FC<Props> = ({
  label,
  activeDigits,
  layout = 'default',
}) => {
  if (layout === 'selftest') {
    return (
      <View style={styles.selftestRow}>
        <View style={styles.selftestTop}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.digit}>{activeDigits[0] ?? ''}</Text>
        </View>
        <View style={styles.digits}>
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <Text key={i} style={styles.digit}>
              {activeDigits[i] ?? ''}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  if (layout === 'pcba') {
    return (
      <View style={styles.pcbaRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.pcbaDigits}>
          {[0, 1, 2].map(i => (
            <Text key={i} style={styles.digit}>
              {activeDigits[i] ?? ''}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.digits}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <Text key={i} style={styles.digit}>
            {activeDigits[i] ?? ''}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  selftestRow: {
    minHeight: 60,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  selftestTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pcbaRow: {
    height: 44,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  pcbaDigits: {flexDirection: 'row', gap: 20, marginLeft: 5},
  label: {fontSize: 15, color: '#333', width: 120},
  digits: {flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  digit: {fontSize: 13, color: '#333', width: 24, textAlign: 'center'},
});

export default StatusDigitRowCell;
