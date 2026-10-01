import assert from "node:assert/strict";
import test from "node:test";
import { topicNotes, topicSources } from "../src/lib/chat/topic-sources";

test("curated topic notes retain exact cited evidence, source scope and fit the existing notes composer", () => {
  assert.equal(new Set(topicSources.map((source) => source.id)).size, 2);
  for (const source of topicSources) {
    const notes = topicNotes(source);
    assert.match(
      source.url,
      /^https:\/\/(www\.noaa\.gov|pwg\.gsfc\.nasa\.gov)\//,
    );
    assert.ok(source.quote.split(/\s+/).length <= 25);
    assert.ok(notes.text.length < 8000);
    assert.ok(notes.text.includes(source.quote));
    assert.ok(notes.text.includes(source.notes));
    assert.ok(notes.text.includes(source.url));
    assert.ok(notes.text.includes(source.publisher));
    assert.ok(notes.text.includes("Source checked: 2026-10-01"));
    assert.equal(notes.url, source.url);
    assert.equal(notes.title, source.title);
    assert.doesNotMatch(notes.text, /teacher.approved|grade.*complete/i);
  }
  const fractions = topicSources.find(
    (source) => source.id === "equivalent-fractions",
  )!;
  assert.match(fractions.sourceNote, /Archived/);
  assert.match(fractions.notes, /nonzero/);
  assert.equal(2 / 3, 8 / 12);
});
