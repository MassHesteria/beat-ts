export type SuffixArray = number[];

// suffix array via induced sorting
// O(n)
export const suffix_array = (data: Uint8Array, characters: number = 256): SuffixArray => {
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
  console.log(types.map(x => x ? 1 : 0).join(""));

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
  console.log(counts.join(""));

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

  console.log(suffixes.join(""));
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
  console.log(suffixes.join(""));
  sortS();
  console.log(suffixes.join(""));

  //analyze data for the summary suffix array
  const names: number[] = new Array(size + 1).fill(-1);
  /*vector<int> names;
  names.resize(size + 1, (int)-1);

  uint currentName = 0;  //keep a count to tag each unique LMS-substring with unique IDs
  auto lastLMSOffset = suffixes[0];  //location in the original data of the last checked LMS suffix
  names[lastLMSOffset] = currentName;  //the first LMS-substring is always the empty suffix entry, at position 0

  for(uint n : range(1, size + 1)) {
    auto offset = suffixes[n];
    if(!isLMS(offset)) continue;  //only LMS suffixes are important

    //if this LMS suffix starts with a different LMS substring than the last suffix observed ...
    if(!isEqual(lastLMSOffset, offset)) currentName++;  //then it gets a new name
    lastLMSOffset = offset;  //keep track of the new most-recent LMS suffix
    names[lastLMSOffset] = currentName;  //store the LMS suffix name where the suffix appears at in the original data
  }

  vector<int> summaryOffsets;
  vector<int> summaryData;
  for(uint n : range(size + 1)) {
    if(names[n] == -1) continue;
    summaryOffsets.append(n);
    summaryData.append(names[n]);
  }
  uint summaryCharacters = currentName + 1;  //zero-indexed, so the total unique characters is currentName + 1

  //make the summary suffix array
  vector<int> summaries;
  if(summaryData.size() == summaryCharacters) {
    //simple bucket sort when every character in summaryData appears only once
    summaries.resize(summaryData.size() + 1, (int)-1);
    summaries[0] = summaryData.size();  //always include the empty suffix at the beginning
    for(int x : range(summaryData.size())) {
      int y = summaryData[x];
      summaries[y + 1] = x;
    }
  } else {
    //recurse until every character in summaryData is unique ...
    summaries = induced_sort<int>({summaryData.data(), summaryData.size()}, summaryCharacters);
  }

  suffixes.fill(-1);  //reuse existing buffer for accurate sort

  //accurate LMS sort
  getTails();
  for(uint n : reverse(range(2, summaries.size()))) {
    auto index = summaryOffsets[summaries[n]];
    suffixes[tails[data[index]]--] = index;  //advance from the tail of the bucket
  }
  suffixes[0] = size;  //always include the empty suffix at the beginning

  sortL();
  sortS();*/

  console.log("");
  return suffixes;
}

// longest previous factor
// O(n)
export const suffix_array_lpf = (sa: SuffixArray): Uint8Array => {
  return new Uint8Array([]);
}
