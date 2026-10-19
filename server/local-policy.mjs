export function localRequestUrl(target, authority, {port, host='127.0.0.1', reviewFrames=false}) {
  if(typeof target!=='string'||!target.startsWith('/')||target.startsWith('//')||target.includes('\\'))throw new Error('Invalid local request target.');
  if(typeof authority!=='string'||!authority||/[\s/@\\?#]/.test(authority))throw new Error('Invalid local Host.');
  const origin=new URL('http://'+authority);
  const allowed=new Set(['localhost','127.0.0.1','[::1]']);
  if(reviewFrames)allowed.add('terminal.local');
  if(!['0.0.0.0','::','[::]'].includes(host))allowed.add(host.toLowerCase());
  if(!allowed.has(origin.hostname)||Number(origin.port||80)!==port)throw new Error('Local Host is not allowed.');
  const resolved=new URL(target,origin);
  if(resolved.origin!==origin.origin)throw new Error('Local request target changed origin.');
  return resolved.href;
}
