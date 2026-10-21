#!/usr/bin/env python3
"""Build the self-contained Keyboard Maestro text-transformations library."""
from pathlib import Path
import plistlib
import uuid

ROOT = Path(__file__).resolve().parents[1]
NAMESPACE = uuid.UUID("8f6218cb-6d8e-4b95-a781-c05fc6bd7a31")
LIBRARY_UID = "1A5ABEA9-B18A-4E07-BED7-5D11A10A83F9"
GROUP_UID = "DD1F4A60-FDFB-4420-ABCE-F772FE06B48E"


def uid(name):
    return str(uuid.uuid5(NAMESPACE, name)).upper()


def action(action_uid, action_type, **values):
    return {"ActionUID": action_uid, "MacroActionType": action_type, **values}


def clipboard_actions(action_uid, source, entry_point, semaphore_name):
    return [
        action(action_uid, "Semaphore", SemaphoreAction="Lock", SemaphoreName=semaphore_name,
               TimeOutPeriod="0.1", TimeOutAbortsMacro=True),
        action(action_uid + 1, "CutCopyPaste", Action="Copy", IsDisclosed=False,
               TimeOutAbortsMacro=True),
        action(action_uid + 2, "ExecuteJavaScriptForAutomation", UseText=True,
               UseModernSyntax=False, Path="", Text=source + "\n" + entry_point + "();\n",
               DisplayKind="None", IncludedVariables=[], TrimResults=False,
               TrimResultsNew=False, IncludeStdErr=False, StopOnFailure=True,
               NotifyOnFailure=True, HonourFailureSettings=True,
               TimeOutAbortsMacro=True),
        action(action_uid + 3, "CutCopyPaste", Action="Paste", IsDisclosed=False,
               TimeOutAbortsMacro=True),
        action(action_uid + 4, "SetClipboardToPastClipboard", PastExpression="2"),
    ]


def macro(name, macro_uid, keycode, actions):
    return {
        "UID": macro_uid,
        "Name": name,
        "IsActive": True,
        # These one-letter shortcuts work while the group's Macro Palette is open.
        "Triggers": [{"MacroTriggerType": "HotKey", "Modifiers": 0,
                      "KeyCode": keycode, "FireType": "Pressed"}],
        "Actions": actions,
    }


def build():
    converter_source = "\n".join(
        (ROOT / "src" / name).read_text() for name in ["convert.js", "replace-selection.js"]
    )
    restore_source = (ROOT / "src" / "restore-accents.js").read_text()
    macros = [
        macro(
            "I wanted to type in Hungarian (English → Hungarian)",
            uid("toHungarian"), 4,
            clipboard_actions(13629, converter_source,
                              'convertSystemClipboard("toHungarian")',
                              "convert-kbd-selection"),
        ),
        macro(
            "I wanted to type in English (Hungarian → English)",
            uid("toEnglish"), 14,
            clipboard_actions(13634, converter_source,
                              'convertSystemClipboard("toEnglish")',
                              "convert-kbd-selection"),
        ),
        macro(
            "Restore Hungarian accents (no accents → accents)",
            uid("restoreHungarianAccents"), 0,
            clipboard_actions(13639, restore_source,
                              "restoreHungarianAccentsOnSystemClipboard",
                              "restore-hungarian-accents-selection"),
        ),
    ]
    group = {
        "UID": GROUP_UID,
        "Name": "✑ Text Transformations",
        "Activate": "OnceWithPalette",
        "IsActive": True,
        "AddToMacroPalette": False,
        "AddToStatusMenu": False,
        "CanDragToMacroGroup": False,
        "KeyCode": 7,
        "Modifiers": 6400,
        "PaletteUnderMouse": False,
        "ToggleMacroUID": "180F7A77-048A-46C1-8E2B-343A67981FD6",
        "Macros": macros,
    }
    library = {
        "Author": "",
        "AuthorURL": "",
        "CanDragToMacroGroup": True,
        "Category1": "Interface Control",
        "Category2": "",
        "Description": "Offline Hungarian keyboard-layout conversion and conservative accent restoration.",
        "Items": [group],
        "UID": LIBRARY_UID,
    }
    output = ROOT / "dist" / "text-transformations-macros.kmlibrary"
    output.parent.mkdir(exist_ok=True)
    output.write_bytes(plistlib.dumps(library, sort_keys=False))
    print(output)


if __name__ == "__main__":
    build()
