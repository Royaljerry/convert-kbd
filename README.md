# Text transformations for Hungarian typing

Three Keyboard Maestro actions repair selected Hungarian text without calling an
AI service.

| Action | Purpose | Example |
| --- | --- | --- |
| I wanted to type in Hungarian | Correct text typed with the US layout | `K-l0nv;lem;nz` → `Különvélemény` |
| I wanted to type in English | Correct text typed with the Hungarian layout | `Különvélemény` → `K-l0nv;lem;nz` |
| Restore Hungarian accents | Restore missing Hungarian vowel accents conservatively | `Arvizturo tukorfurogep` → `Árvíztűrő tükörfúrógép` |

## Install and use

1. For all three actions, import `dist/text-transformations-macros.kmlibrary`
   into Keyboard Maestro. If you have already imported an earlier version and
   do not see **Restore Hungarian accents**, import the standalone
   `dist/restore-hungarian-accents.kmmacros` instead—it has its own macro group
   and cannot be merged into the older two-action group.
2. Enable the **✑ Text Transformations** group if Keyboard Maestro imports it
   disabled. Assign your preferred global shortcuts in Keyboard Maestro, or use
   the group's Macro Palette.
3. Select text in an editable field and run the appropriate action. The corrected
   plain text replaces the selection.

Keyboard Maestro Engine must be running and have the macOS Accessibility
permission needed to send keystrokes. Keyboard Maestro performs Copy and Paste;
the embedded JavaScript only transforms the copied plain text through macOS's
local pasteboard API. No Terminal window, Node installation, Python installation,
or files from this repository are required after importing the macros.

The current input source does not determine conversion direction and is not
changed. The actions serialize access to the clipboard. They restore the
preceding clipboard-history item after pasting, preserving the existing clipboard
in the normal case.

## Restore missing Hungarian accents

**Restore Hungarian accents** is entirely local: it uses the built-in macOS
Hungarian spelling dictionary (`NSSpellChecker`) and a bundled Hungarian word
frequency table, not an AI model. For each ASCII-only word, it generates the
possible Hungarian vowel forms (`a/á`, `e/é`, `i/í`, `o/ó/ö/ő`, `u/ú/ü/ű`),
retains dictionary-valid candidates, and selects the single most frequent one
when there is a clear corpus-frequency winner. This covers inflected words and
recognised compounds, including the example above.

For unresolved dictionary ties, the action can query the official
`helyesiras.mta.hu` word checker for up to 30 individual ASCII words per run.
Only that individual word is sent; the surrounding text is not. If the service
is unavailable, the action remains local and leaves that word unchanged.

The familiar `árvíztűrő tükörfúrógép` pangram is also included as a fixed
phrase. Its first word has two dictionary-valid spellings (`árvíztúró` and
`árvíztűrő`), so this explicit, deterministic phrase entry supplies the intended
form before individual-word checking begins.

It deliberately leaves ties and unknown candidates alone. It also leaves
identifiers, URLs, already accented words, and words with more than 4,096
possible vowel variants unchanged. The bundled frequency data is credited in
[`NOTICE`](NOTICE).

macOS normally includes the Hungarian dictionary. If the action reports that it
is unavailable, add **Hungarian** under **System Settings → Keyboard → Text
Input** and retry. Apart from the individual fallback lookups described above,
the selected text never leaves the Mac.

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

## Development

```sh
node tests/convert.test.js
python3 tools/build.py
plutil -lint 'dist/text-transformations-macros.kmlibrary'
```

`src/convert.js` contains the conversion tables and pure converter;
`src/replace-selection.js` transforms the copied system clipboard; and
`src/restore-accents.js` contains the deterministic accent-restoration logic.
Keyboard Maestro's native actions handle selection copy, replacement paste, and
clipboard restoration. The build embeds all runtime JavaScript into the library,
so the import is self-contained.

`src/layouts.json` records the native layout data used to validate every supported
key/modifier pair. To inspect the currently installed layouts again:

```sh
swift tools/read-layouts.swift > /tmp/convert-kbd-layouts.json
```

The Swift tool needs Apple's Command Line Tools. The runtime macros use only
macOS facilities and Keyboard Maestro.
