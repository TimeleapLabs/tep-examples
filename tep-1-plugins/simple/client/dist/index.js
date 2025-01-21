import { Sia } from "@timeleap/sia";
import { uuidv7obj } from "uuidv7";
import * as ed from "@noble/ed25519";
import { config } from "dotenv";
import { base58_to_binary } from "base58-js";
import { Client, Wallet } from "@timeleap/unchained-client";
config();
const VERSION = process.env.UNCHAINED_PROTOCOL_VERSION;
const BROKER_PK = Buffer.from(base58_to_binary(process.env.BROKER_PUBLIC_KEY));
const sk = process.env.CLIENT_PRIVATE_KEY;
const wallet = await Wallet.fromBase58(sk);
const client = await Client.connect(wallet, `ws://localhost:9123/${VERSION}`);
const age = Math.floor(Math.random() * 42) + 18;
const uuid = uuidv7obj();
const payload = new Sia()
    .addByteArrayN(new Uint8Array([6]))
    .addByteArray8(uuid.bytes)
    .addAscii("swiss.timeleap.isWizard.v1")
    .addAscii("isWizard")
    .addUInt64(5000)
    .addAscii("John Doe")
    .addUInt8(age);
console.log(`Checking if John Doe (${age}yo) is a wizard...`);
console.log(`Request UUID: ${uuid.toString()}`);
const response = await client.send(payload);
// read signature information
const auth = new Sia(response.subarray(-96));
const signer = auth.readByteArrayN(32);
const signature = auth.readByteArrayN(64);
// signer should be the worker public key
if (!BROKER_PK.equals(signer)) {
    console.log("Invalid signer");
    process.exit(1);
}
// verify the signature
const isValid = await ed.verifyAsync(signature, response.subarray(0, response.length - 96), signer);
if (!isValid) {
    console.log("Invalid signature");
    process.exit(1);
}
// read the response
const sia = new Sia(response);
const opcode = sia.readByteArrayN(1);
if (opcode[0] === 1) {
    console.error(response.subarray(1).toString());
    process.exit(1);
}
const responseUuid = sia.readByteArray8();
// verify that the response UUID matches the request UUID
if (Buffer.compare(uuid.bytes, responseUuid) !== 0) {
    console.error("UUID mismatch");
    process.exit(1);
}
const error = sia.readUInt16();
if (error !== 0) {
    console.error(`Error: ${error}`);
    process.exit(1);
}
const isWizard = sia.readBool();
const message = sia.readAscii();
console.log(message);
console.log(`Is Wizard: ${isWizard}`);
client.close();
