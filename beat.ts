import { suffix_array, suffix_array_find, suffix_array_previous } from "./suffix-array";

const args = Bun.argv.slice(2);

const create = (source: Uint8Array, target: Uint8Array) => {
  const start = Date.now();
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

  console.log("header written in %dms", Date.now() - start);
  const sourceArray = suffix_array(source);
  const targetArray = suffix_array(target, true);

  const SourceRead = 0, TargetRead = 1, SourceCopy = 2, TargetCopy = 3;
  let outputOffset = 0, sourceRelativeOffset = 0, targetRelativeOffset = 0;

  let targetReadLength = 0;
  const flush = () => {
    if(!targetReadLength) return;
    encode(TargetRead | ((targetReadLength - 1) << 2));
    let offset = outputOffset - targetReadLength;
    while(targetReadLength) {
      //@ts-ignore
      write(target[offset++]);
      targetReadLength--;
    }
  };

  console.log("loop prep in %dms", Date.now() - start);
  let overlap = Math.min(source.length, target.length);
  while(outputOffset < target.length) {
    //console.log("outputOffset: %d", outputOffset);
    let mode = TargetRead, longestLength = 3, longestOffset = 0;
    let length = 0, offset = outputOffset;

    while(offset < overlap) {
      if(source[offset] != target[offset]) {
        break;
      }
      length++, offset++;
    }
    //console.log("length: %d, offset: %d", length, offset);
    if(length > longestLength) {
      mode = SourceRead, longestLength = length;
    }

    const saf = suffix_array_find(sourceArray.sa, sourceArray.input, target.subarray(outputOffset));
    length = saf.length, offset = saf.offset;
    //console.log("saf length: %d, offset: %d", length, offset);
    if(length > longestLength) {
      mode = SourceCopy, longestLength = length, longestOffset = offset;
    }

    const sap = suffix_array_previous(targetArray, outputOffset);
    length = sap.length, offset = sap.offset;
    //console.log("sap length: %d, offset: %d", length, offset);
    if(length > longestLength) {
      mode = TargetCopy, longestLength = length, longestOffset = offset;
    }
    //console.log("mode: %d", mode);

    if(mode == TargetRead) {
      targetReadLength++;  //queue writes to group sequential commands
      outputOffset++;
    } else {
      flush();
      encode(mode | ((longestLength - 1) << 2));
      if(mode == SourceCopy) {
        let relativeOffset = longestOffset - sourceRelativeOffset;
        sourceRelativeOffset = longestOffset + longestLength;
        //@ts-ignore
        encode(relativeOffset < 0 | Math.abs(relativeOffset) << 1);
      }
      if(mode == TargetCopy) {
        let relativeOffset = longestOffset - targetRelativeOffset;
        targetRelativeOffset = longestOffset + longestLength;
        //@ts-ignore
        encode(relativeOffset < 0 | Math.abs(relativeOffset) << 1);
      }
      outputOffset += longestLength;
    }
  }
  flush();
  console.log("loop in %dms", Date.now() - start);

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
  console.log("footer in %dms", Date.now() - start);
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