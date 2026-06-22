# NetScope Landing Page Website 📡

A premium, interactive, and high-performance single-page landing page website for the **NetScope** cellular telemetry mobile application.

---

## 🌟 Key Features of the App

- **Real-Time RF Telemetry**: Monitor active serving cellular parameters (RSRP, RSRQ, SINR, PCI, Carrier, and network technology type) dynamically.
- **Background Logging**: Persistent logger continues writing CSV records securely even if the screen turns off or the application is sent to the background.
- **Live Route Mapping**: Plot signal telemetry points along geographic paths with color-coded quality states (Excellent, Good, Poor) for route testing.
- **Network Benchmarking**: Run speed, latency, jitter, and packet loss tests correlated with physical cell telemetry at specific coordinates.
- **Data Export & Cloud Sync**: Save sessions locally as standard CSV sheets or sync automatically to your secure remote Supabase database.

---

## 🚀 How to Test Locally

1. **Launch a Local Server**:
   Since the site contains native JavaScript modules and elements, double-clicking `index.html` works, but it is best run on a local development server. You can run one from VS Code (Live Server extension) or via terminal if you have Node.js installed:
   ```bash
   npx serve .
   ```
2. Open your browser and navigate to the address shown (usually `http://localhost:3000`).
