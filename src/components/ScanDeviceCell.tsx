import React, {useState} from 'react';
import {
  Dimensions,
  Image,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {ScanListItem} from '../types/scan';
import {NAVBAR_COLOR} from '../theme/colors';

/** 对齐 MKPIRScanPageCell */
export const SCAN_CELL_HEIGHT = 140;

const OFFSET_X = 15;
const RSSI_LEFT = 20;
const RSSI_TOP = 10;
const RSSI_ICON_W = 20;
const RSSI_ICON_H = 14;
const RSSI_LABEL_W = 40;
const CONNECT_W = 80;
const CONNECT_H = 30;
const TITLE_GAP = 15;
const BATTERY_ICON_W = 22;
const BATTERY_ICON_H = 12;
const METRIC_ROW_H = 30;
const METRIC_ICON = 20;
const METRIC_FONT = 12;
const DEVICE_NAME_LINE = 18;
const MAC_LINE = 14;
const RSSI_LABEL_LINE = 12;
const BATTERY_LABEL_LINE = 12;
const TX_LINE = 14;

/** batteryLabel.bottom + 5 */
const METRICS_TOP =
  RSSI_TOP +
  RSSI_ICON_H +
  5 +
  RSSI_LABEL_LINE +
  3 +
  BATTERY_ICON_H +
  5 +
  BATTERY_LABEL_LINE +
  5;

interface Props {
  item: ScanListItem;
  onConnect: () => void;
}

function hasSensorValue(value: string): boolean {
  const v = value?.trim();
  return !!v && v !== '—' && v.toLowerCase() !== 'ffff';
}

function metricColumnWidth(cellWidth: number): number {
  return (cellWidth - 4 * OFFSET_X) / 3;
}

function MetricIconView({
  icon,
  label,
  visible,
}: {
  icon: number;
  label: string;
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }
  return (
    <>
      <Image source={icon} style={styles.metricIcon} resizeMode="contain" />
      <Text style={styles.metricLabel} numberOfLines={1}>
        {label}
      </Text>
    </>
  );
}

const ScanDeviceCell: React.FC<Props> = ({item, onConnect}) => {
  const [cellWidth, setCellWidth] = useState(
    Dimensions.get('window').width,
  );
  const displayName = item.deviceName?.trim() ? item.deviceName : 'N/A';
  const mac = item.macAddress?.trim() ? item.macAddress : 'N/A';
  const showConnect = item.connectable !== false;
  const showTemperature = hasSensorValue(item.temperature);
  const showHumidity = hasSensorValue(item.humidity);

  const titleLeft = RSSI_LEFT + RSSI_ICON_W + TITLE_GAP;
  const deviceNameTop = RSSI_TOP + RSSI_ICON_H / 2 - DEVICE_NAME_LINE / 2;
  const macTop = deviceNameTop + DEVICE_NAME_LINE + 3;
  const txTop = macTop + MAC_LINE + 7;
  const colW = cellWidth > 0 ? metricColumnWidth(cellWidth) : 0;

  const onCellLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== cellWidth) {
      setCellWidth(w);
    }
  };

  return (
    <View style={styles.cell} onLayout={onCellLayout}>
      {showConnect ? (
        <Pressable
          style={styles.connectBtn}
          onPress={onConnect}
          accessibilityRole="button">
          <View style={styles.connectBtnInner}>
            <Text style={styles.connectText}>CONNECT</Text>
          </View>
        </Pressable>
      ) : null}

      <Image
        source={require('../../assets/images/pir_scan_rssiIcon.png')}
        style={styles.rssiIcon}
        resizeMode="contain"
      />
      <Text style={styles.rssiText}>{`${item.rssi}dBm`}</Text>

      <Image
        source={require('../../assets/images/pir_scan_battery.png')}
        style={styles.batteryIcon}
        resizeMode="contain"
      />
      <Text style={styles.batteryText}>
        {item.lowPower ? 'Low' : 'Normal'}
      </Text>

      <Text
        style={[
          styles.deviceName,
          {
            left: titleLeft,
            top: deviceNameTop,
            right: showConnect ? OFFSET_X + CONNECT_W + 8 : OFFSET_X,
          },
        ]}
        numberOfLines={2}>
        {displayName}
      </Text>
      <Text
        style={[
          styles.macLabel,
          {
            left: titleLeft,
            top: macTop,
            right: showConnect ? OFFSET_X + CONNECT_W + 5 : OFFSET_X,
          },
        ]}
        numberOfLines={1}>
        {`MAC: ${mac}`}
      </Text>

      <View style={[styles.txPowerWrap, {top: txTop}]}>
        <Text style={[styles.txPower, {width: colW + 10}]} numberOfLines={1}>
          {`Tx Power:  ${item.txPower}dBm`}
        </Text>
      </View>
      <View style={[styles.timeWrap, {top: txTop}]}>
        <Text style={styles.timeText} numberOfLines={1}>
          {item.scanTime}
        </Text>
      </View>

      <>
          {/* 左列占位（对齐 voltageView，原生 hidden） */}
          <View
            style={[
              styles.metricSlot,
              {top: METRICS_TOP, left: OFFSET_X, width: colW},
            ]}
          />
          <View
            style={[
              styles.metricSlot,
              {
                top: METRICS_TOP,
                left: (cellWidth - colW) / 2,
                width: colW,
              },
            ]}>
            <MetricIconView
              icon={require('../../assets/images/pir_scan_temperature.png')}
              label={`${item.temperature} °C`}
              visible={showTemperature}
            />
          </View>
          <View
            style={[
              styles.metricSlot,
              {
                top: METRICS_TOP,
                right: OFFSET_X,
                width: colW,
              },
            ]}>
            <MetricIconView
              icon={require('../../assets/images/pir_scan_humidity.png')}
              label={`${item.humidity} %RH`}
              visible={showHumidity}
            />
          </View>
      </>
    </View>
  );
};

const styles = StyleSheet.create({
  cell: {
    height: SCAN_CELL_HEIGHT,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  connectBtn: {
    position: 'absolute',
    right: OFFSET_X,
    top: 5,
    width: CONNECT_W,
    height: CONNECT_H,
    borderRadius: 10,
    backgroundColor: NAVBAR_COLOR,
    overflow: 'hidden',
    zIndex: 2,
  },
  connectBtnInner: {
    width: CONNECT_W,
    height: CONNECT_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectText: {
    width: CONNECT_W,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? CONNECT_H : 18,
    ...(Platform.OS === 'android'
      ? {includeFontPadding: false, textAlignVertical: 'center'}
      : {}),
  },
  rssiIcon: {
    position: 'absolute',
    left: RSSI_LEFT,
    top: RSSI_TOP,
    width: RSSI_ICON_W,
    height: RSSI_ICON_H,
  },
  rssiText: {
    position: 'absolute',
    left: RSSI_LEFT + RSSI_ICON_W / 2 - RSSI_LABEL_W / 2,
    top: RSSI_TOP + RSSI_ICON_H + 5,
    width: RSSI_LABEL_W,
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: RSSI_LABEL_LINE,
  },
  batteryIcon: {
    position: 'absolute',
    left: RSSI_LEFT,
    top: RSSI_TOP + RSSI_ICON_H + 5 + RSSI_LABEL_LINE + 3,
    width: BATTERY_ICON_W,
    height: BATTERY_ICON_H,
  },
  batteryText: {
    position: 'absolute',
    left: RSSI_LEFT + BATTERY_ICON_W / 2 - RSSI_LABEL_W / 2,
    top:
      RSSI_TOP +
      RSSI_ICON_H +
      5 +
      RSSI_LABEL_LINE +
      3 +
      BATTERY_ICON_H +
      5,
    width: RSSI_LABEL_W,
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: BATTERY_LABEL_LINE,
  },
  deviceName: {
    position: 'absolute',
    fontSize: 15,
    color: '#333',
    lineHeight: DEVICE_NAME_LINE,
  },
  macLabel: {
    position: 'absolute',
    fontSize: 12,
    color: '#666',
    lineHeight: MAC_LINE,
  },
  txPowerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  txPower: {
    fontSize: METRIC_FONT,
    color: '#333',
    lineHeight: TX_LINE,
    textAlign: 'left',
  },
  timeWrap: {
    position: 'absolute',
    right: OFFSET_X,
    width: CONNECT_W,
    height: TX_LINE,
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    lineHeight: 12,
  },
  metricSlot: {
    position: 'absolute',
    height: METRIC_ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  metricIcon: {
    width: METRIC_ICON,
    height: METRIC_ICON,
  },
  metricLabel: {
    flex: 1,
    marginLeft: 5,
    fontSize: METRIC_FONT,
    color: '#333',
    lineHeight: 16,
  },
});

export default ScanDeviceCell;
