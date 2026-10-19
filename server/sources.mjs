const SEARCH_URL = 'https://api.tavily.com/search';
const DEADLINE_MS = 10_000;
const MAX_RESPONSE_BYTES = 65_536;
const MAX_RESULTS = 3;
const QUERIES = Object.freeze({
  'outer-join': 'SQLite official documentation LEFT JOIN ON WHERE outer join filtering',
  'null-not-in': 'SQLite official documentation NULL NOT IN expression truth table',
  'aggregate-duplicates': 'SQLite official documentation aggregate functions DISTINCT duplicate rows GROUP BY',
  'integer-division': 'SQLite official documentation integer division numeric expression operands',
});

export const semanticTopics = Object.freeze(Object.keys(QUERIES));

const NOTES = Object.freeze({
  not_configured: 'Official-document search is not configured. Local SQL tests remain available.',
  timeout: 'Official-document search timed out. Retry when the service is available.',
  aborted: 'Official-document search was cancelled.',
  provider_error: 'The search service did not succeed. Local SQL tests remain available.',
  invalid_response: 'The search service returned no usable official-document response.',
});

function unavailable(topic, reason) {
  return {available: false, topic, results: [], reason, note: NOTES[reason]};
}

class SourceResponseError extends Error {
  constructor(reason) {
    super(reason);
    this.reason = reason;
  }
}

// These values are text, never HTML or Markdown. Consumers must render them as text.
function boundedText(value, limit) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, limit);
}

function officialUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['sqlite.org', 'www.sqlite.org'].includes(url.hostname)) return null;
    if (url.username || url.password || url.port) return null;
    return url.href;
  } catch {
    return null;
  }
}

function citations(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Array.isArray(body.results)) {
    throw new SourceResponseError('invalid_response');
  }
  const results = [];
  const seen = new Set();
  for (const item of body.results) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const url = officialUrl(item.url);
    const title = boundedText(item.title, 160);
    const snippet = boundedText(item.content, 600);
    if (!url || !title || !snippet || seen.has(url)) continue;
    seen.add(url);
    results.push({title, url, snippet});
    if (results.length === MAX_RESULTS) break;
  }
  if (body.results.length && !results.length) throw new SourceResponseError('invalid_response');
  return results;
}

async function boundedJson(response, signal) {
  if (typeof response?.ok !== 'boolean') throw new SourceResponseError('invalid_response');
  if (!response.ok) {
    await response.body?.cancel();
    throw new SourceResponseError('provider_error');
  }
  if (Number(response.headers.get('content-length')) > MAX_RESPONSE_BYTES) {
    await response.body?.cancel();
    throw new SourceResponseError('invalid_response');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new SourceResponseError('invalid_response');
  const onAbort = () => { reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', onAbort, {once: true});
  try {
    const decoder = new TextDecoder();
    let bytes = 0;
    let text = '';
    while (true) {
      signal.throwIfAborted();
      const {value, done} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new SourceResponseError('invalid_response');
      }
      text += decoder.decode(value, {stream: true});
    }
    signal.throwIfAborted();
    return JSON.parse(text + decoder.decode());
  } catch (error) {
    if (signal.aborted || error instanceof SourceResponseError) throw error;
    throw new SourceResponseError('invalid_response');
  } finally {
    signal.removeEventListener('abort', onAbort);
    reader.releaseLock();
  }
}

/** Search fixed semantic topics only. SQL, schema and fixture data are never accepted. */
export async function semanticSources(topic, env = {}, fetcher = fetch, signal) {
  if (typeof topic !== 'string' || !Object.hasOwn(QUERIES, topic)) {
    const error = new TypeError('Choose a supported SQLite semantic topic.');
    error.code = 'invalid_topic';
    throw error;
  }
  const key = typeof env.TAVILY_API_KEY === 'string' ? env.TAVILY_API_KEY.trim() : '';
  if (!key) return unavailable(topic, 'not_configured');
  if (signal?.aborted) return unavailable(topic, 'aborted');

  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, {once: true});
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, DEADLINE_MS);
  let rejectAbort;
  const aborted = new Promise((resolve, reject) => { rejectAbort = reject; });
  const onAbort = () => rejectAbort(new SourceResponseError(timedOut ? 'timeout' : 'aborted'));
  controller.signal.addEventListener('abort', onAbort, {once: true});

  try {
    const operation = async () => {
      const response = await fetcher(SEARCH_URL, {
        method: 'POST',
        redirect: 'error',
        signal: controller.signal,
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${key}`},
        body: JSON.stringify({
          query: QUERIES[topic],
          topic: 'general',
          search_depth: 'basic',
          chunks_per_source: 1,
          max_results: MAX_RESULTS,
          include_domains: ['sqlite.org'],
          include_domains_mode: 'restrict',
          include_answer: false,
          include_raw_content: false,
          include_images: false,
          include_usage: true,
          auto_parameters: false,
        }),
      });
      const body = await boundedJson(response, controller.signal);
      const results = citations(body);
      const credits = body.usage?.credits;
      return {
        available: true,
        topic,
        results,
        note: results.length
          ? 'SQLite sources retrieved via Tavily. Citations explain semantics, not query correctness.'
          : 'The search returned no matching official SQLite sources. Tests remain the source of execution evidence.',
        ...(Number.isSafeInteger(credits) && credits >= 0 ? {usage: {credits}} : {}),
      };
    };
    return await Promise.race([operation(), aborted]);
  } catch (error) {
    const reason = controller.signal.aborted ? (timedOut ? 'timeout' : 'aborted')
      : error instanceof SourceResponseError ? error.reason : 'provider_error';
    return unavailable(topic, reason);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
    controller.signal.removeEventListener('abort', onAbort);
  }
}
