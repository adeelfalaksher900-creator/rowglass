import test from 'node:test';
import assert from 'node:assert/strict';
import {semanticSources, semanticTopics} from '../server/sources.mjs';

const env = {TAVILY_API_KEY: 'test-only-not-a-real-key'};
const source = (url = 'https://sqlite.org/lang_select.html', extra = {}) => ({
  title: 'SELECT documentation', url, content: 'LEFT JOIN preserves unmatched rows.', ...extra,
});
const response = (results = [source()], extra = {}) => Response.json({results, ...extra});

test('semantic search has a fixed topic allowlist and no arbitrary query input', async () => {
  assert.deepEqual(semanticTopics, ['outer-join', 'null-not-in', 'aggregate-duplicates', 'integer-division']);
  assert.equal(Object.isFrozen(semanticTopics), true);
  let calls = 0;
  for (const topic of ['SELECT private_email FROM customers', '__proto__', 'toString', 'outer-join ', {topic: 'outer-join'}, null]) {
    await assert.rejects(semanticSources(topic, env, async () => { calls++; }), {name: 'TypeError', code: 'invalid_topic'});
  }
  assert.equal(calls, 0);
});

test('missing or blank Tavily configuration makes zero transport calls', async () => {
  for (const config of [{}, {TAVILY_API_KEY: ''}, {TAVILY_API_KEY: '  '}, {TAVILY_API_KEY: true}]) {
    const result = await semanticSources('outer-join', config, () => assert.fail('Provider must not be called'));
    assert.equal(result.available, false);
    assert.equal(result.reason, 'not_configured');
    assert.deepEqual(result.results, []);
  }
});

test('each topic sends only its generic server-owned query with low-cost official-domain settings', async () => {
  const queries = new Set();
  for (const topic of semanticTopics) {
    const result = await semanticSources(topic, {...env, sql: 'secret-sql', schema: 'secret-schema', rows: ['secret-value']}, async (url, options) => {
      assert.equal(url, 'https://api.tavily.com/search');
      assert.equal(options.method, 'POST');
      assert.equal(options.redirect, 'error');
      assert.equal(options.headers.Authorization, `Bearer ${env.TAVILY_API_KEY}`);
      assert.equal(options.headers['Content-Type'], 'application/json');
      assert.equal(options.signal.aborted, false);
      const body = JSON.parse(options.body);
      assert.deepEqual(Object.keys(body).sort(), ['query', 'topic', 'search_depth', 'chunks_per_source', 'max_results', 'include_domains', 'include_domains_mode', 'include_answer', 'include_raw_content', 'include_images', 'include_usage', 'auto_parameters'].sort());
      assert.equal(body.search_depth, 'basic');
      assert.equal(body.max_results, 3);
      assert.equal(body.chunks_per_source, 1);
      assert.deepEqual(body.include_domains, ['sqlite.org']);
      assert.equal(body.include_domains_mode, 'restrict');
      assert.equal(body.include_answer, false);
      assert.equal(body.include_raw_content, false);
      assert.equal(body.auto_parameters, false);
      assert.equal(body.include_usage, true);
      assert.equal(body.topic, 'general');
      assert.doesNotMatch(options.body, /secret-|test-only-not-a-real-key/);
      assert.match(body.query, /^SQLite official documentation /);
      queries.add(body.query);
      return response();
    });
    assert.equal(result.available, true);
    assert.equal(result.topic, topic);
  }
  assert.equal(queries.size, 4);
});

test('valid citations retain only bounded text, safe official URLs and validated usage', async () => {
  const result = await semanticSources('null-not-in', env, async () => response([
    source('https://www.sqlite.org/lang_expr.html#the_in_and_not_in_operators', {
      title: `  NULL\nIN\u202e ${'x'.repeat(200)}`,
      content: `  <img src=x onerror=alert(1)>\u0000 ${'y'.repeat(900)}`,
      raw_content: 'raw page must not leave the server', extra: 'discard',
    }),
  ], {usage: {credits: 1, api_key: 'never expose'}, answer: 'not used'}));
  assert.equal(result.available, true);
  assert.equal(result.results.length, 1);
  assert.deepEqual(Object.keys(result.results[0]).sort(), ['snippet', 'title', 'url']);
  assert.equal(result.results[0].title.length, 160);
  assert.equal(result.results[0].snippet.length, 600);
  assert.doesNotMatch(result.results[0].title, /[\u0000\u202e\n]/);
  assert.doesNotMatch(result.results[0].snippet, /\u0000/);
  assert.deepEqual(result.usage, {credits: 1});
  assert.match(result.note, /not query correctness/);
  assert.doesNotMatch(JSON.stringify(result), /raw page|never expose|api_key|not used/);
});

test('unsafe destinations and malformed entries are excluded, duplicates removed and result count capped', async () => {
  const result = await semanticSources('outer-join', env, async () => response([
    source('http://sqlite.org/lang_select.html'),
    source('https://sqlite.org.evil.test/'),
    source('https://sqlite.org@evil.test/'),
    source('https://evil@sqlite.org/'),
    source('https://sqlite.org:444/lang_select.html'),
    source('https://forum.sqlite.org/'),
    source('javascript:alert(1)'),
    source('data:text/html,anything'),
    source('not a URL'),
    source('https://sqlite.org/lang_select.html', {title: {unsafe: true}}),
    source('https://sqlite.org/lang_select.html', {content: null}),
    null,
    source(), source(),
    source('https://www.sqlite.org/lang_expr.html'),
    source('https://sqlite.org/lang_aggfunc.html'),
    source('https://sqlite.org/quirks.html'),
  ]));
  assert.equal(result.available, true);
  assert.deepEqual(result.results.map(item => item.url), [
    'https://sqlite.org/lang_select.html', 'https://www.sqlite.org/lang_expr.html', 'https://sqlite.org/lang_aggfunc.html',
  ]);
});

test('empty search results are distinguished from an invalid response or wholly rejected citations', async () => {
  const empty = await semanticSources('outer-join', env, async () => response([]));
  assert.equal(empty.available, true);
  assert.deepEqual(empty.results, []);
  assert.match(empty.note, /no matching official SQLite sources/);
  for (const body of [null, [], {}, {results: null}, {results: {}}, {results: [source('https://evil.test/')]}]) {
    const result = await semanticSources('outer-join', env, async () => Response.json(body));
    assert.equal(result.available, false);
    assert.equal(result.reason, 'invalid_response');
  }
});

test('malformed, oversized and broken response bodies fail without exposing upstream content', async () => {
  const brokenStream = () => new ReadableStream({start(controller) { controller.error(new Error('secret body error')); }});
  for (const makeResponse of [
    () => new Response('secret invalid JSON'),
    () => new Response(' '.repeat(65_537)),
    () => new Response('{}', {headers: {'Content-Length': '70000'}}),
    () => new Response(brokenStream()),
    () => new Response(null),
  ]) {
    const result = await semanticSources('outer-join', env, async () => makeResponse());
    assert.equal(result.available, false);
    assert.equal(result.reason, 'invalid_response');
    assert.doesNotMatch(JSON.stringify(result), /secret/);
  }
});

test('HTTP and transport failures return generic provider errors and never expose credentials', async () => {
  for (const fetcher of [
    async () => new Response('secret upstream body', {status: 401}),
    async () => new Response('secret upstream body', {status: 429}),
    async () => { throw new Error(`Provider echoed ${env.TAVILY_API_KEY}`); },
  ]) {
    const result = await semanticSources('outer-join', env, fetcher);
    assert.equal(result.available, false);
    assert.equal(result.reason, 'provider_error');
    assert.doesNotMatch(JSON.stringify(result), /secret|test-only-not-a-real-key/);
  }
});

test('malformed credit metadata is omitted rather than coercing or leaking it', async () => {
  for (const usage of [null, {credits: '1'}, {credits: -1}, {credits: 0.5}, {credits: Number.MAX_SAFE_INTEGER + 1}, {credits: {secret: true}}]) {
    const result = await semanticSources('outer-join', env, async () => response([source()], {usage}));
    assert.equal(result.available, true);
    assert.equal('usage' in result, false);
  }
});

test('pre-aborted callers make zero requests and active cancellation reaches transport', async () => {
  const before = new AbortController();
  before.abort();
  const noCall = await semanticSources('outer-join', env, () => assert.fail('Cancelled request must not start'), before.signal);
  assert.equal(noCall.reason, 'aborted');
  const during = new AbortController();
  let transportSignal;
  const pending = semanticSources('outer-join', env, async (url, options) => {
    transportSignal = options.signal;
    return new Promise(() => {});
  }, during.signal);
  during.abort();
  const cancelled = await pending;
  assert.equal(cancelled.reason, 'aborted');
  assert.equal(transportSignal.aborted, true);
});

test('the ten-second deadline aborts an unresponsive transport', async t => {
  t.mock.timers.enable({apis: ['setTimeout']});
  let transportSignal;
  const pending = semanticSources('outer-join', env, async (url, options) => {
    transportSignal = options.signal;
    return new Promise(() => {});
  });
  t.mock.timers.tick(9_999);
  assert.equal(transportSignal.aborted, false);
  t.mock.timers.tick(1);
  const result = await pending;
  assert.equal(result.available, false);
  assert.equal(result.reason, 'timeout');
  assert.equal(transportSignal.aborted, true);
});

test('deadline covers a stalled response body as well as connection establishment', async t => {
  t.mock.timers.enable({apis: ['setTimeout']});
  let bodyCancelled = false;
  const stream = new ReadableStream({cancel() { bodyCancelled = true; }});
  const pending = semanticSources('outer-join', env, async () => new Response(stream));
  await Promise.resolve();
  t.mock.timers.tick(10_000);
  const result = await pending;
  assert.equal(result.reason, 'timeout');
  assert.equal(bodyCancelled, true);
});
