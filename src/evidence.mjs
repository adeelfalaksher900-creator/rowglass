import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex} from '@noble/hashes/utils.js';

export async function sealReview(data){
  const bytes=new TextEncoder().encode(JSON.stringify(data));
  // This deterministic digest also works in HTTP development previews.
  return {format:'rowglass.review.v1',data,sha256:bytesToHex(sha256(bytes)),integrityNote:'Digest identifies this record. It is not a signature, trusted attestation or proof of model provenance.'};
}
export async function verifyReview(envelope){
  if(envelope?.format!=='rowglass.review.v1'||typeof envelope.sha256!=='string')return false;
  return (await sealReview(envelope.data)).sha256===envelope.sha256;
}
