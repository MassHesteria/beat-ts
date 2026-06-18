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

//test("complex", () => {
  //const res = induced_sort([97, 97, 97, 98, 97, 97, 99, 97, 97, 97, 98, 97, 97]);
  //console.log(res)
  //expect(res).toEqual([13, 12, 0, 7, 1, 8, 3, 10, 4, 11, 2, 9, 6, 5])
//})

