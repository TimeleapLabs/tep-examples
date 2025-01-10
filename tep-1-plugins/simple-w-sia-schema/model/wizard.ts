import { Sia } from "@timeleap/sia";

export interface WizardCall {
  uuid: Buffer | Uint8Array;
  signature: Buffer | Uint8Array;
  tx: string;
  plugin: string;
  method: string;
  name: string;
  age: number;
}

export interface WizardResponse {
  uuid: Buffer | Uint8Array;
  error?: number;
  isWizard?: boolean;
  message?: string;
}

const emptyWizardResponse: WizardResponse = {
  uuid: new Uint8Array(),
  error: 0,
  isWizard: false,
  message: "",
};

const emptyWizardCall: WizardCall = {
  uuid: new Uint8Array(),
  signature: new Uint8Array(),
  tx: "",
  plugin: "",
  method: "",
  name: "",
  age: 0,
};

export function serializeWizardResponse(
  sia: Sia,
  obj: WizardResponse = emptyWizardResponse,
) {
  sia.addByteArray8(obj.uuid);
  sia.addUInt16(obj.error ?? 0);
  sia.addBool(obj.isWizard ?? false);
  sia.addAscii(obj.message ?? "");

  return sia;
}

export function serializeWizardCall(
  sia: Sia,
  obj: WizardCall = emptyWizardCall,
) {
  sia.addByteArray8(obj.uuid);
  sia.addByteArray8(obj.signature);
  sia.addAscii(obj.tx);
  sia.addAscii(obj.plugin);
  sia.addAscii(obj.method);
  sia.addAscii(obj.name);
  sia.addUInt8(obj.age);

  return sia;
}

export function deserializeWizardResponse(sia: Sia) {
  const obj: WizardResponse = {
    uuid: sia.readByteArray8(),
    error: sia.readUInt16(),
    isWizard: sia.readBool(),
    message: sia.readString8(),
  };

  return obj;
}

export function deserializeWizardCall(sia: Sia) {
  const obj: WizardCall = {
    uuid: sia.readByteArray8(),
    signature: sia.readByteArray8(),
    tx: sia.readString8(),
    plugin: sia.readString8(),
    method: sia.readString8(),
    name: sia.readString8(),
    age: sia.readUInt8(),
  };

  return obj;
}
