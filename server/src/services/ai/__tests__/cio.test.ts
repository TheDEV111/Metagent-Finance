import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCIOTradeIntent } from "../cio";
import type OpenAI from "openai";

const mockCreate = vi.fn();
const mockClient = {
  chat: { completions: { create: mockCreate } },
} as unknown as OpenAI;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCIOTradeIntent", () => {
  it("parses a valid trade intent from the model response", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              target: "ETH",
              amount_usdc: 500,
              router: "0x2626664c2603336E57B271c5C0b26F421741e481",
            }),
          },
        },
      ],
    });

    const result = await getCIOTradeIntent(mockClient);

    expect(result.target).toBe("ETH");
    expect(result.amount_usdc).toBe(500);
    expect(result.router).toBe("0x2626664c2603336E57B271c5C0b26F421741e481");
  });

  it("throws when the model returns an empty response", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });

    await expect(getCIOTradeIntent(mockClient)).rejects.toThrow(
      "CIO Agent returned empty response"
    );
  });

  it("throws when the model returns a malformed intent", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ target: "ETH" }) } }],
    });

    await expect(getCIOTradeIntent(mockClient)).rejects.toThrow(
      "CIO Agent returned malformed intent"
    );
  });
});
