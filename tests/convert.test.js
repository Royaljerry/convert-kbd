const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { convertKeyboardText: convert, keyboardMaps } = require('../src/convert');
const {
    accentVariants,
    restoreHungarianWord,
    restoreHungarianAccents
} = require('../src/restore-accents');

assert.equal(convert('K-l0nv;lem;nz', 'toHungarian'), 'Különvélemény');
assert.equal(convert('Különvélemény', 'toEnglish'), 'K-l0nv;lem;nz');
assert.equal(convert('K_L)NV:LEM:NZ', 'toHungarian'), 'KÜLÖNVÉLEMÉNY');
assert.equal(convert('KÜLÖNVÉLEMÉNY', 'toEnglish'), 'K_L)NV:LEM:NZ');
assert.equal(convert("'`;=0[]-\\", 'toHungarian'), 'áíéóöőúüű');
assert.equal(convert('"~:+){}_|', 'toHungarian'), 'ÁÍÉÓÖŐÚÜŰ');
assert.equal(convert('áíéóöőúüű', 'toEnglish'), "'`;=0[]-\\");
assert.equal(convert('ÁÍÉÓÖŐÚÜŰ', 'toEnglish'), '"~:+){}_|');
assert.equal(convert('yYzZ', 'toHungarian'), 'zZyY');
assert.equal(convert('!@#$%^&*()_+', 'toHungarian'), "'\"+!%/=()ÖÜÓ");
assert.equal(convert(' \tK-l0nv;lem;nz\n😀 中文\n ', 'toHungarian'), ' \tKülönvélemény\n😀 中文\n ');
assert.equal(convert('o\u030B', 'toEnglish'), '[');
assert.equal(convert('', 'toEnglish'), '');
assert.throws(() => convert('text', 'unknown'));

// Compare every supported physical key/modifier against the native macOS data.
const layouts = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/layouts.json'), 'utf8'));
const hungarian = new Map(layouts['com.apple.keylayout.Hungarian'].map(r => [`${r.keyCode}/${r.modifier}`, r.text]));
let checked = 0;
for (const row of layouts['com.apple.keylayout.ABC']) {
    if (row.keyCode === 10 || !['normal', 'shift'].includes(row.modifier)) continue;
    const expected = hungarian.get(`${row.keyCode}/${row.modifier}`);
    assert.equal(convert(row.text, 'toHungarian'), expected);
    assert.equal(convert(expected, 'toEnglish'), row.text);
    checked++;
}
for (const c of Object.keys(keyboardMaps.toHungarian)) {
    assert.equal(convert(convert(c, 'toHungarian'), 'toEnglish'), c);
}

const acceptedWords = new Set(['Árvíztűrő', 'tükörfúrógép', 'KÖR', 'még', 'kór', 'meg', 'kor']);
const isCorrectHungarian = word => acceptedWords.has(word);
assert.ok(accentVariants('turo').includes('tűrő'));
assert.equal(restoreHungarianWord('Arvizturo', isCorrectHungarian), 'Árvíztűrő');
assert.equal(restoreHungarianWord('tukorfurogep', isCorrectHungarian), 'tükörfúrógép');
assert.equal(restoreHungarianWord('KOR', isCorrectHungarian), 'KÖR');
assert.equal(restoreHungarianWord('meg', isCorrectHungarian), 'meg');
assert.equal(restoreHungarianWord('function_name', isCorrectHungarian), 'function_name');
assert.equal(
    restoreHungarianAccents('Arvizturo tukorfurogep, meg kor.', isCorrectHungarian),
    'Árvíztűrő tükörfúrógép, meg kor.'
);
assert.equal(
    restoreHungarianAccents('ARVIZTURO TUKORFUROGEP', isCorrectHungarian),
    'ÁRVÍZTŰRŐ TÜKÖRFÚRÓGÉP'
);

console.log(`Passed layout conversion, Unicode, ${checked} native key/modifier pairs, and conservative Hungarian accent restoration.`);
