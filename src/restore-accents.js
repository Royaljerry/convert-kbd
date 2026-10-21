// Restore missing Hungarian accents without calling an AI or a network service.
//
// The macOS Hungarian spelling dictionary is the authority: candidates are
// generated only by substituting the Hungarian vowel forms and are accepted
// only when NSSpellChecker recognises the complete word. A word changes only
// when exactly one accented spelling is valid, so ambiguous words such as
// "meg" (meg/még) are deliberately left untouched.

var HUNGARIAN_VOWELS = {
    "a": ["a", "á"],
    "e": ["e", "é"],
    "i": ["i", "í"],
    "o": ["o", "ó", "ö", "ő"],
    "u": ["u", "ú", "ü", "ű"]
};

// A small phrase lexicon handles fixed expressions whose component words are
// valid in more than one accented form. More entries can be added without
// changing the algorithm or introducing an external service.
var KNOWN_HUNGARIAN_PHRASES = {
    "arvizturo tukorfurogep": "árvíztűrő tükörfúrógép"
};

var MAX_ACCENT_VARIANTS = 4096;
var HUNGARIAN_LANGUAGE = "hu";
// NSNotFound is wider than JavaScript's safe-integer range, so compare its
// bridged string representation rather than a lossy JavaScript number.
var NOT_FOUND_RANGE = "9223372036854775807";

function accentOptions(character) {
    var options = HUNGARIAN_VOWELS[character.toLowerCase()];
    if (!options) return [character];
    if (character === character.toUpperCase() && character !== character.toLowerCase()) {
        return options.map(function (option) { return option.toUpperCase(); });
    }
    return options;
}

function countAccentVariants(word) {
    return Array.from(word).reduce(function (count, character) {
        return count * accentOptions(character).length;
    }, 1);
}

function accentVariants(word) {
    if (countAccentVariants(word) > MAX_ACCENT_VARIANTS) return [];
    return Array.from(word).reduce(function (variants, character) {
        var options = accentOptions(character);
        var expanded = [];
        variants.forEach(function (prefix) {
            options.forEach(function (option) { expanded.push(prefix + option); });
        });
        return expanded;
    }, [""]);
}

function isHungarianLetter(character) {
    return /^[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]$/.test(character);
}

function restoreHungarianWord(word, isCorrect) {
    // Do not touch already accented words, identifiers, or words whose search
    // space is too large to evaluate promptly inside Keyboard Maestro.
    if (!/^[A-Za-z]+$/.test(word) || !/[aeiouAEIOU]/.test(word)) return word;

    var candidates = accentVariants(word).filter(isCorrect);

    return candidates.length === 1 ? candidates[0] : word;
}

function preservePhraseCapitalization(source, replacement) {
    if (source === source.toUpperCase()) return replacement.toUpperCase();
    if (source.charAt(0) === source.charAt(0).toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
}

function restoreKnownHungarianPhrases(text) {
    Object.keys(KNOWN_HUNGARIAN_PHRASES).forEach(function (unaccented) {
        var expression = new RegExp("\\b" + unaccented + "\\b", "gi");
        text = text.replace(expression, function (source) {
            return preservePhraseCapitalization(source, KNOWN_HUNGARIAN_PHRASES[unaccented]);
        });
    });
    return text;
}

function restoreHungarianAccents(text, isCorrect) {
    text = restoreKnownHungarianPhrases(text.normalize("NFC"));
    var result = "";
    var word = "";

    function appendWord() {
        if (word) result += restoreHungarianWord(word, isCorrect);
        word = "";
    }

    Array.from(text).forEach(function (character) {
        if (isHungarianLetter(character)) word += character;
        else {
            appendWord();
            result += character;
        }
    });
    appendWord();
    return result;
}

function hasHungarianSpellChecker(checker) {
    var languages = checker.availableLanguages;
    for (var index = 0; index < languages.count; index++) {
        if (ObjC.unwrap(languages.objectAtIndex(index)) === HUNGARIAN_LANGUAGE) return true;
    }
    return false;
}

function macOSRecognisesHungarianWord(checker, word) {
    var range = checker.checkSpellingOfStringStartingAtLanguageWrapInSpellDocumentWithTagWordCount(
        $(word), 0, HUNGARIAN_LANGUAGE, false, 0, Ref()
    );
    return String(range.location) === NOT_FOUND_RANGE;
}

function restoreHungarianAccentsOnSystemClipboard() {
    ObjC.import("AppKit");
    var checker = $.NSSpellChecker.sharedSpellChecker;
    if (!hasHungarianSpellChecker(checker)) {
        throw new Error("The macOS Hungarian spelling dictionary is unavailable. Add Hungarian in System Settings > Keyboard > Text Input, then try again.");
    }

    var pasteboard = $.NSPasteboard.generalPasteboard;
    var value = pasteboard.stringForType($.NSPasteboardTypeString);
    if (!value || value.isNil()) throw new Error("The selection does not contain text.");
    var original = ObjC.unwrap(value);
    if (!original.length) throw new Error("Select the unaccented Hungarian text first.");

    var corrected = restoreHungarianAccents(original, function (word) {
        return macOSRecognisesHungarianWord(checker, word);
    });
    if (corrected === original) return;

    pasteboard.clearContents;
    if (!pasteboard.setStringForType($(corrected), $.NSPasteboardTypeString)) {
        throw new Error("Could not prepare the corrected text.");
    }
}

if (typeof module !== "undefined") {
    module.exports = {
        accentVariants: accentVariants,
        restoreHungarianWord: restoreHungarianWord,
        restoreHungarianAccents: restoreHungarianAccents,
        restoreKnownHungarianPhrases: restoreKnownHungarianPhrases
    };
}
