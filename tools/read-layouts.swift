import Carbon
import Foundation
let sources = TISCreateInputSourceList(nil, false).takeRetainedValue() as! [TISInputSource]
var layouts: [String: [[String: Any]]] = [:]
for source in sources {
    let id = Unmanaged<CFString>.fromOpaque(TISGetInputSourceProperty(source, kTISPropertyInputSourceID)).takeUnretainedValue() as String
    guard ["com.apple.keylayout.ABC", "com.apple.keylayout.Hungarian"].contains(id), let dataPtr = TISGetInputSourceProperty(source, kTISPropertyUnicodeKeyLayoutData) else { continue }
    let data = Unmanaged<CFData>.fromOpaque(dataPtr).takeUnretainedValue()
    let layout = UnsafeRawPointer(CFDataGetBytePtr(data)).assumingMemoryBound(to: UCKeyboardLayout.self)
    var rows: [[String: Any]] = []
    for code in 0..<51 {
        for (name, modifiers) in [("normal",0),("shift",2),("option",8),("shiftOption",10)] {
            var deadKeyState: UInt32 = 0
            var count = 0
            var chars = [UniChar](repeating: 0, count: 8)
            let status = UCKeyTranslate(layout, UInt16(code), UInt16(kUCKeyActionDown), UInt32(modifiers), 40, OptionBits(kUCKeyTranslateNoDeadKeysMask), &deadKeyState, 8, &count, &chars)
            if status == noErr && count > 0 {
                rows.append(["keyCode":code,"modifier":name,"text":String(utf16CodeUnits:chars,count:count)])
            }
        }
    }
    layouts[id] = rows
}
let data = try JSONSerialization.data(withJSONObject:layouts,options:[.prettyPrinted,.sortedKeys])
print(String(data:data,encoding:.utf8)!)
