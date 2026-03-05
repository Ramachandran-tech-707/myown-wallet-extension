import { ethers } from "ethers";
import { NETWORKS } from "../config/networks";

const providerCache = new Map();
const makeCacheKey = (rpcUrl, chainId) => `${chainId}:${rpcUrl}`;

export const getProvider = (rpcUrl, chainId) => {
    if (!rpcUrl) throw new Error("RPC URL missing");
    const key = makeCacheKey(rpcUrl, chainId);
    if (providerCache.has(key)) return providerCache.get(key);

    let staticNet = null;
    if (chainId) {
        const name = Object.values(NETWORKS).find((n) => n.chainId === chainId)?.name ?? "unknown";
        staticNet = new ethers.Network(name, chainId);
    }

    const provider = staticNet
        ? new ethers.JsonRpcProvider(rpcUrl, staticNet, { staticNetwork: staticNet })
        : new ethers.JsonRpcProvider(rpcUrl);

    providerCache.set(key, provider);
    return provider;
};

export const getProviderByKey = (networkKey) => {
    const net = NETWORKS[networkKey];
    if (!net) throw new Error("Unknown network: " + networkKey);
    return getProvider(net.rpc, net.chainId);
};

export const clearProviderCache = () => providerCache.clear();

// ── RPC fallbacks per network ─────────────────────────
const RPC_FALLBACKS = {
    ethereum: ["https://rpc.ankr.com/eth", "https://ethereum.publicnode.com", "https://1rpc.io/eth"],
    bsc: ["https://rpc.ankr.com/bsc", "https://bsc-dataseed.binance.org", "https://bsc.publicnode.com"],
    polygon: ["https://rpc.ankr.com/polygon", "https://polygon.publicnode.com", "https://1rpc.io/matic"],
    arbitrum: ["https://rpc.ankr.com/arbitrum", "https://arb1.arbitrum.io/rpc", "https://arbitrum.publicnode.com"],
    optimism: ["https://rpc.ankr.com/optimism", "https://mainnet.optimism.io", "https://optimism.publicnode.com"],
    avalanche: ["https://rpc.ankr.com/avalanche", "https://api.avax.network/ext/bc/C/rpc", "https://avalanche.publicnode.com"],
    base: ["https://rpc.ankr.com/base", "https://mainnet.base.org", "https://base.publicnode.com"],
    fantom: ["https://rpc.ankr.com/fantom", "https://rpcapi.fantom.network", "https://fantom.publicnode.com"],
    cronos: ["https://evm.cronos.org", "https://cronos-evm.publicnode.com"],
    linea: ["https://rpc.linea.build", "https://linea.publicnode.com"],
    // testnets
    sepolia: ["https://rpc.ankr.com/eth_sepolia", "https://sepolia.gateway.tenderly.co", "https://ethereum-sepolia-rpc.publicnode.com", "https://rpc2.sepolia.org"],
    holesky: ["https://rpc.ankr.com/eth_holesky", "https://holesky.publicnode.com", "https://1rpc.io/holesky"],
    bsc_testnet: ["https://data-seed-prebsc-1-s1.binance.org:8545", "https://data-seed-prebsc-2-s1.binance.org:8545"],
    mumbai: ["https://rpc.ankr.com/polygon_mumbai", "https://rpc-mumbai.maticvigil.com"],
    arbitrum_sepolia: ["https://sepolia-rollup.arbitrum.io/rpc", "https://arbitrum-sepolia.publicnode.com"],
    optimism_sepolia: ["https://sepolia.optimism.io", "https://optimism-sepolia.publicnode.com"],
    base_sepolia: ["https://sepolia.base.org", "https://base-sepolia-rpc.publicnode.com"],
    avalanche_fuji: ["https://rpc.ankr.com/avalanche_fuji", "https://api.avax-test.network/ext/bc/C/rpc"],
    fantom_testnet: ["https://rpc.testnet.fantom.network"],
    linea_sepolia: ["https://rpc.sepolia.linea.build", "https://linea-sepolia.publicnode.com"],
};

// ── Raw JSON-RPC call (no ethers overhead) ────────────
const rawGetBalance = async (rpcUrl, address, chainId, timeoutMs = 8000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0", id: 1,
                method: "eth_getBalance",
                params: [address, "latest"],
            }),
            signal: controller.signal,
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        if (!json.result) throw new Error("No result");
        // json.result is hex wei
        return ethers.formatEther(BigInt(json.result));
    } finally {
        clearTimeout(timer);
    }
};

// ── Main fetchBalance with fallback chain ─────────────
export const fetchBalance = async (address, networkKey) => {
    if (!address || !networkKey) return "0.0000";

    const net = NETWORKS[networkKey];
    const fallbacks = RPC_FALLBACKS[networkKey] || (net ? [net.rpc] : []);
    const rpcs = [...new Set([net?.rpc, ...fallbacks].filter(Boolean))];

    for (const rpc of rpcs) {
        try {
            const bal = await rawGetBalance(rpc, address, net?.chainId);
            const num = parseFloat(bal);
            // console.log(`[Balance] ${networkKey} via ${rpc}: ${num}`);
            return num.toFixed(4);
        }
        catch (err) {
            console.warn(`[Balance] ${rpc} failed:`, err.message);
        }
    }

    // console.error(`[Balance] All RPCs failed for ${networkKey}`);
    return "0.0000";
};