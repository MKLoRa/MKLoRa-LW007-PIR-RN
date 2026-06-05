# MKLoRaWANPIR

React Native 应用，对应原生模块 **MKLoRaWAN-PIR**（Moko **LW007-PIR** LoRaWAN 人体感应 / 门磁 / 温湿度传感器）。

协议依据：`LW007协议文档_V1.2.1-20251013`。

## 与 MKLoRaWANMP 的关系

| 项目 | 设备 | BLE 特征 |
|------|------|----------|
| MKLoRaWANMP | LW005 智能插座/电表 | AA02 参数 + AA03 控制 |
| **MKLoRaWANPIR** | LW007-PIR | **AA05** 配置 + **AA06** 状态；AA02/03/04 实时 PIR/门磁/温湿度 |

共用：扫描连接、密码、`ed00/ed01` 帧、LoRaWAN 01–12 类命令、Nordic DFU、Tab 结构（LoRa / General / BLE / Device）。

PIR 独有：PIR / Hall / T&H 设置页、EU868 单通道、电池周期、自检 v2、调试日志 AA07。

## 目录

- `src/sdk/` — 从 `MKPIRInterface*.m` / `MKPIRTaskAdopter.m` 生成的 `PIRInterface`、`PIRInterfaceConfig`、`PIRTaskAdopter`
- `scripts/setup_pir_project.py` — 从 MP 工程初始化 / 同步资源
- `scripts/generate_*.py` — 重新生成 SDK 绑定

## 运行

```bash
cd /Users/aa/Desktop/RN/LoRa/MKLoRaWANPIR
npm install
npm run ios      # 或
npm run android
```

## 重新生成 SDK（原生改协议后）

```bash
python3 scripts/generate_operation_id.py
python3 scripts/generate_interface.py
python3 scripts/generate_interface_config.py
python3 scripts/generate_task_adopter.py
```

## 参考原生工程

`/Users/aa/Desktop/MKLoRaApp/Modules/MKLoRaWAN-PIR`
