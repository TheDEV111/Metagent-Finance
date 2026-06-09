import dotenv from "dotenv";
dotenv.config();

import { getCIOTradeIntent } from "../services/ai";

async function main() {
  console.log("test-cio: calling Venice AI...");
  const intent = await getCIOTradeIntent();
  console.log("Trade intent:", intent);
}

main().catch(console.error);
