import { WebSocketServer } from "ws";
import { Sia } from "@timeleap/sia";
import { Uuid25 } from "uuid25";
const wss = new WebSocketServer({ port: 3000 });
wss.on("connection", (ws) => {
    console.log("Client connected");
    ws.on("message", (buf) => {
        const sia = new Sia(buf);
        const uuid = sia.readByteArray8();
        sia.readByteArray8(); // skip the signature
        sia.readAscii(); // skip the tx hash
        const plugin = sia.readAscii();
        const method = sia.readAscii();
        const uuidStr = Uuid25.fromBytes(uuid).toHyphenated();
        console.log(`Received RPC request ${uuidStr} ${plugin}.${method}`);
        if (plugin != "swiss.timeleap.isWizard.v1" && method !== "isWizard") {
            // return error
            return ws.send(sia
                .seek(0)
                .addByteArray8(uuid)
                .addUInt16(404) // error code
                .toUint8ArrayReference());
        }
        const name = sia.readAscii();
        const age = sia.readUInt8();
        const isWizard = age >= 30;
        const message = isWizard
            ? `You are a wizard, ${name}!`
            : `You are NOT a wizard, ${name}!`;
        const response = new Sia()
            .addByteArray8(uuid)
            .addUInt16(0)
            .addBool(isWizard)
            .addAscii(message)
            .toUint8ArrayReference();
        ws.send(response);
    });
});
console.log("Server started on port 3000");
