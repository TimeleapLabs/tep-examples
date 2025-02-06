import { Wallet } from "@timeleap/client"

const wallet = await Wallet.random();
const encoded = wallet.toBase58();

console.log("sk:", encoded.privateKey);
console.log("pk:", encoded.publicKey);
