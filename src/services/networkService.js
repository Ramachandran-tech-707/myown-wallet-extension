import { ethers } from "ethers";
import { NETWORKS, getNetwork } from "../config/networks";

// ── Provider cache: keyed by chainId:rpc to avoid stale instances ────
const PROVIDER_CACHE = {};

export const getProvider = (networkKey) => {
    const net = getNetwork(networkKey);
    if (!net) throw new Error("Unknown network: " + networkKey);
    const cacheKey = `${net.chainId}:${net.rpc}`;
    if (!PROVIDER_CACHE[cacheKey]) {
        PROVIDER_CACHE[cacheKey] = new ethers.JsonRpcProvider(net.rpc);
    }
    return PROVIDER_CACHE[cacheKey];
};

// ── RPC fallbacks — Ankr removed (requires API key now).
//    Ordered: official/stable → publicnode → llamarpc → 1rpc
const RPC_FALLBACKS = {
    ethereum: [
        "https://eth.llamarpc.com",
        "https://ethereum.publicnode.com",
        "https://cloudflare-eth.com",
        "https://1rpc.io/eth",
    ],
    bsc: [
        "https://bsc-dataseed.binance.org",
        "https://bsc-dataseed1.binance.org",
        "https://bsc.publicnode.com",
        "https://1rpc.io/bnb",
    ],
    polygon: [
        "https://polygon.llamarpc.com",
        "https://polygon.publicnode.com",
        "https://1rpc.io/matic",
    ],
    arbitrum: [
        "https://arb1.arbitrum.io/rpc",
        "https://arbitrum.llamarpc.com",
        "https://arbitrum.publicnode.com",
        "https://1rpc.io/arb",
    ],
    optimism: [
        "https://mainnet.optimism.io",
        "https://optimism.llamarpc.com",
        "https://optimism.publicnode.com",
        "https://1rpc.io/op",
    ],
    avalanche: [
        "https://api.avax.network/ext/bc/C/rpc",
        "https://avalanche.publicnode.com/ext/bc/C/rpc",
        "https://1rpc.io/avax/c",
    ],
    base: [
        "https://mainnet.base.org",
        "https://base.llamarpc.com",
        "https://base.publicnode.com",
        "https://1rpc.io/base",
    ],
    fantom: [
        "https://rpcapi.fantom.network",
        "https://fantom.publicnode.com",
        "https://1rpc.io/ftm",
    ],
    cronos: [
        "https://evm.cronos.org",
        "https://cronos-evm.publicnode.com",
    ],
    linea: [
        "https://rpc.linea.build",
        "https://linea.publicnode.com",
    ],

    // ── Testnets ─────────────────────────────────────────
    sepolia: [
        "https://ethereum-sepolia-rpc.publicnode.com",
        "https://sepolia.gateway.tenderly.co",
        "https://1rpc.io/sepolia",
        "https://rpc2.sepolia.org",
    ],
    holesky: [
        "https://holesky.publicnode.com",
        "https://1rpc.io/holesky",
    ],
    bsc_testnet: [
        "https://data-seed-prebsc-1-s1.binance.org:8545",
        "https://data-seed-prebsc-2-s1.binance.org:8545",
        "https://bsc-testnet.publicnode.com",
    ],
    mumbai: [
        "https://rpc-mumbai.maticvigil.com",
        "https://polygon-testnet.publicnode.com",
    ],
    arbitrum_sepolia: [
        "https://sepolia-rollup.arbitrum.io/rpc",
        "https://arbitrum-sepolia.publicnode.com",
    ],
    optimism_sepolia: [
        "https://sepolia.optimism.io",
        "https://optimism-sepolia.publicnode.com",
    ],
    base_sepolia: [
        "https://sepolia.base.org",
        "https://base-sepolia-rpc.publicnode.com",
    ],
    avalanche_fuji: [
        "https://api.avax-test.network/ext/bc/C/rpc",
        "https://avalanche-fuji-c-chain-rpc.publicnode.com",
    ],
    fantom_testnet: [
        "https://rpc.testnet.fantom.network",
    ],
    linea_sepolia: [
        "https://rpc.sepolia.linea.build",
        "https://linea-sepolia.publicnode.com",
    ],
};

// ── Raw JSON-RPC fetch with 8s timeout (no ethers overhead) ──────────
const rawGetBalance = async (rpcUrl, address) => {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 8000);
    try {
        const res = await fetch(rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0", method: "eth_getBalance",
                params: [address, "latest"], id: 1,
            }),
            signal: ctrl.signal,
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message || "RPC error");
        return json.result; // hex string
    } finally {
        clearTimeout(tid);
    }
};

// ── fetchBalance — tries all fallback RPCs in order ──────────────────
export const fetchBalance = async (address, networkKey) => {
    const net = getNetwork(networkKey);
    const fallbacks = RPC_FALLBACKS[networkKey] || [];
    // Always try the .env-configured RPC first (if different)
    const rpcs = [...new Set([net?.rpc, ...fallbacks].filter(Boolean))];

    for (const rpc of rpcs) {
        try {
            const hex = await rawGetBalance(rpc, address);
            const bal = parseFloat(ethers.formatEther(BigInt(hex))).toFixed(4);
            // console.log(`[Balance] ${networkKey} via ${rpc}: ${bal}`);
            return bal;
        } catch (e) {
            console.warn(`[Balance] ${rpc} failed: ${e.message}`);
        }
    }

    // console.error(`[Balance] All RPCs failed for ${networkKey}`);
    return "0.0000";
};

// ── getContractProvider — for sending transactions ────────────────────
export const getContractProvider = (networkKey) => getProvider(networkKey);