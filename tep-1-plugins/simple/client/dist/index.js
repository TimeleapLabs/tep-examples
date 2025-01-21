import WebSocket from "ws";
import { Sia } from "@timeleap/sia";
import { uuidv7obj } from "uuidv7";
import * as ed from "@noble/ed25519";
import { config } from "dotenv";
import { base58_to_binary } from "base58-js";
config();
const VERSION = process.env.UNCHAINED_PROTOCOL_VERSION;
const BROKER_PK = Buffer.from(base58_to_binary(process.env.BROKER_PUBLIC_KEY));
const sk = base58_to_binary(process.env.CLIENT_PRIVATE_KEY);
const pk = await ed.getPublicKeyAsync(sk);
const ws = new WebSocket(`ws://localhost:9123/${VERSION}`);
const age = Math.floor(Math.random() * 42) + 18;
const opcode = new Uint8Array([6]);
const uuid = uuidv7obj();
const payload = new Sia()
    .addByteArrayN(opcode)
    .addByteArray8(uuid.bytes)
    .addAscii("swiss.timeleap.isWizard.v1")
    .addAscii("isWizard")
    .addUInt64(5000)
    .addAscii("John Doe")
    .addUInt8(age);
const signature = await ed.signAsync(payload.toUint8ArrayReference(), sk);
payload.addByteArrayN(pk).addByteArrayN(signature);
console.log(`Checking if John Doe (${age}yo) is a wizard...`);
console.log(`Request UUID: ${uuid.toString()}`);
ws.on("open", () => {
    ws.send(payload.toUint8Array());
});
ws.on("message", async (buf) => {
    // read signature information
    const auth = new Sia(buf.subarray(-96));
    const signer = auth.readByteArrayN(32);
    const signature = auth.readByteArrayN(64);
    // signer should be the worker public key
    if (!BROKER_PK.equals(signer)) {
        console.log("Invalid signer");
        return;
    }
    // verify the signature
    const isValid = await ed.verifyAsync(signature, buf.subarray(0, buf.length - 96), signer);
    if (!isValid) {
        console.log("Invalid signature");
        return;
    }
    // read the response
    const sia = new Sia(new Uint8Array(buf));
    const opcode = sia.readByteArrayN(1);
    if (opcode[0] === 1) {
        console.error(buf.subarray(1).toString());
        return ws.close();
    }
    const responseUuid = sia.readByteArray8();
    // verify that the response UUID matches the request UUID
    if (Buffer.compare(uuid.bytes, responseUuid) !== 0) {
        console.error("UUID mismatch");
        return ws.close();
    }
    const error = sia.readUInt16();
    if (error !== 0) {
        console.error(`Error: ${error}`);
        return ws.close();
    }
    const isWizard = sia.readBool();
    const message = sia.readAscii();
    console.log(message);
    console.log(`Is Wizard: ${isWizard}`);
    ws.close();
});
