import { SmsRuSmsSender } from "./sms-ru-sms.sender";

function createFetch(response: Response): jest.MockedFunction<typeof fetch> {
  return jest
    .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
    .mockResolvedValue(response);
}

function successfulResponse(): Response {
  return new Response(
    JSON.stringify({
      sms: {
        "79123456789": {
          sms_id: "message-id",
          status: "OK",
          status_code: 100,
        },
      },
      status: "OK",
      status_code: 100,
    }),
    { status: 200 },
  );
}

describe("SmsRuSmsSender", () => {
  it("отправляет один POST-запрос в SMS.RU с формой провайдера", async () => {
    const fetchImplementation = createFetch(successfulResponse());
    const smsSender = new SmsRuSmsSender(
      { apiId: "api-id", from: "Expressa" },
      fetchImplementation,
    );

    await expect(
      smsSender.send("+79123456789", "123456"),
    ).resolves.toBeUndefined();

    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    expect(fetchImplementation).toHaveBeenCalledWith(
      "https://sms.ru/sms/send",
      expect.objectContaining({
        body: expect.any(URLSearchParams),
        headers: { "content-type": "application/x-www-form-urlencoded" },
        method: "POST",
      }),
    );
    expect(
      (
        fetchImplementation.mock.calls[0]?.[1]?.body as URLSearchParams
      ).toString(),
    ).toBe(
      "api_id=api-id&from=Expressa&json=1&msg=%D0%9A%D0%BE%D0%B4+%D0%BF%D0%BE%D0%B4%D1%82%D0%B2%D0%B5%D1%80%D0%B6%D0%B4%D0%B5%D0%BD%D0%B8%D1%8F+Expressa%3A+123456&to=79123456789&ttl=5",
    );
  });

  it.each([
    new Response("{}", { status: 500 }),
    new Response("{}", { status: 200 }),
    new Response(
      JSON.stringify({
        sms: {
          "79123456789": {
            sms_id: "message-id",
            status: "ERROR",
            status_code: 207,
          },
        },
        status: "OK",
        status_code: 100,
      }),
      { status: 200 },
    ),
    new Response(
      JSON.stringify({
        sms: { "79123456789": { status: "OK", status_code: 100 } },
        status: "OK",
        status_code: 100,
      }),
      { status: 200 },
    ),
  ])("отклоняет ответ SMS.RU без подтверждённой доставки", async (response) => {
    const smsSender = new SmsRuSmsSender(
      { apiId: "api-id", from: "Expressa" },
      createFetch(response),
    );

    await expect(smsSender.send("+79123456789", "123456")).rejects.toThrow(
      "SMS delivery failed.",
    );
  });

  it("не повторяет запрос после ошибки провайдера", async () => {
    const fetchImplementation = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockRejectedValue(new Error("network failure"));
    const smsSender = new SmsRuSmsSender(
      { apiId: "api-id", from: "Expressa" },
      fetchImplementation,
    );

    await expect(smsSender.send("+79123456789", "123456")).rejects.toThrow(
      "SMS delivery failed.",
    );
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it("прерывает единственный запрос через пять секунд", async () => {
    jest.useFakeTimers();

    try {
      const fetchImplementation = jest.fn<
        Promise<Response>,
        Parameters<typeof fetch>
      >(
        (_input, init) =>
          new Promise((_, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new Error("request aborted"));
            });
          }),
      );
      const smsSender = new SmsRuSmsSender(
        { apiId: "api-id", from: "Expressa" },
        fetchImplementation,
      );
      const delivery = smsSender.send("+79123456789", "123456");
      const rejection = expect(delivery).rejects.toThrow(
        "SMS delivery failed.",
      );

      await jest.advanceTimersByTimeAsync(5_000);

      await rejection;
      expect(fetchImplementation).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
