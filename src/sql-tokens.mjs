const keywords = new Set(('SELECT FROM WHERE LEFT RIGHT INNER OUTER FULL CROSS JOIN ON AS AND OR NOT IN IS NULL GROUP BY ORDER HAVING LIMIT OFFSET DISTINCT UNION ALL EXCEPT INTERSECT WITH RECURSIVE CASE WHEN THEN ELSE END ASC DESC BETWEEN EXISTS LIKE CAST COLLATE OVER PARTITION ROWS RANGE CURRENT ROW UNBOUNDED PRECEDING FOLLOWING TRUE FALSE').split(' '));
const functions = new Set(('COUNT SUM AVG MIN MAX COALESCE NULLIF TOTAL ROUND ABS LOWER UPPER LENGTH SUBSTR IFNULL IIF ROW_NUMBER RANK DENSE_RANK').split(' '));

// Presentation only: tokens preserve every source byte and never authorize SQL.
export function sqlTokens(source) {
  return (source.match(/--[^\n]*|\/\*[\s\S]*?(?:\*\/|$)|'(?:''|[^'])*'|"(?:""|[^"])*"|\b[A-Za-z_][A-Za-z_0-9]*\b|\b\d+(?:\.\d+)?\b|\s+|./g) || []).map(text => {
    const word = text.toUpperCase();
    const kind = text.startsWith('--') || text.startsWith('/*') ? 'comment'
      : text.startsWith("'") ? 'string'
      : keywords.has(word) ? 'keyword'
      : functions.has(word) ? 'function'
      : /^\d/.test(text) ? 'number' : 'plain';
    return {text, kind};
  });
}
