const { ethers } = await import('ethers')

export const createNewWallet = async (password) => {
    const wallet = ethers.Wallet.createRandom();
    const encrypted = await wallet.encrypt(password);
    return { address: wallet.address, encryptedJson: encrypted };
};

export const decryptWallet = async (encryptedJson, password) => {
    return await ethers.Wallet.fromEncryptedJson(encryptedJson, password);
};

export const importWalletByPrivateKey = async (privateKey, password) => {
    const key = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    const wallet = new ethers.Wallet(key);
    const encrypted = await wallet.encrypt(password);
    return { address: wallet.address, encryptedJson: encrypted };
};

export const exportPrivateKey = async (encryptedJson, password) => {
    const wallet = await ethers.Wallet.fromEncryptedJson(encryptedJson, password);
    return wallet.privateKey;
};

export const validatePrivateKey = (key) => {
    try {
        const k = key.startsWith("0x") ? key : `0x${key}`;
        new ethers.Wallet(k);
        return true;
    } catch {
        return false;
    }
};