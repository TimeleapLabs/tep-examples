import { Sia } from "@timeleap/sia";
import { uuidv7obj } from "uuidv7";
import { config } from "dotenv";
import { Client, Wallet } from "@timeleap/unchained-client";

config();

const wallet = await Wallet.fromBase58(process.env.CLIENT_PRIVATE_KEY!);
const client = await Client.connect(wallet, {
  uri: process.env.BROKER_URI!,
  publicKey: process.env.BROKER_PUBLIC_KEY!,
});

const age = Math.floor(Math.random() * 42) + 18;

const isWizardFn = client.method({
  plugin: "swiss.timeleap.isWizard.v1",
  method: "isWizard",
  timeout: 5000,
});

console.log(`Checking if John Doe (${age}yo) is a wizard...`);

const payload = Sia.alloc(64).addAscii("John Doe").addUInt8(age);
const response = await isWizardFn.populate(payload).invoke();
const isWizard = response.readBool();
const message = response.readAscii();

console.log(message);
console.log(`Is Wizard: ${isWizard}`);
client.close();
