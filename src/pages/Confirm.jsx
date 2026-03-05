import { useState } from "react";
import { decryptWallet } from "../services/walletService";
import { sendTransaction } from "../services/transactionService";
import { NETWORKS, getExplorerTxUrl } from "../config/networks";
import { toast } from "react-toastify";
import { TailSpin } from "react-loader-spinner";

function Confirm({ txData, walletData, network, setStep }) {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState(null);

    const net = NETWORKS[network];

    const handleConfirm = async () => {
        if (!password) return toast.error("Enter your password");

        try {
            setLoading(true);
            toast.info("Decrypting wallet...");
            const decrypted = await decryptWallet(walletData.encryptedJson, password);

            toast.info("Broadcasting transaction...");
            const tx = await sendTransaction(network, decrypted, txData.to, txData.amount);
            setTxHash(tx.hash);
            toast.success("Transaction sent!");
            setTimeout(() => setStep("dashboard"), 3500);
        } catch (err) {
            console.error(err);
            toast.error("Transaction failed. Check password and balance.");
        } finally {
            setLoading(false);
        }
    };

    if (txHash) {
        const explorerUrl = getExplorerTxUrl(network, txHash);
        return (
            <>
                <div style={{ textAlign: "center", padding: "1.5rem 0 0.5rem" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.625rem" }}>✅</div>
                    <h2 style={{ marginBottom: "0.375rem" }}>Transaction Sent!</h2>
                    <p>Your transaction has been broadcast to the network</p>
                </div>
                <div className="card">
                    <div className="form-group">
                        <label>Transaction Hash</label>
                        <div
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.72rem",
                                color: "var(--text-mono)",
                                wordBreak: "break-all",
                                lineHeight: 1.65,
                                padding: "0.5rem 0",
                            }}
                        >
                            {txHash}
                        </div>
                    </div>
                    {explorerUrl && (
                        <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: "var(--accent)",
                                fontSize: "0.83rem",
                                textDecoration: "none",
                                textAlign: "center",
                            }}
                        >
                            View on Explorer →
                        </a>
                    )}
                    <button className="btn-send" onClick={() => setStep("dashboard")}>
                        Back to Dashboard
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <h2 className="page-title">Confirm Transaction</h2>
                <p className="page-subtitle">Review details before sending</p>
            </div>

            <div className="card">
                <div className="info-row">
                    <span className="info-row-label">To</span>
                    <span
                        className="info-row-value"
                        style={{ fontFamily: "var(--font-mono)", fontSize: "0.77rem" }}
                    >
                        {txData?.to.slice(0, 10)}...{txData?.to.slice(-8)}
                    </span>
                </div>
                <div className="info-row">
                    <span className="info-row-label">Amount</span>
                    <span className="info-row-value" style={{ color: "var(--accent)", fontWeight: 700 }}>
                        {txData?.amount} {net?.symbol}
                    </span>
                </div>
                <div className="info-row">
                    <span className="info-row-label">Network</span>
                    <span className="info-row-value">{net?.name}</span>
                </div>
            </div>

            <div className="card">
                <div className="form-group">
                    <label>Enter Password to Confirm</label>
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Your wallet password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                        autoFocus
                    />
                </div>

                <button className="btn-send" onClick={handleConfirm} disabled={loading}>
                    {loading ? (
                        <TailSpin height={20} width={20} color="#fff" />
                    ) : (
                        "Confirm & Send"
                    )}
                </button>

                <button
                    className="btn-ghost"
                    onClick={() => setStep("send")}
                    disabled={loading}
                >
                    Go Back
                </button>
            </div>
        </>
    );
}

export default Confirm;