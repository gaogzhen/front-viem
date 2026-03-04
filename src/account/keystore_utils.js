import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const cipher_alg = "aes-128-ctr";
const hash_alg = "sha3-256";
class KeystoreUtils {
  /**
   * 加密私钥并生成 keystore
   * @param {string} privatekey 私钥
   * @param {string} password 密码
   * @returns {object} keystore 对象
   */
  static async encryptPrivateKey(privatekey, password) {
    try {
      // 1. 生成随机 salt
      const salt = crypto.randomBytes(32);

      // 2. 使用 scrypt 派生密钥
      const derivedKey = crypto.scryptSync(password, salt, 32, {
        N: 8192,
        r: 8,
        p: 1,
      });

      // 3. 生成 IV
      const iv = crypto.randomBytes(16);

      // 4. 加密私钥
      // 使用派生密钥的前16字节作为 AES-128 的密钥
      const cipher = crypto.createCipheriv(
        cipher_alg,
        derivedKey.subarray(16),
        iv,
      );
      const cipherText = Buffer.concat([
        cipher.update(Buffer.from(privatekey.slice(2), "hex")),
        cipher.final(),
      ]);

      // 5. 计算 mac
      const mac = crypto
        .createHash(hash_alg)
        .update(Buffer.concat([derivedKey.subarray(16, 32), cipherText]))
        .digest();
      // 6. 返回 keystore 对象
      return {
        crypto: {
          cipher: cipher_alg,
          cipherParams: { iv: iv.toString("hex") },
          cipherText: cipherText.toString("hex"),
          kdf: "scrypt",
          kdfParams: {
            keylen: 32,
            N: 8192,
            p: 1,
            r: 8,
            salt: salt.toString("hex"),
          },
          mac: mac.toString("hex"),
        },
        id: crypto.randomUUID(),
        version: 3,
      };
    } catch (error) {
      console.error("加密私钥失败:", error);
      throw error;
    }
  }

  /**
   * 从 keystore 解密私钥
   * @param {Object} keystore
   * @param {string} password
   * @returns {`0x${string}`} 解密后的私钥
   */
  static async decryptPrivateKey(keystore, password) {
    try {
      const { crypto: cryptoData } = keystore;

      // 1. 从keystore 获取参数
      const { kdfParams, cipherParams, cipherText, mac, cipher } = cryptoData;
      const { salt, keylen, N, r, p } = kdfParams;
      const { iv } = cipherParams;

      // 2. 使用 scrypt 派生密钥
      const derivedKey = crypto.scryptSync(
        password,
        Buffer.from(salt, "hex"),
        keylen,
        { N, r, p },
      );

      // 3. 验证 map
      const calculatedMac = crypto
        .createHash(hash_alg)
        .update(
          Buffer.concat([
            derivedKey.subarray(16, 32),
            Buffer.from(cipherText, "hex"),
          ]),
        )
        .digest();

      if (calculatedMac.toString("hex") !== mac) {
        throw new Error("密码错误或 KeyStore 文件已损坏");
      }

      // 4. 解密私钥
      const decipher = crypto.createDecipheriv(
        cipher,
        derivedKey.subarray(16),
        Buffer.from(iv, "hex"),
      );

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(cipherText, "hex")),
        decipher.final(),
      ]);

      return `0x${decrypted.toString("hex")}`;
    } catch (error) {
      console.error("解密私钥失败:", error);
      throw error;
    }
  }

  /**
   * 保存 keystore 到文件
   * @param {Object} keystore keystore 对象
   * @param {string} filePath 存储路径
   */
  static async saveKeystore(keystore, filePath) {
    try {
      // 1. 确保目录存在
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // 2. 写文件
      await fs.writeFile(filePath, JSON.stringify(keystore, null, 2), "utf8");
    } catch (error) {
      console.error("保存 KeyStore 文件失败:", error);
      throw error;
    }
  }

  /**
   * 从文件加载 keystore
   * @param {string} filePah keystore 文件存储路径
   * @returns {Object} keystore 对象
   */
  static async loadKeystore(filePah) {
    try {
      const text = await fs.readFile(filePah, "utf8");
      return JSON.parse(text);
    } catch (error) {
      console.error("加载 KeyStore 文件失败:", error);
      throw error;
    }
  }
}

export default KeystoreUtils;
