import assert from "node:assert/strict";
import test from "node:test";
import { isSameOrigin } from "../src/lib/http/origin";

test("write origins allow actual Host behind Next and reject forged/noncanonical origins", () => {
  const request = (origin: string, host = "localhost:3100") =>
    new Request("http://127.0.0.1:3100/api/classes", {
      headers: { origin, host },
    });
  assert.equal(isSameOrigin(request("http://localhost:3100")), true);
  for (const value of [
    "",
    "null",
    "http://attacker.example",
    "https://localhost:3100",
    "http://localhost:3100/path",
    "http://localhost:3100/",
  ])
    assert.equal(isSameOrigin(request(value)), false);
});
