CREATE TABLE `anonymous_messages` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `body` text NOT NULL,
  `created_at` integer NOT NULL,
  `source_route` text NOT NULL,
  `ip_hash` text NOT NULL,
  `browser_family` text NOT NULL,
  `device_type` text NOT NULL
);
