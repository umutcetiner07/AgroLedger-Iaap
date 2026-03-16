AgroLedger-IaaP (Irrigation as a Partner)
🚀 Project Overview
AgroLedger-IaaP is a next-generation agricultural intelligence platform specifically engineered to transform the Kazakhstan farming landscape through data-driven irrigation management. By merging satellite-based phenology data with a transparent financial ledger system, we turn water conservation into a measurable asset, empowering farmers to optimize resources while securing their financial future.

✨ Core Features
Water Needs Baseline (WNB): A proprietary hybrid engine that calculates precise irrigation requirements by cross-referencing real-time soil data with historical climate patterns.

Field Health Score (FHS): Advanced monitoring using phenology-aware NDVI (Normalized Difference Vegetation Index) and Radar weighting to provide a holistic view of crop vitality.

Shadow Mode: A unique "Safety-First" AI implementation. The system runs autonomous decisions in the background, testing and refining logic until a 75% accuracy threshold is consistently met before taking control.

AgroLedger: A specialized financial ledger system that tracks water savings and converts efficiency gains into verifiable financial data for potential incentives or credit assessments.

🛠 Tech Stack
Framework: Next.js 14 (App Router)

Language: TypeScript

Database: PostgreSQL (Hosted on Neon)

ORM: Prisma

Deployment: Vercel

⚙️ Installation
To set up the project locally, follow these steps:

Clone the repository:

Bash
git clone https://github.com/umutcetiner07/AgroLedger-Iaap
cd AgroLedger-Iaap
Install dependencies:

Bash
npm install
Database setup:
Ensure your .env file is configured with your DATABASE_URL.

Bash
npx prisma generate
npx prisma db push
Run the development server:

Bash
npm run dev
🌐 Live Demo & Credentials
Experience the platform live at: https://agro-ledger-iaap.vercel.app

Demo Account Access:

Email: super@iaap.kz

Password: demo1234

🗺 Roadmap
Phase 1: Foundation (Current) - Deployment of v0.3.0-alpha, WNB engine stabilization, and core UI dashboard.

Phase 2: Pilot Launch - Field testing and data calibration within the Almaty pilot region.

Phase 3: AI Refinement - Enhancing Shadow Mode algorithms and achieving the 75% accuracy benchmark for autonomous suggestions.

Phase 4: Financial Integration - Expansion of the AgroLedger module for B2B partnerships with Kazakhstan's agricultural banks.

👥 Developer
Umut Cetiner
Passionate about Agro-Tech, AI, and Sustainable Energy Solutions.

Note: This project is currently in v0.3.0-alpha. It is a work in progress aimed at revolutionizing sustainable agriculture in Central Asia.
