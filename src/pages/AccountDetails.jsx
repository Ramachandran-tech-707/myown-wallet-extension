import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "react-toastify";
import { TailSpin } from "react-loader-spinner";
import {
    getAccountNames, saveAccountName,
    removeWallet, saveSelectedAccount,
} from "../services/storageService";
import { exportPrivateKey } from "../services/walletService";
import PasswordInput from "../components/PasswordInput";

const BackIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const CopyIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

function AccountDetails({ walletData, wallets, setWallets, setCurrentWallet, setStep, network }) {
    const [accountName, setAccountName] = useState("");
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState("");
    const [showPrivKey, setShowPrivKey] = useState(false);
    const [privKey, setPrivKey] = useState("");
    const [password, setPassword] = useState("");
    const [loadingKey, setLoadingKey] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

    useEffect(() => {
        getAccountNames().then((names) => {
            const idx = wallets.findIndex(w => w.address === walletData?.address);
            const name = names[walletData?.address] || `Account ${idx + 1}`;
            setAccountName(name);
            setNewName(name);
        });
    }, [walletData?.address]);

    const handleCopy = (text, label = "Copied!") => {
        navigator.clipboard.writeText(text);
        toast.success(label);
    };

    const handleSaveName = async () => {
        if (!newName.trim()) return toast.error("Enter a name");
        await saveAccountName(walletData.address, newName.trim());
        setAccountName(newName.trim());
        setEditingName(false);
        toast.success("Account name updated!");
    };

    const handleExportKey = async () => {
        if (!password) return toast.error("Enter your password");
        setLoadingKey(true);
        try {
            const key = await exportPrivateKey(walletData.encryptedJson, password);
            setPrivKey(key);
            setShowPrivKey(true);
            toast.success("Private key revealed");
        } catch {
            toast.error("Incorrect password");
        } finally {
            setLoadingKey(false);
        }
    };

    const handleRemove = async () => {
        if (wallets.length <= 1) return toast.error("Cannot remove your only account");
        const updated = await removeWallet(walletData.address);
        setWallets(updated);
        setCurrentWallet(updated[0]);
        await saveSelectedAccount(0);
        toast.success("Account removed");
        setStep("dashboard");
    };

    if (!walletData) return null;

    return (
        <>
            <div className="page-header-nav">
                <button className="icon-btn" onClick={() => setStep("dashboard")}><BackIcon /></button>
                <h2 className="page-title">Account Details</h2>
                <div style={{ width: 32 }} />
            </div>

            {/* QR + Address */}
            <div className="card" style={{ alignItems: "center", gap: "1rem" }}>
                <div className="account-avatar-lg" style={{
                    background: `hsl(${parseInt(walletData.address.slice(2, 4), 16) * 1.4}deg 60% 45%)`
                }}>
                    {accountName.charAt(0).toUpperCase()}
                </div>

                {/* Account Name */}
                {editingName ? (
                    <div style={{ width: "100%", display: "flex", gap: "0.5rem" }}>
                        <input className="form-control" value={newName} onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSaveName()} autoFocus />
                        <button className="btn-send btn-sm" style={{ width: "auto", padding: "0.5rem 0.875rem" }} onClick={handleSaveName}>Save</button>
                        <button className="btn-ghost btn-sm" style={{ width: "auto", padding: "0.5rem 0.875rem" }} onClick={() => setEditingName(false)}>✕</button>
                    </div>
                ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)" }}>{accountName}</span>
                        <button className="icon-btn-sm" onClick={() => setEditingName(true)} title="Edit name">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </button>
                    </div>
                )}

                <div className="qr-wrapper" style={{ padding: "1rem", borderRadius: "var(--radius-md)" }}>
                    <QRCodeCanvas value={walletData.address} size={140} bgColor="transparent" fgColor="#f0f0f8" level="M" />
                </div>

                <div className="address-display" style={{ width: "100%", cursor: "pointer" }}
                    onClick={() => handleCopy(walletData.address, "Address copied!")}>
                    {walletData.address}
                    <span style={{ marginLeft: "0.5rem", opacity: 0.5 }}><CopyIcon /></span>
                </div>
            </div>

            {/* Export Private Key */}
            <div className="card">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Private Key</span>
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Your private key grants complete access to this wallet. Never share it.
                </p>

                {!showPrivKey ? (
                    <>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <PasswordInput value={password} onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleExportKey()} placeholder="Enter your password" />
                        </div>
                        <button className="btn-ghost" onClick={handleExportKey} disabled={loadingKey}
                            style={{ border: "1px solid var(--warning)", color: "var(--warning)" }}>
                            {loadingKey ? <TailSpin height={18} width={18} color="var(--warning)" /> : "Reveal Private Key"}
                        </button>
                    </>
                ) : (
                    <>
                        <div className="privkey-box">
                            <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", wordBreak: "break-all", color: "var(--warning)", lineHeight: 1.7 }}>
                                {privKey}
                            </code>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                            <button className="btn-ghost btn-sm" style={{ width: "100%" }}
                                onClick={() => handleCopy(privKey, "Private key copied!")}>
                                <CopyIcon /> Copy Key
                            </button>
                            <button className="btn-ghost btn-sm" style={{ width: "100%", color: "var(--text-muted)" }}
                                onClick={() => { setShowPrivKey(false); setPrivKey(""); setPassword(""); }}>
                                Hide
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Remove Account */}
            <div className="card">
                {!showRemoveConfirm ? (
                    <button className="btn-ghost" style={{ color: "var(--error)", border: "1px solid rgba(239,68,68,0.3)" }}
                        onClick={() => setShowRemoveConfirm(true)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                        </svg>
                        Remove Account
                    </button>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <p style={{ fontSize: "0.85rem", color: "var(--error)", textAlign: "center", fontWeight: 500 }}>
                            Remove this account? This cannot be undone.
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                            <button className="btn-ghost btn-sm" style={{ width: "100%" }} onClick={() => setShowRemoveConfirm(false)}>Cancel</button>
                            <button className="btn-ghost btn-sm" style={{ width: "100%", color: "var(--error)", border: "1px solid rgba(239,68,68,0.3)" }}
                                onClick={handleRemove}>Remove</button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default AccountDetails;