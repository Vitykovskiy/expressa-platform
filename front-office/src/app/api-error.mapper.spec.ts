import { describe, expect, it } from "vitest";

import { ApiError } from "../shared/api/client";
import { mapApiErrorToScreenError } from "./api-error.mapper";

describe("mapApiErrorToScreenError", () => {
  it("переносит в состояние экрана только безопасные для показа поля", () => {
    const error = new ApiError({
      code: "AUTH_CODE_INVALID",
      details: { attemptsLeft: 2 },
      message: "Код не принят.",
      requestId: "request-42",
    });

    expect(mapApiErrorToScreenError(error)).toEqual({
      message: "Код не принят.",
      requestId: "request-42",
    });
  });
});
