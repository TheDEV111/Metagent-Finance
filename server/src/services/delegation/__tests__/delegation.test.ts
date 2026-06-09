import { describe, it, expect } from "vitest";
import { generateBurnerKey, buildSubDelegation } from "../index";

describe("generateBurnerKey", () => {
  it("returns a valid private key and address", () => {
    const { privateKey, address } = generateBurnerKey();
    expect(privateKey).toMatch(/^0x[0-9a-f]{64}$/i);
    expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it("generates a unique key on each call", () => {
    const a = generateBurnerKey();
    const b = generateBurnerKey();
    expect(a.privateKey).not.toBe(b.privateKey);
    expect(a.address).not.toBe(b.address);
  });

  it("burner address derives correctly from its private key", () => {
    const { privateKey, address } = generateBurnerKey();
    const { privateKeyToAddress } = require("viem/accounts");
    expect(privateKeyToAddress(privateKey)).toBe(address);
  });
});

describe("buildSubDelegation", () => {
  it("throws when SYSTEM_PRIVATE_KEY is missing", async () => {
    const saved = process.env.SYSTEM_PRIVATE_KEY;
    delete process.env.SYSTEM_PRIVATE_KEY;

    const burner = generateBurnerKey();
    await expect(
      buildSubDelegation(
        {},
        { target: "ETH", amount_usdc: 500, router: "0x2626664c2603336E57B271c5C0b26F421741e481" },
        burner
      )
    ).rejects.toThrow("SYSTEM_PRIVATE_KEY not set in env");

    process.env.SYSTEM_PRIVATE_KEY = saved;
  });
});
