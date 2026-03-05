// ─────────────────────────────────────────────────────────────
//  networks.js  —  All supported chains + testnets
//  Structure mirrors MetaMask: mainnets first, testnets grouped
// ─────────────────────────────────────────────────────────────

// ── Helpers ──────────────────────────────────────────────────
const env = (key, fallback) => import.meta.env[key] || fallback;

// ── Network registry ─────────────────────────────────────────
export const NETWORKS = {

    // ══════════════════════════════════════════
    //  MAINNETS
    // ══════════════════════════════════════════

    ethereum: {
        name: "Ethereum",
        shortName: "ETH",
        rpc: env("VITE_ETH_RPC", "https://rpc.ankr.com/eth"),
        symbol: "ETH",
        decimals: 18,
        chainId: 1,
        explorer: "https://etherscan.io",
        explorerApi: "https://api.etherscan.io/api",
        coingeckoId: "ethereum",
        color: "#627EEA",
        icon: "⟠",
        isTestnet: false,
    },

    bsc: {
        name: "BNB Chain",
        shortName: "BNB",
        rpc: env("VITE_BSC_RPC", "https://rpc.ankr.com/bsc"),
        symbol: "BNB",
        decimals: 18,
        chainId: 56,
        explorer: "https://bscscan.com",
        explorerApi: "https://api.bscscan.com/api",
        coingeckoId: "binancecoin",
        color: "#F3BA2F",
        icon: "🔶",
        isTestnet: false,
    },

    polygon: {
        name: "Polygon",
        shortName: "MATIC",
        rpc: env("VITE_POLYGON_RPC", "https://rpc.ankr.com/polygon"),
        symbol: "MATIC",
        decimals: 18,
        chainId: 137,
        explorer: "https://polygonscan.com",
        explorerApi: "https://api.polygonscan.com/api",
        coingeckoId: "matic-network",
        color: "#8247E5",
        icon: "⬡",
        isTestnet: false,
    },

    arbitrum: {
        name: "Arbitrum One",
        shortName: "ARB",
        rpc: env("VITE_ARBITRUM_RPC", "https://rpc.ankr.com/arbitrum"),
        symbol: "ETH",
        decimals: 18,
        chainId: 42161,
        explorer: "https://arbiscan.io",
        explorerApi: "https://api.arbiscan.io/api",
        coingeckoId: "ethereum",
        color: "#28A0F0",
        icon: "🔵",
        isTestnet: false,
    },

    optimism: {
        name: "Optimism",
        shortName: "OP",
        rpc: env("VITE_OPTIMISM_RPC", "https://rpc.ankr.com/optimism"),
        symbol: "ETH",
        decimals: 18,
        chainId: 10,
        explorer: "https://optimistic.etherscan.io",
        explorerApi: "https://api-optimistic.etherscan.io/api",
        coingeckoId: "ethereum",
        color: "#FF0420",
        icon: "🔴",
        isTestnet: false,
    },

    avalanche: {
        name: "Avalanche C-Chain",
        shortName: "AVAX",
        rpc: env("VITE_AVAX_RPC", "https://rpc.ankr.com/avalanche"),
        symbol: "AVAX",
        decimals: 18,
        chainId: 43114,
        explorer: "https://snowtrace.io",
        explorerApi: "https://api.snowtrace.io/api",
        coingeckoId: "avalanche-2",
        color: "#E84142",
        icon: "🔺",
        isTestnet: false,
    },

    base: {
        name: "Base",
        shortName: "BASE",
        rpc: env("VITE_BASE_RPC", "https://rpc.ankr.com/base"),
        symbol: "ETH",
        decimals: 18,
        chainId: 8453,
        explorer: "https://basescan.org",
        explorerApi: "https://api.basescan.org/api",
        coingeckoId: "ethereum",
        color: "#0052FF",
        icon: "🔷",
        isTestnet: false,
    },

    fantom: {
        name: "Fantom",
        shortName: "FTM",
        rpc: env("VITE_FTM_RPC", "https://rpc.ankr.com/fantom"),
        symbol: "FTM",
        decimals: 18,
        chainId: 250,
        explorer: "https://ftmscan.com",
        explorerApi: "https://api.ftmscan.com/api",
        coingeckoId: "fantom",
        color: "#1969FF",
        icon: "👻",
        isTestnet: false,
    },

    cronos: {
        name: "Cronos",
        shortName: "CRO",
        rpc: env("VITE_CRONOS_RPC", "https://evm.cronos.org"),
        symbol: "CRO",
        decimals: 18,
        chainId: 25,
        explorer: "https://cronoscan.com",
        explorerApi: "https://api.cronoscan.com/api",
        coingeckoId: "crypto-com-chain",
        color: "#002D74",
        icon: "🐾",
        isTestnet: false,
    },

    linea: {
        name: "Linea",
        shortName: "LINEA",
        rpc: env("VITE_LINEA_RPC", "https://rpc.linea.build"),
        symbol: "ETH",
        decimals: 18,
        chainId: 59144,
        explorer: "https://lineascan.build",
        explorerApi: "https://api.lineascan.build/api",
        coingeckoId: "ethereum",
        color: "#61DFFF",
        icon: "〰️",
        isTestnet: false,
    },

    // ══════════════════════════════════════════
    //  TESTNETS
    // ══════════════════════════════════════════

    sepolia: {
        name: "Sepolia Testnet",
        shortName: "SEP",
        rpc: env("VITE_SEPOLIA_RPC", "https://rpc.ankr.com/eth_sepolia"),
        symbol: "ETH",
        decimals: 18,
        chainId: 11155111,
        explorer: "https://sepolia.etherscan.io",
        explorerApi: "https://api-sepolia.etherscan.io/api",
        coingeckoId: null,
        color: "#627EEA",
        icon: "⟠",
        isTestnet: true,
        faucet: "https://sepoliafaucet.com",
    },

    holesky: {
        name: "Holesky Testnet",
        shortName: "HOL",
        rpc: env("VITE_HOLESKY_RPC", "https://rpc.ankr.com/eth_holesky"),
        symbol: "ETH",
        decimals: 18,
        chainId: 17000,
        explorer: "https://holesky.etherscan.io",
        explorerApi: "https://api-holesky.etherscan.io/api",
        coingeckoId: null,
        color: "#627EEA",
        icon: "⟠",
        isTestnet: true,
        faucet: "https://holesky-faucet.pk910.de",
    },

    bsc_testnet: {
        name: "BNB Testnet",
        shortName: "tBNB",
        rpc: env("VITE_BSC_TESTNET_RPC", "https://data-seed-prebsc-1-s1.binance.org:8545"),
        symbol: "tBNB",
        decimals: 18,
        chainId: 97,
        explorer: "https://testnet.bscscan.com",
        explorerApi: "https://api-testnet.bscscan.com/api",
        coingeckoId: null,
        color: "#F3BA2F",
        icon: "🔶",
        isTestnet: true,
        faucet: "https://testnet.binance.org/faucet-smart",
    },

    mumbai: {
        name: "Polygon Mumbai",
        shortName: "MUMBAI",
        rpc: env("VITE_MUMBAI_RPC", "https://rpc.ankr.com/polygon_mumbai"),
        symbol: "MATIC",
        decimals: 18,
        chainId: 80001,
        explorer: "https://mumbai.polygonscan.com",
        explorerApi: "https://api-testnet.polygonscan.com/api",
        coingeckoId: null,
        color: "#8247E5",
        icon: "⬡",
        isTestnet: true,
        faucet: "https://faucet.polygon.technology",
    },

    arbitrum_sepolia: {
        name: "Arbitrum Sepolia",
        shortName: "ARB-SEP",
        rpc: env("VITE_ARB_SEPOLIA_RPC", "https://sepolia-rollup.arbitrum.io/rpc"),
        symbol: "ETH",
        decimals: 18,
        chainId: 421614,
        explorer: "https://sepolia.arbiscan.io",
        explorerApi: "https://api-sepolia.arbiscan.io/api",
        coingeckoId: null,
        color: "#28A0F0",
        icon: "🔵",
        isTestnet: true,
        faucet: "https://faucet.arbitrum.io",
    },

    optimism_sepolia: {
        name: "Optimism Sepolia",
        shortName: "OP-SEP",
        rpc: env("VITE_OP_SEPOLIA_RPC", "https://sepolia.optimism.io"),
        symbol: "ETH",
        decimals: 18,
        chainId: 11155420,
        explorer: "https://sepolia-optimism.etherscan.io",
        explorerApi: "https://api-sepolia-optimistic.etherscan.io/api",
        coingeckoId: null,
        color: "#FF0420",
        icon: "🔴",
        isTestnet: true,
        faucet: "https://app.optimism.io/faucet",
    },

    base_sepolia: {
        name: "Base Sepolia",
        shortName: "BASE-SEP",
        rpc: env("VITE_BASE_SEPOLIA_RPC", "https://sepolia.base.org"),
        symbol: "ETH",
        decimals: 18,
        chainId: 84532,
        explorer: "https://sepolia.basescan.org",
        explorerApi: "https://api-sepolia.basescan.org/api",
        coingeckoId: null,
        color: "#0052FF",
        icon: "🔷",
        isTestnet: true,
        faucet: "https://www.coinbase.com/faucets/base-ethereum-goerli-faucet",
    },

    avalanche_fuji: {
        name: "Avalanche Fuji",
        shortName: "FUJI",
        rpc: env("VITE_FUJI_RPC", "https://rpc.ankr.com/avalanche_fuji"),
        symbol: "AVAX",
        decimals: 18,
        chainId: 43113,
        explorer: "https://testnet.snowtrace.io",
        explorerApi: "https://api-testnet.snowtrace.io/api",
        coingeckoId: null,
        color: "#E84142",
        icon: "🔺",
        isTestnet: true,
        faucet: "https://faucet.avax.network",
    },

    fantom_testnet: {
        name: "Fantom Testnet",
        shortName: "tFTM",
        rpc: env("VITE_FTM_TESTNET_RPC", "https://rpc.testnet.fantom.network"),
        symbol: "FTM",
        decimals: 18,
        chainId: 4002,
        explorer: "https://testnet.ftmscan.com",
        explorerApi: "https://api-testnet.ftmscan.com/api",
        coingeckoId: null,
        color: "#1969FF",
        icon: "👻",
        isTestnet: true,
        faucet: "https://faucet.fantom.network",
    },

    linea_sepolia: {
        name: "Linea Sepolia",
        shortName: "LINEA-SEP",
        rpc: env("VITE_LINEA_SEP_RPC", "https://rpc.sepolia.linea.build"),
        symbol: "ETH",
        decimals: 18,
        chainId: 59141,
        explorer: "https://sepolia.lineascan.build",
        explorerApi: "https://api-sepolia.lineascan.build/api",
        coingeckoId: null,
        color: "#61DFFF",
        icon: "〰️",
        isTestnet: true,
        faucet: "https://faucet.goerli.linea.build",
    },
};

// ── Grouped for UI rendering ──────────────────────────────────
export const MAINNET_KEYS = Object.keys(NETWORKS).filter((k) => !NETWORKS[k].isTestnet);
export const TESTNET_KEYS = Object.keys(NETWORKS).filter((k) => NETWORKS[k].isTestnet);

// ── Helpers ───────────────────────────────────────────────────
export const getNetwork = (key = "ethereum") => NETWORKS[key] || NETWORKS.ethereum;

export const getExplorerTxUrl = (networkKey, txHash) => {
    const net = NETWORKS[networkKey];
    if (!net?.explorer || !txHash) return null;
    return `${net.explorer}/tx/${txHash}`;
};

export const getExplorerAddressUrl = (networkKey, address) => {
    const net = NETWORKS[networkKey];
    if (!net?.explorer || !address) return null;
    return `${net.explorer}/address/${address}`;
};

export const getFaucetUrl = (networkKey) => NETWORKS[networkKey]?.faucet || null;

export const isTestnet = (networkKey) => NETWORKS[networkKey]?.isTestnet === true;