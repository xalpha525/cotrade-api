/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/login` | `/(auth)/onboarding` | `/(tabs)` | `/(tabs)/` | `/(tabs)/notifications` | `/(tabs)/portfolio` | `/(tabs)/settings` | `/(tabs)/traders` | `/(tabs)/trades` | `/(tabs)/wallets` | `/_sitemap` | `/activity` | `/login` | `/notifications` | `/onboarding` | `/portfolio` | `/settings` | `/traders` | `/trades` | `/wallets`;
      DynamicRoutes: `/copy-config/${Router.SingleRoutePart<T>}` | `/trader/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/copy-config/[traderId]` | `/trader/[id]`;
    }
  }
}
