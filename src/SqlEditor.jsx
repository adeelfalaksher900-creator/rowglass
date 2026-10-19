import React, {useLayoutEffect,useRef} from 'react';
import {sqlTokens} from './sql-tokens.mjs';

export function SqlText({value}) {
  return sqlTokens(value).map((token, index) => <span key={index} className={`sql-${token.kind}`}>{token.text}</span>);
}

export function SqlEditor({value, onChange, disabled, inputRef, invalid = false}) {
  const paint = useRef(null), numbers = useRef(null);
  function synchronize(input) {
    if (!input || !paint.current || !numbers.current) return;
    // A horizontal scrollbar shrinks the textarea's client height. Give its
    // presentation layers that same viewport so bottom scroll positions match.
    paint.current.style.height = `${input.clientHeight}px`;
    paint.current.style.width = `${input.clientWidth}px`;
    numbers.current.style.height = `${input.clientHeight}px`;
    paint.current.scrollTop = input.scrollTop;
    paint.current.scrollLeft = input.scrollLeft;
    numbers.current.scrollTop = input.scrollTop;
  }
  useLayoutEffect(() => {
    const input = inputRef.current;
    synchronize(input);
    const observer = new ResizeObserver(() => synchronize(input));
    observer.observe(input);
    return () => observer.disconnect();
  }, [value,inputRef]);
  return <div className="code-editor">
    <div ref={numbers} className="line-numbers" aria-hidden="true">{value.split('\n').map((_, index) => <span key={index}>{index + 1}</span>)}</div>
    <pre ref={paint} className="syntax-paint" aria-hidden="true"><SqlText value={value + '\n'}/></pre>
    <textarea id="query" className="resize-none" ref={inputRef} value={value} onChange={event => onChange(event.target.value)} onScroll={event => synchronize(event.currentTarget)} disabled={disabled} spellCheck="false" autoCapitalize="off" autoCorrect="off" aria-invalid={invalid || undefined} aria-describedby={invalid ? 'query-help error-message' : 'query-help'}/>
  </div>;
}
