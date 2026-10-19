import test from 'node:test';
import assert from 'node:assert/strict';
import {serializeReview,verifyReview,REVIEW_MAX_BYTES} from '../src/evidence.mjs';

test('download and copy serialization produces the same bounded verifiable Unicode envelope',async()=>{
  const data={query:'SELECT 1',note:'طالب Δ',results:[[null,1,'café']]};
  const text=await serializeReview(data),envelope=JSON.parse(text);
  assert.deepEqual(envelope.data,data);
  assert.equal(await verifyReview(envelope),true);
  assert.ok(new TextEncoder().encode(text).byteLength<REVIEW_MAX_BYTES);
});

test('UTF-8 review bytes cannot exceed what the CLI verifier accepts',async()=>{
  // Fits the character count but exceeds 16 MiB in UTF-8.
  const data={note:'é'.repeat(REVIEW_MAX_BYTES/2)};
  await assert.rejects(serializeReview(data),/16 MiB export limit/);
});
