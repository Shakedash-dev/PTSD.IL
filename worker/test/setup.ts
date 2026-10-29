import { shardTiming } from "../src/lib/qa";

// No real waits in tests: the read-back delay and the KV one-write-per-second
// pause of a shard edit (lib/qa.ts editShard).
shardTiming.verifyMs = 0;
shardTiming.retryMs = 0;
