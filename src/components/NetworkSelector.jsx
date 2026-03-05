import { NETWORKS } from "../config/networks";
import { saveSelectedNetwork } from "../services/storageService";

function NetworkSelector({ setNetwork }) {
    const handleChange = (e) => {
        saveSelectedNetwork(e.target.value);
        setNetwork(e.target.value);
    };

    return (
        <select onChange={handleChange}>
            {Object.keys(NETWORKS).map((key) => (
                <option key={key} value={key}>
                    {NETWORKS[key].name}
                </option>
            ))}
        </select>
    );
}

export default NetworkSelector;