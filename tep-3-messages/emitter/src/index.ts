import { Wallet, Client } from "@timeleap/client";
import { config } from "dotenv";

config();

const uri = process.env.BROKER_URI!;
const publicKey = process.env.BROKER_PUBLIC_KEY!;

const wallet = await Wallet.fromBase58(process.env.CLIENT_PRIVATE_KEY!);
const client = await Client.connect(wallet, { uri, publicKey });

const payload = Buffer.from("Hello, World!");
await client.broadcast(Date.now(), "swiss.timeleap", payload);

client.close();
