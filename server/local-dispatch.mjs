import {api} from './api.mjs';

// The public bundle is permanently local-only. A loopback Node process owns
// its separately opted-in API; it does not relax the compiled public Worker.
export function localDispatch(request, env, worker, {host, reviewFrames = false} = {}) {
  const privateLoopback = !reviewFrames && ['127.0.0.1','::1','localhost'].includes(host);
  const apiEnv = privateLoopback ? env : {...env, ROWGLASS_PROVIDER_MODE:'local-only', ROWGLASS_PUBLIC:'true'};
  return new URL(request.url).pathname.startsWith('/api/')
    ? api(request, apiEnv)
    : worker.fetch(request, env, {});
}
