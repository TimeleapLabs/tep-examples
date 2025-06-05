import { Sia } from "@timeleap/sia";
import { Client, Function } from "@timeleap/client";

export interface IsWizardArgs {
  name: string;
  age: number;
}

export function encodeIsWizardArgs(sia: Sia, isWizardArgs: IsWizardArgs): Sia {
  sia.addString8(isWizardArgs.name);
  sia.addUInt8(isWizardArgs.age);
  return sia;
}

export function decodeIsWizardArgs(sia: Sia): IsWizardArgs {
  return {
    name: sia.readString8(),
    age: sia.readUInt8(),
  };
}

export interface Fee {
  amount: number;
  currency: string;
}

export function encodeFee(sia: Sia, fee: Fee): Sia {
  sia.addUInt64(fee.amount);
  sia.addString8(fee.currency);
  return sia;
}

export function decodeFee(sia: Sia): Fee {
  return {
    amount: sia.readUInt64(),
    currency: sia.readString8(),
  };
}

export interface WizardCall {
  uuid: Uint8Array | Buffer;
  plugin: string;
  method: string;
  timeout: number;
  fee: Fee;
  args: IsWizardArgs;
}

export function encodeWizardCall(sia: Sia, wizardCall: WizardCall): Sia {
  sia.addByteArray8(wizardCall.uuid);
  sia.addString8(wizardCall.plugin);
  sia.addString8(wizardCall.method);
  sia.addUInt64(wizardCall.timeout);
  encodeFee(sia, wizardCall.fee);
  encodeIsWizardArgs(sia, wizardCall.args);
  return sia;
}

export function decodeWizardCall(sia: Sia): WizardCall {
  return {
    uuid: sia.readByteArray8(),
    plugin: sia.readString8(),
    method: sia.readString8(),
    timeout: sia.readUInt64(),
    fee: decodeFee(sia),
    args: decodeIsWizardArgs(sia),
  };
}

export interface WizardResponse {
  opcode: number;
  uuid: Uint8Array | Buffer;
  error?: number;
  isWizard?: boolean;
  message?: string;
}

export function encodeWizardResponse(
  sia: Sia,
  wizardResponse: WizardResponse,
): Sia {
  sia.addUInt8(wizardResponse.opcode);
  sia.addByteArray8(wizardResponse.uuid);
  sia.addUInt16(wizardResponse.error ?? 0);
  sia.addBool(wizardResponse.isWizard ?? false);
  sia.addString8(wizardResponse.message ?? "");
  return sia;
}

export function decodeWizardResponse(sia: Sia): WizardResponse {
  return {
    opcode: sia.readUInt8(),
    uuid: sia.readByteArray8(),
    error: sia.readUInt16(),
    isWizard: sia.readBool(),
    message: sia.readString8(),
  };
}

export class Sorcery {
  private methods: Map<string, Function> = new Map();
  private pluginName = "swiss.timeleap.isWizard.v1";

  constructor(private client: Client) {}

  static connect(client: Client): Sorcery {
    return new Sorcery(client);
  }

  private getMethod(
    method: string,
    timeout: number,
    fee: { currency: string; amount: number },
  ): Function {
    if (!this.methods.has(method)) {
      this.methods.set(
        method,
        this.client.method({
          plugin: this.pluginName,
          method,
          timeout,
          fee,
        }),
      );
    }
    return this.methods.get(method)!;
  }

  public async isWizard(
    sia: Sia,
    isWizardArgs: IsWizardArgs,
  ): Promise<{
    isWizard: boolean;
    message: string;
  }> {
    encodeIsWizardArgs(sia, isWizardArgs);
    const method = this.getMethod("isWizard", 5000, {
      currency: "USD",
      amount: 1,
    });
    const response = await method.populate(sia).invoke();
    const respIsWizard = response.readBool();
    const respMessage = response.readString8();
    return {
      isWizard: respIsWizard,
      message: respMessage,
    };
  }
}
