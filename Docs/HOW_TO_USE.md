# Aetheris DID Passport: User Guide & Operation Manual

Welcome to **Aetheris Decentralized ID (DID) Passport**, a sovereign digital identity and verifiable credentials platform built on Ethereum.

This guide walks you through navigating the application, switching roles, issuing travel visas, generating zero-knowledge privacy proofs, and performing identity audits.

---

## 1. Quick Access & Role Setup

### Accessing the Web Application
Open your web browser and navigate to:
👉 **`http://localhost:3000/index.html`**

### Understanding Pre-Configured Personas
In the top right corner of the header, the **Wallet Selector** allows instant switching between different network accounts without needing MetaMask:

| Account | Role | Designated Name | Description |
|---|---|---|---|
| **Account 0** | **Genesis Authority (Admin)** | Aria Vance | Contract owner; possesses full administrative power, an active passport, and 3 travel stamps. |
| **Account 1** | **Authorized Border Authority** | Global Digital Border Agency | Authorized issuer capable of stamping visas and KYC attestations onto citizen passports. |
| **Account 2** | **Citizen / Passport Holder** | Marcus Chen | Registered citizen possessing an active passport and a Devcon Diplomatic Pass. |
| **Accounts 3–9** | **Unregistered Citizens** | *Available for Minting* | Fresh wallets ready for testing new passport creation. |

> **MetaMask Users:** If you have MetaMask installed, you can also connect and sign transactions directly through your browser extension.

---

## 2. Tour of the 6 Navigation Tabs

```
[ 🪪 My Passport ] [ ✈️ Visa & Stamp Book ] [ 🛡️ Selective Disclosure ] [ ✍️ Register / Update ] [ 🏛️ Issuer Terminal ] [ 🔍 Universal Verifier ]
```

---

### Tab 1: 🪪 My Passport

This tab displays your sovereign on-chain identity credentials.

#### Features & Controls:
1. **Interactive 3D Holographic Card**:
   - **Tilt Effect**: Move your mouse over the card to tilt it in real-time 3D perspective.
   - **Holographic Shimmer**: A dynamic light-reflective wave sweeps across the surface.
   - **Biometric Chip**: Represents on-chain EVM cryptographic key attestation.
   - **Status Badge**: Displays **ACTIVE** (emerald) or **FROZEN** (crimson).
   - **Dynamic QR Code**: Encodes your on-chain DID string (`did:ethr:<address>`).
   - **ICAO Doc 9303 MRZ Bar**: 2-line machine-readable zone at the bottom, compatible with international border scanners.

2. **Metrics Dashboard**:
   - **Identity Status**: Active vs. Suspended.
   - **Visas & Credentials**: Total count of active stamped attestations.
   - **Age Verification**: Indicates if the smart contract verifies you as an adult (18+).
   - **Passport Validity**: 10-year validity countdown.

3. **Action Buttons**:
   - **🔒 Emergency Freeze Identity**: Instantly freeze your identity if your private keys are compromised. (Clicking it again reactivates the passport).
   - **📜 View W3C DID Document**: Displays the full W3C-compliant JSON-LD document representing your decentralized identifier, verification methods, and public keys.
   - **🔐 Generate Selective Proof**: Jumps to the Privacy tab to create zero-knowledge presentation tokens.

---

### Tab 2: ✈️ Visa & Stamp Book

Displays all cryptographic travel stamps, residency permits, and KYC attestations stamped onto your passport.

#### Stamp Types & Badges:
- 🇪🇺 **Schengen Digital Border Pass**: 90-day European digital border entry pass.
- 🌐 **Web3 Global Nomad Residency**: 1-year residency attestation for digital borders.
- ✓ **KYC Tier 2 Identity Verification**: 2-year biometric identity attestation.
- 👤 **Proof of Humanity Sovereign Seal**: Lifetime Sybil-resistance credential.
- ★ **Devcon Global Diplomatic Pass**: VIP diplomatic summit entry pass.

> **Revocation Indicator:** If a visa is cancelled or revoked by border control, a prominent red **`REVOKED`** seal is stamped across the card, and it is excluded from valid credential counts.

---

### Tab 3: 🛡️ Selective Disclosure & Privacy

Allows you to generate verifiable presentation tokens for third-party verifiers **without revealing sensitive personal data**.

#### Available Disclosure Toggles:
- **Proof of Majority (Age $\ge$ 18)**: Proves you are an adult on-chain without disclosing your birth date or birth year.
- **Proof of Active Status**: Proves your identity is valid and not suspended.
- **Disclose Sovereign Jurisdiction**: Selectively reveals your nationality while keeping your legal name and passport number hidden.
- **Include Verified Visa Credentials**: Attaches proof hashes of your travel stamps.

> Click **Copy Presentation Token** to export the signed JSON presentation for third-party verification.

---

### Tab 4: ✍️ Register / Update Identity

Allows unregistered wallets to mint a new sovereign passport, or existing holders to update their non-immutable profile data.

#### How to Mint:
1. Enter your **Full Legal Name** (e.g., `Sophia Thorne`).
2. Enter your **Nationality / Jurisdiction** (e.g., `Singapore / Global Nomad`).
3. Select your **Date of Birth** using the date picker.
4. Provide a **Photo URL** or click one of the **Quick Avatar** presets.
5. Watch the **live holographic card preview update in real-time** as you type!
6. Click **✨ Mint Passport On-Chain** to broadcast the transaction.

---

### Tab 5: 🏛️ Issuer & Border Control Terminal

Dedicated terminal for designated authorities (**Account 0** or **Account 1**) to issue and revoke travel stamps.

#### How to Issue a Visa Stamp:
1. Switch to **Account 0** or **Account 1** using the top-right wallet dropdown.
2. Under **Subject Citizen Wallet Address**, paste the citizen's address, or click one of the **Registered Citizens** quick-pick buttons.
3. Select a **Credential / Visa Preset** (e.g., *Web3 Global Nomad Residency*).
4. Review the auto-populated title, validity duration, and IPFS metadata hash.
5. Click **✈️ Issue & Sign On-Chain Visa Stamp**.
6. The credential is now permanently bound to the citizen's DID!

#### Admin Controls:
- The contract owner (Account 0) can authorize new embassies or border agencies by entering their Ethereum address and agency name under **Authority Authorization**.

---

### Tab 6: 🔍 Universal Verifier

Public audit terminal designed for immigration officers, border control gates, and third-party verifiers.

#### How to Audit an Identity:
1. Paste any Ethereum address (`0x...`) or DID (`did:ethr:0x...`) into the search bar.
   *(Tip: Click **Verify Connected Wallet** to instantly audit the current account).*
2. Click **🔍 Audit Identity**.
3. The system queries the blockchain and renders a comprehensive audit dossier:
   - **Validity Status**: `VALID SOVEREIGN PASSPORT`, `PASSPORT SUSPENDED / FROZEN`, or `NO PASSPORT REGISTERED`.
   - **Age Verification Badge**: `Age: Over 18 Verified` (computed via smart contract logic).
   - **Citizen Metadata**: Full Name, Passport Number, and Jurisdiction.
   - **Verified Visa Booklet**: A list of all active stamps with issuer signatures and revocation checks.

---

## 3. Step-by-Step Hands-On Tutorial

Try this complete end-to-end scenario to experience the full multi-persona workflow:

### Scenario: A New Citizen Mints a Passport and Receives a Visa

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

#### Step 1: Mint a New Passport
1. In the top-right dropdown, switch to **Account 3**.
2. Notice the top banner indicates **Citizen / Holder** and shows *No DID Passport Found*.
3. Click the **Register / Update** tab.
4. Enter:
   - Name: `Kai Takahashi`
   - Nationality: `Japan / Cyber Nomad`
   - Date of Birth: Pick any date before 2005 (e.g., `1998-04-12`)
   - Avatar: Click **Avatar 2**
5. Click **✨ Mint Passport On-Chain**.
6. You will see a success notification, and your newly minted holographic card will appear in the **My Passport** tab!

#### Step 2: Issue a Travel Visa to the New Citizen
1. In the top-right dropdown, switch to **Account 1** (*Global Digital Border Agency*).
2. Click on the **Issuer & Border Terminal** tab.
3. Under **Subject Citizen Wallet Address**, click on the quick-pick button for Account 3 (or copy Account 3's address).
4. Select the preset **Web3 Global Nomad Residency**.
5. Click **✈️ Issue & Sign On-Chain Visa Stamp**.

#### Step 3: Inspect the Visa as Citizen
1. Switch the wallet dropdown back to **Account 3**.
2. Click on the **Visa & Stamp Book** tab.
3. You will now see the official **Web3 Global Nomad Residency** stamp proudly displayed in your stamp booklet!

#### Step 4: Test Emergency Freeze
1. Go to the **My Passport** tab.
2. Click **🔒 Emergency Freeze Identity**.
3. Observe the card status badge turn red (**FROZEN**) and the metric card reflect **Suspended**.

#### Step 5: Verify at Immigration Desk
1. Click on the **Universal Verifier** tab.
2. Click **Verify Connected Wallet** (Account 3).
3. The audit result immediately displays a warning: **`⚠ PASSPORT SUSPENDED / FROZEN`**.
4. Go back to **My Passport**, click **🔓 Reactivate / Unfreeze Identity**, and re-run the verification: it will now display **`✓ VALID SOVEREIGN PASSPORT`**!

---

## 4. Frequently Asked Questions (FAQ)

**Q: Can a wallet register more than one passport?**  
A: No. The smart contract strictly enforces one passport per Ethereum address to prevent duplicate identity claims.

**Q: Can anyone revoke my travel visa?**  
A: No. Only the specific authority that issued the visa (or the contract administrator) has the cryptographic permission to revoke that credential.

**Q: How does age verification protect my privacy?**  
A: The contract calculates `block.timestamp >= dateOfBirth + 18 years` on-chain. When a verifier checks your age, the contract returns a simple boolean (`true` or `false`) without ever exposing your birth date or birth year.

**Q: Does this require an active internet connection?**  
A: No. The local Ganache node and the local HTTP server run entirely offline on your machine. The QR code generator and styling are completely self-contained.
