\connect app;

-- Seed users
INSERT INTO users (email, name)
VALUES
  ('alice@example.com', 'Alice'),
  ('bob@example.com',   'Bob'),
  ('carol@example.com', 'Carol'),
  ('dave@example.com',  'Dave')
ON CONFLICT (email) DO NOTHING;

-- Map emails to ids for clarity
WITH u AS (
  SELECT id, email FROM users
)
INSERT INTO orders (user_id, name, amount)
VALUES
  ((SELECT id FROM u WHERE email='alice@example.com'), 'Notebooks',  5),
  ((SELECT id FROM u WHERE email='alice@example.com'), 'Pencils',   12),
  ((SELECT id FROM u WHERE email='bob@example.com'),   'Backpack',  60),
  ((SELECT id FROM u WHERE email='bob@example.com'),   'Markers',   25),
  ((SELECT id FROM u WHERE email='carol@example.com'), 'Desk Lamp', 45),
  ((SELECT id FROM u WHERE email='dave@example.com'),  'Headphones',120);
