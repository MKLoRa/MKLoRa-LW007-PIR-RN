#!/usr/bin/env python3
"""Rebrand MKLoRaWANPIR project: AE/CT -> MP."""
from __future__ import annotations

import os
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NATIVE_ASSETS = Path(
    '/Users/aa/Desktop/MKLoRaApp/Modules/MKLoRaWAN-PIR/MKLoRaWAN-PIR/Assets'
)
SKIP_DIRS = {'node_modules', '.git', 'build', 'Pods', '.gradle', '.idea', 'DerivedData'}

FILE_SUBS = [
    ('MKLoRaWANPIR', 'MKLoRaWANPIR'),
    ('MKPIR', 'MKPIR'),
    ('MKPIR', 'MKPIR'),
    ('mklorawanmp', 'mklorawanmp'),
    ('buildPIRInterfaceConfig', 'buildMKPIRInterfaceConfig'),
]

CONTENT_SUBS = [
    ('MKLoRaWAN-PIR', 'MKLoRaWAN-PIR'),
    ('MKLoRaWANPIR', 'MKLoRaWANPIR'),
    ('PIRInterfaceConfig', 'PIRInterfaceConfig'),
    ('PIRConfigSupport', 'PIRConfigSupport'),
    ('PIRSDKDataAdopter', 'PIRSDKDataAdopter'),
    ('PIRTaskAdopter', 'PIRTaskAdopter'),
    ('PIRConnectModel', 'PIRConnectModel'),
    ('PIRCentralManager', 'PIRCentralManager'),
    ('PIRInterface', 'PIRInterface'),
    ('PIRSDKDefines', 'PIRSDKDefines'),
    ('MKPIROperationID', 'MKPIROperationID'),
    ('buildPIRInterfaceConfig', 'buildMKPIRInterfaceConfig'),
    ('MKPIR', 'MKPIR'),
    ('MKPIR', 'MKPIR'),
    ('mkmp', 'mkmp'),
    ('mkmp', 'mkmp'),
    ('mklorawanmp', 'mklorawanmp'),
    ('com.mklorawanpir', 'com.mklorawanpir'),
    ('aeSession', 'pirSession'),
    ('pir_lora_tabBar', 'pir_lora_tabBar'),
    ('mp_position_tabBar', 'pir_bleSettings_tabBar'),
    ('pir_setting_tabBar', 'pir_setting_tabBar'),
    ('pir_device_tabBar', 'pir_device_tabBar'),
]

AE_TO_MP_ASSET = {
    'pir_aboutBottomIcon': 'pir_aboutBottomIcon',
    'pir_aboutIcon': 'pir_aboutIcon',
    'mp_addIcon': 'pir_addIcon',
    'pir_device_tabBarSelected': 'pir_device_tabBarSelected',
    'pir_device_tabBarUnselected': 'pir_device_tabBarUnselected',
    'pir_goNextButton': 'pir_goNextButton',
    'pir_lora_tabBarSelected': 'pir_lora_tabBarSelected',
    'pir_lora_tabBarUnselected': 'pir_lora_tabBarUnselected',
    'pir_bleSettings_tabBarSelected': 'pir_bleSettings_tabBarSelected',
    'pir_bleSettings_tabBarUnselected': 'pir_bleSettings_tabBarUnselected',
    'mp_scanRightAboutIcon': 'pir_scanRightAboutIcon',
    'pir_scan_refreshIcon': 'pir_scan_refreshIcon',
    'pir_scan_rssiIcon': 'pir_scan_rssiIcon',
    'pir_scan_powerIcon': 'pir_scan_powerIcon',
    'pir_scan_overStateIcon': 'pir_scan_overStateIcon',
    'pir_setting_tabBarSelected': 'pir_setting_tabBarSelected',
    'pir_setting_tabBarUnselected': 'pir_setting_tabBarUnselected',
    'pir_slotSaveIcon': 'pir_slotSaveIcon',
    'pir_switchSelectedIcon': 'pir_switchSelectedIcon',
    'pir_switchUnselectedIcon': 'pir_switchUnselectedIcon',
    'pir_sync_disableIcon': 'pir_sync_disableIcon',
    'pir_export_disableIcon': 'pir_export_disableIcon',
    'pir_export_enableIcon': 'pir_export_enableIcon',
    'pir_delete_disableIcon': 'pir_delete_disableIcon',
    'pir_delete_enableIcon': 'pir_delete_enableIcon',
    'pir_debuggerSelected': 'pir_debuggerSelected',
    'pir_debuggerUnselected': 'pir_debuggerUnselected',
}

TEXT_SUFFIX = {
    '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.mjs', '.py', '.xml',
    '.plist', '.gradle', '.properties', '.kt', '.swift', '.pbxproj',
    '.xcscheme', '.h', '.m', '.mm', '.rb', '.podspec', '.storyboard',
}
ALWAYS_TEXT = {
    'Gemfile', 'Podfile', 'AppDelegate.swift', 'MainActivity.kt',
    'strings.xml', 'settings.gradle', 'build.gradle', 'gradle.properties',
    'AndroidManifest.xml',
}


def should_process(path: Path) -> bool:
    if path.name in ALWAYS_TEXT:
        return True
    return path.suffix in TEXT_SUFFIX


def copy_native_assets() -> None:
    dest = ROOT / 'assets' / 'images'
    dest.mkdir(parents=True, exist_ok=True)
    if NATIVE_ASSETS.is_dir():
        for src in NATIVE_ASSETS.glob('mp_*@2x.png'):
            out = dest / src.name.replace('@2x', '')
            shutil.copy2(src, out)
            print(f'asset: {out.name}')
    # MP bundle has no dedicated arrow / debugger icons — reuse AE files under mp_ names
    mp_only = [
        'pir_goNextButton',
        'pir_debuggerSelected',
        'pir_debuggerUnselected',
        'pir_delete_disableIcon',
        'pir_delete_enableIcon',
        'pir_export_disableIcon',
        'pir_export_enableIcon',
    ]
    for base in mp_only:
        ae = dest / f'{base}.png'
        mp_name = base.replace('ae_', 'mp_', 1)
        mp = dest / f'{mp_name}.png'
        if ae.exists() and not mp.exists():
            shutil.copy2(ae, mp)
            print(f'asset alias: {mp.name}')


def merge_mp_api() -> None:
    mkmp = ROOT / 'src' / 'utils' / 'pirApi.ts'
    small = ROOT / 'src' / 'utils' / 'pirApi.ts'
    if not mkmp.exists():
        print('SKIP merge: pirApi.ts missing')
        return
    text = mkmp.read_text(encoding='utf-8')
    text = text.replace('export const mpRead', 'export const mpRead')
    text = text.replace('export const mpConfig', 'export const mpConfig')
    text = text.replace('mpRead.', 'mpRead.')
    text = text.replace('mpConfig.', 'mpConfig.')

    extra_reads = '''
  lorawanClassType: () =>
    readPromise(PIRInterface.read_lorawan_class_type as ReadFn),
  deviceName: () => readPromise(PIRInterface.read_device_name as ReadFn),
  advInterval: () => readPromise(PIRInterface.read_adv_interval as ReadFn),
  deviceConnectable: () =>
    readPromise(PIRInterface.read_device_connectable as ReadFn),
  connectationNeedPassword: () =>
    readPromise(PIRInterface.read_connectation_need_password as ReadFn),
  txPower: () => readPromise(PIRInterface.read_tx_power as ReadFn),
'''
    if 'lorawanClassType' not in text:
        text = text.replace(
            '  filterByAdvNameReverseFilter: () =>\n'
            '    readPromise(PIRInterface.read_filter_by_adv_name_reverse_filter as ReadFn),\n};',
            '  filterByAdvNameReverseFilter: () =>\n'
            '    readPromise(PIRInterface.read_filter_by_adv_name_reverse_filter as ReadFn),\n'
            + extra_reads
            + '};',
        )

    helpers = '''

export function classTypeLabel(classType: unknown): string {
  const n = Number(classType);
  return n === 0 ? 'ClassA' : 'ClassC';
}

export function modemLabel(modem: unknown): string {
  return Number(modem) === 1 ? 'ABP' : 'OTAA';
}

export function networkStatusLabel(status: unknown): string {
  return Number(status) === 0 ? 'Connecting' : 'Connected';
}
'''
    if 'classTypeLabel' not in text:
        text = text.rstrip() + helpers + '\n'

    header = '/**\n * LW007-PIR 读/写辅助（对齐 MKPIRInterface / MKPIRInterfaceConfig）\n */\n'
    if not text.startswith('/**'):
        text = header + text

    out = ROOT / 'src' / 'utils' / 'pirApi.ts'
    out.write_text(text, encoding='utf-8')
    mkmp.unlink()
    if small.exists() and small != out:
        print('merged pirApi.ts')
    print('pirApi.ts ready')


def replace_asset_refs(text: str) -> str:
    for ae, mp in AE_TO_MP_ASSET.items():
        text = text.replace(f'assets/images/{ae}.png', f'assets/images/{mp}.png')
        text = text.replace(f"'{ae}_", f"'{mp}_")
    text = re.sub(r'\bae_([a-zA-Z0-9_]+)', lambda m: AE_TO_MP_ASSET.get(
        f'ae_{m.group(1)}', f'mp_{m.group(1)}'
    ), text)
    return text


def replace_content() -> None:
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        if any(p in SKIP_DIRS for p in Path(dirpath).parts):
            continue
        for fn in filenames:
            p = Path(dirpath) / fn
            if not should_process(p):
                continue
            try:
                text = p.read_text(encoding='utf-8')
            except (UnicodeDecodeError, OSError):
                continue
            orig = text
            for a, b in CONTENT_SUBS:
                text = text.replace(a, b)
            if p.suffix in {'.ts', '.tsx', '.js', '.jsx'}:
                text = replace_asset_refs(text)
            if text != orig:
                p.write_text(text, encoding='utf-8')
                print(f'content: {p.relative_to(ROOT)}')


def rename_paths() -> None:
    # Android package directory
    old_pkg = ROOT / 'android/app/src/main/java/com/mklorawanmp'
    new_pkg = ROOT / 'android/app/src/main/java/com/mklorawanmp'
    if old_pkg.is_dir() and not new_pkg.exists():
        new_pkg.parent.mkdir(parents=True, exist_ok=True)
        old_pkg.rename(new_pkg)
        print(f'dir: {old_pkg.relative_to(ROOT)} -> com/mklorawanmp')

    renames: list[tuple[Path, Path]] = []

    ios_app = ROOT / 'ios' / 'MKLoRaWANPIR'
    ios_app_new = ROOT / 'ios' / 'MKLoRaWANPIR'
    if ios_app.is_dir() and not ios_app_new.exists():
        renames.append((ios_app, ios_app_new))

    xcode = ROOT / 'ios' / 'MKLoRaWANPIR.xcodeproj'
    xcode_new = ROOT / 'ios' / 'MKLoRaWANPIR.xcodeproj'
    if xcode.is_dir() and not xcode_new.exists():
        renames.append((xcode, xcode_new))

    ws = ROOT / 'ios' / 'MKLoRaWANPIR.xcworkspace'
    ws_new = ROOT / 'ios' / 'MKLoRaWANPIR.xcworkspace'
    if ws.is_dir() and not ws_new.exists():
        renames.append((ws, ws_new))

    native_ts = ROOT / 'src/native/PIRNative.ts'
    if native_ts.exists():
        renames.append((native_ts, ROOT / 'src/native/PIRNative.ts'))

    for dirpath, dirnames, filenames in os.walk(ROOT, topdown=False):
        if any(p in SKIP_DIRS for p in Path(dirpath).parts):
            continue
        for fn in filenames:
            old = Path(dirpath) / fn
            new_name = fn
            for a, b in FILE_SUBS:
                new_name = new_name.replace(a, b)
            if new_name != fn:
                new = Path(dirpath) / new_name
                if not new.exists():
                    renames.append((old, new))

    for old, new in renames:
        new.parent.mkdir(parents=True, exist_ok=True)
        old.rename(new)
        print(f'rename: {old.relative_to(ROOT)} -> {new.relative_to(ROOT)}')


def patch_launch_and_strings() -> None:
    launch = ROOT / 'ios/MKLoRaWANPIR/LaunchScreen.storyboard'
    if not launch.exists():
        launch = ROOT / 'ios/MKLoRaWANPIR/LaunchScreen.storyboard'
    if launch.exists():
        t = launch.read_text(encoding='utf-8')
        t = re.sub(
            r'text="MKLoRaWAN[^"]*"',
            'text="MKLoRaWANPIR"',
            t,
        )
        launch.write_text(t, encoding='utf-8')
        print('LaunchScreen -> MKLoRaWANPIR')

    strings = ROOT / 'android/app/src/main/res/values/strings.xml'
    if strings.exists():
        t = strings.read_text(encoding='utf-8')
        t = t.replace('MKLoRaWANPIR', 'LW007-PIR')
        t = t.replace('MKLoRaWANPIR', 'LW007-PIR') if 'LW007-PIR' not in t else t
        if 'LW007-PIR' not in t:
            t = re.sub(r'<string name="app_name">[^<]+</string>',
                       '<string name="app_name">LW007-PIR</string>', t)
        strings.write_text(t, encoding='utf-8')


if __name__ == '__main__':
    copy_native_assets()
    merge_mp_api()
    replace_content()
    rename_paths()
    patch_launch_and_strings()
    print('setup_rename_mp done')
