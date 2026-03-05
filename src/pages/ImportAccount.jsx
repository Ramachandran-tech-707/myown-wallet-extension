import { useState } from "react";
import { toast } from "react-toastify";
import { TailSpin } from "react-loader-spinner";
import { importWalletByPrivateKey, validatePrivateKey } from "../services/walletService";
import { addWallet, saveSelectedAccount, getAccountNames, saveAccountName } from "../services/storageService";

const BackIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

function ImportAccount({ setStep, wallets, setWallets, setCurrentWallet }) {
    const [privateKey, setPrivateKey] = useState("");
    const [password, setPassword] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [loading, setLoading] = useState(false);
    const [keyValid, setKeyValid] = useState(null);

    const handleKeyChange = (val) => {
        setPrivateKey(val);
        if (val.length >= 64) setKeyValid(validatePrivateKey(val));
        else setKeyValid(null);
    };

    const handleImport = async () => {
        if (!privateKey) return toast.error("Enter a private key");
        if (!validatePrivateKey(privateKey)) return toast.error("Invalid private key");
        if (!password) return toast.error("Enter your wallet password");

        const isDuplicate = wallets.some(
            (w) => w.address?.toLowerCase() === (() => {
                try { const { ethers } = require("ethers"); const k = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`; return new ethers.Wallet(k).address.toLowerCase(); } catch { return ""; }
            })()
        );
        if (isDuplicate) return toast.error("This account is already imported");

        try {
            setLoading(true);
            toast.info("Importing account...");
            const newWallet = await importWalletByPrivateKey(privateKey, password);
            const updated = await addWallet(newWallet);
            setWallets(updated);
            const newIdx = updated.length - 1;
            setCurrentWallet(updated[newIdx]);
            await saveSelectedAccount(newIdx);
            await saveAccountName(newWallet.address, `Imported ${updated.length}`);
            toast.success("Account imported successfully!");
            setStep("dashboard");
        } catch (err) {
            toast.error("Import failed. Check your private key and password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="page-header-nav">
                <button className="icon-btn" onClick={() => setStep("dashboard")}>
                    <BackIcon />
                </button>
                <h2 className="page-title">Import Account</h2>
                <div style={{ width: 32 }} />
            </div>

            <div className="card">
                <div className="import-warning">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <p>Never share your private key. Anyone with it has full access to your wallet.</p>
                </div>

                <div className="form-group">
                    <label>Private Key</label>
                    <div className="password-field">
                        <textarea
                            className="form-control"
                            style={{ resize: "none", height: 80, paddingRight: "2.5rem", fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}
                            placeholder="Enter your private key (0x...)"
                            value={privateKey}
                            onChange={(e) => handleKeyChange(e.target.value)}
                            spellCheck={false}
                        />
                        <button type="button" className="password-toggle" style={{ top: 12, bottom: "auto" }}
                            onClick={() => setShowKey(s => !s)}>
                            {showKey
                                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            }
                        </button>
                    </div>
                    {keyValid === true && <span style={{ fontSize: "0.73rem", color: "var(--success)", marginTop: "0.25rem" }}>✓ Valid private key</span>}
                    {keyValid === false && <span style={{ fontSize: "0.73rem", color: "var(--error)", marginTop: "0.25rem" }}>✗ Invalid private key</span>}
                </div>

                <div className="form-group">
                    <label>Wallet Password</label>
                    <input type="password" className="form-control" placeholder="Your existing wallet password"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleImport()} />
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Used to encrypt the imported account
                    </span>
                </div>

                <button className="btn-send" onClick={handleImport} disabled={loading}>
                    {loading ? <TailSpin height={20} width={20} color="#fff" /> : "Import Account"}
                </button>
            </div>
        </>
    );
}

export default ImportAccount;