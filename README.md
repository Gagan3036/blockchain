# 🪪 Aetheris // Decentralized ID (DID) Passport

> **Sovereign On-Chain Identity, Verifiable Credentials & Digital Travel Visas on Ethereum**

[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.21-363636?logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Truffle Suite](https://img.shields.io/badge/Truffle-v5.11.5-5E464D?logo=truffle&logoColor=white)](https://trufflesuite.com/)
[![Web3.js](https://img.shields.io/badge/Web3.js-v1.10.0-F16822?logo=javascript&logoColor=white)](https://web3js.readthedocs.io/)
[![Ganache](https://img.shields.io/badge/Ganache-Port%207545-E4A663?logo=ethereum&logoColor=white)](https://trufflesuite.com/ganache/)
[![Standards](https://img.shields.io/badge/Standards-W3C%20DID%20%7C%20VC%20%7C%20ICAO%209303-00C9A7)](https://www.w3.org/TR/did-core/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Overview

**Aetheris DID Passport** is an enterprise-grade, self-sovereign identity (SSI) and verifiable credential platform deployed on the Ethereum Virtual Machine (EVM). It replaces centralized government registries and corporate identity silos with a decentralized, privacy-preserving, and mathematically verifiable passport system.

Citizens hold complete sovereign control over their identity cards, authorities issue cryptographically sealed travel visas and KYC attestations, and third-party verifiers (border checkpoints, embassies, age-restricted services) can instantly audit identity status without compromising user privacy.

---

## ✨ Key Highlights

- **🪪 3D Interactive Holographic Passport Card**: Dynamic spatial mouse-tracking tilt effect, cybernetic gold biometric emblem, reflective gradient shimmer wave, and real-time status indication (**ACTIVE** vs. **FROZEN**).
- **🔒 Zero-Knowledge Selective Disclosure**: Prove majority (age 18+) mathematically on-chain without disclosing your birth date, birth year, or legal identity.
- **✈️ Verifiable Travel Visas & Credentials**: Multi-authority issuance and revocation of travel permits (Schengen Border Pass, Web3 Global Nomad Residency, KYC Tier 2, Proof of Humanity, VIP Summit Passes).
- **🚨 Citizen Emergency Freeze**: In case of private key compromise, holders can immediately freeze their identity card directly on-chain, rendering all verification attempts invalid.
- **📜 Standards Compliant**:
  - **W3C DID Core 1.0**: Generates standard decentralized identifier strings (`did:ethr:<address>`) and exports complete JSON-LD DID Documents.
  - **W3C Verifiable Credentials (VC)**: Cryptographically verifiable presentation payloads.
  - **ICAO Doc 9303 (MRZ)**: 2-line international Machine Readable Zone bar for border terminal scanner compatibility.
- **🔍 Universal Verifier Terminal**: Public audit desk for immigration officers and services to inspect any wallet address or DID with full credential provenance.
- **⚡ Zero-Build Client**: High-performance, lightweight pure HTML5/CSS3/JavaScript frontend with an offline pure JS SVG QR code engine and native Ganache multi-wallet switcher.

---

## 🏛️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                              PRESENTATION LAYER                                   |
|  - 3D Holographic Digital Passport Card (Spatial CSS Tilt & Shimmer Wave Matrix)  |
|  - Offline SVG QR Code Engine & ICAO Doc 9303 MRZ Formatter                       |
|  - 6 Modular Portals: Passport, Visa Book, Privacy, Register, Terminal, Verifier  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (HTTP / Web3.js v1.10.0)
+-----------------------------------------------------------------------------------+
|                            CLIENT & MIDDLEWARE LAYER                              |
|  - Multi-Provider Adapter (MetaMask Bridge & Direct Ganache RPC on Port 7545)     |
|  - 10-Account Persona Switcher with Role Badges (Admin, Authority, Citizen)       |
|  - Contract ABI Artifact Resolver (`build/contracts/DIDPassport.json`)            |
|  - W3C DID Document & Verifiable Presentation (VP) Formatter Engine               |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (JSON-RPC 2.0 on Port 7545)
+-----------------------------------------------------------------------------------+
|                            BLOCKCHAIN NODE LAYER                                  |
|  - Local Ganache EVM Node (Chain ID: 1337 / Network ID: 5777)                     |
|  - 10 Pre-funded Accounts (1,000 ETH each)                                        |
|  - Deterministic Gas Metering, Event Logging & State Storage                      |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (EVM Bytecode Execution)
+-----------------------------------------------------------------------------------+
|                            SMART CONTRACT LAYER                                   |
|  - `DIDPassport.sol` (Solidity ^0.8.21)                                           |
|    * Sovereign Identity Registry (Name, Nationality, DOB, MRZ, 10-Year Expiry)    |
|    * Multi-Authority Role-Based Access Control (RBAC) Whitelist                   |
|    * Verifiable Credentials & Visa Stamp Registry (Keccak256 Hashed IDs)          |
|    * Emergency Freeze & Suspension Mechanism (`togglePassportStatus`)             |
|    * Selective Disclosure Age Verifier (`isAdult`)                                |
|    * Fast Verification Engine (`verifyPassport`)                                  |
+-----------------------------------------------------------------------------------+
```

---

## 🧭 Navigation & Portal Modules

| Tab | Feature | Description |
|---|---|---|
| 🪪 **My Passport** | **Sovereign ID Card** | Interactive 3D holographic card with QR code, MRZ bar, validity countdown, W3C DID document modal, and emergency freeze trigger. |
| ✈️ **Visa & Stamp Book** | **Credential Booklet** | Displays all active and historical visas, residency permits, and KYC stamps with issuer signatures and revocation seals. |
| 🛡️ **Selective Disclosure** | **Privacy Token Generator** | Allows citizens to disclose specific attributes (e.g. proof of majority, status, nationality) without exposing raw PII. |
| ✍️ **Register / Update** | **Identity Minting** | Mint a new on-chain passport with live 3D card preview as you type, or update avatar and legal profile details. |
| 🏛️ **Issuer Terminal** | **Border Control Hub** | Authorize new embassies/agencies and issue or revoke signed visa credentials for citizen wallets. |
| 🔍 **Universal Verifier** | **Immigration Audit** | Public verification portal for any wallet address or DID, returning validity status, age check, and credential dossier. |

---

## 👥 Pre-Configured Personas (Local Testnet)

The client features a native wallet selector connected to Ganache, allowing instant switching between predefined roles:

| Account | Role | Name | Capabilities |
|---|---|---|---|
| **Account 0** | **Genesis Authority (Admin)** | Aria Vance | Contract owner; manages authorized authorities, holds active passport with 3 travel visas. |
| **Account 1** | **Authorized Border Authority** | Global Digital Border Agency | Authorized issuer capable of stamping visas and KYC attestations onto citizen passports. |
| **Account 2** | **Citizen / Passport Holder** | Marcus Chen | Registered citizen holding an active passport and a Devcon Diplomatic Pass. |
| **Accounts 3–9** | **Unregistered Citizens** | *Available for Minting* | Fresh wallets ready for testing new passport registration and end-to-end user journeys. |

---

## 🚀 Quick Start Guide

### 1. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher (Recommended: `v20.x` or `v22.x`)
- **Truffle Suite**: `v5.11.5` (`npm install -g truffle` or use `npx truffle`)
- **Ganache**: CLI or GUI (`npm install -g ganache` or use `npx ganache`)
- **Python**: `3.x` (for lightweight HTTP static server)

---

### 2. Start the Local EVM Blockchain (Ganache)

Launch Ganache on port `7545` with network ID `5777`:

```bash
npx ganache --port 7545 --chain.networkId 5777 --wallet.totalAccounts 10
```

> 💡 **Keep this terminal window open.** It maintains the local blockchain state and keystores.

---

### 3. Compile & Deploy Smart Contracts

In a new terminal window, navigate to the project directory:

```bash
# Compile Solidity contracts
npx truffle compile --all

# Deploy to local development network
npx truffle migrate --reset --network development
```

This compiles `DIDPassport.sol` and deploys it to the local Ganache network, registering **Account 0** as the Genesis Authority and **Account 1** as an authorized border agency.

---

### 4. Run Automated Test Suite

Execute the 13 automated unit tests verifying authorization, passport lifecycle, verifiable credentials, selective disclosure, and border verification:

```bash
npx truffle test --network development
```

**Expected output:**
```
  Contract: DIDPassport
    Initialization & Authorization
      ✔ should set deployer as owner and default authorized authority
      ✔ should allow admin to authorize a new issuer
      ✔ should prevent non-admin from adding issuers
    Passport Registration & Lifecycle
      ✔ should register a new DID passport for citizen1
      ✔ should prevent duplicate registration for the same wallet
      ✔ should allow holder to update their profile info
      ✔ should allow holder to freeze and unfreeze their passport
    Verifiable Credentials (Visas & Stamps)
      ✔ should allow authorized authority to issue a travel visa / credential
      ✔ should prevent unauthorized entities from issuing credentials
      ✔ should allow issuer to revoke a credential
      ✔ should prevent unauthorized users from revoking credentials
    Selective Disclosure & Fast Verification
      ✔ should verify adult status without revealing DOB
      ✔ should run fast verification check for third-party verifiers

  13 passing (2s)
```

---

### 5. Seed Demo Personas & Visas (Recommended)

Seed the blockchain with realistic identity records and travel visas for quick demonstration:

```bash
npx truffle exec seed_demo.js --network development
```

This provisions passports for **Aria Vance** (Account 0) and **Marcus Chen** (Account 2), along with European Schengen, Web3 Nomad, and KYC Tier 2 visas.

---

### 6. Launch the Web Client

Serve the frontend client using Python's built-in HTTP server:

```bash
python -m http.server 3000 --directory client
```

Now open your web browser and navigate to:
👉 **[http://localhost:3000/index.html](http://localhost:3000/index.html)**

---

## 🧪 Hands-On End-to-End Walkthrough

Follow this 5-step scenario to experience the full multi-persona workflow:

```
[ Step 1: Citizen ] ──── Mint Passport (Account 3)
         │
[ Step 2: Authority ] ── Stamp Global Nomad Visa onto Account 3 (Account 1)
         │
[ Step 3: Citizen ] ──── View Stamped Visa in Stamp Book (Account 3)
         │
[ Step 4: Citizen ] ──── Test Emergency Freeze (Account 3)
         │
[ Step 5: Verifier ] ─── Audit Frozen vs. Active Status in Universal Verifier
```

1. **Mint Identity**: Switch to **Account 3** in the top-right wallet dropdown. Go to **Register / Update**, fill in name/nationality/birthdate, and click **✨ Mint Passport On-Chain**.
2. **Issue Visa**: Switch to **Account 1** (*Global Digital Border Agency*). Go to **Issuer Terminal**, select Account 3, choose **Web3 Global Nomad Residency**, and click **✈️ Issue & Sign On-Chain Visa Stamp**.
3. **Inspect Visa**: Switch back to **Account 3** and click **Visa & Stamp Book** to view the newly minted cryptographic visa stamp.
4. **Emergency Freeze**: In **My Passport**, click **🔒 Emergency Freeze Identity**. Notice the card turns red (**FROZEN**).
5. **Border Audit**: Open **Universal Verifier** and click **Verify Connected Wallet**. Observe the system detect the suspension: `⚠ PASSPORT SUSPENDED / FROZEN`.

---

## 📂 Project Structure

```
blockchain/
├── contracts/
│   └── DIDPassport.sol            # Core EVM smart contract (Identity, Credentials, MRZ, Privacy)
├── migrations/
│   └── 1_deploy_did_passport.js   # Truffle migration & authority initialization
├── test/
│   └── did_passport_test.js       # Comprehensive unit test suite (13 test specs)
├── client/
│   ├── index.html                 # Semantic Web3 frontend with 6 navigation tabs
│   ├── style.css                  # Cyberpunk design system, 3D card tilt & holographic shimmer
│   ├── app.js                     # Web3 controller, offline QR generator, MRZ & DID formatter
│   └── DIDPassport.json           # Contract ABI and deployed network addresses
├── Docs/
│   ├── ARCHITECTURE_AND_SETUP.md  # Deep technical architecture and internal execution mechanics
│   └── HOW_TO_USE.md              # Detailed end-user manual, personas, and feature guides
├── seed_demo.js                   # Truffle script to seed demo identities and visas
├── truffle-config.js              # Truffle compiler (Solidity 0.8.21) and network config
└── README.md                      # Project landing page and documentation hub
```

---

## 📜 Standards & Cryptographic Specifications

### W3C DID Core 1.0 Compliance
Passports are automatically resolved into valid W3C DID Documents:
```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "did:ethr:0x4f1049e551fbd3606643b6058f652ef199692498",
  "verificationMethod": [
    {
      "id": "did:ethr:0x4f1049e551fbd3606643b6058f652ef199692498#controller",
      "type": "EcdsaSecp256k1RecoveryMethod2020",
      "controller": "did:ethr:0x4f1049e551fbd3606643b6058f652ef199692498",
      "blockchainAccountId": "eip155:1337:0x4f1049e551fbd3606643b6058f652ef199692498"
    }
  ],
  "authentication": ["did:ethr:0x4f1049e551fbd3606643b6058f652ef199692498#controller"],
  "assertionMethod": ["did:ethr:0x4f1049e551fbd3606643b6058f652ef199692498#controller"]
}
```

### ICAO Doc 9303 MRZ Formatting
Generates standardized 2-line machine-readable zone data:
```
P<UTOESTONIA<<ARIA<VANCE<<<<<<<<<<<<<<<<<<<<<
P-78X921K1UTO9608144F3409141<<<<<<<<<<<<<<06
```

---

## 📚 Detailed Documentation

For advanced system architecture, data flow diagrams, and full operational instructions, explore the dedicated guides in [`Docs/`](file:///d:/Documents/playground/js/blockchain/Docs):
- [Architecture & Setup Technical Guide](file:///d:/Documents/playground/js/blockchain/Docs/ARCHITECTURE_AND_SETUP.md)
- [User Guide & Operation Manual](file:///d:/Documents/playground/js/blockchain/Docs/HOW_TO_USE.md)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
