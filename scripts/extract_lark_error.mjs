import { readFileSync } from "node:fs";
import { parseArgs, isMain, emit } from "./_args.mjs";

export function run(opts) {
  const raw = String(opts.input ?? "");
  try {
    const json = JSON.parse(raw);
    const error = json.error || {};
    return {
      ok: Boolean(json.ok),
      type: error.type ?? null,
      subtype: error.subtype ?? null,
      message: error.message ?? null,
      hint: error.hint ?? null,
      identity: json.identity ?? null,
      update: json?._notice?.update?.message ?? null,
    };
  } catch {
    return {
      ok: false,
      type: "raw-output",
      message: raw,
    };
  }
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  let input = args.input;
  if (input === undefined && args._.length > 0) {
    input = args._.join("\n");
  }
  if (input === undefined) {
    try {
      input = readFileSync(0, "utf8");
    } catch {
      input = "";
    }
  }
  emit(run({ input }));
}
