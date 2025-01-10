import { WebSocketServer } from "ws";
import { Sia } from "@timeleap/sia";
import { Uuid25 } from "uuid25";

import {
  deserializeWizardCall as decode,
  serializeWizardResponse as encode,
} from "./model/wizard.js";

const wss = new WebSocketServer({ port: 3000 });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (buf: Buffer) => {
    const sia = new Sia(buf);
    const { plugin, method, uuid, ...args } = decode(sia);

    const uuidStr = Uuid25.fromBytes(uuid).toHyphenated();
    console.log(`Received RPC request ${uuidStr} ${plugin}.${method}`);

    if (plugin != "swiss.timeleap.isWizard.v1" && method !== "isWizard") {
      const payload = { uuid, error: 404 }; // return error
      return ws.send(encode(new Sia(), payload).toUint8ArrayReference());
    }

    const isWizard = args.age >= 30;
    const message = isWizard
      ? `You are a wizard, ${args.name}!`
      : `You are NOT a wizard, ${args.name}!`;

    const payload = { uuid, isWizard, message };
    ws.send(encode(new Sia(), payload).toUint8ArrayReference());
  });
});

console.log("Server started on port 3000");
