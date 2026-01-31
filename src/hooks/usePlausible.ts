import { init, track, type PlausibleEventOptions } from '@plausible-analytics/tracker';

init({
  domain: 'autobusy.rawa-maz.pl',
  autoCapturePageviews: true,
  captureOnLocalhost: false,
});

export function trackEvent(eventName: string, options?: PlausibleEventOptions) {
  track(eventName, options ?? {});
}
