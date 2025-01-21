import { WebSocketServer } from "ws";
import { Sia } from "@timeleap/sia";
import { Uuid25 } from "uuid25";
import { config } from "dotenv";
import { base58_to_binary } from "base58-js";
import * as ed from "@noble/ed25519";
config();
const wss = new WebSocketServer({ port: 3000 });
const secretKey = base58_to_binary(process.env.PLUGIN_PRIVATE_KEY);
const publicKey = await ed.getPublicKeyAsync(secretKey);
const WORKER_PK = Buffer.from(base58_to_binary(process.env.WORKER_PUBLIC_KEY));
wss.on("connection", (ws) => {
    console.log("Client connected");
    ws.on("message", async (buf) => {
        // read signature information
        const auth = new Sia(buf.subarray(-96));
        const signer = auth.readByteArrayN(32);
        const signature = auth.readByteArrayN(64);
        // signer should be the worker public key
        if (!WORKER_PK.equals(signer)) {
            // TODO: return error to client
            console.log("Invalid signer");
            return;
        }
        // verify the signature
        const isValid = await ed.verifyAsync(signature, buf.subarray(0, buf.length - 96), signer);
        if (!isValid) {
            console.log("Invalid signature");
            return;
        }
        // read the rest of the message
        const sia = new Sia(buf);
        const uuid = sia.readByteArray8();
        const plugin = sia.readAscii();
        const method = sia.readAscii();
        sia.readUInt64(); // skip timeout
        const uuidStr = Uuid25.fromBytes(uuid).toHyphenated();
        console.log(`Received RPC request ${uuidStr} ${plugin}.${method}`);
        if (plugin != "swiss.timeleap.isWizard.v1" && method !== "isWizard") {
            const payload = sia.seek(0).addByteArray8(uuid).addUInt16(404);
            // sign the payload
            const signature = await ed.signAsync(payload.toUint8ArrayReference(), secretKey);
            // add the signature to the payload
            payload.addByteArrayN(publicKey).addByteArrayN(signature);
            // return error
            return ws.send(payload.toUint8ArrayReference());
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
            .addAscii(message);
        // sign the response
        const responseSignature = await ed.signAsync(response.toUint8ArrayReference(), secretKey);
        // add the signature to the response
        response.addByteArrayN(publicKey).addByteArrayN(responseSignature);
        // return response
        ws.send(response.toUint8ArrayReference());
    });
});
console.log("Server started on port 3000");
