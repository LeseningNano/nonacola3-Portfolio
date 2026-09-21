import assert from "node:assert/strict";
import test from "node:test";
import { handleReorderPost } from "../lib/admin-reorder";

test("malformed reorder JSON returns the invalid-payload 422 without starting a transaction", async () => {
  let transactionCalls = 0;
  const response = await handleReorderPost(
    {
      json: async () => {
        throw new SyntaxError("Unexpected end of JSON input");
      },
    },
    {
      authorize: async () => null,
      commit: async () => {
        transactionCalls += 1;
      },
      revalidate: () => {},
    },
  );

  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), { error: "参数无效" });
  assert.equal(transactionCalls, 0);
});
