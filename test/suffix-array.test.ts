import { expect, test } from "bun:test";
import { induced_sort } from "../suffix-array";

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
  //console.log(res)
  expect(res).toEqual([14, 13, 12, 7, 8, 0, 9, 1, 4, 10, 2, 5, 11, 3, 6])
})

