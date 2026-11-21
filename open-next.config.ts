import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Minimal adapter config for the test deploy. No KV/R2/D1 cache is attached,
// so the default dummy incremental/tag cache is used. That is fine for a small
// test audience and keeps the Cloudflare setup free of extra bindings.
export default defineCloudflareConfig();
