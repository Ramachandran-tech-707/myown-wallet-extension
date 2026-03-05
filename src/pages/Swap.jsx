import { useState, useEffect } from "react";
import { NETWORKS } from "../config/networks";
import { toast } from "react-toastify";
import { TailSpin } from "react-loader-spinner";

const SwapArrowIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
);

const TOKENS = ["ETH", "BNB", "MATIC", "USDT", "USDC", "DAI"];
const COINGECKO_IDS = {
    ETH: "ethereum", BNB: "binancecoin", MATIC: "matic-network",
    USDT: "tether", USDC: "usd-coin", DAI: "dai",
};

function Swap({ network, walletData, balance }) {
    const net = NETWORKS[network];
    const [fromToken, setFromToken] = useState(net?.symbol || "ETH");
    const [toToken, setToToken] = useState("USDT");
    const [fromAmount, setFromAmount] = useState("");
    const [toAmount, setToAmount] = useState("");
    const [rate, setRate] = useState(null);
    const [loadingRate, setLoadingRate] = useState(false);
    const [slippage, setSlippage] = useState("0.5");

    useEffect(() => { setFromToken(net?.symbol || "ETH"); }, [network]);

    useEffect(() => {
        if (!fromAmount || parseFloat(fromAmount) <= 0) { setToAmount(""); return; }
        let cancelled = false;
        const calc = async () => {
            setLoadingRate(true);
            try {
                const fromId = COINGECKO_IDS[fromToken];
                const toId = COINGECKO_IDS[toToken];
                if (!fromId || !toId || fromToken === toToken) { setToAmount(""); return; }
                const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${fromId},${toId}&vs_currencies=usd`);
                const data = await res.json();
                const fromUsd = data[fromId]?.usd;
                const toUsd = data[toId]?.usd;
                if (!cancelled && fromUsd && toUsd) {
                    const r = fromUsd / toUsd;
                    setRate(r);
                    setToAmount((parseFloat(fromAmount) * r).toFixed(6));
                }
            } catch { if (!cancelled) setToAmount(""); }
            finally { if (!cancelled) setLoadingRate(false); }
        };
        calc();
        return () => { cancelled = true; };
    }, [fromAmount, fromToken, toToken]);

    const handleFromChange = (e) => {
        const v = e.target.value;
        if (v === "" || /^\d*\.?\d*$/.test(v)) setFromAmount(v);
    };

    const handleFlip = () => {
        setFromToken(toToken);
        setToToken(fromToken);
        setFromAmount(toAmount);
        setToAmount(fromAmount);
        setRate(rate ? 1 / rate : null);
    };

    const handleMax = () => {
        if (fromToken === net?.symbol && balance) setFromAmount(String(balance));
    };

    const handleSwap = () => {
        if (!fromAmount || parseFloat(fromAmount) <= 0) return toast.error("Enter an amount");
        if (fromToken === toToken) return toast.error("Select different tokens");
        if (fromToken === net?.symbol && parseFloat(fromAmount) > parseFloat(balance || "0"))
            return toast.error("Insufficient balance");
        toast.info("Swap connects to a DEX aggregator — integration coming soon");
    };

    return (
        <>
            <div className="page-header">
                <h2 className="page-title">Swap</h2>
                <p className="page-subtitle">Exchange tokens instantly</p>
            </div>

            <div className="card">
                {/* ── From ── */}
                <div className="swap-box">
                    <div className="swap-box-header">
                        <span className="swap-box-label">From</span>
                        <button className="max-btn" onClick={handleMax} type="button">MAX</button>
                    </div>
                    <div className="swap-input-row">
                        <input
                            className="swap-amount-input"
                            type="text"
                            inputMode="decimal"
                            placeholder="0.0"
                            value={fromAmount}
                            onChange={handleFromChange}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                        />
                        <select
                            className="token-select"
                            value={fromToken}
                            onChange={(e) => setFromToken(e.target.value)}
                        >
                            {TOKENS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    {fromToken === net?.symbol && (
                        <span className="swap-balance-hint">Balance: {balance ?? "0"} {net?.symbol}</span>
                    )}
                </div>

                {/* ── Flip ── */}
                <div className="swap-flip-row">
                    <button className="swap-flip-btn" onClick={handleFlip} type="button" title="Flip tokens">
                        <SwapArrowIcon />
                    </button>
                </div>

                {/* ── To ── */}
                <div className="swap-box">
                    <div className="swap-box-header">
                        <span className="swap-box-label">To (estimated)</span>
                        {rate && !loadingRate && (
                            <span className="swap-rate-hint">1 {fromToken} ≈ {rate.toFixed(4)} {toToken}</span>
                        )}
                    </div>
                    <div className="swap-input-row">
                        {loadingRate
                            ? <div className="swap-loading-row">
                                <TailSpin height={16} width={16} color="#f6851b" />
                                <span>Fetching rate…</span>
                            </div>
                            : <input
                                className="swap-amount-input"
                                type="text"
                                placeholder="0.0"
                                value={toAmount}
                                readOnly
                                tabIndex={-1}
                            />
                        }
                        <select
                            className="token-select"
                            value={toToken}
                            onChange={(e) => setToToken(e.target.value)}
                        >
                            {TOKENS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                {/* ── Slippage ── */}
                <div className="slippage-row">
                    <span className="slippage-label">Slippage Tolerance</span>
                    <div className="slippage-options">
                        {["0.1", "0.5", "1.0"].map((s) => (
                            <button
                                key={s}
                                type="button"
                                className={`slippage-btn${slippage === s ? " active" : ""}`}
                                onClick={() => setSlippage(s)}
                            >{s}%</button>
                        ))}
                    </div>
                </div>

                <button className="btn-send" type="button" onClick={handleSwap}>
                    Swap {fromToken} → {toToken}
                </button>
            </div>

            <div className="info-card">
                <div className="info-row">
                    <span className="info-row-label">Network</span>
                    <span className="info-row-value">{net?.name}</span>
                </div>
                <div className="info-row">
                    <span className="info-row-label">Slippage</span>
                    <span className="info-row-value">{slippage}%</span>
                </div>
                <div className="info-row" style={{ borderBottom: "none" }}>
                    <span className="info-row-label">Protocol</span>
                    <span className="info-row-value">DEX Aggregator</span>
                </div>
            </div>
        </>
    );
}

export default Swap;