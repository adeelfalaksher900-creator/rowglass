SELECT p.id AS product_id,
       p.stock - COALESCE(SUM(r.units), 0) AS units_available
FROM products p
LEFT JOIN reservations r ON r.product_id = p.id
GROUP BY p.id, p.stock;
