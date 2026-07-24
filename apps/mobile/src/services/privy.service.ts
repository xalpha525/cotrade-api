export interface PrivyAuthResponse {
  privyToken: string;
  user: {
    id: string;
    email?: string;
    wallets?: Array<{ address: string; chainType?: string; walletClientType?: string }>;
  };
}

export class PrivyService {
  private static getAppId(): string {
    const appId = process.env['EXPO_PUBLIC_PRIVY_APP_ID'];
    if (!appId || appId.trim() === '') {
      throw new Error(
        'MISSING CONFIGURATION: EXPO_PUBLIC_PRIVY_APP_ID is missing from environment configuration.'
      );
    }
    return appId;
  }

  static init(): void {
    const appId = this.getAppId();
    console.log(`[PRIVY] Privy initialized (App ID: ${appId})`);
  }

  static async sendEmailOTP(email: string): Promise<void> {
    const appId = this.getAppId();
    console.log(`[PRIVY] Login started for email: ${email}`);

    const res = await fetch('https://auth.privy.io/api/v1/passwordless/init', {
      method: 'POST',
      headers: {
        'privy-app-id': appId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[PRIVY] Failed to send OTP: ${res.status} ${errText}`);
      throw new Error(`Failed to send OTP code: ${res.statusText}`);
    }

    console.log(`[PRIVY] OTP sent to ${email}`);
  }

  static async verifyEmailOTP(email: string, code: string): Promise<PrivyAuthResponse> {
    const appId = this.getAppId();
    console.log(`[PRIVY] Verifying OTP for ${email}...`);

    const res = await fetch('https://auth.privy.io/api/v1/passwordless/authenticate', {
      method: 'POST',
      headers: {
        'privy-app-id': appId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as { error?: string };
      const errorMessage = errBody.error ?? `Authentication failed (${res.status})`;
      console.error(`[PRIVY] OTP verification error: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    console.log('[PRIVY] OTP verified');

    const data = (await res.json()) as {
      token?: string;
      user?: {
        id: string;
        email?: string;
        wallets?: Array<{ address: string; chain_type?: string; chainType?: string; wallet_client_type?: string }>;
      };
      wallets?: Array<{ address: string; chain_type?: string; chainType?: string; wallet_client_type?: string }>;
    };

    const privyToken = data.token;
    if (!privyToken) {
      throw new Error('Privy token missing from authentication response');
    }

    console.log('[PRIVY] Privy token obtained');

    const rawWallets = data.user?.wallets ?? data.wallets ?? [];
    const formattedWallets = rawWallets.map((w) => ({
      address: w.address,
      chainType: w.chain_type ?? w.chainType ?? 'solana',
      walletClientType: w.wallet_client_type ?? 'privy',
    }));

    return {
      privyToken,
      user: {
        id: data.user?.id ?? `did:privy:${Date.now()}`,
        email: data.user?.email ?? email,
        wallets: formattedWallets,
      },
    };
  }
}
