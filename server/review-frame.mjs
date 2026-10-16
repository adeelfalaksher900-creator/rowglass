// Local visual QA only. This module is never imported by the hosted Worker.
export function reviewFrame(path){
 const requested=Number(new URL(path,'http://localhost').searchParams.get('width'));
 const width=[360,390,768].includes(requested)?requested:390;
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Rowglass responsive review</title><style>body{margin:24px;background:#e1e8ec;color:#192b38;font:14px system-ui}nav{display:flex;gap:18px;margin:16px 0}a{color:#15556b}iframe{display:block;border:0;background:white;box-shadow:0 0 0 1px #a9bdc9}h1{font-size:20px;margin:0}p{max-width:760px;line-height:1.5}</style></head><body><h1>Rowglass responsive review</h1><p>Local QA frame: ${width} CSS pixels. This checks layout in a real nested viewport; it does not emulate a mobile device or touch behavior.</p><nav aria-label="Review widths"><a href="?width=360">360 px</a><a href="?width=390">390 px</a><a href="?width=768">768 px</a></nav><iframe title="Rowglass at ${width} px" width="${width}" height="850" src="/?case=missing-customers"></iframe></body></html>`;
}
