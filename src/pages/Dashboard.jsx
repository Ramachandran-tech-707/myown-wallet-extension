import { useState, useEffect, useCallback, useRef } from "react";
import { TailSpin } from "react-loader-spinner";
import { NETWORKS } from "../config/networks";
import { toast } from "react-toastify";

// ── Explorer APIs ─────────────────────────────────────
const EXPLORER_APIS = {
    ethereum: { bs: "https://eth.blockscout.com/api", es: "https://api.etherscan.io/api" },
    sepolia: { bs: "https://eth-sepolia.blockscout.com/api", es: "https://api-sepolia.etherscan.io/api" },
    holesky: { bs: "https://eth-holesky.blockscout.com/api", es: "https://api-holesky.etherscan.io/api" },
    polygon: { bs: "https://polygon.blockscout.com/api", es: "https://api.polygonscan.com/api" },
    mumbai: { bs: "https://polygon-mumbai.blockscout.com/api", es: "https://api-testnet.polygonscan.com/api" },
    arbitrum: { bs: "https://arbitrum.blockscout.com/api", es: "https://api.arbiscan.io/api" },
    arbitrum_sepolia: { bs: "https://arbitrum-sepolia.blockscout.com/api", es: "https://api-sepolia.arbiscan.io/api" },
    optimism: { bs: "https://optimism.blockscout.com/api", es: "https://api-optimistic.etherscan.io/api" },
    optimism_sepolia: { bs: "https://optimism-sepolia.blockscout.com/api", es: "https://api-sepolia-optimistic.etherscan.io/api" },
    base: { bs: "https://base.blockscout.com/api", es: "https://api.basescan.org/api" },
    base_sepolia: { bs: "https://base-sepolia.blockscout.com/api", es: "https://api-sepolia.basescan.org/api" },
    avalanche: { bs: "https://avalanche.blockscout.com/api", es: "https://api.snowtrace.io/api" },
    avalanche_fuji: { bs: "https://avalanche-fuji.blockscout.com/api", es: null },
    fantom: { bs: "https://ftm.blockscout.com/api", es: "https://api.ftmscan.com/api" },
    fantom_testnet: { bs: null, es: "https://api-testnet.ftmscan.com/api" },
    bsc: { bs: "https://bsc.blockscout.com/api", es: "https://api.bscscan.com/api" },
    bsc_testnet: { bs: "https://bsc-testnet.blockscout.com/api", es: "https://api-testnet.bscscan.com/api" },
    cronos: { bs: null, es: "https://api.cronoscan.com/api" },
    linea: { bs: "https://explorer.linea.build/api", es: null },
    linea_sepolia: { bs: "https://sepolia.lineascan.build/api", es: null },
};

// ── Method signatures ─────────────────────────────────
const METHOD_LABELS = {
    "0x60806040": "Contract Deployment", "0x60a06040": "Contract Deployment", "0x60c06040": "Contract Deployment",
    "0xa9059cbb": "Token Transfer", "0x23b872dd": "Token Transfer", "0x095ea7b3": "Approve Token",
    "0x40c10f19": "Mint", "0x1249c58b": "Mint", "0xd0e30db0": "Deposit", "0x2e1a7d4d": "Withdraw",
    "0x38ed1739": "Swap", "0x8803dbee": "Swap", "0x18cbafe5": "Swap", "0xfb3bdb41": "Swap", "0x7ff36ab5": "Swap",
    "0xe8e33700": "Add Liquidity", "0xbaa2abde": "Remove Liquidity", "0xa22cb465": "Set Approval",
    "0x42842e0e": "Transfer NFT", "0x6352211e": "NFT Lookup", "0xb88d4fde": "Transfer NFT",
    "0x4e71d92d": "Claim", "0x4e71e0c8": "Claim", "0x5f5e1000": "Staking",
};

const getTxLabel = (tx, isOwner) => {
    if (!tx.to || tx.to === "") return "Contract Deployment";
    const input = tx.input || tx.data || "0x";
    if (input === "0x" || input === "0x0" || input.length <= 2) return isOwner ? "Sent" : "Received";
    const sig = input.slice(0, 10).toLowerCase();
    return METHOD_LABELS[sig] || (isOwner ? "Contract Call" : "Interaction");
};

const getTxIcon = (label, failed) => {
    if (failed) return { char: "✕", cls: "act-failed" };
    if (label === "Contract Deployment") return { char: "📄", cls: "act-deploy" };
    if (label === "Mint") return { char: "✦", cls: "act-mint" };
    if (label.includes("Swap")) return { char: "⇄", cls: "act-swap" };
    if (label.includes("NFT")) return { char: "🖼", cls: "act-nft" };
    if (label === "Approve Token") return { char: "✓", cls: "act-approve" };
    if (label === "Deposit") return { char: "↓", cls: "act-in" };
    if (label === "Withdraw") return { char: "↑", cls: "act-out" };
    if (label === "Claim") return { char: "★", cls: "act-mint" };
    if (label === "Token Transfer") return { char: "→", cls: "act-out" };
    if (label === "Sent") return { char: "↑", cls: "act-out" };
    if (label === "Received") return { char: "↓", cls: "act-in" };
    return { char: "⚙", cls: "act-contract" };
};

// ── Network fetch helpers ────────────────────────────
const fetchWithTimeout = (url, ms = 9000) => {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(id));
};

// ── Activity fetch — key-aware rate limit logic ───────
const fetchTxHistory = async (address, networkKey, page = 1, offset = 30) => {
    const apis = EXPLORER_APIS[networkKey];
    const key = (import.meta.env.VITE_ETHERSCAN_KEY || "").trim();

    // 1. Blockscout (always first, free)
    if (apis?.bs) {
        try {
            const url = `${apis.bs}?module=account&action=txlist&address=${address}&sort=desc&page=${page}&offset=${offset}`;
            const res = await fetchWithTimeout(url);
            const json = await res.json();
            if (json.status === "1" && json.result?.length)
                return { txns: json.result, source: "blockscout" };
        } catch (e) { console.warn("[Activity] Blockscout:", e.message); }
    }

    // 2. Etherscan with key (if available)
    if (apis?.es) {
        try {
            const keyParam = key ? `&apikey=${key}` : "";
            const url = `${apis.es}?module=account&action=txlist&address=${address}&sort=desc&page=${page}&offset=${offset}${keyParam}`;
            const res = await fetchWithTimeout(url);
            const json = await res.json();
            if (json.status === "1" && json.result?.length)
                return { txns: json.result, source: "etherscan" };
            // Only show rate-limit UI when NO key is provided
            const isRateLimit = json.result === "Max rate limit reached";
            if (isRateLimit && !key) return { txns: [], source: "ratelimit" };
            // If key exists but response is still bad, just return empty (not rate-limit UI)
        } catch (e) { console.warn("[Activity] Etherscan:", e.message); }
    }

    return { txns: [], source: apis ? "empty" : "none" };
};

// ── Helpers ───────────────────────────────────────────
const formatWei = (val) => {
    if (!val || val === "0") return null;
    const eth = parseFloat(val) / 1e18;
    if (eth < 0.000001) return null;
    if (eth < 0.0001) return eth.toFixed(6);
    return eth.toFixed(4);
};

const formatTime = (ts) => {
    const d = new Date(Number(ts) * 1000);
    const now = new Date();
    const diffH = (now - d) / 3600000;
    if (diffH < 1) return `${Math.floor(diffH * 60)}m ago`;
    if (diffH < 24) return `${Math.floor(diffH)}h ago`;
    if (diffH < 48) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
};

const groupByDate = (txns) => {
    const groups = {};
    txns.forEach((tx) => {
        const d = new Date(Number(tx.timeStamp) * 1000);
        const now = new Date();
        const diffD = Math.floor((now - d) / 86400000);
        const label = diffD === 0 ? "Today" : diffD === 1 ? "Yesterday"
            : d.toLocaleDateString(undefined, {
                weekday: "long", month: "long", day: "numeric",
                year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined
            });
        if (!groups[label]) groups[label] = [];
        groups[label].push(tx);
    });
    return groups;
};

// ── Price helpers ─────────────────────────────────────
const PRICE_CACHE = {};
const fetchPrice = async (id) => {
    if (!id) return null;
    if (PRICE_CACHE[id]) return PRICE_CACHE[id];
    try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
        const data = await res.json();
        const p = data?.[id]?.usd ?? null;
        if (p) PRICE_CACHE[id] = p;
        return p;
    } catch { return null; }
};
const fetchMultiPrice = async (ids) => {
    if (!ids.length) return {};
    try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`);
        return await res.json();
    } catch { return {}; }
};
const SYMBOL_TO_CG = {
    USDT: "tether", USDC: "usd-coin", DAI: "dai", BUSD: "binance-usd", WETH: "weth", WBTC: "wrapped-bitcoin",
    LINK: "chainlink", UNI: "uniswap", AAVE: "aave", MATIC: "matic-network", BNB: "binancecoin", SHIB: "shiba-inu",
    PEPE: "pepe", ARB: "arbitrum", OP: "optimism", SNX: "synthetix-network-token", MKR: "maker",
    COMP: "compound-governance-token", CRV: "curve-dao-token", LDO: "lido-dao", FRAX: "frax", LUSD: "liquity-usd",
};

// ── Image URL resolver ────────────────────────────────
const IPFS_GATEWAYS = [
    "https://ipfs.io/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
];
const resolveImg = (url) => {
    if (!url || typeof url !== "string") return null;
    // Already a data URI
    if (url.startsWith("data:")) return url;
    // IPFS protocol
    if (url.startsWith("ipfs://")) return IPFS_GATEWAYS[0] + url.slice(7);
    if (url.startsWith("ipfs/")) return IPFS_GATEWAYS[0] + url.slice(5);
    // Bare CID
    if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-zA-Z0-9]{58,})/.test(url))
        return IPFS_GATEWAYS[0] + url;
    // Already HTTP/HTTPS
    if (url.startsWith("http")) return url;
    // Relative IPFS path
    if (url.startsWith("/ipfs/")) return "https://ipfs.io" + url;
    return url;
};

// Try next IPFS gateway on failure
const tryNextGateway = (currentSrc) => {
    for (let i = 0; i < IPFS_GATEWAYS.length - 1; i++) {
        if (currentSrc.startsWith(IPFS_GATEWAYS[i])) {
            return IPFS_GATEWAYS[i + 1] + currentSrc.slice(IPFS_GATEWAYS[i].length);
        }
    }
    return null;
};

// ── ERC-20 fetch ──────────────────────────────────────
const fetchERC20 = async (address, networkKey) => {
    const apis = EXPLORER_APIS[networkKey];
    if (!apis?.bs) return [];
    const v2 = apis.bs.replace("/api", "/api/v2");
    try {
        const res = await fetchWithTimeout(`${v2}/addresses/${address}/tokens?type=ERC-20`);
        const json = await res.json();
        if (Array.isArray(json.items)) return json.items;
    } catch { }
    try {
        const res = await fetchWithTimeout(`${apis.bs}?module=account&action=tokenlist&address=${address}`);
        const json = await res.json();
        if (json.status === "1" && Array.isArray(json.result)) return json.result;
    } catch { }
    return [];
};

// ── NFT fetch — CORRECT endpoint for actual instances ─
// Blockscout v2  /addresses/{addr}/nft   returns real NFT instances
// with token_id, metadata, and image_url populated.
// The /tokens?type=ERC-721 endpoint returns holdings summary only (token_id: null).
// ── NFT fetch — 3-step strategy ──────────────────────
// Step 1: v1 tokennfttx → get actual tokenIDs owned by address
// Step 2: v2 /tokens/{contract}/instances/{id} → get metadata + image per token
// Step 3: If metadata missing, try fetching tokenURI from public RPC
const fetchNFTs = async (address, networkKey) => {
    const apis = EXPLORER_APIS[networkKey];
    if (!apis?.bs) return [];
    const v1 = apis.bs;                           // v1 API base
    const v2 = apis.bs.replace("/api", "/api/v2"); // v2 API base

    console.log("[NFT] Starting fetch for", networkKey, address);

    // ── Step 1: Get owned tokenIDs from v1 tokennfttx ────
    // This is the most reliable way — returns actual transfers with tokenID
    let ownedTokens = []; // [{contractAddress, tokenID, tokenName, tokenSymbol, contractInfo}]
    try {
        const url = `${v1}?module=account&action=tokennfttx&address=${address}&sort=desc&page=1&offset=100`;
        const res = await fetchWithTimeout(url);
        const json = await res.json();
        console.log("[NFT] tokennfttx status:", json.status, "count:", json.result?.length);
        if (json.status === "1" && Array.isArray(json.result)) {
            // Determine currently owned: incoming transfers that weren't later sent out
            const incoming = new Map(); // key: contract:tokenId → tx
            const outgoing = new Set(); // key: contract:tokenId
            // Sort oldest first to process correctly
            const sorted = [...json.result].sort((a, b) => Number(a.timeStamp) - Number(b.timeStamp));
            for (const tx of sorted) {
                const k = tx.contractAddress.toLowerCase() + ":" + tx.tokenID;
                if (tx.to.toLowerCase() === address.toLowerCase()) {
                    incoming.set(k, tx);
                } else {
                    outgoing.add(k);
                    incoming.delete(k);
                }
            }
            // Remaining in incoming = currently owned
            ownedTokens = [...incoming.values()].map(tx => ({
                contractAddress: tx.contractAddress,
                tokenID: tx.tokenID,
                tokenName: tx.tokenName,
                tokenSymbol: tx.tokenSymbol,
                type: "ERC-721",
            }));
            console.log("[NFT] Owned tokens after dedup:", ownedTokens.length, ownedTokens);
        }
    } catch (e) { console.warn("[NFT] tokennfttx failed:", e.message); }

    // Also try ERC-1155
    try {
        const url = `${v1}?module=account&action=token1155tx&address=${address}&sort=desc&page=1&offset=50`;
        const res = await fetchWithTimeout(url);
        const json = await res.json();
        if (json.status === "1" && Array.isArray(json.result) && json.result.length) {
            const seen1155 = new Set();
            for (const tx of json.result) {
                const k = tx.contractAddress.toLowerCase() + ":" + tx.tokenID;
                if (!seen1155.has(k)) {
                    seen1155.add(k);
                    ownedTokens.push({
                        contractAddress: tx.contractAddress,
                        tokenID: tx.tokenID,
                        tokenName: tx.tokenName,
                        tokenSymbol: tx.tokenSymbol,
                        type: "ERC-1155",
                    });
                }
            }
        }
    } catch { }

    if (!ownedTokens.length) {
        console.warn("[NFT] No owned tokens found via tokennfttx");
        return [];
    }

    // ── Step 2: Fetch metadata for each token via v2 ─────
    const results = [];
    for (const tok of ownedTokens.slice(0, 25)) {
        const contract = tok.contractAddress;
        const tokenId = tok.tokenID;

        let instance = null;
        let tokenInfo = null;

        // Fetch instance metadata from Blockscout v2
        try {
            const ir = await fetchWithTimeout(`${v2}/tokens/${contract}/instances/${tokenId}`);
            instance = await ir.json();
            console.log("[NFT] instance for", tokenId, ":", instance?.image_url, instance?.metadata);
        } catch { }

        // Fetch token info (name, symbol, type) from v2 if not from tx
        try {
            const tr = await fetchWithTimeout(`${v2}/tokens/${contract}`);
            tokenInfo = await tr.json();
        } catch { }

        const meta = instance?.metadata || {};
        const imgRaw = instance?.image_url
            || meta.image
            || meta.image_url
            || meta.animation_url
            || tokenInfo?.icon_url
            || null;

        results.push({
            token: {
                address_hash: contract,
                address: contract,
                name: tokenInfo?.name || tok.tokenName || "Unknown",
                symbol: tokenInfo?.symbol || tok.tokenSymbol || "",
                type: tokenInfo?.type || tok.type || "ERC-721",
                icon_url: tokenInfo?.icon_url || null,
            },
            token_id: tokenId,
            token_instance: instance,
            metadata: meta,
            image_url: imgRaw,
            value: "1",
        });
    }

    console.log("[NFT] Final results:", results.length, results.map(r => ({ id: r.token_id, img: r.image_url })));
    return results;
};

// ══════════════════════════════════════════
//  TOKENS TAB
// ══════════════════════════════════════════
function TokensTab({ balance, loadingBalance, network, walletData }) {
    const [nativePrice, setNativePrice] = useState(null);
    const [tokens, setTokens] = useState([]);
    const [loadingTok, setLoadingTok] = useState(false);
    const [prices, setPrices] = useState({});
    const net = NETWORKS[network];

    useEffect(() => { fetchPrice(net?.coingeckoId).then(setNativePrice); }, [network]);

    useEffect(() => {
        if (!walletData?.address) return;
        let cancelled = false;
        setLoadingTok(true);
        setTokens([]);
        fetchERC20(walletData.address, network).then(async (list) => {
            if (cancelled) return;
            setTokens(list);
            setLoadingTok(false);
            const cgIds = [...new Set(list.map((t) =>
                SYMBOL_TO_CG[(t.token?.symbol || t.symbol || "").toUpperCase()]).filter(Boolean))];
            if (cgIds.length) { const p = await fetchMultiPrice(cgIds); if (!cancelled) setPrices(p); }
        }).catch(() => { if (!cancelled) setLoadingTok(false); });
        return () => { cancelled = true; };
    }, [walletData?.address, network]);

    const nativeUsd = nativePrice && balance && !["---", "0.0000"].includes(balance)
        ? (parseFloat(balance) * nativePrice).toFixed(2) : null;

    const formatBal = (tok) => {
        const raw = tok.value || tok.balance || "0";
        const dec = parseInt(tok.token?.decimals || tok.decimals || "18", 10);
        const amt = parseFloat(raw) / Math.pow(10, dec);
        if (amt === 0) return "0";
        if (amt < 0.0001) return "< 0.0001";
        if (amt >= 1e6) return (amt / 1e6).toFixed(2) + "M";
        if (amt >= 1e3) return (amt / 1e3).toFixed(2) + "K";
        return amt.toFixed(4);
    };

    const getUsd = (tok) => {
        const sym = (tok.token?.symbol || tok.symbol || "").toUpperCase();
        const cgId = SYMBOL_TO_CG[sym];
        const p = cgId && prices[cgId]?.usd;
        if (!p) return null;
        const raw = tok.value || tok.balance || "0";
        const dec = parseInt(tok.token?.decimals || tok.decimals || "18", 10);
        return ((parseFloat(raw) / Math.pow(10, dec)) * p).toFixed(2);
    };

    return (
        <div className="tab-scroll-area">
            <div className="token-item">
                <div className="token-icon" style={{ background: net?.color ?? "var(--accent)", fontSize: "1rem" }}>
                    {net?.icon || net?.symbol?.charAt(0)}
                </div>
                <div className="token-info">
                    <span className="token-name">{net?.symbol}</span>
                    <span className="token-subname">{net?.name}</span>
                </div>
                <div className="token-balance">
                    {loadingBalance
                        ? <TailSpin height={13} width={13} color="#f6851b" />
                        : <>
                            <span className="token-amount">{balance ?? "0.0000"}</span>
                            {nativeUsd
                                ? <span className="token-usd">{"$" + nativeUsd}</span>
                                : net?.isTestnet ? <span className="token-usd" style={{ color: "var(--warning)" }}>Testnet</span> : null}
                        </>}
                </div>
            </div>

            {loadingTok && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.25rem" }}>
                    <TailSpin height={12} width={12} color="#f6851b" />
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Loading tokens…</span>
                </div>
            )}
            {!loadingTok && tokens.length === 0 && (
                <div className="empty-state-sm"><p>No ERC-20 tokens found</p></div>
            )}
            {tokens.map((tok, i) => {
                const sym = tok.token?.symbol || tok.symbol || "?";
                const name = tok.token?.name || tok.name || sym;
                const addr = tok.token?.address_hash || tok.token?.address || tok.contractAddress || "";
                const color = "#" + (addr.slice(2, 8) || "aaaaaa");
                const usd = getUsd(tok);
                return (
                    <div key={addr + i} className="token-item">
                        <div className="token-icon" style={{ background: color, fontSize: "0.68rem", fontWeight: 700 }}>
                            {sym.slice(0, 4)}
                        </div>
                        <div className="token-info">
                            <span className="token-name">{sym}</span>
                            <span className="token-subname" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{name}</span>
                        </div>
                        <div className="token-balance">
                            <span className="token-amount">{formatBal(tok)}</span>
                            {usd && <span className="token-usd">{"$" + usd}</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ══════════════════════════════════════════
//  NFT DETAIL PANEL (slide-up modal)
// ══════════════════════════════════════════
function NFTDetailPanel({ nft, net, onClose }) {
    const addr = nft.token?.address_hash || nft.token?.address || "";
    const tokenId = nft.token_id;
    const colName = nft.token?.name || "Unknown Collection";
    const sym = nft.token?.symbol || "";
    const meta = nft.metadata || nft.token_instance?.metadata || {};
    const imgRaw = meta.image || meta.image_url || nft.image_url || nft.token_instance?.image_url || null;
    const imgUrl = resolveImg(imgRaw);
    const display = meta.name || (tokenId ? `#${tokenId}` : colName);
    const attrs = Array.isArray(meta.attributes) ? meta.attributes : [];
    const color = "#" + (addr.slice(2, 8) || "888888");
    const [imgErr, setImgErr] = useState(false);
    const explorerUrl = `${net?.explorer}/token/${addr}/instance/${tokenId}`;

    return (
        <>
            <div className="nft-panel-overlay" onClick={onClose} />
            <div className="nft-detail-panel">
                {/* Header */}
                <div className="nft-panel-header">
                    <button className="icon-btn-sm" onClick={onClose} type="button" style={{ marginRight: "auto" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, flex: 1, textAlign: "center" }}>{display}</span>
                    <div style={{ width: 28 }} />
                </div>

                <div className="nft-panel-body">
                    {/* Image */}
                    <div className="nft-panel-image-wrap">
                        {imgUrl && imgErr !== "dead"
                            ? <img
                                src={imgErr ? (tryNextGateway(imgUrl) || imgUrl) : imgUrl}
                                alt={display}
                                className="nft-panel-image"
                                onError={() => setImgErr(prev => prev ? "dead" : true)}
                            />
                            : <div className="nft-panel-placeholder" style={{ background: color }}>
                                <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>
                                    {sym?.slice(0, 3) || "?"}
                                </span>
                            </div>}
                    </div>

                    {/* Details */}
                    <div className="nft-panel-info-block">
                        <div className="nft-panel-info-row">
                            <span className="nft-panel-label">Collection</span>
                            <span className="nft-panel-value">{colName}</span>
                        </div>
                        <div className="nft-panel-info-row">
                            <span className="nft-panel-label">Token ID</span>
                            <span className="nft-panel-value mono">{tokenId ?? "—"}</span>
                        </div>
                        <div className="nft-panel-info-row">
                            <span className="nft-panel-label">Standard</span>
                            <span className="nft-panel-value">{nft.token?.type || "ERC-721"}</span>
                        </div>
                        <div className="nft-panel-info-row" style={{ borderBottom: "none" }}>
                            <span className="nft-panel-label">Contract</span>
                            <span className="nft-panel-value mono" style={{ fontSize: "0.68rem" }}>
                                {addr.slice(0, 10)}…{addr.slice(-4)}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    {meta.description && (
                        <p className="nft-panel-desc">{meta.description}</p>
                    )}

                    {/* Traits */}
                    {attrs.length > 0 && (
                        <div className="nft-attrs-section">
                            <div className="nft-attrs-title">Properties</div>
                            <div className="nft-attrs-grid">
                                {attrs.map((a, i) => (
                                    <div key={i} className="nft-attr-chip">
                                        <span className="nft-attr-type">{a.trait_type}</span>
                                        <span className="nft-attr-value">{String(a.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="nft-panel-actions">
                        <button
                            className="btn-receive"
                            style={{ flex: 1 }}
                            type="button"
                            onClick={() => window.open(explorerUrl, "_blank")}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            View on Explorer
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ══════════════════════════════════════════
//  NFTS TAB
// ══════════════════════════════════════════
function NFTsTab({ walletData, network }) {
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [imgErr, setImgErr] = useState({});
    const [selected, setSelected] = useState(null);
    const net = NETWORKS[network];

    useEffect(() => {
        if (!walletData?.address) return;
        let cancelled = false;
        setLoading(true);
        setNfts([]);
        setSelected(null);
        fetchNFTs(walletData.address, network).then((list) => {
            if (!cancelled) { setNfts(list); setLoading(false); }
        }).catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [walletData?.address, network]);

    if (loading) return (
        <div className="tab-scroll-area tab-center">
            <TailSpin height={24} width={24} color="#f6851b" />
            <span style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>Loading NFTs…</span>
        </div>
    );

    if (!nfts.length) return (
        <div className="tab-scroll-area tab-center">
            <div className="empty-state">
                <div className="empty-state-icon">🖼️</div>
                <p className="empty-state-title">No NFTs found</p>
                <p className="empty-state-sub">NFTs on {net?.name} will appear here</p>
            </div>
        </div>
    );

    return (
        <>
            <div className="tab-scroll-area">
                <div className="nft-count-row">
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600 }}>
                        {nfts.length} NFT{nfts.length !== 1 ? "s" : ""}
                    </span>
                </div>
                <div className="nft-grid">
                    {nfts.map((nft, i) => {
                        const addr = nft.token?.address_hash || nft.token?.address || "";
                        const tokenId = nft.token_id;
                        const name = nft.token?.name || "Unknown";
                        const sym = nft.token?.symbol || "";
                        // ✅ Pull image from all possible locations in Blockscout v2 response
                        const meta = nft.metadata || nft.token_instance?.metadata || {};
                        const imgRaw = meta.image
                            || meta.image_url
                            || nft.image_url
                            || nft.token_instance?.image_url
                            || nft.token?.icon_url
                            || null;
                        const imgUrl = resolveImg(imgRaw);
                        const display = meta.name || (tokenId ? `#${tokenId}` : name);
                        const key = addr + (tokenId ?? "") + i;
                        const color = "#" + (addr.slice(2, 8) || "888888");

                        return (
                            <div key={key} className="nft-card" onClick={() => setSelected(nft)}>
                                <div className="nft-image-wrap">
                                    {imgUrl && imgErr[key] !== "dead"
                                        ? <img
                                            src={imgErr[key] ? (tryNextGateway(imgUrl) || imgUrl) : imgUrl}
                                            alt={display}
                                            className="nft-image"
                                            onError={() => setImgErr((p) => {
                                                const cur = p[key];
                                                // first error → try next gateway, second → give up
                                                return { ...p, [key]: cur ? "dead" : true };
                                            })}
                                        />
                                        : <div className="nft-placeholder" style={{ background: color }}>
                                            <span style={{ fontSize: "1rem", fontWeight: 800, color: "rgba(255,255,255,0.8)" }}>
                                                {sym?.slice(0, 3) || "?"}
                                            </span>
                                        </div>}
                                </div>
                                <div className="nft-info">
                                    <span className="nft-name">{display}</span>
                                    <span className="nft-collection">{name}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detail panel */}
            {selected && (
                <NFTDetailPanel nft={selected} net={net} onClose={() => setSelected(null)} />
            )}
        </>
    );
}

// ══════════════════════════════════════════
//  ACTIVITY TAB
// ══════════════════════════════════════════
function ActivityTab({ walletData, network }) {
    const [txns, setTxns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadMore, setLoadMore] = useState(false);
    const [status, setStatus] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [price, setPrice] = useState(null);
    const scrollRef = useRef(null);
    const net = NETWORKS[network];
    const PAGE_SIZE = 30;

    useEffect(() => { fetchPrice(net?.coingeckoId).then(setPrice); }, [network]);

    const load = useCallback(async (resetPage = true) => {
        if (!walletData?.address) return;
        const currentPage = resetPage ? 1 : page;
        if (resetPage) { setLoading(true); setTxns([]); setPage(1); setHasMore(true); setStatus(null); }
        else setLoadMore(true);
        try {
            const { txns: result, source } = await fetchTxHistory(walletData.address, network, currentPage, PAGE_SIZE);
            if (result.length > 0) {
                setTxns((prev) => resetPage ? result : [...prev, ...result]);
                setHasMore(result.length === PAGE_SIZE);
                if (!resetPage) setPage((p) => p + 1);
                setStatus(null);
            } else {
                setHasMore(false);
                if (resetPage) setStatus(source === "ratelimit" ? "ratelimit" : source === "none" ? "noapi" : "empty");
            }
        } catch { if (resetPage) setStatus("error"); }
        finally { setLoading(false); setLoadMore(false); }
    }, [walletData?.address, network, page]);

    useEffect(() => { load(true); }, [walletData?.address, network]);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el || loadMore || !hasMore) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) load(false);
    };

    if (loading) return (
        <div className="tab-scroll-area tab-center">
            <TailSpin height={26} width={26} color="#f6851b" />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>Fetching transactions…</span>
        </div>
    );

    if (status === "ratelimit") return (
        <div className="tab-scroll-area tab-center">
            <div className="empty-state">
                <div className="empty-state-icon">⏳</div>
                <p className="empty-state-title">Rate limited</p>
                <p className="empty-state-sub">
                    Add <code style={{ fontSize: "0.7rem", background: "var(--bg-input)", padding: "0.1rem 0.35rem", borderRadius: "3px" }}>VITE_ETHERSCAN_KEY</code> to your .env
                </p>
                <button className="btn-ghost btn-sm" style={{ marginTop: "0.75rem", width: "auto" }} onClick={() => load(true)}>Retry</button>
            </div>
        </div>
    );

    if (status === "noapi") return (
        <div className="tab-scroll-area tab-center">
            <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <p className="empty-state-title">No explorer available</p>
                <p className="empty-state-sub">Activity not supported for this network yet</p>
            </div>
        </div>
    );

    if (status === "error") return (
        <div className="tab-scroll-area tab-center">
            <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <p className="empty-state-title">Failed to load</p>
                <button className="btn-ghost btn-sm" style={{ marginTop: "0.5rem", width: "auto" }} onClick={() => load(true)}>Retry</button>
            </div>
        </div>
    );

    if (status === "empty" || (!loading && txns.length === 0)) return (
        <div className="tab-scroll-area tab-center">
            <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p className="empty-state-title">No transactions yet</p>
                <p className="empty-state-sub">
                    {net?.isTestnet ? "Use the faucet to get test tokens" : "Send or receive crypto to see activity"}
                </p>
            </div>
        </div>
    );

    const groups = groupByDate(txns);
    return (
        <div className="tab-scroll-area" ref={scrollRef} onScroll={handleScroll}>
            <div className="activity-toolbar">
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    {txns.length} transaction{txns.length !== 1 ? "s" : ""}
                </span>
                <button className="icon-btn-sm" onClick={() => load(true)} title="Refresh" type="button">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                </button>
            </div>

            {Object.entries(groups).map(([dateLabel, dateTxns]) => (
                <div key={dateLabel} className="activity-group">
                    <div className="activity-date-header">{dateLabel}</div>
                    {dateTxns.map((tx) => {
                        const isOwner = tx.from?.toLowerCase() === walletData.address.toLowerCase();
                        const failed = tx.isError === "1" || tx.txreceipt_status === "0";
                        const label = getTxLabel(tx, isOwner);
                        const { char, cls } = getTxIcon(label, failed);
                        const val = formatWei(tx.value);
                        const usd = val && price && !net?.isTestnet
                            ? "$" + (parseFloat(tx.value) / 1e18 * price).toFixed(2) : null;
                        return (
                            <div key={tx.hash} className="act-row"
                                onClick={() => window.open(`${net.explorer}/tx/${tx.hash}`, "_blank")}>
                                <div className={`act-icon ${cls}`}>{char}</div>
                                <div className="act-body">
                                    <div className="act-label-row">
                                        <span className="act-label">{label}</span>
                                        {failed
                                            ? <span className="act-badge act-badge-fail">Failed</span>
                                            : <span className="act-badge act-badge-ok">Confirmed</span>}
                                    </div>
                                    <span className="act-sub">
                                        {label === "Received" || label === "Interaction"
                                            ? `From: ${tx.from.slice(0, 6)}…${tx.from.slice(-4)}`
                                            : tx.to ? `To: ${tx.to.slice(0, 6)}…${tx.to.slice(-4)}` : "Contract created"}
                                    </span>
                                </div>
                                <div className="act-right">
                                    <span className={`act-amount ${failed ? "act-amount-fail" : isOwner ? "act-amount-out" : "act-amount-in"}`}>
                                        {val ? `${isOwner ? "-" : "+"}${val} ${net?.symbol}` : "—"}
                                    </span>
                                    {usd && <span className="act-usd">{isOwner ? "-" : "+" + usd}</span>}
                                    <span className="act-time">{formatTime(tx.timeStamp)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}

            {loadMore && (
                <div style={{ display: "flex", justifyContent: "center", padding: "0.75rem" }}>
                    <TailSpin height={20} width={20} color="#f6851b" />
                </div>
            )}
            {!hasMore && txns.length > 0 && (
                <div className="activity-explorer-link">
                    <a href={`${net.explorer}/address/${walletData.address}`} target="_blank" rel="noreferrer">
                        View full history on {net.explorer?.replace("https://", "").split("/")[0]} ↗
                    </a>
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════
function Dashboard({ setStep, walletData, network, balance, loadingBalance }) {
    const [activeTab, setActiveTab] = useState("tokens");
    const net = NETWORKS[network];

    const handleCopy = () => {
        navigator.clipboard.writeText(walletData.address);
        toast.success("Address copied!");
    };

    if (!walletData) return (
        <div className="loader-wrapper"><TailSpin height={40} width={40} color="#f6851b" /></div>
    );

    return (
        <>
            <div className="balance-block">
                <div className="balance-label">{net?.isTestnet ? "Testnet Balance" : "Total Balance"}</div>
                <div className="balance-amount" style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: "0.25rem" }}>
                    {loadingBalance
                        ? <TailSpin height={26} width={26} color="#f6851b" />
                        : <><span>{balance ?? "0.0000"}</span><span className="balance-symbol">{net?.symbol}</span></>}
                </div>
                <div className="address-copy-row" onClick={handleCopy} title="Click to copy">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.73rem", color: "var(--text-muted)" }}>
                        {walletData.address.slice(0, 10)}…{walletData.address.slice(-8)}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                </div>
            </div>

            <div className="actions">
                <button className="btn-send" onClick={() => setStep("send")}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Send
                </button>
                <button className="btn-receive" onClick={() => setStep("receive")}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="8 17 12 21 16 17" /><line x1="12" y1="3" x2="12" y2="21" />
                    </svg>
                    Receive
                </button>
            </div>

            <div className="tab-card">
                <div className="tab-bar">
                    {["tokens", "nfts", "activity"].map((tab) => (
                        <button key={tab} className={`tab-btn${activeTab === tab ? " active" : ""}`}
                            onClick={() => setActiveTab(tab)} type="button">
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
                {activeTab === "tokens" && <TokensTab balance={balance} loadingBalance={loadingBalance} network={network} walletData={walletData} />}
                {activeTab === "nfts" && <NFTsTab walletData={walletData} network={network} />}
                {activeTab === "activity" && <ActivityTab walletData={walletData} network={network} />}
            </div>
        </>
    );
}

export default Dashboard;