const MODEL_URL = 'https://api.tokenfactory.nebius.com/v1/chat/completions';
export const MODEL_RESPONSE_MAX_BYTES = 128 * 1024;
export const MODEL_DEADLINE_MS = 60_000;

export class ModelTransportError extends Error {
  constructor(code, status) {
    super('Model transport did not return a usable response.');
    this.name = 'ModelTransportError';
    this.code = code;
    if (Number.isInteger(status) && status >= 100 && status <= 599) this.status = status;
  }
}

// Cancellation must not delay returning an error if an upstream cancel stalls.
function cancel(body) {
  try { body?.cancel().catch(() => {}); } catch {}
}

/** Fixed destination, bounded UTF-8 response, and one deadline for headers and body. */
export async function modelCompletion(payload, {apiKey, signal, fetcher = fetch}) {
  if (signal?.aborted) throw new ModelTransportError('aborted');
  const controller = new AbortController();
  let timedOut = false;
  let reader;
  let rejectAbort;
  const aborted = new Promise((resolve, reject) => { rejectAbort = reject; });
  const abortError = () => new ModelTransportError(timedOut ? 'timeout' : 'aborted');
  const onAbort = () => {
    cancel(reader);
    rejectAbort(abortError());
  };
  const onCallerAbort = () => controller.abort();
  controller.signal.addEventListener('abort', onAbort, {once: true});
  signal?.addEventListener('abort', onCallerAbort, {once: true});
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, MODEL_DEADLINE_MS);

  try {
    const operation = async () => {
      const response = await fetcher(MODEL_URL, {
        method: 'POST',
        redirect: 'error',
        signal: controller.signal,
        headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey},
        body: JSON.stringify(payload),
      });
      if (controller.signal.aborted) {
        cancel(response?.body);
        throw abortError();
      }
      if (typeof response?.ok !== 'boolean') throw new ModelTransportError('invalid_response');
      if (!response.ok) {
        cancel(response.body);
        throw new ModelTransportError('provider_error', response.status);
      }
      if (Number(response.headers.get('content-length')) > MODEL_RESPONSE_MAX_BYTES) {
        cancel(response.body);
        throw new ModelTransportError('invalid_response');
      }
      reader = response.body?.getReader();
      if (!reader) throw new ModelTransportError('invalid_response');
      const activeReader = reader;
      try {
        const decoder = new TextDecoder('utf-8', {fatal: true});
        let bytes = 0;
        let text = '';
        while (true) {
          if (controller.signal.aborted) throw abortError();
          const {value, done} = await activeReader.read();
          if (controller.signal.aborted) throw abortError();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > MODEL_RESPONSE_MAX_BYTES) {
            cancel(activeReader);
            throw new ModelTransportError('invalid_response');
          }
          text += decoder.decode(value, {stream: true});
        }
        return JSON.parse(text + decoder.decode());
      } catch (error) {
        cancel(activeReader);
        throw error;
      } finally {
        activeReader.releaseLock();
        reader = undefined;
      }
    };
    return await Promise.race([operation(), aborted]);
  } catch (error) {
    if (controller.signal.aborted) throw abortError();
    if (error instanceof ModelTransportError) throw error;
    throw new ModelTransportError('invalid_response');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
    controller.signal.removeEventListener('abort', onAbort);
  }
}
