const bip39 = require("bip39");
const { hdkey } = require("ethereumjs-wallet");

// 1. 生成助记词
const mnemonic = bip39.generateMnemonic();
console.log("mnemonic: ", mnemonic);

// 2. 根据助记词生成种子
const seed = bip39.mnemonicToSeedSync(mnemonic, ""); // 第二个参数为可选的密码短语

// 3. 从种子创建 hd 钱包
const hdWallet = hdkey.fromMasterSeed(seed);

// 4. 获取第一个以太坊的账户(遵循BIP44)
const path = "m/44'/60'/0'/0/0";
const wallet = hdWallet.derivePath(path).getWallet();

// 5. 获取私钥，公钥，地址
const address = wallet.getAddressString();
const privateKey = wallet.getPrivateKeyString();
const publicKey = wallet.getPublicKeyString();

console.log("Address:", address);
console.log("Private Key:", privateKey);
console.log("Public Key:", publicKey);
