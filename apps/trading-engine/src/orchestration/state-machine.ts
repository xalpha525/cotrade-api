import type { ExecutionState } from './types.js';

export class ExecutionStateMachine {
  private static readonly allowedTransitions: Record<ExecutionState, Set<ExecutionState>> = {
    CREATED: new Set(['VALIDATING', 'FAILED', 'CANCELLED']),
    VALIDATING: new Set(['PREPARING', 'FAILED', 'CANCELLED']),
    PREPARING: new Set(['WAITING_FOR_QUOTE', 'READY', 'FAILED', 'CANCELLED']),
    WAITING_FOR_QUOTE: new Set(['WAITING_FOR_SIMULATION', 'PREPARING', 'FAILED', 'CANCELLED']),
    WAITING_FOR_SIMULATION: new Set(['WAITING_FOR_SIGNATURE', 'READY', 'FAILED', 'CANCELLED']),
    WAITING_FOR_SIGNATURE: new Set(['READY_TO_BROADCAST', 'FAILED', 'CANCELLED']),
    READY_TO_BROADCAST: new Set(['BROADCAST_PENDING', 'FAILED', 'CANCELLED']),
    BROADCAST_PENDING: new Set(['CONFIRMATION_PENDING', 'FAILED', 'CANCELLED']),
    CONFIRMATION_PENDING: new Set(['CONFIRMED', 'FAILED', 'EXPIRED']),
    READY: new Set(['READY_TO_BROADCAST', 'FAILED', 'CANCELLED']),
    CONFIRMED: new Set([]),
    FAILED: new Set(['CREATED']),
    CANCELLED: new Set([]),
    EXPIRED: new Set(['CREATED'])
  };

  static canTransition(from: ExecutionState, to: ExecutionState): boolean {
    const allowed = this.allowedTransitions[from];
    return allowed ? allowed.has(to) : false;
  }

  static transition(currentState: ExecutionState, nextState: ExecutionState): ExecutionState {
    if (!this.canTransition(currentState, nextState)) {
      throw new Error(`INVALID_STATE_TRANSITION: Cannot transition from ${currentState} to ${nextState}`);
    }
    return nextState;
  }
}
