import { describe, expect, it } from "vitest";
import {
  BOARD_SIZE,
  addParcel,
  buyUpgrade,
  chooseFamilyScene,
  restorePrudinaMergeState,
  selectOrMergeTile,
  starterPrudinaMergeState,
  upgradeCost,
} from "./prudina-merge";

describe("Prudina merge game", () => {
  it("starts with a readable board and two immediate pairs", () => {
    const state = starterPrudinaMergeState();
    expect(state.board).toHaveLength(BOARD_SIZE);
    expect(state.board[0]?.level).toBe(1);
    expect(state.board[1]?.level).toBe(1);
    expect(state.board[4]?.level).toBe(2);
    expect(state.board[5]?.level).toBe(2);
    expect(state.sceneReady).toBe(true);
  });

  it("merges two matching items and rewards the player", () => {
    const selected = selectOrMergeTile(starterPrudinaMergeState(), 0);
    const merged = selectOrMergeTile(selected, 1);
    expect(merged.board[0]).toBeNull();
    expect(merged.board[1]?.level).toBe(2);
    expect(merged.coins).toBeGreaterThan(selected.coins);
    expect(merged.totalMerges).toBe(1);
    expect(merged.selectedIndex).toBeNull();
  });

  it("keeps the second item selected when levels do not match", () => {
    const selected = selectOrMergeTile(starterPrudinaMergeState(), 0);
    const mismatch = selectOrMergeTile(selected, 4);
    expect(mismatch.selectedIndex).toBe(4);
    expect(mismatch.totalMerges).toBe(0);
  });

  it("unlocks another family scene after the required merge loop", () => {
    let state = chooseFamilyScene(starterPrudinaMergeState(), 0);
    state = selectOrMergeTile(selectOrMergeTile(state, 0), 1);
    state = selectOrMergeTile(selectOrMergeTile(state, 4), 5);
    state = addParcel(state, 1);
    state = addParcel(state, 1);
    state = selectOrMergeTile(selectOrMergeTile(state, 0), 2);
    expect(state.totalMerges).toBe(3);
    expect(state.sceneReady).toBe(true);
  });

  it("buys upgrades only when the player has enough coins", () => {
    const state = starterPrudinaMergeState();
    const denied = buyUpgrade(state, "betterBag");
    expect(denied.upgrades.betterBag).toBe(0);

    const funded = { ...state, coins: upgradeCost("betterBag", 0) };
    const bought = buyUpgrade(funded, "betterBag");
    expect(bought.upgrades.betterBag).toBe(1);
    expect(bought.coins).toBe(0);
  });

  it("falls back safely when a saved game is malformed", () => {
    const restored = restorePrudinaMergeState({ version: 1, board: [] });
    expect(restored.board).toHaveLength(BOARD_SIZE);
    expect(restored.coins).toBe(48);
  });

  it("sanitizes every persisted number instead of trusting local storage", () => {
    const unsafe = {
      ...starterPrudinaMergeState(),
      coins: "infinite",
      stories: Number.NaN,
      sceneIndex: 300,
      upgrades: { betterBag: 99, familyBook: -4, longTable: "yes", oldRadio: 2.4 },
      relations: { "mara-davor": { warmth: 800, friction: "angry" } },
    };
    const restored = restorePrudinaMergeState(unsafe);
    expect(restored.coins).toBe(48);
    expect(restored.stories).toBe(0);
    expect(restored.sceneIndex).toBeLessThan(8);
    expect(restored.upgrades).toEqual({ betterBag: 5, familyBook: 0, longTable: 0, oldRadio: 2 });
    expect(restored.relations["mara-davor"]).toEqual({ warmth: 100, friction: 74 });
  });

  it("adds directly to a clicked empty cell and rejects invalid board indexes", () => {
    const state = starterPrudinaMergeState();
    const added = addParcel(state, 1, 10);
    expect(added.board[10]?.level).toBe(1);
    expect(added.board[2]).toBeNull();

    const invalid = selectOrMergeTile(state, 99);
    expect(invalid.board).toEqual(state.board);
    expect(invalid.selectedIndex).toBeNull();
  });
});
