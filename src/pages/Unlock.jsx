import { useEffect, useState } from "react";
import { decryptWallet } from "../services/walletService";
import { getWallets, getSelectedAccount } from "../services/storageService";
import { toast } from "react-toastify";
import { TailSpin } from "react-loader-spinner";

function Unlock({ setWallet, setStep }) {
    const [password, setPassword] = useState("");
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getWallets().then(setWallets);
    }, []);

    const handleUnlock = async () => {
        if (!wallets || wallets.length === 0) {
            return toast.error("No wallets found");
        }
        if (!password) return toast.error("Enter your password");

        try {
            setLoading(true);
            const selectedIndex = await getSelectedAccount();
            const walletData = wallets[selectedIndex] || wallets[0];
            const decrypted = await decryptWallet(walletData.encryptedJson, password);
            setWallet(walletData);
            toast.success("Wallet unlocked!");
            setStep("dashboard");
        } catch {
            toast.error("Incorrect password");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleUnlock();
    };

    return (
        <div className="page-centered">
            <div style={{ padding: "2rem 1.5rem 1rem", textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🔐</div>
                <h2 style={{ marginBottom: "0.375rem" }}>Welcome Back</h2>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    Enter your password to unlock your wallet
                </p>
            </div>

            <div style={{ margin: "0 1rem 1rem" }}>
                <div className="card">
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>

                    <button className="btn-send" onClick={handleUnlock} disabled={loading}>
                        {loading ? <TailSpin height={20} width={20} color="#fff" /> : "Unlock"}
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
                    <button
                        className="btn-ghost btn-sm"
                        style={{ width: "auto", fontSize: "0.8rem", color: "var(--accent)", border: "none", background: "transparent" }}
                        onClick={() => setStep("forgotPassword")}
                    >
                        Forgot password?
                    </button>
                    <button
                        className="btn-ghost btn-sm"
                        style={{ width: "auto", fontSize: "0.8rem" }}
                        onClick={() => setStep("onboarding")}
                    >
                        Create new wallet
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Unlock;