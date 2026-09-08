// Optional starter database helper; the garden itself does not enable D1.
declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
  }
}
