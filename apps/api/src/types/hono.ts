import type { AuthUser } from '@copytrading/auth';

export interface HonoEnv {
  Variables: {
    user: AuthUser;
    requestId: string;
    correlationId: string;
  };
}
