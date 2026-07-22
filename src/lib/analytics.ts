import { Platform } from 'react-native';
import { PostHog } from 'posthog-react-native';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

const isWeb = Platform.OS === 'web';

type PosthogJsLike = {
  init: (key: string, opts: Record<string, unknown>) => void;
  capture: (event: string, props?: Record<string, unknown>) => void;
  identify: (id: string, props?: Record<string, unknown>) => void;
  reset: () => void;
};

let webClient: PosthogJsLike | null = null;
function getWebClient(): PosthogJsLike | null {
  if (!isWeb || !apiKey || typeof window === 'undefined') return null;
  if (webClient) return webClient;
  const mod = require('posthog-js') as { default: PosthogJsLike } | PosthogJsLike;
  const client = (mod as { default?: PosthogJsLike }).default ?? (mod as PosthogJsLike);
  client.init(apiKey, {
    api_host: host,
    capture_pageview: false,
    autocapture: true,
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: { password: true, email: false },
    },
    disable_session_recording: false,
  });
  webClient = client;
  return webClient;
}

if (isWeb) getWebClient();

export const posthog =
  !isWeb && apiKey
    ? new PostHog(apiKey, {
        host,
        enableSessionReplay: true,
        sessionReplayConfig: {
          maskAllTextInputs: true,
          maskAllImages: true,
          captureLog: true,
          captureNetworkTelemetry: true,
        },
      })
    : null;

export function track(event: string, props?: Record<string, unknown>) {
  if (isWeb) {
    getWebClient()?.capture(event, props);
    return;
  }
  posthog?.capture(event, props);
}

export function identify(userId: string, props?: Record<string, unknown>) {
  if (!userId) return;
  if (isWeb) {
    getWebClient()?.identify(userId, props);
    return;
  }
  posthog?.identify(userId, props);
}

export function resetAnalytics() {
  if (isWeb) {
    getWebClient()?.reset();
    return;
  }
  posthog?.reset();
}
