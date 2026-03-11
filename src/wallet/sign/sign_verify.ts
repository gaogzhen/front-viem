import { createWalletClient, http, verifyMessage, hashMessage } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  const walletClient = createWalletClient({
    account,
    chain: foundry,
    transport: http(),
  });

  const message = "Hello World";

  const hash = await hashMessage(message);

  const signature = await walletClient.signMessage({ message });
  console.log("签名结果:", signature);

  const isValid = await verifyMessage({
    address: account.address,
    message,
    signature,
  });

  console.log("签名验证结果:", isValid ? "验证成功" : "验证失败");
}

main().catch((error) => {
  console.error("发生错误:", error);
  process.exit(1);
});
