import { useState } from "react";
import { NETWORKS } from "../config/networks";
import { toast } from "react-toastify";

const PROVIDERS = [
    { id: "moonpay", name: "MoonPay", logo: "🌙", fees: "1.9%", methods: "Card, Bank" },
    { id: "transak", name: "Transak", logo: "⚡", fees: "0.99%", methods: "Card, UPI" },
    { id: "ramp", name: "Ramp", logo: "🚀", fees: "1.5%", methods: "Card, SEPA" },
    { id: "coinbase", name: "Coinbase", logo: "🔵", fees: "2.9%", methods: "Card, ACH" },
];

const FIAT_AMOUNTS = ["50", "100", "200", "500"];

function Buy({ network, walletData }) {
    const net = NETWORKS[network];
    const [amount, setAmount] = useState("100");
    const [selectedProvider, setSelectedProvider] = useState("moonpay");
    const [currency, setCurrency] = useState("USD");

    const handleBuy = () => {
        if (!amount || parseFloat(amount) < 10) return toast.error("Minimum purchase is $10");
        toast.info(`Redirecting to ${PROVIDERS.find(p => p.id === selectedProvider)?.name}...`);
    };

    return (
        <>
            <div className="page-header">
                <h2 className="page-title">Buy Crypto</h2>
                <p className="page-subtitle">Purchase {net?.symbol} with fiat currency</p>
            </div>

            <div className="card">
                {/* Amount */}
                <div className="form-group">
                    <label>Amount ({currency})</label>
                    <div className="buy-amount-row">
                        <select
                            className="form-control"
                            style={{ width: 80, flexShrink: 0 }}
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                        >
                            {["USD", "EUR", "GBP", "INR"].map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input
                            type="number"
                            className="form-control"
                            placeholder="100"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="10"
                        />
                    </div>
                </div>

                {/* Quick amounts */}
                <div className="quick-amounts">
                    {FIAT_AMOUNTS.map((a) => (
                        <button
                            key={a}
                            className={`quick-amount-btn${amount === a ? " active" : ""}`}
                            onClick={() => setAmount(a)}
                        >${a}</button>
                    ))}
                </div>

                {/* Receiving */}
                <div className="form-group">
                    <label>Receiving</label>
                    <div className="form-control" style={{ color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 600, color: "var(--accent)" }}>{net?.symbol}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>on {net?.name}</span>
                    </div>
                </div>

                {/* Wallet Address */}
                <div className="form-group">
                    <label>Delivery Address</label>
                    <div className="address-display" style={{ cursor: "default", fontSize: "0.72rem", padding: "0.6rem 0.875rem" }}>
                        {walletData?.address}
                    </div>
                </div>
            </div>

            {/* Providers */}
            <div className="card" style={{ gap: "0.625rem" }}>
                <label style={{ marginBottom: "0.25rem" }}>Select Provider</label>
                {PROVIDERS.map((p) => (
                    <div
                        key={p.id}
                        className={`provider-item${selectedProvider === p.id ? " selected" : ""}`}
                        onClick={() => setSelectedProvider(p.id)}
                    >
                        <div className="provider-logo">{p.logo}</div>
                        <div className="provider-info">
                            <span className="provider-name">{p.name}</span>
                            <span className="provider-methods">{p.methods}</span>
                        </div>
                        <div className="provider-fee">
                            <span>{p.fees}</span>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>fee</span>
                        </div>
                        <div className={`provider-radio${selectedProvider === p.id ? " checked" : ""}`}>
                            {selectedProvider === p.id && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button className="btn-send" onClick={handleBuy}>
                Continue with {PROVIDERS.find(p => p.id === selectedProvider)?.name}
            </button>

            <p style={{ textAlign: "center", fontSize: "0.73rem", color: "var(--text-muted)", marginTop: "-0.25rem" }}>
                You will be redirected to the provider's secure checkout
            </p>
        </>
    );
}

export default Buy;