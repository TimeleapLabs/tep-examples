import WebSocket from "ws";
import { Sia } from "@timeleap/sia";
import { uuidv7obj } from "uuidv7";

import {
  serializeWizardCall as encode,
  deserializeWizardResponse as decode,
} from "./model/wizard.js";

const VERSION = process.env.UNCHAINED_PROTOCOL_VERSION;
const ws = new WebSocket(`ws://localhost:9123/${VERSION}`);

const age = Math.floor(Math.random() * 42) + 18;
const opcode = new Uint8Array([9]);
const uuid = uuidv7obj();

const payload = new Sia().addByteArrayN(opcode);
const call = encode(payload, {
  uuid: uuid.bytes,
  signature: uuid.bytes,
  tx: "0x",
  plugin: "swiss.timeleap.isWizard.v1",
  method: "isWizard",
  age,
  name: "John Doe",
});

console.log(`Checking if John Doe (${age}yo) is a wizard...`);
console.log(`Request UUID: ${uuid.toString()}`);

ws.on("open", () => {
  ws.send(call.toUint8Array());
});

ws.on("message", (data: Buffer) => {
  const sia = new Sia(new Uint8Array(data));

  const opcode = sia.readByteArrayN(1);
  if (opcode[0] === 5) {
    console.error(data.subarray(1).toString());
    return ws.close();
  }

  const { uuid: responseUuid, error, ...args } = decode(sia);

  // verify that the response UUID matches the request UUID
  if (Buffer.compare(uuid.bytes, responseUuid) !== 0) {
    console.error("UUID mismatch");
    return ws.close();
  }

  if (error !== 0) {
    console.error(`Error: ${error}`);
    return ws.close();
  }

  console.log(args.message);
  console.log(`Is Wizard: ${args.isWizard}`);
  ws.close();
});
