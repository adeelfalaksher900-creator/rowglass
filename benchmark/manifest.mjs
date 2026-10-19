// Frozen synthetic controls. These are authored cases, never live model results.
const integer = (name, extra = {}) => ({name, type: 'integer', nullable: false, primaryKey: name === 'id', ...extra});
const text = (name, extra = {}) => ({name, type: 'text', nullable: false, primaryKey: false, ...extra});
const foreign = (name, table, extra = {}) => integer(name, {references: {table, column: 'id'}, ...extra});
const fixture = (id, label, rows, columns, values, calculation) => ({
  fixture: {id, label, rows}, expected: [{columns, values}], calculation,
});
const change = (id, candidateSQL, taxonomy, equivalent = false) => ({
  id, candidateSQL, taxonomy,
  expectedClassification: equivalent ? 'equivalent-rewrite' : 'wrong-mutation',
  provenance: equivalent ? 'hand-authored equivalent rewrite' : 'hand-authored mutation',
});

function schema(id, title, contract, tables, referenceSQL, fixtures, changes) {
  return {
    id,
    pack: {
      format: 'rowglass.case.v1', id, title, contract, tables,
      baselineSQL: changes[0].candidateSQL, referenceSQL,
      fixtures: fixtures.map(item => item.fixture),
    },
    visibleFixtureIds: fixtures.slice(0, 2).map(item => item.fixture.id),
    heldoutFixtureIds: fixtures.slice(2).map(item => item.fixture.id),
    independentExpectations: fixtures.map(({fixture: item, expected, calculation}) => ({
      fixtureId: item.id, expected, calculation,
    })),
    changes,
  };
}

const customerColumns = ['customer_id', 'name', 'paid_orders'];
const userColumns = ['user_id', 'name'];
const orderColumns = ['order_id', 'item_cents', 'paid_cents'];
const readingColumns = ['device_id', 'reading_id', 'day', 'value'];
const ratioColumns = ['task_id', 'ratio'];

export const benchmarkManifest = {
  format: 'rowglass.benchmark.manifest.v1',
  version: '2026-10-19.1',
  frozenOn: '2026-10-19',
  provenance: {
    corpus: 'Hand-authored synthetic schemas, fixtures, SQL mutations and equivalent rewrites.',
    assistance: 'Prepared with AI coding assistance; not sampled from live repair-model output.',
    oracle: 'Expected outputs were calculated from the small fixture rows independently of SQL execution. Each fixture records its calculation.',
    limitations: 'Finite SQLite controls, not production data, a representative SQL workload or an equivalence proof. Public held-out data prevents within-run prompt leakage, not training-data contamination.',
  },
  schemas: [
    schema('retained-customers', 'Retain customers without paid orders',
      'Return every customer once as customer_id, name and paid_orders. Count only paid orders; customers with none have zero. Preserve the stated output columns.',
      [{name: 'customers', columns: [integer('id'), text('name')]}, {name: 'orders', columns: [integer('id'), foreign('customer_id', 'customers'), text('status')]}],
      "SELECT c.id AS customer_id, c.name, COUNT(o.id) AS paid_orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid' GROUP BY c.id, c.name",
      [
        fixture('customers-visible-paid', 'One paid order', {customers: [[1, 'Ada']], orders: [[1, 1, 'paid']]}, customerColumns, [[1, 'Ada', 1]], 'Ada has one paid order, so the count is 1.'),
        fixture('customers-visible-pending', 'A customer with only a pending order', {customers: [[1, 'Ada'], [2, 'Ben']], orders: [[1, 1, 'paid'], [2, 2, 'pending']]}, customerColumns, [[1, 'Ada', 1], [2, 'Ben', 0]], 'Ada has one paid order. Ben has no paid orders and remains with count 0.'),
        fixture('customers-heldout-empty', 'No customers or orders', {customers: [], orders: []}, customerColumns, [], 'There are no customers; output is empty with all three columns.'),
        fixture('customers-heldout-many', 'Repeated paid orders, pending and absent orders', {customers: [[11, 'Cam'], [12, 'Dee'], [13, 'Eli']], orders: [[1, 11, 'paid'], [2, 11, 'paid'], [3, 11, 'pending'], [4, 12, 'pending']]}, customerColumns, [[11, 'Cam', 2], [12, 'Dee', 0], [13, 'Eli', 0]], 'Cam has two paid orders. Dee has only pending and Eli has no orders. Both stay at zero.'),
      ], [
        change('customers-filter-in-where', "SELECT c.id AS customer_id, c.name, COUNT(o.id) AS paid_orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.status = 'paid' GROUP BY c.id, c.name", ['outer-join', 'filter-placement']),
        change('customers-count-star', "SELECT c.id AS customer_id, c.name, COUNT(*) AS paid_orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid' GROUP BY c.id, c.name", ['outer-join', 'null', 'aggregation']),
        change('customers-count-all-statuses', 'SELECT c.id AS customer_id, c.name, COUNT(o.id) AS paid_orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id, c.name', ['join', 'filter-placement', 'aggregation']),
        change('customers-preaggregate', "SELECT c.id AS customer_id, c.name, COALESCE(p.paid_orders, 0) AS paid_orders FROM customers c LEFT JOIN (SELECT customer_id, COUNT(*) AS paid_orders FROM orders WHERE status = 'paid' GROUP BY customer_id) p ON p.customer_id = c.id", ['outer-join', 'aggregation'], true),
      ]),
    schema('nullable-exclusions', 'Exclude matching bans without NULL poisoning',
      'Return user_id and name for users with no matching bans.user_id. A NULL ban user_id matches nobody. Preserve each eligible user once.',
      [{name: 'users', columns: [integer('id'), text('name')]}, {name: 'bans', columns: [integer('id'), foreign('user_id', 'users', {nullable: true})]}],
      'SELECT u.id AS user_id, u.name FROM users u WHERE NOT EXISTS (SELECT 1 FROM bans b WHERE b.user_id = u.id)',
      [
        fixture('exclusions-visible-one', 'One eligible and one banned user', {users: [[1, 'Ada'], [2, 'Ben']], bans: [[1, 2]]}, userColumns, [[1, 'Ada']], 'Ban user_id 2 excludes Ben. Ada has no matching ban.'),
        fixture('exclusions-visible-all', 'All users banned', {users: [[3, 'Cam']], bans: [[1, 3]]}, userColumns, [], 'The only user has a matching ban, so no row remains.'),
        fixture('exclusions-heldout-null', 'NULL and a real ban coexist', {users: [[11, 'Eli'], [12, 'Farah'], [13, 'Gus']], bans: [[1, 12], [2, null]]}, userColumns, [[11, 'Eli'], [13, 'Gus']], 'Only user 12 matches a ban. The NULL ban matches neither 11 nor 13.'),
        fixture('exclusions-heldout-only-null', 'Only a NULL ban', {users: [[21, 'Hana'], [22, 'Ivo']], bans: [[1, null]]}, userColumns, [[21, 'Hana'], [22, 'Ivo']], 'The NULL ban matches nobody, so both users remain.'),
      ], [
        change('exclusions-not-in-null', 'SELECT u.id AS user_id, u.name FROM users u WHERE u.id NOT IN (SELECT b.user_id FROM bans b)', ['null', 'anti-join']),
        change('exclusions-equals-null', 'SELECT u.id AS user_id, u.name FROM users u LEFT JOIN bans b ON b.user_id = u.id WHERE b.user_id = NULL', ['null', 'comparison']),
        change('exclusions-null-as-wildcard', 'SELECT u.id AS user_id, u.name FROM users u WHERE NOT EXISTS (SELECT 1 FROM bans b WHERE b.user_id IS NULL OR b.user_id = u.id)', ['null', 'anti-join']),
        change('exclusions-left-anti-join', 'SELECT u.id AS user_id, u.name FROM users u LEFT JOIN bans b ON b.user_id = u.id WHERE b.id IS NULL', ['null', 'anti-join'], true),
      ]),
    schema('order-totals', 'Keep line totals independent of payment fanout',
      'Return every order once as order_id, item_cents and paid_cents. Item cents are the sum of quantity times unit_cents. Paid cents are the sum of payments. Empty sums are zero; equal amounts still count separately.',
      [{name: 'orders', columns: [integer('id')]}, {name: 'lines', columns: [integer('id'), foreign('order_id', 'orders'), integer('quantity'), integer('unit_cents')]}, {name: 'payments', columns: [integer('id'), foreign('order_id', 'orders'), integer('amount_cents')]}],
      'SELECT o.id AS order_id, COALESCE((SELECT SUM(l.quantity * l.unit_cents) FROM lines l WHERE l.order_id = o.id), 0) AS item_cents, COALESCE((SELECT SUM(p.amount_cents) FROM payments p WHERE p.order_id = o.id), 0) AS paid_cents FROM orders o',
      [
        fixture('totals-visible-single', 'One line with quantity two', {orders: [[1]], lines: [[1, 1, 2, 100]], payments: [[1, 1, 200]]}, orderColumns, [[1, 200, 200]], 'The item total is 2 times 100 = 200. The single payment is 200.'),
        fixture('totals-visible-empty', 'An order with no lines or payments', {orders: [[2]], lines: [], payments: []}, orderColumns, [[2, 0, 0]], 'The order remains. Both empty sums are defined as zero.'),
        fixture('totals-heldout-duplicates', 'Equal-valued lines and payments', {orders: [[11]], lines: [[1, 11, 1, 100], [2, 11, 1, 100]], payments: [[1, 11, 100], [2, 11, 100]]}, orderColumns, [[11, 200, 200]], 'Two distinct lines total 100 + 100 = 200. Two distinct payments total 100 + 100 = 200.'),
        fixture('totals-heldout-quantities', 'Multiple quantities and payment fanout', {orders: [[21]], lines: [[1, 21, 3, 50], [2, 21, 2, 50]], payments: [[1, 21, 100], [2, 21, 150]]}, orderColumns, [[21, 250, 250]], 'Items total 3 times 50 plus 2 times 50 = 250. Payments total 100 + 150 = 250.'),
      ], [
        change('totals-join-fanout', 'SELECT o.id AS order_id, COALESCE(SUM(l.quantity * l.unit_cents), 0) AS item_cents, COALESCE(SUM(p.amount_cents), 0) AS paid_cents FROM orders o LEFT JOIN lines l ON l.order_id = o.id LEFT JOIN payments p ON p.order_id = o.id GROUP BY o.id', ['join', 'aggregation-grain', 'duplicates']),
        change('totals-distinct-amounts', 'SELECT o.id AS order_id, COALESCE((SELECT SUM(DISTINCT l.quantity * l.unit_cents) FROM lines l WHERE l.order_id = o.id), 0) AS item_cents, COALESCE((SELECT SUM(DISTINCT p.amount_cents) FROM payments p WHERE p.order_id = o.id), 0) AS paid_cents FROM orders o', ['duplicates', 'aggregation']),
        change('totals-drop-quantity', 'SELECT o.id AS order_id, COALESCE((SELECT SUM(l.unit_cents) FROM lines l WHERE l.order_id = o.id), 0) AS item_cents, COALESCE((SELECT SUM(p.amount_cents) FROM payments p WHERE p.order_id = o.id), 0) AS paid_cents FROM orders o', ['aggregation', 'arithmetic']),
        change('totals-preaggregate', 'WITH li AS (SELECT order_id, SUM(quantity * unit_cents) AS item_cents FROM lines GROUP BY order_id), pa AS (SELECT order_id, SUM(amount_cents) AS paid_cents FROM payments GROUP BY order_id) SELECT o.id AS order_id, COALESCE(li.item_cents, 0) AS item_cents, COALESCE(pa.paid_cents, 0) AS paid_cents FROM orders o LEFT JOIN li ON li.order_id = o.id LEFT JOIN pa ON pa.order_id = o.id', ['join', 'aggregation-grain'], true),
      ]),
    schema('latest-readings', 'Select a bounded latest reading with a deterministic tie',
      'Return device_id, reading_id, day and value for each device with a reading on days 10 through 20 inclusive. Pick the greatest day, breaking ties by greatest reading id. Omit devices without a reading in that range.',
      [{name: 'devices', columns: [integer('id'), text('name')]}, {name: 'readings', columns: [integer('id'), foreign('device_id', 'devices'), integer('day'), integer('value')]}],
      'SELECT r.device_id, r.id AS reading_id, r.day, r.value FROM readings r WHERE r.day BETWEEN 10 AND 20 AND NOT EXISTS (SELECT 1 FROM readings newer WHERE newer.device_id = r.device_id AND newer.day BETWEEN 10 AND 20 AND (newer.day > r.day OR (newer.day = r.day AND newer.id > r.id)))',
      [
        fixture('readings-visible-single', 'One in-range reading', {devices: [[1, 'A']], readings: [[1, 1, 15, 8]]}, readingColumns, [[1, 1, 15, 8]], 'Day 15 is in range and is the only reading.'),
        fixture('readings-visible-outside', 'Only out-of-range readings', {devices: [[2, 'B']], readings: [[1, 2, 9, 100], [2, 2, 21, 200]]}, readingColumns, [], 'Days 9 and 21 are outside the inclusive interval 10 through 20.'),
        fixture('readings-heldout-boundaries', 'Both inclusive boundary days', {devices: [[11, 'C'], [12, 'D']], readings: [[1, 11, 10, 100], [2, 12, 20, 200]]}, readingColumns, [[11, 1, 10, 100], [12, 2, 20, 200]], 'Days 10 and 20 are both included, one reading for each device.'),
        fixture('readings-heldout-tie', 'Two readings on the newest day', {devices: [[21, 'E']], readings: [[101, 21, 14, 9], [102, 21, 18, 7], [103, 21, 18, 8]]}, readingColumns, [[21, 103, 18, 8]], 'Newest day is 18. Of ids 102 and 103, the tie rule selects 103.'),
      ], [
        change('readings-exclusive-boundaries', 'SELECT r.device_id, r.id AS reading_id, r.day, r.value FROM readings r WHERE r.day > 10 AND r.day < 20 AND NOT EXISTS (SELECT 1 FROM readings newer WHERE newer.device_id = r.device_id AND newer.day > 10 AND newer.day < 20 AND (newer.day > r.day OR (newer.day = r.day AND newer.id > r.id)))', ['boundaries', 'filter-placement']),
        change('readings-ignore-tie', 'SELECT r.device_id, r.id AS reading_id, r.day, r.value FROM readings r WHERE r.day BETWEEN 10 AND 20 AND r.day = (SELECT MAX(newer.day) FROM readings newer WHERE newer.device_id = r.device_id AND newer.day BETWEEN 10 AND 20)', ['ties', 'duplicates']),
        change('readings-lowest-tie', 'SELECT r.device_id, r.id AS reading_id, r.day, r.value FROM readings r WHERE r.day BETWEEN 10 AND 20 AND NOT EXISTS (SELECT 1 FROM readings newer WHERE newer.device_id = r.device_id AND newer.day BETWEEN 10 AND 20 AND (newer.day > r.day OR (newer.day = r.day AND newer.id < r.id)))', ['ties', 'ordering']),
        change('readings-window-rewrite', 'WITH ranked AS (SELECT device_id, id AS reading_id, day, value, ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY day DESC, id DESC) AS position FROM readings WHERE day BETWEEN 10 AND 20) SELECT device_id, reading_id, day, value FROM ranked WHERE position = 1', ['boundaries', 'ties', 'window'], true),
      ]),
    schema('fractional-progress', 'Preserve fractional ratios and unknown zero totals',
      'Return task_id and ratio for every task. Ratio is completed divided by total using REAL division. A total of zero produces NULL. Preserve exact supported SQLite numeric results without approximate comparison.',
      [{name: 'tasks', columns: [integer('id'), integer('completed'), integer('total')]}],
      'SELECT id AS task_id, CASE WHEN total = 0 THEN NULL ELSE 1.0 * completed / total END AS ratio FROM tasks',
      [
        fixture('progress-visible-whole', 'A complete task', {tasks: [[1, 2, 2]]}, ratioColumns, [[1, 1]], 'Two completed divided by total two is exactly 1.'),
        fixture('progress-visible-empty', 'No tasks', {tasks: []}, ratioColumns, [], 'No tasks means no output rows, with task_id and ratio columns retained.'),
        fixture('progress-heldout-fractions', 'Non-integral ratios', {tasks: [[11, 1, 3], [12, 2, 5]]}, ratioColumns, [[11, 0.3333333333333333], [12, 0.4]], 'REAL arithmetic gives the binary64 results for 1/3 and 2/5, represented here as 0.3333333333333333 and 0.4.'),
        fixture('progress-heldout-zero', 'Unknown zero total and a zero numerator', {tasks: [[21, 0, 0], [22, 0, 4]]}, ratioColumns, [[21, null], [22, 0]], 'A zero total is explicitly NULL. Zero completed out of four gives 0.'),
      ], [
        change('progress-integer-division', 'SELECT id AS task_id, completed / NULLIF(total, 0) AS ratio FROM tasks', ['division', 'numeric-types']),
        change('progress-zero-instead-of-null', 'SELECT id AS task_id, COALESCE(1.0 * completed / NULLIF(total, 0), 0.0) AS ratio FROM tasks', ['division', 'null']),
        change('progress-reversed-ratio', 'SELECT id AS task_id, CASE WHEN total = 0 THEN NULL ELSE 1.0 * total / NULLIF(completed, 0) END AS ratio FROM tasks', ['division', 'arithmetic']),
        change('progress-cast-rewrite', 'SELECT id AS task_id, CAST(completed AS REAL) / NULLIF(total, 0) AS ratio FROM tasks', ['division', 'numeric-types'], true),
      ]),
    schema('projection-bags', 'Preserve duplicate categories and column identity',
      'Return one category column named category for each event whose active value equals 1. Keep repeated categories and NULL categories. Output row order is irrelevant. Inactive events must be excluded.',
      [{name: 'events', columns: [integer('id'), text('category', {nullable: true}), integer('active')]}],
      'SELECT category AS category FROM events WHERE active = 1',
      [
        fixture('projection-visible-single', 'One active category', {events: [[1, 'alpha', 1]]}, ['category'], [['alpha']], 'The single active event contributes one alpha category.'),
        fixture('projection-visible-empty', 'Empty event table', {events: []}, ['category'], [], 'No events means an empty output whose column is still named category.'),
        fixture('projection-heldout-bag', 'Duplicate and NULL active categories', {events: [[11, 'alpha', 1], [12, 'alpha', 1], [13, 'beta', 0], [14, null, 1]]}, ['category'], [['alpha'], ['alpha'], [null]], 'Both alpha events count separately, the NULL active category remains and inactive beta is excluded.'),
        fixture('projection-heldout-inactive', 'Only inactive categories', {events: [[21, 'delta', 0], [22, 'echo', 0]]}, ['category'], [], 'Neither event has active equal to 1, so no category is returned.'),
      ], [
        change('projection-distinct', 'SELECT DISTINCT category AS category FROM events WHERE active = 1', ['duplicates', 'projection']),
        change('projection-wrong-column', 'SELECT category AS name FROM events WHERE active = 1', ['columns', 'projection']),
        change('projection-include-inactive', 'SELECT category AS category FROM events WHERE active >= 0', ['boundaries', 'filter-placement']),
        change('projection-reordered', 'SELECT e.category AS category FROM events e WHERE e.active = 1 ORDER BY e.id DESC', ['columns', 'duplicates', 'ordering'], true),
      ]),
  ],
};

function deepFreeze(value) {
  for (const child of Object.values(value)) if (child && typeof child === 'object') deepFreeze(child);
  return Object.freeze(value);
}
deepFreeze(benchmarkManifest);
