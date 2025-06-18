import { WebSocketServer } from "ws";
import { Sia } from "@timeleap/sia";
import { Uuid25 } from "uuid25";
import { config } from "dotenv";
import { Wallet, Identity, OpCodes } from "@timeleap/client";
import { decodeWizardCall, encodeWizardResponse } from "./model/wizard.js";

config();

const wss = new WebSocketServer({ port: 3000 });
const wallet = await Wallet.fromBase58(process.env.PLUGIN_PRIVATE_KEY!);
const worker = await Identity.fromBase58(process.env.WORKER_PUBLIC_KEY!);
const appId = process.env.APP_ID ? parseInt(process.env.APP_ID) : 0;

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (buf: Buffer) => {
    if (!(await worker.verify(buf))) {
      console.log("Invalid signature");
      return;
    }

    const { uuid, plugin, method, args } = decodeWizardCall(
      new Sia(buf).skip(9), // Skip the opcode byte and the appId byte
    );
    const uuidStr = Uuid25.fromBytes(uuid).toHyphenated();
    console.log(`Received RPC request ${uuidStr} ${plugin}.${method}`);

    if (plugin != "swiss.timeleap.isWizard.v1" && method !== "isWizard") {
      const payload = await wallet.signSia(
        encodeWizardResponse(Sia.alloc(256), {
          opcode: OpCodes.RPCResponse,
          appId,
          uuid,
          error: 404,
        }),
      );

      return ws.send(payload.toUint8ArrayReference()); // return error
    }

    const isWizard = args.age >= 30;
    const message = isWizard
      ? `You are a wizard, ${args.name}!`
      : `You are NOT a wizard, ${args.name}!`;

    const response = await wallet.signSia(
      encodeWizardResponse(Sia.alloc(512), {
        opcode: OpCodes.RPCResponse,
        uuid,
        appId,
        isWizard,
        message,
      }),
    );

    ws.send(response.toUint8ArrayReference()); // return response
  });
});

console.log("Server started on port 3000");
