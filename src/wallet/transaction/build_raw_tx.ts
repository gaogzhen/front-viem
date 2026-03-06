import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  parseGwei,
  formatEther,
  type PublicClient,
  type WalletClient,
  type Hash,
  type TransactionReceipt,
} from "viem";
import { prepareTransactionRequest } from "viem/actions";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

async function sendTransactionExample(): Promise<Hash> {
  try {
    // 1. 账号管理
    // 1.1 从环境变量获取私钥
    const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
    if (!privateKey) {
      throw new Error("请在 .env 文件中设置 PRIVATE_KEY");
    }

    // 1.2 使用私钥推导账号
    const account: PrivateKeyAccount = privateKeyToAccount(privateKey);
    const userAddress = account.address;
    console.log("账户地址:", userAddress);

    // 1.3 创建公共客户端
    const publicClient: PublicClient = createPublicClient({
      chain: foundry,
      transport: http(process.env.RPC_URL),
    });

    // 检查网络状态
    const blockNumber = await publicClient.getBlockNumber();
    console.log("当前区块号:", blockNumber);

    // 获取 gas 价格
    const gasPrice = await publicClient.getGasPrice();
    console.log("当前 gas 价格:", gasPrice);

    // 查询余额
    const balance = await publicClient.getBalance({
      address: userAddress,
    });
    console.log("账户余额:", formatEther(balance), " ETH");

    // 查询nonce
    const nonce = await publicClient.getTransactionCount({
      address: userAddress,
    });
    console.log("当前 Nonce:", nonce);

    // 2. 构建交易
    // 2.1 构建交易参数
    const txParams = {
      account,
      to: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` as `0x${string}`,
      value: parseEther("0.001"), // 发送金额（ETH)
      chainId: foundry.id,
      type: "eip1559" as const, // 使用 const 断言确保类型正确
      chain: foundry,

      // EIP-1559 交易参数
      maxFeePerGas: gasPrice * 2n,
      maxPriorityFeePerGas: parseGwei("1.5"),
      gas: 21000n,
      // nonce: nonce + 1,
    };
    // 自动 Gas 估算及参数校验和补充
    const preparedTx = await prepareTransactionRequest(publicClient, txParams);
    console.log("准备后的交易参数:", {
      ...preparedTx,
      maxFeePerGas: parseGwei(preparedTx.maxFeePerGas.toString()),
      maxPriorityFeePerGas: parseGwei(
        preparedTx.maxPriorityFeePerGas.toString(),
      ),
    });
    // 创建钱包客户端
    const walletClient: WalletClient = createWalletClient({
      account: account,
      chain: foundry,
      transport: http(process.env.RPC_URL),
    });

    // // 方式 1：直接发送交易
    // const txHash1 = await walletClient.sendTransaction(preparedTx);
    // console.log("交易哈希:", txHash1);

    //方式 2 ：
    //签名交易
    const signedTx = await walletClient.signTransaction(preparedTx);
    console.log("Signed Transaction:", signedTx);

    // 发送交易  eth_sendRawTransaction
    const txHash = await publicClient.sendRawTransaction({
      serializedTransaction: signedTx,
    });
    console.log("Transaction Hash:", txHash);

    // 等待交易确认
    const receipt: TransactionReceipt =
      await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log("交易状态:", receipt.status === "success" ? "成功" : "失败");
    console.log("区块号:", receipt.blockNumber);
    console.log("Gas 使用量:", receipt.gasUsed.toString());

    return txHash;
  } catch (error) {
    console.error("错误:", error);
    if (error instanceof Error) {
      console.error("错误信息:", error.message);
    }
    if (error && typeof error === "object" && "details" in error) {
      console.error("错误详情:", error.details);
    }
    throw error;
  }
}

sendTransactionExample();
