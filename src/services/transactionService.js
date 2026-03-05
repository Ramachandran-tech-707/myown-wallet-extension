const { ethers } = await import('ethers')

import { getProvider } from "./networkService";
import { NETWORKS } from "../config/networks";

export const estimateGasFee = async (networkKey, fromAddress, toAddress, amount) => {
    const net = NETWORKS[networkKey];
    const provider = getProvider(net.rpc, net.chainId);

    const tx = {
        from: fromAddress,
        to: toAddress,
        value: ethers.parseEther(amount),
    };

    const [gasEstimate, feeData] = await Promise.all([
        provider.estimateGas(tx),
        provider.getFeeData(),
    ]);

    return {
        gasLimit: gasEstimate,
        gasPrice: feeData.gasPrice,
        maxFeePerGas: feeData.maxFeePerGas,
    };
};

export const sendTransaction = async (networkKey, decryptedWallet, toAddress, amount) => {
    const net = NETWORKS[networkKey];
    const provider = getProvider(net.rpc, net.chainId);
    const wallet = decryptedWallet.connect(provider);

    const tx = await wallet.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount),
    });

    return tx;
};