var Crypto = require("crypto");
var secp256k1 = require("secp256k1");
var createKeccakHash = require("keccak");

// 1. 生成私钥：一个32位字节的随机数(1-2^(256-1))
var privateKey = Crypto.randomBytes(32);
console.log("private key ", privateKey.toString("hex"));

// 2. 生成公钥：由secp256k1椭圆曲线算法计算公钥
var publicKey = secp256k1.publicKeyCreate(privateKey, false).slice(1);
publicKey = Buffer.from(publicKey);
console.log("public key length: ", publicKey.toString("hex").length);

// 3. 生成区块链地址：公钥进行keccak256 hash 运算取后40位
var address = createKeccakHash("keccak256")
  .update(publicKey)
  .digest()
  .subarray(-20);

console.log("0x" + address.toString("hex"));
