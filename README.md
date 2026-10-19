# Convert keyboard layout

Two Keyboard Maestro macros repair selected text typed with the wrong keyboard
layout on a US ANSI Mac keyboard.

| Shortcut | Intended language | Conversion |
| --- | --- | --- |
| Control–Option–Shift–Command–P | Hungarian | `K-l0nv;lem;nz` → `Különvélemény` |
| Control–Option–Shift–Command–O | English | `Különvélemény` → `K-l0nv;lem;nz` |

## Install and use

1. Import `dist/Convert Keyboard Layout v2.kmmacros` into Keyboard Maestro using
   **File → Import → Import Macros…**.
2. Enable the **Convert Keyboard Layout — US ↔ Hungarian v2** group and both macros
   if Keyboard Maestro imports them disabled.
3. Select the mistyped text in an editable field, press the appropriate shortcut,
   and release the keys. The corrected plain text replaces the selection.

Keyboard Maestro Engine must be running and have the macOS Accessibility
permission needed to send keystrokes. Keyboard Maestro performs Copy and Paste;
the embedded JavaScript only transforms the copied plain text through macOS's
local pasteboard API. No Terminal window, Node installation, Python installation,
or files from this repository are required after importing the macros.

The current input source does not determine conversion direction and is not
changed. Either shortcut works with either layout currently selected. The macros
serialize access to the clipboard. They restore the preceding clipboard-history
item after pasting, preserving the existing clipboard in the normal case.

## Character handling

The mapping was extracted from macOS's **ABC** and **Hungarian** input sources
using `UCKeyTranslate` for an ANSI keyboard. It includes unmodified and Shift
layers, uppercase and lowercase letters, all nine Hungarian accented letters,
Y/Z, digits, and punctuation. Examples:

```text
K-l0nv;lem;nz  ↔ Különvélemény
K_L)NV:LEM:NZ  ↔ KÜLÖNVÉLEMÉNY
'`;=0[]-\     ↔ áíéóöőúüű
"~:+){}_|     ↔ ÁÍÉÓÖŐÚÜŰ
```

Each input character is translated once. Spaces, tabs, and line breaks remain
intact; characters outside the mapping, such as emoji, are retained. Text is
normalized to NFC so decomposed Hungarian accents work too.

This is a physical-key conversion, not spelling correction or translation.
Select only the incorrectly typed portion. Option/dead-key sequences and
Caps-Lock-specific interpretations are outside this first version: plain text
does not retain the original modifier-key history. For instance, a US `;` could
mean Hungarian `é` or `É` if Caps Lock had been involved; this version uses the
unmodified/Shift mapping consistently.

## App compatibility

Use in ordinary editable text fields that support Command-C and Command-V.
Formatting inside the replaced selection is not preserved.

Terminal selections are not editable selections. **Do not use these macros in
standalone or integrated terminals, read-only content, or nonstandard editors
where Paste does not replace the selection.** Correcting a shell command buffer
needs a separate shell-specific integration.

The native Copy action waits for the clipboard to change. If nothing usable is
selected, it times out and the macro stops. Some nonstandard editors may copy a
whole line when nothing is selected, so always make the text selection first.

## Replacing the earlier build

The `v2` macros avoid the macOS `System Events` call that could produce an
AppleEvent timeout. Disable the earlier **Convert Keyboard Layout — US ↔
Hungarian** group before enabling v2, because the shortcuts are identical.
After the v2 macros work in a text editor, delete the earlier group.

## Development

```sh
node tests/convert.test.js
python3 tools/build.py
plutil -lint 'dist/Convert Keyboard Layout v2.kmmacros'
```

`src/convert.js` contains the conversion tables and pure converter;
`src/replace-selection.js` transforms the copied system clipboard. Keyboard
Maestro's native actions handle selection copy, replacement paste, and clipboard
restoration. The build embeds both into each macro, so the import is
self-contained.

`src/layouts.json` records the native layout data used to validate every supported
key/modifier pair. To inspect the currently installed layouts again:

```sh
swift tools/read-layouts.swift > /tmp/convert-kbd-layouts.json
```

The Swift tool needs Apple's Command Line Tools. The runtime macros use only
macOS facilities and Keyboard Maestro.
