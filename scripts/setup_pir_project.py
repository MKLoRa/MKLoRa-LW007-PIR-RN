#!/usr/bin/env python3
"""Bootstrap MKLoRaWANPIR from copied MKLoRaWANPIR + native MKLoRaWAN-PIR."""
from __future__ import annotations

import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PIR_MODULE = Path('/Users/aa/Desktop/MKLoRaApp/Modules/MKLoRaWAN-PIR/MKLoRaWAN-PIR')
PIR_SDK = PIR_MODULE / 'Classes/SDK'
NATIVE_ASSETS = PIR_MODULE / 'Assets'
RN_ASSETS = ROOT / 'assets/images'

SDK_RENAMES = {
    'PIRCentralManager.ts': 'PIRCentralManager.ts',
    'PIRConnectModel.ts': 'PIRConnectModel.ts',
    'PIRSDKDefines.ts': 'PIRSDKDefines.ts',
    'PIRSDKDataAdopter.ts': 'PIRSDKDataAdopter.ts',
    'PIRConfigSupport.ts': 'PIRConfigSupport.ts',
    'PIRTaskAdopter.ts': 'PIRTaskAdopter.ts',
    'PIRInterface.ts': 'PIRInterface.ts',
    'PIRInterfaceConfig.ts': 'PIRInterfaceConfig.ts',
}

UTIL_RENAMES = {
    'pirApi.ts': 'pirApi.ts',
    'pirScanAdvertisement.ts': 'pirScanAdvertisement.ts',
    'pirSession.ts': 'pirSession.ts',
}

NATIVE_RENAMES = {
    'PIRNative.ts': 'PIRNative.ts',
}

CONTENT_SUBS = [
    ('MKLoRaWAN-PIR', 'MKLoRaWAN-PIR'),
    ('MKLoRaWANPIR', 'MKLoRaWANPIR'),
    ('LW007-PIR', 'LW007-PIR'),
    ('LW007_PIR', 'LW007_PIR'),
    ('PIRInterfaceConfig', 'PIRInterfaceConfig'),
    ('PIRConfigSupport', 'PIRConfigSupport'),
    ('PIRSDKDataAdopter', 'PIRSDKDataAdopter'),
    ('PIRTaskAdopter', 'PIRTaskAdopter'),
    ('PIRConnectModel', 'PIRConnectModel'),
    ('PIRCentralManager', 'PIRCentralManager'),
    ('PIRInterface', 'PIRInterface'),
    ('PIRSDKDefines', 'PIRSDKDefines'),
    ('PIRNative', 'PIRNative'),
    ('mk_pir_', 'mk_pir_'),
    ('pirApi', 'pirApi'),
    ('pirScanAdvertisement', 'pirScanAdvertisement'),
    ('pirSession', 'pirSession'),
    ('pir_scan_', 'pir_scan_'),
    ('pir_lora_', 'pir_lora_'),
    ('pir_setting_', 'pir_setting_'),
    ('pir_bleSettings_', 'pir_bleSettings_'),
    ('pir_device_', 'pir_device_'),
    ('pir_about', 'pir_about'),
    ('pir_switch', 'pir_switch'),
    ('pir_slotSave', 'pir_slotSave'),
    ('pir_goNext', 'pir_goNext'),
    ('pir_sync_', 'pir_sync_'),
    ('pir_export_', 'pir_export_'),
    ('pir_delete_', 'pir_delete_'),
    ('pir_debugger', 'pir_debugger'),
    ('mk_pir_passwordKey', 'mk_pir_passwordKey'),
    ('com.mklorawanpir', 'com.mklorawanpir'),
    ('MKPIR', 'MKPIR'),
    ('MokoPIR', 'MokoPIR'),
]


def copy_assets():
    RN_ASSETS.mkdir(parents=True, exist_ok=True)
    if not NATIVE_ASSETS.is_dir():
        print('Skip assets: native Assets missing')
        return
    for src in NATIVE_ASSETS.glob('pir_*@2x.png'):
        dest = RN_ASSETS / src.name.replace('@2x', '')
        shutil.copy2(src, dest)
    print(f'Copied PIR tab/scan assets to {RN_ASSETS}')


def rename_sdk_files():
    sdk = ROOT / 'src/sdk'
    for old, new in SDK_RENAMES.items():
        p = sdk / old
        if p.exists():
            p.rename(sdk / new)
    utils = ROOT / 'src/utils'
    for old, new in UTIL_RENAMES.items():
        p = utils / old
        if p.exists():
            p.rename(utils / new)
    nat = ROOT / 'src/native'
    for old, new in NATIVE_RENAMES.items():
        p = nat / old
        if p.exists():
            p.rename(nat / new)


def apply_content_subs(path: Path):
    if path.suffix not in {
        '.ts', '.tsx', '.js', '.json', '.gradle', '.xml', '.plist',
        '.m', '.mm', '.h', '.kt', '.java', '.md', '.py',
    }:
        return
    try:
        text = path.read_text(encoding='utf-8')
    except (UnicodeDecodeError, OSError):
        return
    orig = text
    for a, b in CONTENT_SUBS:
        text = text.replace(a, b)
    if text != orig:
        path.write_text(text, encoding='utf-8')


def walk_apply_subs():
    skip = {'node_modules', '.git', 'build', 'Pods', '.gradle', '.cxx'}
    for p in ROOT.rglob('*'):
        if p.is_dir():
            continue
        if any(s in p.parts for s in skip):
            continue
        apply_content_subs(p)


def patch_package_json():
    pkg = ROOT / 'package.json'
    data = pkg.read_text()
    data = data.replace('"name": "MKLoRaWANPIR"', '"name": "MKLoRaWANPIR"')
    pkg.write_text(data)
    (ROOT / 'app.json').write_text('{"name": "MKLoRaWANPIR", "displayName": "LW007 PIR"}\n')


def patch_generators():
    scripts = ROOT / 'scripts'
    replacements = [
        (
            scripts / 'generate_operation_id.py',
            (
                "H_PATH = Path(\n    '/Users/aa/Desktop/MKLoRaApp/Modules/MKLoRaWAN-PIR/MKLoRaWAN-PIR/Classes/SDK/MKPIROperationID.h'\n)",
                "H_PATH = Path(\n    '/Users/aa/Desktop/MKLoRaApp/Modules/MKLoRaWAN-PIR/MKLoRaWAN-PIR/Classes/SDK/MKPIROperationID.h'\n)",
            ),
            ("mk_pir_", "mk_pir_"),
            ("OperationID.ts", "OperationID.ts"),
        ),
        (
            scripts / 'generate_interface.py',
            (
                "M_PATH = Path(\n    '/Users/aa/Desktop/MKLoRaApp/Modules/MKLoRaWAN-PIR/MKLoRaWAN-PIR/Classes/SDK/MKPIRInterface.m'\n)",
                "M_PATH = Path(\n    '/Users/aa/Desktop/MKLoRaApp/Modules/MKLoRaWAN-PIR/MKLoRaWAN-PIR/Classes/SDK/MKPIRInterface.m'\n)",
            ),
            ("MKPIRInterface.m", "MKPIRInterface.m"),
            ("PIRInterface.ts", "PIRInterface.ts"),
            ("PIRCentralManager", "PIRCentralManager"),
            ("mp_", "pir_"),
            ("readDeviceControlDataWithTaskID", "readDeviceControlDataWithTaskID"),
            ("readDataWithTaskID", "readDataWithTaskID"),
            ("peripheral.mp_", "peripheral.pir_"),
            ("+ \\(void\\)mp_", "+ \\(void\\)pir_"),
        ),
        (
            scripts / 'generate_interface_config.py',
            (
                "M_PATH = Path(\n    '/Users/aa/Desktop/MKLoRaApp/Modules/MKLoRaWAN-PIR/MKLoRaWAN-PIR/Classes/SDK/MKPIRInterface+MKPIRConfig.m'\n)",
                "M_PATH = Path(\n    '/Users/aa/Desktop/MKLoRaApp/Modules/MKLoRaWAN-PIR/MKLoRaWAN-PIR/Classes/SDK/MKPIRInterface+MKPIRConfig.m'\n)",
            ),
            ("MKPIRInterface+MKPIRConfig.m", "MKPIRInterface+MKPIRConfig.m"),
            ("PIRInterfaceConfig.ts", "PIRInterfaceConfig.ts"),
            ("mk_pir_", "mk_pir_"),
            ("PIRInterfaceConfig", "PIRInterfaceConfig"),
            ("PIRSDKDefines", "PIRSDKDefines"),
            ("PIRSDKDataAdopter", "PIRSDKDataAdopter"),
            ("PIRConfigSupport", "PIRConfigSupport"),
            ("LoRaWanClassType", "LoRaWanClassType"),
            ("+ \\(void\\)mp_", "+ \\(void\\)pir_"),
        ),
        (
            scripts / 'generate_task_adopter.py',
            (
                "M_PATH = Path(\n    '/Users/aa/Desktop/MKLoRaApp/Modules/MKLoRaWAN-PIR/MKLoRaWAN-PIR/Classes/SDK/MKPIRTaskAdopter.m'\n)",
                "M_PATH = Path(\n    '/Users/aa/Desktop/MKLoRaApp/Modules/MKLoRaWAN-PIR/MKLoRaWAN-PIR/Classes/SDK/MKPIRTaskAdopter.m'\n)",
            ),
            ("MKPIRTaskAdopter.m", "MKPIRTaskAdopter.m"),
            ("PIRTaskAdopter.ts", "PIRTaskAdopter.ts"),
            ("mk_pir_", "mk_pir_"),
            ("MKPIRSDKDataAdopter", "MKPIRSDKDataAdopter"),
        ),
    ]
    for path, *subs in replacements:
        if not path.exists():
            continue
        text = path.read_text()
        for a, b in subs:
            text = text.replace(a, b)
        path.write_text(text)


def run_generators():
    for name in [
        'generate_operation_id.py',
        'generate_interface.py',
        'generate_interface_config.py',
        'generate_task_adopter.py',
    ]:
        script = ROOT / 'scripts' / name
        if script.exists():
            subprocess.run([sys.executable, str(script)], check=True, cwd=ROOT)


def rename_android_package():
    old_java = ROOT / 'android/app/src/main/java/com/mklorawanpir'
    new_java = ROOT / 'android/app/src/main/java/com/mklorawanpir'
    old_mp = ROOT / 'android/app/src/main/java/com/mklorawanmp'
    if old_mp.exists() and not new_java.exists():
        new_java.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(old_mp), str(new_java))
    for f in new_java.rglob('*') if new_java.exists() else []:
        if f.suffix == '.java':
            apply_content_subs(f)


def update_sdk_index():
    idx = ROOT / 'src/sdk/index.ts'
    if idx.exists():
        idx.write_text(
            "export {default as PIRCentralManager} from './PIRCentralManager';\n"
            "export * from './PIRSDKDefines';\n"
            "export {default as PIRConnectModel} from './PIRConnectModel';\n"
        )


def main():
    copy_assets()
    rename_sdk_files()
    walk_apply_subs()
    patch_package_json()
    patch_generators()
    rename_android_package()
    run_generators()
    walk_apply_subs()
    update_sdk_index()
    print('PIR project bootstrap done.')


if __name__ == '__main__':
    main()
