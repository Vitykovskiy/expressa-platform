import { describe, expect, it } from "vitest";

import { ApiError } from "../shared/api/client";
import { mapApiErrorToScreenError } from "./api-error.mapper";

describe("mapApiErrorToScreenError", () => {
  it("переносит в состояние экрана только безопасные для показа поля", () => {
    const error = new ApiError({
      code: "AVAILABILITY_UPDATE_REJECTED",
      details: { field: "acceptingOrders" },
      message: "Изменение не принято.",
      requestId: "request-42",
    });

    expect(mapApiErrorToScreenError(error)).toEqual({
      message: "Изменение не принято.",
      requestId: "request-42",
    });
  });
});
