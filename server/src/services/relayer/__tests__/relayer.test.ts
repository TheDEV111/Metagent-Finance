import { describe, it, expect } from "vitest";
import { generateSalt, serializeJson, USDC_BASE, BASE_CHAIN_ID } from "../index";

describe("generateSalt", () => {
  it("returns a 32-byte hex string", () => {
    const salt = generateSalt();
    expect(salt).toMatch(/^0x[0-9a-f]{64}$/i);
  });

  it("generates a unique salt each call", () => {
    const a = generateSalt();
    const b = generateSalt();
    expect(a).not.toBe(b);
  });
});

describe("serializeJson", () => {
  it("serializes BigInt values to hex strings", () => {
    const result = serializeJson({ salt: BigInt("12345") });
    expect(result).toBe('{"salt":"0x3039"}');
  });

  it("leaves non-BigInt values unchanged", () => {
    const result = serializeJson({ foo: "bar", n: 42 });
    expect(result).toBe('{"foo":"bar","n":42}');
  });

  it("handles nested BigInts", () => {
    const result = serializeJson({ a: { b: BigInt(0) } });
    expect(result).toBe('{"a":{"b":"0x0"}}');
  });
});

describe("constants", () => {
  it("USDC_BASE is a valid address", () => {
    expect(USDC_BASE).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it("BASE_CHAIN_ID is 0x2105 (Base Mainnet)", () => {
    expect(BASE_CHAIN_ID).toBe("0x2105");
    expect(parseInt(BASE_CHAIN_ID, 16)).toBe(8453);
  });
});
