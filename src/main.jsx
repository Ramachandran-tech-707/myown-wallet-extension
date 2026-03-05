import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode double-invokes every useEffect in dev, which creates multiple
// ethers providers before the cache warms up and triggers the
// "failed to detect network" retry loop. Removing it stops that entirely.
createRoot(document.getElementById('root')).render(<App />)