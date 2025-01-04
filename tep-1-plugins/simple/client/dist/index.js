import WebSocket from "ws";
import { Sia } from "@timeleap/sia";
import { uuidv7obj } from "uuidv7";
const VERSION = "0.14.0";
const ws = new WebSocket(`ws://localhost:9123/${VERSION}`);
const age = Math.floor(Math.random() * 42) + 18;
const opcode = new Uint8Array([9]);
const uuid = uuidv7obj();
const payload = new Sia()
    .addByteArrayN(opcode)
    .addByteArray8(uuid.bytes)
    .addByteArray8(uuid.bytes) // We don't care about the signature for now
    .addAscii("0x") // We don't care about the transaction hash for now
    .addAscii("swiss.timeleap.isWizard.v1")
    .addAscii("isWizard")
    .addAscii("John Doe")
    .addUInt8(age);
console.log(`Checking if John Doe (${age}yo) is a wizard...`);
console.log(`Request UUID: ${uuid.toString()}`);
ws.on("open", () => {
    ws.send(payload.toUint8Array());
});
ws.on("message", (data) => {
    const sia = new Sia(new Uint8Array(data));
    const opcode = sia.readByteArrayN(1);
    if (opcode[0] === 5) {
        console.error(data.subarray(1).toString());
        return ws.terminate();
    }
    const responseUuid = sia.readByteArray8();
    // verify that the response UUID matches the request UUID
    if (Buffer.compare(uuid.bytes, responseUuid) !== 0) {
        console.error("UUID mismatch");
        return ws.terminate();
    }
    const error = sia.readUInt16();
    if (error !== 0) {
        console.error(`Error: ${error}`);
        return ws.terminate();
    }
    const isWizard = sia.readBool();
    const message = sia.readAscii();
    console.log(message);
    console.log(`Is Wizard: ${isWizard}`);
    ws.terminate();
});
