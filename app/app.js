"use strict";

const D = KeepInTouchData;
// Accessing localStorage itself can throw when browser policy blocks storage.
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const store = D.createStore(storage);
let selectedPersonId = store.data.people[0]?.id || null;
let editorState = null;
let pendingDelete = null;
const $ = selector => document.querySelector(selector);
const editor = $("#editor");
const editorForm = $("#editor-form");
const deleteDialog = $("#delete-dialog");

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function button(label, action, className = "secondary", changesData = false) {
  const node = element("button", label, className);
  node.type = "button";
  node.disabled = changesData && store.readOnly;
  node.addEventListener("click", action);
  return node;
}

function dateLabel(value) {
  if (!value) return "No date set";
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function showWarnings() {
  const warning = $("#storage-warning");
  warning.hidden = !store.message;
  warning.textContent = store.message;
  $("#add-person").disabled = store.readOnly;
}

function announce(message) { $("#status").textContent = message; }

function selectPerson(personId) {
  selectedPersonId = personId;
  render();
  $("#profile-heading").focus();
}

function renderPeople() {
  const list = $("#people-list");
  list.replaceChildren();
  $("#people-count").textContent = String(store.data.people.length);
  const people = [...store.data.people].sort((a, b) => a.name.localeCompare(b.name));
  for (const person of people) {
    const row = element("li");
    const open = button("", () => selectPerson(person.id), "person-button");
    open.append(element("span", person.name, "person-name"), element("span", person.categories.join(" · ") || "Getting to know each other", "hint"));
    if (person.id === selectedPersonId) open.setAttribute("aria-current", "true");
    row.append(open);
    list.append(row);
  }
  if (!people.length) list.append(element("li", "Start with someone you’d like to remember. Add a fictional person above.", "empty"));
}

function renderUpcoming() {
  const dated = $("#upcoming-list");
  const undated = $("#undated-list");
  dated.replaceChildren();
  undated.replaceChildren();
  for (const item of D.sortFollowUps(store.data.followUps.filter(item => !item.done))) {
    const person = store.data.people.find(person => person.id === item.personId);
    const row = element("li", undefined, "upcoming-item");
    row.append(button(person.name, () => selectPerson(person.id), "text-button"), element("p", item.context, "context"), element("p", dateLabel(item.date), "hint"));
    (item.date ? dated : undated).append(row);
  }
  if (!dated.children.length) dated.append(element("li", "No dated follow-ups. A little breathing room.", "empty"));
  if (!undated.children.length) undated.append(element("li", "No undated follow-ups.", "empty"));
}

function detail(list, label, value) {
  list.append(element("dt", label), element("dd", value || "Not added yet"));
}

function renderProfile() {
  const panel = $("#profile");
  panel.replaceChildren();
  const person = store.data.people.find(person => person.id === selectedPersonId);
  const heading = element("h2", person ? person.name : "Make room for your people", "profile-heading");
  heading.id = "profile-heading";
  heading.tabIndex = -1;
  panel.append(heading);
  if (!person) {
    panel.append(element("p", "Add a fictional person to start, or choose someone from your people list.", "empty"));
    return;
  }
  const tags = element("div", undefined, "tags");
  for (const category of person.categories) tags.append(element("span", category, "tag"));
  panel.append(tags);
  const actions = element("div", undefined, "actions");
  actions.append(button("Edit profile", () => openEditor("person", person.id), "secondary", true), button("Delete profile", () => askDelete("person", person.id), "danger-text", true));
  panel.append(actions);
  const details = element("dl", undefined, "details");
  detail(details, "Where we met", person.metWhere);
  detail(details, "How we met", person.metHow);
  detail(details, "Introduced by", person.introducedBy);
  detail(details, "Last interaction", [person.lastInteractionDate ? dateLabel(person.lastInteractionDate) : "", person.lastInteractionType].filter(Boolean).join(" · "));
  panel.append(details);

  const notesSection = element("section", undefined, "profile-section");
  const notesHeading = element("div", undefined, "section-heading");
  notesHeading.append(element("h3", "Little things to remember"), button("+ Add note", () => openEditor("note"), "secondary", true));
  notesSection.append(notesHeading);
  const notes = store.data.notes.filter(note => note.personId === person.id);
  if (!notes.length) notesSection.append(element("p", "A favorite hobby, a shared story, something to ask about next time…", "empty"));
  for (const note of notes) {
    const article = element("article", undefined, "entry note");
    article.append(element("p", note.text, "context"));
    const controls = element("div", undefined, "actions");
    controls.append(button("Edit note", () => openEditor("note", note.id), "text-button", true), button("Delete note", () => askDelete("note", note.id), "danger-text", true));
    article.append(controls);
    notesSection.append(article);
  }
  panel.append(notesSection);

  const followUpSection = element("section", undefined, "profile-section");
  const followUpHeading = element("div", undefined, "section-heading");
  followUpHeading.append(element("h3", "Follow-ups"), button("+ Add follow-up", () => openEditor("followUp"), "secondary", true));
  followUpSection.append(followUpHeading);
  const followUps = D.sortFollowUps(store.data.followUps.filter(item => item.personId === person.id));
  if (!followUps.length) followUpSection.append(element("p", "Something you promised or a reason to reconnect? Leave yourself a little reminder.", "empty"));
  for (const item of followUps) {
    const article = element("article", undefined, `entry${item.done ? " completed" : ""}`);
    article.append(element("p", item.context, "context"), element("p", dateLabel(item.date), "hint"));
    const controls = element("div", undefined, "actions");
    if (item.done) controls.append(element("span", "Done", "tag"));
    controls.append(button(item.done ? "Mark as not done" : "Mark as done", () => toggleDone(item.id), "secondary", true), button("Edit follow-up", () => openEditor("followUp", item.id), "text-button", true), button("Delete follow-up", () => askDelete("followUp", item.id), "danger-text", true));
    article.append(controls);
    followUpSection.append(article);
  }
  panel.append(followUpSection);
}

function render() { showWarnings(); renderPeople(); renderUpcoming(); renderProfile(); }

function field(name, label, value = "", options = {}) {
  const wrap = element("div", undefined, "field");
  const labelNode = element("label", label);
  labelNode.htmlFor = `field-${name}`;
  const input = element(options.multiline ? "textarea" : options.choices ? "select" : "input");
  input.id = `field-${name}`;
  input.name = name;
  if (options.choices) {
    for (const choice of ["", ...options.choices]) {
      const option = element("option", choice || "Not specified");
      option.value = choice;
      input.append(option);
    }
  } else if (options.multiline) {
    input.rows = 4;
  } else {
    input.type = options.date ? "date" : "text";
    if (options.date) { input.min = "0001-01-01"; input.max = "9999-12-31"; }
  }
  if (options.max) input.maxLength = options.max;
  input.required = !!options.required;
  input.value = value;
  input.addEventListener("input", () => input.setCustomValidity(""));
  wrap.append(labelNode, input);
  return wrap;
}

function openEditor(kind, id = null) {
  if (store.readOnly) return;
  editorState = { kind, id, personId: selectedPersonId };
  const fields = $("#editor-fields");
  fields.replaceChildren();
  $("#editor-error").hidden = true;
  $("#editor-title").textContent = `${id ? "Edit" : "Add"} ${kind === "followUp" ? "follow-up" : kind === "person" ? "person" : "note"}`;
  if (kind === "person") {
    const person = store.data.people.find(person => person.id === id) || D.blankPerson("", "");
    fields.append(field("name", "Name (required)", person.name, { required: true, max: 100 }), field("metWhere", "Where we met (optional)", person.metWhere, { max: 300 }), field("metHow", "How we met (optional)", person.metHow, { multiline: true, max: 500 }), field("introducedBy", "Who introduced us (optional)", person.introducedBy, { max: 100 }));
    const categories = element("fieldset");
    categories.append(element("legend", "Categories (optional — choose any)"));
    for (const category of D.CATEGORIES) {
      const label = element("label", undefined, "checkbox-label");
      const checkbox = element("input");
      checkbox.type = "checkbox";
      checkbox.name = "categories";
      checkbox.value = category;
      checkbox.checked = person.categories.includes(category);
      label.append(checkbox, document.createTextNode(category));
      categories.append(label);
    }
    fields.append(categories, field("lastInteractionDate", "Most recent interaction date (optional)", person.lastInteractionDate, { date: true }), field("lastInteractionType", "Interaction type (optional)", person.lastInteractionType, { choices: D.INTERACTION_TYPES }));
  } else if (kind === "note") {
    const note = store.data.notes.find(note => note.id === id);
    fields.append(field("text", "Note (required)", note?.text || "", { required: true, multiline: true, max: 5000 }));
  } else {
    const item = store.data.followUps.find(item => item.id === id);
    fields.append(field("context", "What do you want to follow up on? (required)", item?.context || "", { required: true, multiline: true, max: 1000 }), field("date", "Follow-up date (optional)", item?.date || "", { date: true }));
  }
  editor.showModal();
}

function saveEditor(event) {
  event.preventDefault();
  if (!editorState) return;
  const inputs = [...$("#editor-fields").querySelectorAll("input, textarea, select")];
  for (const input of inputs) {
    if (input.type === "checkbox") continue;
    input.setCustomValidity("");
    if (input.required && !input.value.trim()) input.setCustomValidity("Please add some text, rather than only spaces.");
    if (input.type === "date" && input.value && !D.validDate(input.value)) input.setCustomValidity("Please choose a valid date.");
  }
  if (!editorForm.reportValidity()) return;
  const values = new FormData(editorForm);
  const { kind, id, personId } = editorState;
  const next = structuredClone(store.data);
  const collection = kind === "person" ? "people" : kind === "note" ? "notes" : "followUps";
  const previous = next[collection].find(item => item.id === id);
  const item = { ...(previous || {}), id: id || crypto.randomUUID() };
  if (kind === "person") {
    for (const name of ["name", "metWhere", "metHow", "introducedBy", "lastInteractionDate", "lastInteractionType"]) item[name] = values.get(name).trim();
    item.categories = values.getAll("categories");
  } else {
    item.personId = personId;
    if (kind === "note") item.text = values.get("text").trim();
    else { item.context = values.get("context").trim(); item.date = values.get("date"); item.done = previous?.done || false; }
  }
  if (previous) next[collection][next[collection].findIndex(entry => entry.id === id)] = item;
  else next[collection].push(item);
  if (!store.save(next)) {
    $("#editor-error").textContent = store.message;
    $("#editor-error").hidden = false;
    showWarnings();
    return;
  }
  if (kind === "person") selectedPersonId = item.id;
  editor.close();
  render();
  $("#profile-heading").focus();
  announce("Saved. A little context for next time.");
}

function toggleDone(id) {
  const next = structuredClone(store.data);
  const item = next.followUps.find(item => item.id === id);
  item.done = !item.done;
  if (store.save(next)) {
    render();
    $("#profile-heading").focus();
    announce(item.done ? "Follow-up marked as done." : "Follow-up marked as not done.");
  } else showWarnings();
}

function askDelete(kind, id) {
  pendingDelete = { kind, id };
  const person = store.data.people.find(person => person.id === id);
  $("#delete-title").textContent = kind === "person" ? `Delete ${person.name}’s profile?` : `Delete this ${kind === "note" ? "note" : "follow-up"}?`;
  $("#delete-description").textContent = kind === "person" ? "This removes the profile and all of its notes and follow-ups from the current app. This cannot be undone." : "This removes the item from this person’s profile. This cannot be undone.";
  $("#delete-error").hidden = true;
  deleteDialog.showModal();
  $("#cancel-delete").focus();
}

function confirmDelete() {
  if (!pendingDelete) return;
  const { kind, id } = pendingDelete;
  const collection = kind === "note" ? "notes" : "followUps";
  const next = kind === "person" ? D.removePerson(store.data, id) : { ...store.data, [collection]: store.data[collection].filter(item => item.id !== id) };
  if (!store.save(next)) {
    $("#delete-error").textContent = store.message;
    $("#delete-error").hidden = false;
    showWarnings();
    return;
  }
  if (kind === "person" && selectedPersonId === id) selectedPersonId = store.data.people[0]?.id || null;
  deleteDialog.close();
  render();
  $("#profile-heading").focus();
  announce(kind === "person" ? "Profile and its notes and follow-ups deleted." : "Item deleted.");
}

$("#add-person").addEventListener("click", () => openEditor("person"));
editorForm.addEventListener("submit", saveEditor);
$("#cancel-editor").addEventListener("click", () => editor.close());
editor.addEventListener("close", () => { editorState = null; });
$("#cancel-delete").addEventListener("click", () => deleteDialog.close());
$("#confirm-delete").addEventListener("click", confirmDelete);
deleteDialog.addEventListener("close", () => { pendingDelete = null; });
render();
