import { Buffer as BrowserBuffer } from "buffer";

type BrowserGlobals = typeof globalThis & {
  Buffer?: typeof BrowserBuffer;
};

const browserGlobals = globalThis as BrowserGlobals;

if (!browserGlobals.Buffer) {
  browserGlobals.Buffer = BrowserBuffer;
}
