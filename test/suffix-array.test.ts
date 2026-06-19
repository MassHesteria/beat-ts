import { expect, test } from "bun:test";
import { induced_sort } from "../suffix-array";

export const bruteForceSuffixArray = (s: string): number[] => {
  const suffixes: { index: number; suffix: string }[] = [];

  for (let i = 0; i <= s.length; i++) {
    suffixes.push({
      index: i,
      suffix: s.slice(i),
    });
  }

  suffixes.sort((a, b) => {
    if (a.suffix < b.suffix) return -1;
    if (a.suffix > b.suffix) return 1;
    return a.index - b.index;
  });

  return suffixes.map(x => x.index);
};

test("empty", () => {
  expect(induced_sort([])).toEqual([0]);
});

test("single", () => {
  expect(induced_sort([97])).toEqual([1, 0]);
});

test("triple", () => {
  expect(induced_sort([97, 98, 97])).toEqual([3, 2, 0, 1]);
});

test("complex", () => {
  // aaabaacaaaabaa
  const res = induced_sort([97, 97, 97, 98, 97, 97, 99, 97, 97, 97, 97, 98, 97, 97]);
  expect(res).toEqual([14, 13, 12, 7, 8, 0, 9, 1, 4, 10, 2, 5, 11, 3, 6])
})

test("strings", () => {
  const s = "the quick brown fox jumps over the lazy dog";
  const arr = new Uint8Array(s.split("").map(x => x.charCodeAt(0)));
  expect(induced_sort(arr)).toEqual(bruteForceSuffixArray(s).map(x => x));

  const t = "In the quiet glow of early morning, the city slowly wakes as golden light spills across the rooftops, " +
  "birds begin their first songs, and the streets, still calm and unhurried, hold the promise of a busy day ahead."
  const arr2 = new Uint8Array(t.split("").map(x => x.charCodeAt(0)));
  expect(induced_sort(arr2)).toEqual(bruteForceSuffixArray(t).map(x => x));

  const u = "As the afternoon drifted toward evening, the clouds gathered in soft layers above the horizon, " +
  "the wind carried the faint scent of rain through tree-lined streets, and windows across the neighborhood " +
  "began to glow one by one, each warm rectangle hinting at a different story, a different dinner, a different " +
  "conversation, all unfolding quietly as the day slipped into a calm and thoughtful dusk."
  const arr3 = new Uint8Array(u.split("").map(x => x.charCodeAt(0)));
  expect(induced_sort(arr3)).toEqual(bruteForceSuffixArray(u).map(x => x));
})
