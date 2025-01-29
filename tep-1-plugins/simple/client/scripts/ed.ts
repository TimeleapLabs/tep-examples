import { binary_to_base58 } from "base58-js";
import * as ed from "@noble/ed25519";

const sk = ed.utils.randomPrivateKey();
const pk = await ed.getPublicKeyAsync(sk);

const skBase58 = binary_to_base58(sk);
const pkBase58 = binary_to_base58(pk);

console.log("sk:", skBase58);
console.log("pk:", pkBase58);
