import { useState } from "react";
import { ethers } from "ethers";
import { NETWORKS } from "../config/networks";
import { estimateGasFee } from "../services/transactionService";
import { toast } from "react-toastify";
import { TailSpin } from "react-loader-spinner";

function Send({ wallet, network, setStep, setTxData }) {
    const [to, setTo] = useState("");
    const [amount, setAmount] = useState("");
    const [gasEstimate, setGasEstimate] = useState(null);
    const [estimating, setEstimating] = useState(false);

    const net = NETWORKS[network];

    const isValidAddress = (addr) => {
        try {
            ethers.getAddress(addr);
            return true;
        } catch {
            return false;
        }
    };

    const handleEstimate = async () => {
        if (!to || !amount) return toast.error("Enter recipient and amount");
        if (!isValidAddress(to)) return toast.error("Invalid Ethereum address");
        if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)
            return toast.error("Enter a valid amount");

        try {
            setEstimating(true);
            const fee = await estimateGasFee(network, wallet.address, to, amount);
            const gasLimit = fee.gasLimit;
            const gasPrice = fee.gasPrice ?? fee.maxFeePerGas ?? BigInt(0);
            const totalGas = ethers.formatEther(gasLimit * gasPrice);
            setGasEstimate(parseFloat(totalGas).toFixed(8));
            toast.success("Gas estimated");
        } catch (err) {
            console.error(err);
            toast.error("Could not estimate gas");
        } finally {
            setEstimating(false);
        }
    };

    const handleNext = () => {
        if (!to || !amount) return toast.error("Fill in all fields");
        if (!isValidAddress(to)) return toast.error("Invalid address");
        if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)
            return toast.error("Enter a valid amount");

        setTxData({ to: ethers.getAddress(to), amount });
        setStep("confirm");
    };

    return (
        <>
            <div className="page-header">
                <h2 className="page-title">Send {net?.symbol}</h2>
                <p className="page-subtitle">Transfer funds to another address</p>
            </div>

            <div className="card">
                <div className="form-group">
                    <label>Recipient Address</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="0x..."
                        value={to}
                        onChange={(e) => setTo(e.target.value.trim())}
                        style={{
                            fontFamily: to ? "var(--font-mono)" : "inherit",
                            fontSize: to ? "0.8rem" : "0.93rem",
                        }}
                    />
                </div>

                <div className="form-group">
                    <label>Amount ({net?.symbol})</label>
                    <input
                        type="number"
                        className="form-control"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        step="0.0001"
                    />
                </div>

                {gasEstimate && (
                    <div className="gas-row">
                        <span>Estimated Gas</span>
                        <span>
                            {gasEstimate} {net?.symbol}
                        </span>
                    </div>
                )}

                <button
                    className="btn-ghost"
                    onClick={handleEstimate}
                    disabled={estimating}
                >
                    {estimating ? (
                        <TailSpin height={18} width={18} color="#f6851b" />
                    ) : (
                        "Estimate Gas"
                    )}
                </button>

                <button className="btn-send" onClick={handleNext}>
                    Review Transaction
                </button>
            </div>

            <button
                className="btn-ghost"
                style={{ marginTop: "0.25rem" }}
                onClick={() => setStep("dashboard")}
            >
                Cancel
            </button>
        </>
    );
}

export default Send;