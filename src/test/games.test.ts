import { describe, expect, it } from "vitest";
import { GAMES, CROSSWORDS, crosswordCells, isAnswer, memoryMatch, shuffle } from "@/lib/games";
describe("ZELFA games", () => {
  it("includes all nine requested game activities", () => {
    expect(GAMES.map((game) => game.id)).toEqual(["memoria", "forca", "cruzadas", "adivinha", "quiz", "leve", "colorir", "sons", "historia"]);
  });
  it("accepts answers independent of case and accents but rejects wrong guesses", () => {
    expect(isAnswer("  banana ", "BANANA")).toBe(true);
    expect(isAnswer("júpiter", "JUPITER")).toBe(true);
    expect(isAnswer("maçã", "BANANA")).toBe(false);
  });
  it("matches memory pairs and not different cards", () => {
    expect(memoryMatch({ pair: "🍌" }, { pair: "🍌" })).toBe(true);
    expect(memoryMatch({ pair: "🍌" }, { pair: "🍓" })).toBe(false);
    expect(shuffle([1, 2, 3]).sort()).toEqual([1, 2, 3]);
  });
  it("crossword intersections have consistent letters", () => {
    const cells = crosswordCells();
    expect(cells["0-1"]).toBe("A");
    expect(cells["2-1"]).toBe("A");
    for (const word of CROSSWORDS) {
      [...word.answer].forEach((letter, index) => {
        const key = `${word.row + (word.direction === "down" ? index : 0)}-${word.col + (word.direction === "across" ? index : 0)}`;
        expect(cells[key]).toBe(letter);
      });
    }
  });
});