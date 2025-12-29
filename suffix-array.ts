export type SuffixArray = {
  input: Uint8Array;
  sa: number[];
  phi?: number[];
  plcp?: number[];
  lengths?: number[];
  offsets?: number[];
};

// longest previous factor
// O(n)
const lpf = (array: SuffixArray): SuffixArray => {
  if (!array.phi) {
    array.phi = suffix_array_phi(array.sa);
  }
  //if (array.phi) {
    //console.log('phi:', array.phi.join(""));
  //}
  if(!array.lengths || !array.offsets) {
    array.lengths = [];
    array.offsets = [];
    array.plcp = [];
    suffix_array_lpf(array.lengths, array.offsets, array.phi, array.plcp, array.input);
  }
  //if (array.lengths && array.offsets) {
    //console.log("lengths size:", array.lengths.length);
    //console.log("lengths:", array.lengths.join(""));
    //console.log("offsets size:", array.offsets.length);
    //console.log("offsets:", array.offsets.join(""));
    //console.log("plcp:", array.plcp?.join("") || "");
  //}
  return array;
}

// suffix array via induced sorting
// O(n)
export const suffix_array = (data: Uint8Array, lcf: boolean = false): SuffixArray => {
  const arr: SuffixArray = {
    input: data,
    sa: induced_sort([...data]),
  };
  if (lcf) {
    lpf(arr);
  }
  return arr;
};

export const suffix_array_find = (sa: number[], input: Uint8Array, match: Uint8Array): {result: boolean, length: number, offset: number} => {
  let length = 0, offset = 0;
  let l = 0, r = input.length;

  while(l < r - 1) {
    let m = l + r >> 1;
    let s = sa[m];

    let k = 0;
    while(k < match.length && s + k < input.length) {
      if(match[k] != input[s + k]) {
        break;
      }
      k++;
    }

    if(k > length) {
      length = k;
      offset = s;
      if(k == match.length) {
        //console.log("suffix_array_find true, length: %d, offset: %d", length, offset);
        return {
          result: true,
          length,
          offset
        }
      }
    }

    if(k == match.length || s + k == input.length) {
      k--;
    }

    if(match[k] < input[s + k]) {
      r = m;
    } else {
      l = m;
    }
  }
  //console.log("suffix_array_find false, length: %d, offset: %d", length, offset);

  return {
    result: false,
    length,
    offset
  };
}

//O(n) with lpf()
export const suffix_array_previous = (sa: SuffixArray, address: number): { length: number, offset: number } => {
  return {
    length: sa.lengths[address],
    offset: sa.offsets[address]
  };
}

export const induced_sort = (data: number[], characters: number = 256): number[] => {
  const size = data?.length ?? 0;
  if(size == 0) return [0];  //required to avoid out-of-bounds accesses
  if(size == 1) return [1, 0];  //not strictly necessary; but more performant

  //0 = S-suffix (sort before next suffix), 1 = L-suffix (sort after next suffix)
  const types: boolean[] = new Array(size + 1).fill(false);

  types[size - 0] = false;  //empty suffix is always S-suffix
  types[size - 1] = true;   //last suffix is always L-suffix compared to empty suffix
  for(let n = size - 2; n >= 0; n--) {
    const curr = data[n] as number;
    const next = data[n + 1] as number;
    if(curr < next) {
      types[n] = false;  //this suffix is smaller than the one after it
    } else if(curr > next) {
      types[n] = true;  //this suffix is larger than the one after it
    } else {
      types[n] = types[n + 1] as boolean;  //this suffix will be the same as the one after it
    }
  }
  //console.log(types.map(x => x ? 1 : 0).join(""));

  //left-most S-suffix
  const isLMS = (n: number): boolean => {
    if(n == 0) return false;  //no character to the left of the first suffix
    return (!types[n] && types[n - 1]) as boolean;  //true if this is the start of a new S-suffix
  };

  //test if two LMS-substrings are equal
  const isEqual = (lhs: number, rhs: number): boolean => {
    if(lhs == size || rhs == size) return false;  //no other suffix can be equal to the empty suffix

    let n = 0;
    while(true) {
      const lhsLMS = isLMS(lhs + n);
      const rhsLMS = isLMS(rhs + n);
      if(n && lhsLMS && rhsLMS) return true;  //substrings are identical
      if(lhsLMS != rhsLMS) return false;  //length mismatch: substrings cannot be identical
      if(data[lhs + n] != data[rhs + n]) return false;  //character mismatch: substrings are different
      n++;
    }
  };

  //determine the sizes of each bucket: one bucket per character
  const counts: number[] = new Array(characters).fill(0);
  for(let n = 0; n < size; n++) {
    const idx = data[n] as number;
    const cnt = counts[idx] as number;
    counts[idx] = cnt + 1;
  }
  //console.log(counts.join(""));

  //bucket sorting start offsets
  const heads: number[] = new Array(characters).fill(0);

  let headOffset;
  const getHeads = () => {
    headOffset = 1;
    for(let n = 0; n < characters; n++) {
      heads[n] = headOffset;
      headOffset += (counts[n] as number);
    }
  };

  //bucket sorting end offsets
  const tails: number[] = new Array(characters).fill(0);

  let tailOffset;
  const getTails = () => {
    tailOffset = 1;
    for(let n = 0; n < characters; n++) {
      tailOffset += (counts[n] as number);
      tails[n] = tailOffset - 1;
    }
  };

  //inaccurate LMS bucket sort
  const suffixes: number[] = new Array(size + 1).fill(-1);

  getTails();
  for(let n = 0; n < size; n++) {
    if(!isLMS(n)) continue;  //skip non-LMS-suffixes
    const di = data[n] as number;
    const ti = tails[di] as number;
    suffixes[ti] = n;  //advance from the tail of the bucket
    tails[di] = ti - 1;
  }

  suffixes[0] = size;  //the empty suffix is always an LMS-suffix, and is the first suffix

  //console.log(suffixes.join(""));
  //sort all L-suffixes to the left of LMS-suffixes
  const sortL = () => {
    getHeads();
    for(let n = 0; n < size + 1; n++) {
      if(suffixes[n] == -1) continue;  //offsets may not be known yet here ...
      //@ts-ignore
      const l = suffixes[n] - 1;
      if(l < 0 || !types[l]) continue;  //skip S-suffixes
      //@ts-ignore
      suffixes[heads[data[l]]++] = l;  //advance from the head of the bucket
    }
  };

  const sortS = () => {
    getTails();
    for(let n = size; n >= 0; n--) {
      //@ts-ignore
      const l = suffixes[n] - 1;
      if(l < 0 || types[l]) continue;  //skip L-suffixes
      //@ts-ignore
      suffixes[tails[data[l]]--] = l;  //advance from the tail of the bucket
    }
  };

  sortL();
  //console.log(suffixes.join(""));
  sortS();
  //console.log(suffixes.join(""));

  //analyze data for the summary suffix array
  const names: number[] = new Array(size + 1).fill(-1);

  let currentName: number = 0;  //keep a count to tag each unique LMS-substring with unique IDs
  let lastLMSOffset = suffixes[0];  //location in the original data of the last checked LMS suffix
  names[lastLMSOffset] = currentName;  //the first LMS-substring is always the empty suffix entry, at position 0

  for(let n = 1; n < size + 1; n++) {
    const offset = suffixes[n];
    //@ts-ignore
    if(!isLMS(offset)) continue;  //only LMS suffixes are important

    //if this LMS suffix starts with a different LMS substring than the last suffix observed ...
    //@ts-ignore
    if(!isEqual(lastLMSOffset, offset)) currentName++;  //then it gets a new name
    //@ts-ignore
    lastLMSOffset = offset;  //keep track of the new most-recent LMS suffix
    names[lastLMSOffset] = currentName;  //store the LMS suffix name where the suffix appears at in the original data
  }
  //console.log(names.join(""));

  const summaryOffsets: number[] = [];
  const summaryData: number[] = [];
  for(let n = 0; n < size + 1; n++) {
    if(names[n] == -1) continue;
    summaryOffsets.push(n);
    //@ts-ignore
    summaryData.push(names[n]);
  }
  const summaryCharacters = currentName + 1;  //zero-indexed, so the total unique characters is currentName + 1
  //console.log(summaryCharacters.toString());
  //console.log(summaryData.join(""));
  //console.log(summaryOffsets.join(""));

  //make the summary suffix array
  let summaries: number[];
  if(summaryData.length == summaryCharacters) {
    //simple bucket sort when every character in summaryData appears only once
    summaries = new Array(summaryData.length).fill(-1);
    summaries[0] = summaryData.length;  //always include the empty suffix at the beginning
    for(let x = 0; x < summaryData.length; x++) {
      const y = summaryData[x];
      //@ts-ignore
      summaries[y + 1] = x;
    }
  } else {
    //recurse until every character in summaryData is unique ...
    summaries = induced_sort(summaryData, summaryCharacters);
  }

  suffixes.fill(-1);  //reuse existing buffer for accurate sort

  //accurate LMS sort
  getTails();
  for(let n = summaries.length - 1; n >= 2; n--) {
    //@ts-ignore
    const index = summaryOffsets[summaries[n]];
    //@ts-ignore
    suffixes[tails[data[index]]--] = index;  //advance from the tail of the bucket
  }
  suffixes[0] = size;  //always include the empty suffix at the beginning

  sortL();
  //console.log(suffixes.join(""));
  sortS();
  //console.log(suffixes.join(""));

  return suffixes;
}

// longest previous factor
// O(n)
// optional: plcp
const suffix_array_lpf = (lengths: number[], offsets: number[], phi: number[], plcp: number[], input: Uint8Array) => {
  let k = 0, size = input.length;
  const resize = (arr: number[], newSize: number, defaultValue: number) => {
    arr.length = 0;
    while (arr.length < newSize) {
      arr.push(defaultValue);
    }
  }

  resize(lengths, size + 1, -1);
  //console.log("lengths init:" , lengths.join(""));
  resize(offsets, size + 1, -1);
  //console.log("offsets init:" , offsets.join(""));

  const recurse = (i: number, j: number, k: number) => {
    //@ts-ignore
    if(lengths[i] < 0) {
      lengths[i] = k;
      offsets[i] = j;
    //@ts-ignore
    } else if(lengths[i] < k) {
      //@ts-ignore
      if(offsets[i] > j) {
        //@ts-ignore
        recurse(offsets[i], j, lengths[i]);
      } else {
        //@ts-ignore
        recurse(j, offsets[i], lengths[i]);
      }
      lengths[i] = k;
      offsets[i] = j;
    } else {
        //@ts-ignore
      if(offsets[i] > j) {
        //@ts-ignore
        recurse(offsets[i], j, k);
      } else {
        //@ts-ignore
        recurse(j, offsets[i], k);
      }
    }
  };

  for(let i = 0; i < size; i++) {
    const j = phi[i];
    if(plcp && plcp.length > 0) {
      //@ts-ignore
      k = plcp[i];
    }
    else {
      //@ts-ignore
      while(i + k < size && j + k < size && input[i + k] == input[j + k]) {
        k++;
      }
    }
    //@ts-ignore
    if(i > j) {
    //console.log("recurse a", i, j, k);
    //@ts-ignore
      recurse(i, j, k);
    } else {
    //console.log("recurse b", i, j, k);
    //@ts-ignore
      recurse(j, i, k);
    }
    if(k) {
      k--;
    }
  }

  lengths[0] = 0;
  offsets[0] = 0;
}

const suffix_array_phi = (sa: number[]): number[] => {
  const phi: number[] = new Array(sa.length);
  //@ts-ignore
  phi[sa[0]] = 0;
  for(let i = 1; i < sa.length; i++) {
    //@ts-ignore
    phi[sa[i]] = sa[i - 1];
  }
  return phi;
}