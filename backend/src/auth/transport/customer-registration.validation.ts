import { HttpException, HttpStatus } from "@nestjs/common";

export function parseRegistrationName(body: unknown): string {
  if (typeof body === "object" && body !== null && !Array.isArray(body)) {
    const entries = Object.entries(body);
    if (entries.length === 1 && entries[0]?.[0] === "name") {
      const name = entries[0][1];
      if (typeof name === "string" && name.trim() !== "") {
        return name.trim();
      }
    }
  }
  throw new HttpException(
    {
      code: "VALIDATION_ERROR",
      message: "Введите имя.",
      details: {
        fields: [
          {
            path: "name",
            reason: "Must be the only field and a non-blank string",
          },
        ],
      },
    },
    HttpStatus.BAD_REQUEST,
  );
}
