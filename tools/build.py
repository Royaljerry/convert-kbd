#!/usr/bin/env python3
"""Build a portable Keyboard Maestro import containing both conversion macros."""
from pathlib import Path
import plistlib
import uuid

ROOT = Path(__file__).resolve().parents[1]
NAMESPACE = uuid.UUID("8f6218cb-6d8e-4b95-a781-c05fc6bd7a31")


def uid(name):
    return str(uuid.uuid5(NAMESPACE, name)).upper()


def build():
    source = "\n".join((ROOT / "src" / name).read_text() for name in ["convert.js", "replace-selection.js"])
    macros = []
    for direction, name, keycode in [
        ("toHungarian", "I wanted to type in Hungarian (English → Hungarian)", 35),
        ("toEnglish", "I wanted to type in English (Hungarian → English)", 31),
    ]:
        macros.append({
            "UID": uid(direction), "Name": name, "IsActive": True,
            "Triggers": [{"MacroTriggerType": "HotKey", "Modifiers": 6912,
                          "KeyCode": keycode, "FireType": "Pressed"}],
            "Actions": [
                {"MacroActionType": "Semaphore", "SemaphoreAction": "Lock", "SemaphoreName": "convert-kbd-selection",
                 "TimeOutPeriod": "0.1", "TimeOutAbortsMacro": True},
                {"MacroActionType": "CutCopyPaste", "Action": "Copy", "IsDisclosed": False,
                 "TimeOutAbortsMacro": True},
                {"MacroActionType": "ExecuteJavaScriptForAutomation", "UseText": True,
                 "UseModernSyntax": False, "Text": source + '\nconvertSystemClipboard("' + direction + '");\n',
                 "DisplayKind": "None", "IncludedVariables": [], "TrimResults": False,
                 "TrimResultsNew": False, "IncludeStdErr": False, "StopOnFailure": True,
                 "NotifyOnFailure": True, "HonourFailureSettings": True,
                 "TimeOutAbortsMacro": True},
                {"MacroActionType": "CutCopyPaste", "Action": "Paste", "IsDisclosed": False,
                 "TimeOutAbortsMacro": True},
                {"MacroActionType": "SetClipboardToPastClipboard", "PastExpression": "2"},
            ],
        })
    group = {"UID": uid("group-v2"), "Name": "Convert Keyboard Layout — US ↔ Hungarian v2",
             "Activate": "Normal", "IsActive": True, "Macros": macros}
    output = ROOT / "dist" / "Convert Keyboard Layout v2.kmmacros"
    output.parent.mkdir(exist_ok=True)
    output.write_bytes(plistlib.dumps([group], sort_keys=False))
    print(output)


if __name__ == "__main__":
    build()
