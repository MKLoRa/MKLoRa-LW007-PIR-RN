import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface Props {
  label: string;
  value?: string;
  leftIcon?: ImageSourcePropType;
  showArrow?: boolean;
  onPress?: () => void;
}

const NormalTextCell: React.FC<Props> = ({
  label,
  value,
  leftIcon,
  showArrow,
  onPress,
}) => (
  <Pressable
    style={styles.row}
    onPress={onPress}
    disabled={!onPress && !showArrow}>
    <View style={styles.left}>
      {leftIcon ? (
        <Image source={leftIcon} style={styles.leftIcon} resizeMode="contain" />
      ) : null}
      <Text style={styles.label}>{label}</Text>
    </View>
    <View style={styles.right}>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {showArrow ? (
        <Image
          source={require('../../../assets/images/pir_goNextButton.png')}
          style={styles.arrow}
          resizeMode="contain"
        />
      ) : null}
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  left: {flexDirection: 'row', alignItems: 'center', flex: 1},
  leftIcon: {width: 20, height: 20, marginRight: 6},
  label: {fontSize: 15, color: '#333', flexShrink: 1},
  right: {flexDirection: 'row', alignItems: 'center'},
  value: {fontSize: 14, color: '#666', marginRight: 6},
  arrow: {width: 18, height: 18},
});

export default NormalTextCell;
