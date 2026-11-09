"use strict";

// Runs in the browser and Node so storage and upgrades can be tested separately.
const KeepInTouchData = (() => {
  const STORAGE_KEY = "keep-in-touch-relationships-v2";
  const LEGACY_KEY = "keep-in-touch-follow-ups-v1";
  const CATEGORIES = ["Friend", "Classmate", "Professional", "Family", "Neighbor", "Other"];
  const INTERACTION_TYPES = ["In person", "Phone call", "Video call", "Text", "Email", "Other"];
  const empty = () => ({ version: 2, people: [], notes: [], followUps: [] });
  const text = (value, max, required = false) => typeof value === "string" && value.length <= max && (!required || value.trim().length > 0);

  function validDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T12:00:00Z`);
    return Number(value.slice(0, 4)) > 0 && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }

  function validIds(entries) {
    return entries.every(entry => entry && text(entry.id, Infinity, true)) && new Set(entries.map(entry => entry.id)).size === entries.length;
  }

  function validate(data) {
    if (!data || data.version !== 2 || ![data.people, data.notes, data.followUps].every(Array.isArray)) throw Error("Invalid data format.");
    if (![data.people, data.notes, data.followUps].every(validIds)) throw Error("Missing or duplicate IDs.");
    const people = new Set(data.people.map(person => person.id));
    for (const person of data.people) {
      if (!text(person.name, 100, true) || !text(person.metWhere, 300) || !text(person.metHow, 500) || !text(person.introducedBy, 100) ||
          !Array.isArray(person.categories) || !person.categories.every(category => CATEGORIES.includes(category)) ||
          new Set(person.categories).size !== person.categories.length ||
          !(person.lastInteractionDate === "" || validDate(person.lastInteractionDate)) ||
          !(person.lastInteractionType === "" || INTERACTION_TYPES.includes(person.lastInteractionType))) throw Error("Invalid profile.");
    }
    for (const note of data.notes) {
      if (!people.has(note.personId) || !text(note.text, 5000, true)) throw Error("Invalid note.");
    }
    for (const item of data.followUps) {
      if (!people.has(item.personId) || !text(item.context, 1000, true) || typeof item.done !== "boolean" ||
          !(item.date === "" || validDate(item.date))) throw Error("Invalid follow-up.");
    }
    return data;
  }

  function blankPerson(id, name) {
    return { id, name, metWhere: "", metHow: "", introducedBy: "", categories: [], lastInteractionDate: "", lastInteractionType: "" };
  }

  function migrateLegacy(entries) {
    if (!Array.isArray(entries) || !validIds(entries) || !entries.every(entry => text(entry.person, 100, true) && text(entry.context, 1000, true) && validDate(entry.date) && typeof entry.done === "boolean")) throw Error("Unreadable previous list.");
    const data = empty();
    const names = new Map();
    for (const entry of entries) {
      if (!names.has(entry.person)) {
        const personId = `migrated-person-${data.people.length + 1}`;
        names.set(entry.person, personId);
        data.people.push(blankPerson(personId, entry.person));
      }
      data.followUps.push({ id: entry.id, personId: names.get(entry.person), context: entry.context, date: entry.date, done: entry.done });
    }
    return validate(data);
  }

  function dateAfter(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function examples() {
    const data = empty();
    data.people = [
      { ...blankPerson("example-alex", "Alex Example"), metWhere: "Maple Community Studio (fictional)", metHow: "Sat next to each other in a beginner pottery class.", introducedBy: "Jamie Sample", categories: ["Friend", "Classmate"], lastInteractionDate: dateAfter(-4), lastInteractionType: "In person" },
      { ...blankPerson("example-jamie", "Jamie Sample"), metWhere: "An imaginary neighborhood picnic", metHow: "Chatted while setting up the picnic tables.", categories: ["Friend", "Neighbor"], lastInteractionDate: dateAfter(-2), lastInteractionType: "Text" }
    ];
    data.notes.push({ id: "example-note", personId: "example-alex", text: "Trying out a new creative hobby. Mentioned enjoying handmade mugs." });
    data.followUps = [
      { id: "example-pottery", personId: "example-alex", context: "Ask how their first pottery bowl turned out.", date: dateAfter(1), done: false },
      { id: "example-recipe", personId: "example-jamie", context: "I promised to share my favorite easy pasta recipe.", date: dateAfter(3), done: false },
      { id: "example-walk", personId: "example-jamie", context: "Find a time for a walk in the imaginary park.", date: "", done: false }
    ];
    return data;
  }

  function removePerson(data, personId) {
    return { ...data, people: data.people.filter(person => person.id !== personId), notes: data.notes.filter(note => note.personId !== personId), followUps: data.followUps.filter(item => item.personId !== personId) };
  }

  function sortFollowUps(entries) {
    return [...entries].sort((a, b) => Number(a.done) - Number(b.done) || (a.date || "99999").localeCompare(b.date || "99999"));
  }

  function createStore(storage) {
    const store = { data: empty(), readOnly: false, message: "" };
    let savedSnapshot;
    try {
      savedSnapshot = storage.getItem(STORAGE_KEY);
      if (savedSnapshot !== null) {
        store.data = validate(JSON.parse(savedSnapshot));
      } else {
        const legacy = storage.getItem(LEGACY_KEY);
        store.data = legacy === null ? examples() : migrateLegacy(JSON.parse(legacy));
        store.message = legacy === null ? "Fictional examples are ready to explore." : "Your previous follow-ups have been brought into profiles. The original list is kept as a backup in this browser.";
        const serialized = JSON.stringify(store.data);
        storage.setItem(STORAGE_KEY, serialized);
        savedSnapshot = serialized;
      }
    } catch {
      store.readOnly = true;
      store.message = "Browser storage is unavailable or saved data could not be read or upgraded. Changes are disabled to protect existing data. Nothing has been overwritten. Use the same browser address, allow site storage if blocked, and reload. Do not clear site data if you need to recover it.";
    }
    store.save = next => {
      if (store.readOnly) return false;
      try {
        validate(next);
        if (storage.getItem(STORAGE_KEY) !== savedSnapshot) {
          store.readOnly = true;
          store.message = "Data changed in another tab. This change was not saved. Reload this page to use the latest version.";
          return false;
        }
        const serialized = JSON.stringify(next);
        storage.setItem(STORAGE_KEY, serialized);
        savedSnapshot = serialized;
        store.data = next;
        store.message = "";
        return true;
      } catch {
        store.message = "This change could not be saved. Your last saved data is unchanged. Keep this form open if you are editing, check that browser storage is allowed and has space, then try again.";
        return false;
      }
    };
    return store;
  }
  return { STORAGE_KEY, LEGACY_KEY, CATEGORIES, INTERACTION_TYPES, empty, blankPerson, validDate, validate, migrateLegacy, examples, removePerson, sortFollowUps, createStore };
})();

if (typeof module !== "undefined" && module.exports) module.exports = KeepInTouchData;
