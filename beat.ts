const args = Bun.argv.slice(2);

if (args.includes("-create:bps")) {
  console.log("Creating bps...");
} else if (args.includes("-apply:bps")) {
  console.log("UNIMPLEMENTED: Applying bps...");
} else {
  console.log("beat v2")
};