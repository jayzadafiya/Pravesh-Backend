import * as CryptoJS from "crypto-js";

const SECRET_KEY = "pravesh-org-secret-key-2024";

export const decryptOrgId = (encryptedOrgId: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedOrgId, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      console.warn(
        "Decryption resulted in empty string, using original value as plain ID"
      );
      return encryptedOrgId;
    }

    return decrypted;
  } catch (error) {
    console.warn("Decryption failed, using value as plain ID:", error);
    return encryptedOrgId;
  }
};
