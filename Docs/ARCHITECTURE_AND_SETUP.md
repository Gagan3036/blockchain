# System Architecture & Technical Execution Guide

**Project:** Aetheris Decentralized ID (DID) Passport  
**Repository:** `d:/Documents/playground/js/blockchain`  
**Standard Compliance:** W3C DID Core 1.0, W3C Verifiable Credentials (VC), ICAO Doc 9303 (MRZ)

---

## 1. High-Level Architecture Overview

The Decentralized ID (DID) Passport system replaces centralized identity providers (government databases, corporate identity silos) with a self-sovereign identity (SSI) model deployed directly on the Ethereum Virtual Machine (EVM).

```
+-----------------------------------------------------------------------------------+
|                              PRESENTATION LAYER                                   |
|  - 3D Holographic Digital Passport Card (Perspective CSS & Shimmer Matrix)        |
|  - Offline SVG QR Code Engine & ICAO Doc 9303 MRZ Formatter                       |
|  - Tab Portals: Passport, Visa Booklet, Selective Proofs, Issuer Terminal, Audit  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (HTTP / Web3.js v1.10.0)
+-----------------------------------------------------------------------------------+
|                            CLIENT & MIDDLEWARE LAYER                              |
|  - Web3 Provider Engine (MetaMask / Local Ganache RPC Bridge)                     |
|  - JSON-RPC 2.0 Client Interface                                                 |
|  - Contract ABI Artifact Resolver (`build/contracts/DIDPassport.json`)            |
|  - W3C DID Document & Verifiable Presentation (VP) Formatter Engine               |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (JSON-RPC on Port 7545)
+-----------------------------------------------------------------------------------+
|                            BLOCKCHAIN NODE LAYER                                  |
|  - Local Ganache EVM Node (Chain ID: 1337 / Network ID: 5777)                     |
|  - State Database & Account Keystores (10 Pre-funded Accounts with 1000 ETH each)  |
|  - Block Mining, Gas Metering, & Event Log Indexing                               |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (EVM Bytecode Execution)
+-----------------------------------------------------------------------------------+
|                            SMART CONTRACT LAYER                                   |
|  - `DIDPassport.sol` (Solidity ^0.8.20 / 0.8.21)                                  |
|    * Identity Registry (Name, Nationality, DOB, MRZ, 10-Year Expiry)              |
|    * Verifiable Credentials & Visa Stamp Registry (Multi-Authority Issuance)      |
|    * Emergency Freeze & Suspension Mechanism                                      |
|    * Privacy-Preserving Selective Disclosure (`isAdult` verification)             |
|    * Fast Verifier Engine (`verifyPassport`)                                      |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Details & Internal Mechanics

### 2.1 Smart Contract Layer (`DIDPassport.sol`)

The core business logic runs on-chain with zero off-chain dependencies for identity validation:

```solidity
struct Passport {
    string did;                  // "did:ethr:<address>"
    address holder;              // Ethereum account owning this sovereign ID
    string fullName;             // Full Legal / Sovereign Name
    string nationality;          // Jurisdiction / Territory
    uint256 dateOfBirth;         // UNIX timestamp in seconds
    string passportNumber;       // Unique generated alphanumeric ID (e.g., P-78X921K)
    string avatarUrl;            // IPFS CID or high-resolution photo URL
    uint256 issuedAt;            // Registration timestamp
    uint256 expiresAt;           // Timestamp (10 years from issuance)
    bool isActive;               // Emergency freeze switch
    bool exists;                 // Registration verification flag
    bytes32[] credentialIds;     // Array of issued visa/credential hashes
}
```

#### Key State Mappings:
- `mapping(address => Passport) private passports`: Maps wallet addresses to their sovereign identity record.
- `mapping(bytes32 => Credential) public credentials`: Stores issued travel visas and identity attestations keyed by their unique cryptographic ID (`keccak256(subject, issuer, type, timestamp, nonce)`).
- `mapping(address => bool) public authorizedIssuers`: Role-based access control (RBAC) whitelist designating which authority addresses can issue or sign travel visas and KYC attestations.
- `mapping(address => string) public issuerNames`: Human-readable agency designations (e.g., "Global Digital Border & Visa Agency").

#### Internal Lifecycle Flows:

1. **Identity Minting (`registerPassport`)**:
   - Reverts if caller already possesses a registered identity (`!passports[msg.sender].exists`).
   - Generates the standard DID identifier: `did:ethr:<address>`.
   - Computes a deterministic pseudo-unique passport number using `keccak256(holder, timestamp, prevrandao)`.
   - Sets validity period to exactly 10 years (`block.timestamp + 3650 days`).
   - Emits `PassportRegistered` event.

2. **Credential Issuance (`issueCredential`)**:
   - Caller must pass `onlyAuthorizedIssuer` modifier (`authorizedIssuers[msg.sender] || msg.sender == owner`).
   - Target subject must possess an existing registered passport.
   - Computes immutable unique `credId` and links it to both subject's global record and passport card.
   - Emits `CredentialIssued` event.

3. **Emergency Freezing (`togglePassportStatus`)**:
   - Restricted to `onlyPassportHolder` (`msg.sender`).
   - If private keys are exposed or a device is lost, the citizen can freeze the passport on-chain. Suspended passports immediately fail all verification checks (`verifyPassport` returns `isValid: false, isSuspended: true`).

4. **Zero-Knowledge Selective Disclosure (`isAdult`)**:
   - Verifies whether `block.timestamp >= dateOfBirth + 568029600` (18 years in seconds).
   - Allows verifiers (bars, voting systems, restricted border gates) to confirm adult status with 100% mathematical certainty without ever accessing the citizen's actual date or year of birth.

---

### 2.2 Client-Side Architecture (`client/`)

The client runs as a zero-build, high-performance Web3 application:

- **`index.html`**: Semantic HTML5 layout with modular tab navigation, SVG icons, and reactive form cards.
- **`style.css`**: Vanilla CSS design system:
  - Custom 3D perspective wrapper (`perspective: 1200px`) enabling realistic spatial tilting.
  - Holographic shimmer layer using continuous diagonal gradient animation (`holographicWave`).
  - Dark-mode glassmorphism panels with 20px backdrop blur.
  - Authentic visa stamp styling with weathered dashed border seals and rotated revocation watermarks.
- **`app.js`**:
  - **Dynamic Multi-Provider**: Automatically detects MetaMask if installed, or smoothly connects directly to the local Ganache RPC (`http://127.0.0.1:7545`).
  - **Account Selector**: Auto-detects all 10 Ganache accounts and allows one-click switching between Admin, Border Authorities, and Citizens.
  - **Offline QR Matrix Generator**: Generates SVG QR codes in pure JavaScript without external CDN requests.
  - **ICAO Doc 9303 MRZ Generator**: Generates standard 2-line Machine Readable Zone data for border scanner compatibility.
  - **W3C DID Document Exporter**: Serializes live on-chain identity into W3C DID Core 1.0 JSON-LD format with cryptographic assertion methods.

---

## 3. How This Runs Internally (Data Flow Diagram)

```
[ Citizen Wallet ]             [ Client App ]             [ EVM Contract ]             [ Verifier ]
       │                              │                          │                           │
       │── 1. Mint Passport ─────────>│                          │                           │
       │   (Name, Nat, DOB, Photo)    │── 2. eth_sendTransaction>│                           │
       │                              │      registerPassport()  │                           │
       │                              │                          │── 3. Store Identity       │
       │                              │                          │      Generate DID & No.   │
       │                              │<── 4. Tx Receipt ────────│                           │
       │<── 5. Holographic Card ──────│                          │                           │
       │                              │                          │                           │
[ Border Authority ]                  │                          │                           │
       │── 6. Issue Schengen Visa ───>│                          │                           │
       │                              │── 7. eth_sendTransaction>│                           │
       │                              │      issueCredential()   │                           │
       │                              │                          │── 8. Hash & Store Stamp   │
       │                              │<── 9. Tx Receipt ────────│                           │
       │                              │                          │                           │
       │                              │                          │── 10. Audit DID Query ───>│
       │                              │                          │       verifyPassport()    │
       │                              │                          │<── 11. Valid / Stamped ───│
```

---

## 4. How to Run This Project (Step-by-Step)

### 4.1 Prerequisites
Ensure the following tools are installed:
- **Node.js**: `v18.0.0` or higher (Recommended: `v20` or `v22`)
- **Truffle Suite**: `v5.11.5` (or install globally: `npm install -g truffle`)
- **Python**: `3.x` (for lightweight HTTP serving)

---

### 4.2 Start the Local Blockchain (Ganache)
Run Ganache on port `7545` with 10 pre-funded accounts and network ID `5777`:

```powershell
npx ganache --port 7545 --chain.networkId 5777 --wallet.totalAccounts 10
```

> Keep this terminal window open. You will see 10 available accounts with 1,000 ETH each.

---

### 4.3 Compile & Deploy Smart Contracts
Open a second terminal in the project root (`d:\Documents\playground\js\blockchain`):

```powershell
# 1. Compile the Solidity contracts
npx truffle compile --all

# 2. Deploy contracts to the local network
npx truffle migrate --reset --network development
```

Upon completion, Truffle will output the deployed contract address (e.g. `0x4F1049e551FbD3606643B6058f652eF199692498`) and authorize Account 1 as the secondary border authority.

---

### 4.4 Run the Automated Test Suite
To verify contract integrity across all 13 security and logic assertions:

```powershell
npx truffle test --network development
```

**Expected output:**
```
  Contract: DIDPassport
    Initialization & Authorization
      √ should set deployer as owner and default authorized authority
      √ should allow admin to authorize a new issuer
      √ should prevent non-admin from adding issuers
    Passport Registration & Lifecycle
      √ should register a new DID passport for citizen1
      √ should prevent duplicate registration for the same wallet
      √ should allow holder to update their profile info
      √ should allow holder to freeze and unfreeze their passport
    Verifiable Credentials (Visas & Stamps)
      √ should allow authorized authority to issue a travel visa / credential
      √ should prevent unauthorized entities from issuing credentials
      √ should allow issuer to revoke a credential
      √ should prevent unauthorized users from revoking credentials
    Selective Disclosure & Fast Verification
      √ should verify adult status without revealing DOB
      √ should run fast verification check for third-party verifiers

  13 passing (2s)
```

---

### 4.5 Seed Demo Identities & Visas (Optional but Recommended)
Populate the contract with realistic identity records and travel visas for quick demonstration:

```powershell
npx truffle exec seed_demo.js --network development
```

This registers passports for **Account 0** and **Account 2**, and stamps 3 visas (Schengen Border Pass, Web3 Nomad Residency, KYC Tier 2).

---

### 4.6 Launch the Web Client
Start the static web server serving the `client/` directory:

```powershell
python -m http.server 3000 --directory client
```

Now open your browser and navigate to:
👉 **`http://localhost:3000/index.html`**

---

## 5. File & Directory Reference

| Path | Purpose |
|---|---|
| [`contracts/DIDPassport.sol`](file:///d:/Documents/playground/js/blockchain/contracts/DIDPassport.sol) | Core EVM smart contract (Identity, Credentials, MRZ, Selective Disclosure) |
| [`migrations/1_deploy_did_passport.js`](file:///d:/Documents/playground/js/blockchain/migrations/1_deploy_did_passport.js) | Truffle deployment script and default authority configuration |
| [`test/did_passport_test.js`](file:///d:/Documents/playground/js/blockchain/test/did_passport_test.js) | Complete automated test suite (13 unit test cases) |
| [`seed_demo.js`](file:///d:/Documents/playground/js/blockchain/seed_demo.js) | Truffle execution script to seed realistic demo passports and visas |
| [`client/index.html`](file:///d:/Documents/playground/js/blockchain/client/index.html) | Semantic Web3 portal markup with 6 modular tabs |
| [`client/style.css`](file:///d:/Documents/playground/js/blockchain/client/style.css) | Cyberpunk holographic design system, 3D card tilt, and glassmorphism |
| [`client/app.js`](file:///d:/Documents/playground/js/blockchain/client/app.js) | Web3 client controller, QR generator, MRZ engine, and contract caller |
| [`client/DIDPassport.json`](file:///d:/Documents/playground/js/blockchain/client/DIDPassport.json) | Compiled contract ABI and network address artifact for the frontend |
| [`truffle-config.js`](file:///d:/Documents/playground/js/blockchain/truffle-config.js) | Network and compiler configuration (`solc: 0.8.21`) |
