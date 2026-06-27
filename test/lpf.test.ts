import { expect, test } from "bun:test";
import { suffix_array, suffix_array_previous } from "../suffix-array";

test("lpf", () => {
  const s = "banana";
  const arr = new Uint8Array(s.split("").map(x => x.charCodeAt(0)));
  const sa = suffix_array(arr, true);
  //console.log(sa.offsets)
  //console.log(sa.lengths)
  expect(sa.lengths).toEqual([0, 0, 0, 3, 2, 1, 0]);
});
