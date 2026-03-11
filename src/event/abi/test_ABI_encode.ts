import {
  createPublicClient,
  http,
  parseEther,
  type PublicClient,
  type Address,
  getContract,
} from "viem";
import { foundry } from "viem/chains";

import ABIEncode_ABI from "../../contracts/ABIEncode.json" with { type: "json" };

const ABIENCODE_ADDRESS =
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as Address;
const to = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as Address;
const amount = parseEther("10");

async function TestABIEncode() {
  try {
    // 创建公共客户端
    const publicClient: PublicClient = createPublicClient({
      chain: foundry,
      transport: http(process.env.RPC_URL),
    });

    // 获取合约
    const abiEncodeContract = getContract({
      address: ABIENCODE_ADDRESS,
      abi: ABIEncode_ABI,
      client: publicClient,
    });

    const signature = await abiEncodeContract.read.encodeWithSignature([
      to,
      amount,
    ]);

    console.log(signature);
  } catch (error) {
    console.log(error);
  }
}

TestABIEncode();
