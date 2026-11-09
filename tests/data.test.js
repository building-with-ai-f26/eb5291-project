"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const D = require("../app/data.js");

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
const legacy = [
  { id: "a", person: "Taylor Demo", context: "An imaginary book club.", date: "2026-11-10", done: false },
  { id: "b", person: "Taylor Demo", context: "Share a fictional recipe.", date: "2026-11-12", done: true },
  { id: "c", person: "taylor demo", context: "A different example person.", date: "2026-11-15", done: false }
];

test("migration groups exact names and preserves every follow-up and status", () => {
  const data = D.migrateLegacy(legacy);
  assert.equal(data.people.length, 2);
  assert.equal(data.people[0].metWhere, "");
  assert.deepEqual(data.people[0].categories, []);
  assert.equal(data.followUps[0].personId, data.followUps[1].personId);
  assert.notEqual(data.followUps[0].personId, data.followUps[2].personId);
  for (let i = 0; i < legacy.length; i++) {
    const { personId, ...item } = data.followUps[i];
    const { person, ...original } = legacy[i];
    assert.deepEqual(item, original);
  }
});

test("upgrade leaves the old key byte-for-byte unchanged and never repeats", () => {
  const original = JSON.stringify(legacy);
  const storage = memoryStorage({ [D.LEGACY_KEY]: original });
  const store = D.createStore(storage);
  assert.equal(store.readOnly, false);
  assert.equal(storage.getItem(D.LEGACY_KEY), original);
  assert.match(store.message, /brought into profiles/);
  assert.equal(store.save(D.empty()), true);
  assert.deepEqual(D.createStore(storage).data, D.empty());
  assert.equal(storage.getItem(D.LEGACY_KEY), original);
});

test("empty legacy data stays empty; a fresh visit gets persistent fictional examples", () => {
  const emptyStorage = memoryStorage({ [D.LEGACY_KEY]: "[]" });
  assert.deepEqual(D.createStore(emptyStorage).data, D.empty());
  const fresh = memoryStorage();
  const first = D.createStore(fresh);
  assert.equal(first.data.people.length, 2);
  assert.deepEqual(D.createStore(fresh).data, first.data);
});

test("unreadable old or new data is never overwritten or replaced with examples", () => {
  for (const key of [D.LEGACY_KEY, D.STORAGE_KEY]) {
    for (const value of ["{bad", "null", JSON.stringify([{ ...legacy[0], date: "2026-02-30" }])]) {
      const storage = memoryStorage({ [key]: value });
      const store = D.createStore(storage);
      assert.equal(store.readOnly, true);
      assert.deepEqual(store.data, D.empty());
      assert.equal(store.save(D.examples()), false);
      assert.equal(storage.getItem(key), value);
      if (key === D.LEGACY_KEY) assert.equal(storage.getItem(D.STORAGE_KEY), null);
    }
  }
});

test("blocked storage or failed migration write keeps original data", () => {
  assert.equal(D.createStore(null).readOnly, true);
  const storage = memoryStorage({ [D.LEGACY_KEY]: JSON.stringify(legacy) });
  storage.setItem = () => { throw Error("Full"); };
  const store = D.createStore(storage);
  assert.equal(store.readOnly, true);
  assert.equal(store.data.followUps.length, 3);
  assert.equal(storage.getItem(D.STORAGE_KEY), null);
  assert.equal(storage.getItem(D.LEGACY_KEY), JSON.stringify(legacy));
});

test("failed writes do not mutate current or persisted data and can be retried", () => {
  const storage = memoryStorage();
  const store = D.createStore(storage);
  const original = JSON.stringify(store.data);
  const next = structuredClone(store.data);
  next.people[0].name = "Alex Renamed";
  const write = storage.setItem;
  storage.setItem = () => { throw Error("Full"); };
  assert.equal(store.save(next), false);
  assert.equal(JSON.stringify(store.data), original);
  assert.equal(storage.getItem(D.STORAGE_KEY), original);
  storage.setItem = write;
  assert.equal(store.save(next), true);
  assert.equal(D.createStore(storage).data.people[0].name, "Alex Renamed");
});

test("a stale tab cannot overwrite newer saved data", () => {
  const storage = memoryStorage();
  const first = D.createStore(storage);
  const second = D.createStore(storage);
  const next = structuredClone(second.data);
  next.people[0].name = "Changed in second tab";
  assert.equal(second.save(next), true);
  assert.equal(first.save(D.empty()), false);
  assert.equal(first.readOnly, true);
  assert.match(first.message, /another tab/);
  assert.equal(D.createStore(storage).data.people[0].name, "Changed in second tab");
});

test("profile deletion removes only that person's linked notes and follow-ups", () => {
  const data = D.examples();
  const deleted = data.people[0].id;
  const next = D.removePerson(data, deleted);
  D.validate(next);
  assert.equal(next.people.length, 1);
  assert.equal(next.notes.some(item => item.personId === deleted), false);
  assert.equal(next.followUps.some(item => item.personId === deleted), false);
  assert.deepEqual(next.followUps, data.followUps.filter(item => item.personId !== deleted));
  assert.equal(data.people.length, 2);
});

test("optional dates and categories work, invalid dates and broken links fail", () => {
  const data = D.examples();
  data.people[0].categories = [];
  data.people[0].lastInteractionDate = "";
  data.people[0].lastInteractionType = "";
  data.followUps[0].date = "";
  assert.doesNotThrow(() => D.validate(data));
  assert.equal(D.validDate("2024-02-29"), true);
  for (const value of ["2026-02-29", "2026-02-30", "0000-01-01", "no date", "2026-13-01"]) assert.equal(D.validDate(value), false);
  const orphan = structuredClone(data);
  orphan.notes[0].personId = "missing";
  assert.throws(() => D.validate(orphan));
  assert.throws(() => D.migrateLegacy([legacy[0], legacy[0]]));
  const duplicate = structuredClone(data);
  duplicate.people.push(duplicate.people[0]);
  assert.throws(() => D.validate(duplicate));
});

test("follow-ups sort dated unfinished, undated unfinished, then completed", () => {
  const entries = [
    { id: "done", done: true, date: "2020-01-01" },
    { id: "undated", done: false, date: "" },
    { id: "later", done: false, date: "2027-01-01" },
    { id: "earlier", done: false, date: "2026-01-01" }
  ];
  assert.deepEqual(D.sortFollowUps(entries).map(item => item.id), ["earlier", "later", "undated", "done"]);
  assert.equal(entries[0].id, "done");
});
