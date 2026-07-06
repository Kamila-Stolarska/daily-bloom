import { PostHog } from 'posthog-react-native';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

export const posthog = apiKey
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
  posthog?.capture(event, props);
}

export function identify(userId: string, props?: Record<string, unknown>) {
  if (!userId) return;
  posthog?.identify(userId, props);
}

export function resetAnalytics() {
  posthog?.reset();
}
