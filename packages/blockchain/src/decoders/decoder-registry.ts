import type { DecodedInstruction, IDexDecoder } from './interfaces.js';

export class DecoderRegistry {
  private decoders: IDexDecoder[] = [];

  register(decoder: IDexDecoder): void {
    this.decoders.push(decoder);
  }

  decodeTransaction(programIdOrContract: string, rawPayload: Record<string, unknown>): DecodedInstruction {
    for (const decoder of this.decoders) {
      if (decoder.canDecode(programIdOrContract, rawPayload)) {
        return decoder.decode(rawPayload);
      }
    }

    return {
      actionType: 'UNKNOWN',
      rawPayload
    };
  }
}
