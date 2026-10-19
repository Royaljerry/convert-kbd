// Embedded after convert.js in each macro. No external runtime files are needed.
// Keyboard Maestro performs Copy and Paste natively; this action only transforms
// the copied text on the local macOS pasteboard.
function convertSystemClipboard(direction) {
    ObjC.import("AppKit");
    var pasteboard = $.NSPasteboard.generalPasteboard;
    var value = pasteboard.stringForType($.NSPasteboardTypeString);
    if (!value || value.isNil()) throw new Error("The selection does not contain text.");
    var original = ObjC.unwrap(value);
    if (!original.length) throw new Error("Select the mistyped text first.");
    var converted = convertKeyboardText(original, direction);
    if (converted === original) return;
    pasteboard.clearContents;
    if (!pasteboard.setStringForType($(converted), $.NSPasteboardTypeString)) {
        throw new Error("Could not prepare the replacement text.");
    }
}
