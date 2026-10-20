import Foundation
import Security
import CryptoKit

// Approved per-app publisher key only. Private bytes never leave this process/Keychain.
let service = "org.squidproductions.script-call.release-signing"
let account = "ed25519-v1"
let privatePrefix = Data([0x30,0x2e,0x02,0x01,0x00,0x30,0x05,0x06,0x03,0x2b,0x65,0x70,0x04,0x22,0x04,0x20])
let publicPrefix = Data([0x30,0x2a,0x30,0x05,0x06,0x03,0x2b,0x65,0x70,0x03,0x21,0x00])
func fail(_ text: String) -> Never { FileHandle.standardError.write(Data((text+"\n").utf8)); exit(1) }
var login: SecKeychain?
let location = NSHomeDirectory()+"/Library/Keychains/login.keychain-db"
let opened = SecKeychainOpen(location, &login)
guard opened == errSecSuccess, let keychain = login else { fail("Login Keychain unavailable (status \(opened)).") }
let query: [String:Any] = [kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:service,kSecAttrAccount as String:account,kSecUseKeychain as String:keychain]
func load() -> Curve25519.Signing.PrivateKey {
 var q=query;q[kSecReturnData as String]=true;q[kSecMatchLimit as String]=kSecMatchLimitOne
 var result:CFTypeRef?;let status=SecItemCopyMatching(q as CFDictionary,&result)
 guard status==errSecSuccess,let encoded=result as? Data,let secret=Data(base64Encoded:encoded),secret.count==48,secret.prefix(16)==privatePrefix else { fail("Approved release Keychain item unavailable or invalid (status \(status)).") }
 do{return try Curve25519.Signing.PrivateKey(rawRepresentation:secret.suffix(32))}catch{fail("Release key could not be opened.")}
}
func publicPEM(_ key:Curve25519.Signing.PrivateKey)->String {"-----BEGIN PUBLIC KEY-----\n"+(publicPrefix+key.publicKey.rawRepresentation).base64EncodedString()+"\n-----END PUBLIC KEY-----\n"}
let command=CommandLine.arguments.dropFirst().first ?? "public"
if command=="create" {
 var existing:CFTypeRef?;let status=SecItemCopyMatching(query as CFDictionary,&existing)
 guard status==errSecItemNotFound else {fail("Refusing to create or replace an existing/unavailable release item (status \(status)).")}
 let key=Curve25519.Signing.PrivateKey();let encoded=(privatePrefix+key.rawRepresentation).base64EncodedData()
 var item=query;item[kSecValueData as String]=encoded;item[kSecAttrLabel as String]="Script Call release signing — Ed25519 v1";item[kSecAttrSynchronizable as String]=false
 let added=SecItemAdd(item as CFDictionary,nil)
 guard added==errSecSuccess else {fail("Release item was not stored (status \(added)).")}
 // Output contains the public key only. No private key, credential or access grant is exported.
 let output:[String:Any]=["created":true,"service":service,"account":account,"publicKey":publicPEM(key)]
 FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject:output,options:[.sortedKeys]));exit(0)
}
let key=load()
if command=="public" {FileHandle.standardOutput.write(Data(publicPEM(key).utf8));exit(0)}
if command=="sign" {
 let payload=FileHandle.standardInput.readDataToEndOfFile();guard !payload.isEmpty && payload.count<=200000 else {fail("Signed metadata must be nonempty and under 200 KB.")}
 do{let signature=try key.signature(for:payload);let output=["publicKey":publicPEM(key),"signature":signature.base64EncodedString()];FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject:output,options:[.sortedKeys]));exit(0)}catch{fail("Release signing failed.")}
}
fail("Supported operations: create, public, sign.")
