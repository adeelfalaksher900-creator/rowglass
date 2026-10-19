import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex} from '@noble/hashes/utils.js';
export const REVIEW_MAX_BYTES=16*1024*1024;

export async function sealReview(data){
  const bytes=new TextEncoder().encode(JSON.stringify(data));
  // This deterministic digest also works in HTTP development previews.
  return {format:'rowglass.review.v1',data,sha256:bytesToHex(sha256(bytes)),integrityNote:'Digest identifies this record. It is not a signature, trusted attestation or proof of model provenance.'};
}
export async function verifyReview(envelope){
  if(envelope?.format!=='rowglass.review.v1'||typeof envelope.sha256!=='string')return false;
  return (await sealReview(envelope.data)).sha256===envelope.sha256;
}
export async function serializeReview(data){
  const json=JSON.stringify(await sealReview(data),null,2);
  if(new TextEncoder().encode(json).byteLength>REVIEW_MAX_BYTES){
    throw new Error('Review exceeds the 16 MiB export limit. Narrow the case or result set.');
  }
  return json;
}
