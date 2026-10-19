SELECT p.id AS product_id, p.stock - SUM(r.units) AS units_available FROM products p JOIN reservations r ON r.product_id=p.id GROUP BY p.id, p.stock;
