import { useEffect, useState } from "react";
import { NETWORKS, MAINNET_KEYS, TESTNET_KEYS, getFaucetUrl, isTestnet } from "../config/networks";
import { fetchBalance } from "../services/networkService";
import { ethers } from "ethers";
import { TailSpin } from "react-loader-spinner";
import BottomNav from "./BottomNav";
import AccountPanel from "./AccountPanel";

const WalletIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L3 6.5V12C3 16.75 7.02 21.16 12 22.5C16.98 21.16 21 16.75 21 12V6.5L12 2Z" fill="url(#wg1)" />
        <path d="M8.5 12L11 14.5L15.5 9.5" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
            <linearGradient id="wg1" x1="3" y1="2" x2="21" y2="22.5" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffb84d" /><stop offset="100%" stopColor="#d95f00" />
            </linearGradient>
        </defs>
    </svg>
);

const LogoutIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const FaucetIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v6M8 6l4 4 4-4" />
        <path d="M5 14h14a2 2 0 0 1 2 2v1a5 5 0 0 1-10 0v-1a2 2 0 0 1-2-2z" />
    </svg>
);

function LogoutModal({ onConfirm, onCancel }) {
    return (
        <>
            <div className="panel-overlay" onClick={onCancel} />
            <div className="logout-modal">
                <div className="logout-modal-icon"><LogoutIcon /></div>
                <h3 className="logout-modal-title">Lock Wallet</h3>
                <p className="logout-modal-text">
                    This will lock your wallet and return to the login screen.
                    Your accounts remain safely stored.
                </p>
                <div className="logout-modal-actions">
                    <button className="btn-ghost" onClick={onCancel}>Cancel</button>
                    <button className="btn-logout-confirm" onClick={onConfirm}>Lock Wallet</button>
                </div>
            </div>
        </>
    );
}

function Layout({ network, setNetwork, wallets, setWallets, currentWallet, setCurrentWallet, step, setStep, onLogout, children }) {
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [balance, setBalance] = useState("---");
    const [showAccountPanel, setShowAccountPanel] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showNetworkMenu, setShowNetworkMenu] = useState(false);

    const net = NETWORKS[network];
    const accountIndex = Math.max(0, wallets.findIndex((w) => w.address === currentWallet?.address));
    const onTestnet = isTestnet(network);
    const faucetUrl = getFaucetUrl(network);

    useEffect(() => {
        if (!currentWallet?.address || !NETWORKS[network]) return;
        let cancelled = false;
        setBalance('---');
        setLoadingBalance(true);
        fetchBalance(currentWallet.address, network).then((bal) => {
            if (!cancelled) {
                setBalance(bal);
                setLoadingBalance(false);
            }
        });
        return () => { cancelled = true; };
    }, [currentWallet?.address, network]);

    const handleNetworkSelect = (key) => {
        setNetwork(key);
        setShowNetworkMenu(false);
    };

    const handleAccountChange = (e) => {
        const idx = Number(e.target.value);
        if (wallets[idx]) setCurrentWallet(wallets[idx]);
    };

    return (
        <>
            <div className="app-shell">
                {/* ── Top Bar ── */}
                <div className="top-bar">
                    <div className="top-bar-row">
                        {/* Brand */}
                        <div className="brand-logo" style={{ marginRight: "auto" }}>
                            <div className="brand-icon"><WalletIcon /></div>
                            <span className="brand-name">My Own Wallet</span>
                        </div>

                        {/* Network picker button */}
                        <div style={{ position: "relative" }}>
                            <button
                                className={`network-pill-btn${onTestnet ? " testnet" : ""}`}
                                onClick={() => setShowNetworkMenu((v) => !v)}
                                type="button"
                            >
                                <span className={`network-pill-dot${onTestnet ? " testnet" : ""}`} />
                                <span className="network-pill-name">{net?.shortName || net?.name}</span>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>

                            {/* Network dropdown menu */}
                            {showNetworkMenu && (
                                <>
                                    <div className="network-menu-overlay" onClick={() => setShowNetworkMenu(false)} />
                                    <div className="network-menu">
                                        <div className="network-menu-section-label">Mainnets</div>
                                        {MAINNET_KEYS.map((key) => {
                                            const n = NETWORKS[key];
                                            return (
                                                <button
                                                    key={key}
                                                    className={`network-menu-item${network === key ? " active" : ""}`}
                                                    onClick={() => handleNetworkSelect(key)}
                                                    type="button"
                                                >
                                                    <span className="network-menu-icon">{n.icon}</span>
                                                    <span className="network-menu-info">
                                                        <span className="network-menu-name">{n.name}</span>
                                                        <span className="network-menu-symbol">{n.symbol}</span>
                                                    </span>
                                                    <span className="network-menu-chain">#{n.chainId}</span>
                                                    {network === key && (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </button>
                                            );
                                        })}

                                        <div className="network-menu-divider" />
                                        <div className="network-menu-section-label">
                                            Testnets
                                            <span className="testnet-badge-sm">TEST</span>
                                        </div>
                                        {TESTNET_KEYS.map((key) => {
                                            const n = NETWORKS[key];
                                            return (
                                                <button
                                                    key={key}
                                                    className={`network-menu-item testnet${network === key ? " active" : ""}`}
                                                    onClick={() => handleNetworkSelect(key)}
                                                    type="button"
                                                >
                                                    <span className="network-menu-icon">{n.icon}</span>
                                                    <span className="network-menu-info">
                                                        <span className="network-menu-name">{n.name}</span>
                                                        <span className="network-menu-symbol">{n.symbol}</span>
                                                    </span>
                                                    <span className="network-menu-chain">#{n.chainId}</span>
                                                    {network === key && (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Logout */}
                        <button className="logout-btn" onClick={() => setShowLogoutModal(true)} title="Lock Wallet" type="button">
                            <LogoutIcon />
                        </button>
                    </div>

                    {/* Account + Balance row */}
                    {wallets.length > 0 && currentWallet && (
                        <div className="top-bar-row">
                            <select className="select-pill" value={accountIndex} onChange={handleAccountChange} style={{ flex: 1 }}>
                                {wallets.map((_, i) => (
                                    <option key={i} value={i}>Account {i + 1}</option>
                                ))}
                            </select>
                            <div className="balance-pill">
                                {loadingBalance
                                    ? <TailSpin height={13} width={13} color="#f6851b" />
                                    : `${balance} ${net?.symbol ?? ""}`}
                            </div>
                        </div>
                    )}

                    {/* Address + network badge row */}
                    {currentWallet && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div className="network-badge">
                                <span className={`network-dot${onTestnet ? " testnet-dot" : ""}`} />
                                {net?.name}
                                {onTestnet && <span className="testnet-badge-inline">TESTNET</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                {onTestnet && faucetUrl && (
                                    <a
                                        href={faucetUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="faucet-link"
                                        title="Get test tokens"
                                    >
                                        <FaucetIcon /> Faucet
                                    </a>
                                )}
                                <span className="address-short">
                                    {currentWallet.address.slice(0, 6)}...{currentWallet.address.slice(-4)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Page Content */}
                <div className="page-content">{children}</div>

                {/* Bottom Nav */}
                <BottomNav step={step} setStep={setStep} onAccountsClick={() => setShowAccountPanel(true)} />

            </div>

            {/* Account Panel — outside app-shell so position:fixed is not clipped */}
            {showAccountPanel && (
                <AccountPanel
                    wallets={wallets} setWallets={setWallets}
                    currentWallet={currentWallet} setCurrentWallet={setCurrentWallet}
                    onClose={() => setShowAccountPanel(false)} setStep={setStep}
                />
            )}

            {/* Logout Modal — outside app-shell for same reason */}
            {showLogoutModal && (
                <LogoutModal
                    onConfirm={() => { setShowLogoutModal(false); onLogout(); }}
                    onCancel={() => setShowLogoutModal(false)}
                />
            )}
        </>
    );
}

export default Layout;