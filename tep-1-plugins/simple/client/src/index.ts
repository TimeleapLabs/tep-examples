import { Sia } from "@timeleap/sia";
import { config } from "dotenv";
import { Client, Wallet } from "@timeleap/unchained-client";
import { Sorcery } from "./model/wizard.js";

config();

const uri = process.env.BROKER_URI!;
const publicKey = process.env.BROKER_PUBLIC_KEY!;

const wallet = await Wallet.fromBase58(process.env.CLIENT_PRIVATE_KEY!);
const client = await Client.connect(wallet, { uri, publicKey });
const sorcery = Sorcery.connect(client);

const age = Math.floor(Math.random() * 42) + 18;
const name = "John Doe";

console.log(`Checking if ${name} (${age}yo) is a wizard...`);
const response = await sorcery.isWizard(Sia.alloc(64), { name, age });

console.log(response.message);
console.log(`Is Wizard: ${response.isWizard}`);
client.close();
