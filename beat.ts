import { suffix_array, suffix_array_lpf } from "./suffix-array";

const args = Bun.argv.slice(2);

const create = (source: Uint8Array, target: Uint8Array) => {
  let beat: number[] = [];
  const write = (byte: number) => {
    beat.push(byte & 0xFF);
  }

  const encode = (data: number) => {
    while(true) {
      const x = data & 0x7f;
      data >>= 7;
      if(data == 0) { write(0x80 | x); break; }
      write(x);
      data--;
    }
  };

  write(0x42), write(0x50), write(0x53), write(0x31);
  encode(source.length), encode(target.length), encode(0);
  //TODO: write manifest

  const sourceArray = suffix_array(source);
  const targetArray = suffix_array_lpf(suffix_array(target));

  const sourceHash = Bun.hash.crc32(source);
  write(sourceHash);
  write(sourceHash >> 8);
  write(sourceHash >> 16);
  write(sourceHash >> 24);
  const targetHash = Bun.hash.crc32(target);
  write(targetHash);
  write(targetHash >> 8);
  write(targetHash >> 16);
  write(targetHash >> 24);
  const beatHash = Bun.hash.crc32(new Uint8Array(beat));
  write(beatHash);
  write(beatHash >> 8);
  write(beatHash >> 16);
  write(beatHash >> 24);
  return new Uint8Array(beat);
}

if (args.includes("-create:bps")) {
  const index = args.indexOf("-create:bps");
  const patchFile = args[index + 1];
  const originalName = args[index + 2];
  const modifiedName = args[index + 3];
  if (patchFile === undefined || originalName === undefined || modifiedName === undefined) {
    console.log("Error: Missing arguments for -create:bps. Usage: -create:bps <patchFile> <originalFile> <modifiedFile>");
    process.exit(1);
  }
  const originalData = await Bun.file(originalName).bytes();
  const modifiedData = await Bun.file(modifiedName).bytes();
  const patchData = create(originalData, modifiedData);
  await Bun.write(patchFile, patchData);
  console.log("patch created successfully");

} else if (args.includes("-apply:bps")) {
  console.log("UNIMPLEMENTED: Applying bps...");
} else {
  console.log("beat v2")
};