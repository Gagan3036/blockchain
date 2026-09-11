let web3;
let didContract;
let account;
let allAccounts = [];
let contractOwner;
let isCurrentAuthorizedIssuer = false;
let currentPassportData = null;

// Tab Switching
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

  const targetBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => 
    b.getAttribute('onclick') && b.getAttribute('onclick').includes(tabId)
  );
  if (targetBtn) targetBtn.classList.add('active');

  const targetPane = document.getElementById(tabId);
  if (targetPane) targetPane.classList.add('active');
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `<span style="font-weight: bold;">${icon}</span><span>${message}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Interactive 3D Card Tilt Effect
function setupCardTilt() {
  const card = document.getElementById('passportCard');
  const wrapper = document.getElementById('passportCardWrapper');
  if (!card || !wrapper) return;

  wrapper.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 14;

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  wrapper.addEventListener('mouseleave', () => {
    card.style.transform = 'rotateX(0deg) rotateY(0deg)';
  });
}

// Lightweight Dynamic SVG QR Code Generator
function generateQRCodeSVG(text) {
  // Generates an SVG QR pattern based on data hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  const size = 21;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`;
  svg += `<rect width="${size}" height="${size}" fill="#ffffff"/>`;
  
  // Finder patterns at 3 corners
  function drawFinder(startX, startY) {
    let r = '';
    for (let x = 0; x < 7; x++) {
      for (let y = 0; y < 7; y++) {
        if (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)) {
          r += `<rect x="${startX + x}" y="${startY + y}" width="1" height="1" fill="#000000"/>`;
        }
      }
    }
    return r;
  }

  svg += drawFinder(0, 0);
  svg += drawFinder(size - 7, 0);
  svg += drawFinder(0, size - 7);

  // Timing lines
  for (let i = 8; i < size - 8; i += 2) {
    svg += `<rect x="${i}" y="6" width="1" height="1" fill="#000000"/>`;
    svg += `<rect x="6" y="${i}" width="1" height="1" fill="#000000"/>`;
  }

  // Deterministic data dots based on string
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if ((x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8)) continue;
      const bit = Math.abs(Math.sin(hash * (x + 1) * (y + 1))) > 0.48;
      if (bit) {
        svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="#000000"/>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

// Generate Standard Machine Readable Zone (MRZ) string
function generateMRZLines(name, passportNo, nationality, dobTimestamp, expiryTimestamp, address) {
  const cleanName = (name || "UNKNOWN").toUpperCase().replace(/[^A-Z]/g, '<');
  const nameLine = `P<W3C<<${cleanName}${'<'.repeat(44)}`.substring(0, 44);

  const cleanNo = (passportNo || "P-0000000").replace(/[^A-Z0-9]/g, '');
  const cleanNat = (nationality || "W3C").substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  
  const dob = new Date(dobTimestamp ? dobTimestamp * 1000 : Date.now());
  const dobStr = `${String(dob.getFullYear()).slice(-2)}${String(dob.getMonth() + 1).padStart(2, '0')}${String(dob.getDate()).padStart(2, '0')}`;

  const exp = new Date(expiryTimestamp ? expiryTimestamp * 1000 : Date.now() + 10 * 365 * 86400000);
  const expStr = `${String(exp.getFullYear()).slice(-2)}${String(exp.getMonth() + 1).padStart(2, '0')}${String(exp.getDate()).padStart(2, '0')}`;

  const addrChecksum = (address || "0x00").substring(2, 6).toUpperCase();
  const line2 = `${cleanNo}0${cleanNat}${dobStr}4F${expStr}0ETH${addrChecksum}${'<'.repeat(44)}`.substring(0, 44);

  return { line1: nameLine, line2: line2 };
}

// Initialize Web3 and Application
async function init() {
  try {
    if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (e) {
        console.warn("MetaMask requestAccounts ignored or rejected; checking local fallback");
      }
    } else {
      web3 = new Web3("http://127.0.0.1:7545");
      console.warn("Connected directly to local Ganache RPC at http://127.0.0.1:7545");
    }

    // Load available accounts
    allAccounts = await web3.eth.getAccounts();
    if (!allAccounts.length) {
      // Direct Ganache RPC connection test
      web3 = new Web3("http://127.0.0.1:7545");
      allAccounts = await web3.eth.getAccounts();
    }

    if (!allAccounts.length) {
      throw new Error("No Web3 / Ganache accounts found. Ensure Ganache is running on port 7545.");
    }

    account = allAccounts[0];

    // Populate Account Switcher Dropdown
    const selector = document.getElementById('accountSelector');
    selector.innerHTML = allAccounts.map((addr, idx) => {
      const short = `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
      const label = idx === 0 ? `Account 0 (Admin/Genesis)` : idx === 1 ? `Account 1 (Border Authority)` : `Account ${idx}`;
      return `<option value="${addr}">${label}: ${short}</option>`;
    }).join("");

    selector.value = account;
    selector.addEventListener('change', async (e) => {
      account = e.target.value;
      await handleAccountChanged();
    });

    // Load Smart Contract Artifact
    let response = await fetch("./DIDPassport.json").catch(() => null);
    if (!response || !response.ok) {
      response = await fetch("../build/contracts/DIDPassport.json").catch(() => null);
    }
    if (!response || !response.ok) {
      throw new Error("Could not load DIDPassport.json contract artifact.");
    }
    const contractData = await response.json();
    const networkId = await web3.eth.net.getId();
    
    // Check network deployment
    let deployedNetwork = contractData.networks[networkId];
    if (!deployedNetwork) {
      // Fallback to highest network ID available in artifact
      const keys = Object.keys(contractData.networks);
      if (keys.length > 0) {
        deployedNetwork = contractData.networks[keys[keys.length - 1]];
      }
    }

    if (!deployedNetwork) {
      throw new Error("DIDPassport contract not deployed on current network ID: " + networkId);
    }

    didContract = new web3.eth.Contract(contractData.abi, deployedNetwork.address);
    contractOwner = await didContract.methods.owner().call();

    document.getElementById('networkLabel').innerText = `Ganache // ${networkId}`;
    setupCardTilt();

    await handleAccountChanged();
    showToast("Connected to Decentralized ID (DID) Passport Registry", "success");

  } catch (error) {
    console.error("Initialization error:", error);
    showToast(`Initialization failed: ${error.message}`, "error");
    document.getElementById('networkLabel').innerText = "Connection Failed";
  }
}

// Handle Wallet / Account Switch
async function handleAccountChanged() {
  try {
    // Check if account is authorized issuer
    isCurrentAuthorizedIssuer = await didContract.methods.authorizedIssuers(account).call();
    const isOwner = (account.toLowerCase() === contractOwner.toLowerCase());

    const roleBadge = document.getElementById('roleBadge');
    if (isOwner) {
      roleBadge.innerHTML = `<span style="color: var(--cyan);">★ Genesis Authority</span>`;
      roleBadge.style.borderColor = "var(--cyan)";
    } else if (isCurrentAuthorizedIssuer) {
      const issuerName = await didContract.methods.issuerNames(account).call();
      roleBadge.innerHTML = `<span style="color: #c084fc;">🏛️ ${issuerName || 'Authorized Issuer'}</span>`;
      roleBadge.style.borderColor = "var(--purple)";
    } else {
      roleBadge.innerHTML = `<span>Citizen / Holder</span>`;
      roleBadge.style.borderColor = "var(--border-color)";
    }

    // Toggle authority warnings & sections
    const unauthorizedBanner = document.getElementById('unauthorizedIssuerBanner');
    const adminIssuerCard = document.getElementById('adminIssuerManagementCard');
    const issuerQuickLink = document.getElementById('issuerQuickLink');

    if (unauthorizedBanner) unauthorizedBanner.style.display = (isCurrentAuthorizedIssuer || isOwner) ? 'none' : 'block';
    if (adminIssuerCard) adminIssuerCard.style.display = isOwner ? 'block' : 'none';
    if (issuerQuickLink) issuerQuickLink.style.display = (isCurrentAuthorizedIssuer || isOwner) ? 'block' : 'none';

    // Populate registered citizens quick-pick for issuers
    await loadRegisteredCitizensQuickPick();

    // Load passport for this account
    await loadPassportData();
  } catch (err) {
    console.error("Account change error:", err);
  }
}

// Populate Quick Pick for Issuers
async function loadRegisteredCitizensQuickPick() {
  const container = document.getElementById('citizenPicksContainer');
  if (!container) return;

  try {
    const totalHolders = await didContract.methods.getTotalHolders().call();
    if (parseInt(totalHolders) === 0) {
      container.innerHTML = `<em style="color: var(--text-muted); font-size: 0.75rem;">No registered citizens yet.</em>`;
      return;
    }

    let html = '';
    const maxShow = Math.min(parseInt(totalHolders), 5);
    for (let i = 0; i < maxShow; i++) {
      const holderAddr = await didContract.methods.registeredHolders(i).call();
      const short = `${holderAddr.substring(0, 6)}...${holderAddr.substring(holderAddr.length - 4)}`;
      html += `<button type="button" class="btn-sm btn-secondary" onclick="document.getElementById('issueSubject').value = '${holderAddr}'">${short}</button> `;
    }
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `<em style="font-size: 0.75rem; color: var(--text-muted);">Could not fetch list</em>`;
  }
}

// Load Passport Data from Contract
async function loadPassportData() {
  try {
    const res = await didContract.methods.getPassport(account).call();
    const exists = res.exists;

    const noNotice = document.getElementById('noPassportNotice');
    const cardWrapper = document.getElementById('passportCardWrapper');
    const regFormTitle = document.getElementById('regFormTitle');
    const registerSubmitBtn = document.getElementById('registerSubmitBtn');

    if (!exists) {
      if (noNotice) noNotice.style.display = 'block';
      currentPassportData = null;
      document.getElementById('statStatus').innerText = "Unregistered";
      document.getElementById('statStatus').style.color = "var(--text-muted)";
      document.getElementById('statStampsCount').innerText = "0";
      document.getElementById('statAgeVerified').innerText = "N/A";
      document.getElementById('stampBookletList').innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
          No passport registered for this wallet. Mint your passport in the "Register / Update" tab.
        </div>`;
      
      if (regFormTitle) regFormTitle.innerText = "Mint Sovereign DID Passport";
      if (registerSubmitBtn) registerSubmitBtn.innerHTML = `<span>✨ Mint Passport On-Chain</span>`;
      return;
    }

    if (noNotice) noNotice.style.display = 'none';
    if (cardWrapper) cardWrapper.style.display = 'flex';

    if (regFormTitle) regFormTitle.innerText = "Update Identity Profile";
    if (registerSubmitBtn) registerSubmitBtn.innerHTML = `<span>💾 Update Profile On-Chain</span>`;

    currentPassportData = {
      did: res.did,
      fullName: res.fullName,
      nationality: res.nationality,
      dateOfBirth: parseInt(res.dateOfBirth),
      passportNumber: res.passportNumber,
      avatarUrl: res.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
      issuedAt: parseInt(res.issuedAt),
      expiresAt: parseInt(res.expiresAt),
      isActive: res.isActive,
      credentialCount: parseInt(res.credentialCount)
    };

    // Populate Passport Card
    document.getElementById('cardName').innerText = currentPassportData.fullName;
    document.getElementById('cardPassportNo').innerText = currentPassportData.passportNumber;
    document.getElementById('cardNationality').innerText = currentPassportData.nationality;
    document.getElementById('cardNationalityHeader').innerText = currentPassportData.nationality.toUpperCase();
    
    const dob = new Date(currentPassportData.dateOfBirth * 1000);
    document.getElementById('cardDOB').innerText = dob.toISOString().split('T')[0];

    const issued = new Date(currentPassportData.issuedAt * 1000);
    document.getElementById('cardIssued').innerText = issued.toISOString().split('T')[0];

    const expires = new Date(currentPassportData.expiresAt * 1000);
    document.getElementById('cardExpires').innerText = expires.toISOString().split('T')[0];

    document.getElementById('cardDID').innerText = currentPassportData.did;
    document.getElementById('cardAvatar').src = currentPassportData.avatarUrl;

    // Status Indicator
    const badge = document.getElementById('cardStatusBadge');
    const badgeText = document.getElementById('cardStatusText');
    const freezeBtn = document.getElementById('freezeToggleBtn');

    if (currentPassportData.isActive) {
      badge.className = 'status-indicator-badge status-active';
      badgeText.innerText = 'ACTIVE';
      if (freezeBtn) freezeBtn.innerHTML = `<span>🔒 Emergency Freeze Identity</span>`;
      document.getElementById('statStatus').innerText = "Active";
      document.getElementById('statStatus').style.color = "var(--emerald)";
    } else {
      badge.className = 'status-indicator-badge status-frozen';
      badgeText.innerText = 'FROZEN';
      if (freezeBtn) freezeBtn.innerHTML = `<span>🔓 Reactivate / Unfreeze Identity</span>`;
      document.getElementById('statStatus').innerText = "Suspended";
      document.getElementById('statStatus').style.color = "var(--crimson)";
    }

    // QR Code
    const qrContainer = document.getElementById('cardQrCode');
    qrContainer.innerHTML = generateQRCodeSVG(currentPassportData.did);

    // MRZ Lines
    const mrz = generateMRZLines(
      currentPassportData.fullName,
      currentPassportData.passportNumber,
      currentPassportData.nationality,
      currentPassportData.dateOfBirth,
      currentPassportData.expiresAt,
      account
    );
    document.getElementById('mrzLine1').innerText = mrz.line1;
    document.getElementById('mrzLine2').innerText = mrz.line2;

    // Selective disclosure check
    const isAdult = await didContract.methods.isAdult(account).call();
    document.getElementById('statAgeVerified').innerText = isAdult ? "Verified (18+)" : "Minor (<18)";
    document.getElementById('statAgeVerified').style.color = isAdult ? "var(--emerald)" : "var(--gold)";

    // Update DID Document
    updateDIDDocumentJSON();

    // Update Selective Proof Presentation
    updateSelectiveProof();

    // Load Credentials / Visas
    await loadCredentials();

  } catch (err) {
    console.error("Load passport error:", err);
  }
}

// Load Credentials / Visas for Current Account
async function loadCredentials() {
  try {
    const creds = await didContract.methods.getCredentials(account).call();
    document.getElementById('statStampsCount').innerText = creds.length;

    const booklet = document.getElementById('stampBookletList');
    if (!creds.length) {
      booklet.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; background: var(--bg-card); border-radius: 16px; border: 1px dashed var(--border-color);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">✈️</div>
          <h3 style="color: #fff; margin-bottom: 0.25rem;">No Visa Stamps Issued Yet</h3>
          <p style="color: var(--text-muted); max-width: 450px; margin: 0 auto 1rem; font-size: 0.85rem;">
            Switch to an Authorized Authority account (Account 0 or 1) to stamp a European Schengen Pass or Web3 Nomad Residency onto this identity.
          </p>
        </div>`;
      return;
    }

    let html = '';
    for (const cred of creds) {
      const isRevoked = cred.isRevoked;
      const isExpired = cred.expiresAt > 0 && (Date.now() / 1000 > parseInt(cred.expiresAt));
      
      const issueDate = new Date(parseInt(cred.issuedAt) * 1000).toISOString().split('T')[0];
      const expiryDate = parseInt(cred.expiresAt) === 0 ? "Lifetime Validity" : new Date(parseInt(cred.expiresAt) * 1000).toISOString().split('T')[0];

      // Seal icon per credential type
      let sealIcon = '🛡️';
      if (cred.credentialType.includes('VISA') || cred.credentialType.includes('SCHENGEN')) sealIcon = '🇪🇺';
      else if (cred.credentialType.includes('NOMAD')) sealIcon = '🌐';
      else if (cred.credentialType.includes('KYC')) sealIcon = '✓';
      else if (cred.credentialType.includes('HUMAN')) sealIcon = '👤';
      else if (cred.credentialType.includes('VIP')) sealIcon = '★';

      html += `
        <div class="visa-stamp-card ${isRevoked ? 'revoked' : ''}">
          ${isRevoked ? '<div class="revocation-stamp">REVOKED</div>' : ''}
          
          <div class="stamp-header">
            <div class="stamp-seal">${sealIcon}</div>
            <span class="stamp-type-pill">${cred.credentialType}</span>
          </div>

          <div>
            <h3 class="stamp-title">${cred.title}</h3>
            <p class="stamp-authority">Issuer: ${cred.issuerName} (${cred.issuer.substring(0, 6)}...${cred.issuer.substring(cred.issuer.length - 4)})</p>
            <p style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--cyan); margin-top: 0.35rem; word-break: break-all;">
              Data: ${cred.dataHash}
            </p>
          </div>

          <div class="stamp-dates">
            <div>
              <span>ISSUED: </span><strong>${issueDate}</strong>
            </div>
            <div>
              <span>VALID UNTIL: </span><strong>${expiryDate}</strong>
            </div>
          </div>

          ${(isCurrentAuthorizedIssuer && !isRevoked) ? `
            <div style="margin-top: 1rem; text-align: right;">
              <button class="btn-sm btn-danger" onclick="handleRevokeCredential('${cred.id}')">Revoke Visa Stamp</button>
            </div>
          ` : ''}
        </div>
      `;
    }

    booklet.innerHTML = html;

  } catch (err) {
    console.error("Load credentials error:", err);
  }
}

// Live Preview of Passport in Registration Form
function previewPassportLive() {
  const name = document.getElementById('regFullName').value.trim() || 'Elena Rostova';
  const nat = document.getElementById('regNationality').value.trim() || 'Estonia';
  const dob = document.getElementById('regDOB').value || '1995-05-20';
  const avatar = document.getElementById('regAvatar').value.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';

  document.getElementById('cardName').innerText = name;
  document.getElementById('cardNationality').innerText = nat;
  document.getElementById('cardNationalityHeader').innerText = nat.toUpperCase();
  document.getElementById('cardDOB').innerText = dob;
  document.getElementById('cardAvatar').src = avatar;

  const mrz = generateMRZLines(name, "P-PENDING", nat, Math.floor(new Date(dob).getTime() / 1000), Math.floor(Date.now() / 1000) + 10 * 365 * 86400, account);
  document.getElementById('mrzLine1').innerText = mrz.line1;
  document.getElementById('mrzLine2').innerText = mrz.line2;
}

function setAvatarPreset(url) {
  document.getElementById('regAvatar').value = url;
  previewPassportLive();
}

// Mint or Update Passport
async function handlePassportSubmit() {
  const name = document.getElementById('regFullName').value.trim();
  const nat = document.getElementById('regNationality').value.trim();
  const dobStr = document.getElementById('regDOB').value;
  const avatar = document.getElementById('regAvatar').value.trim();

  if (!name || !nat || !dobStr) {
    showToast("Please fill in all required fields (Name, Nationality, Date of Birth)", "warning");
    return;
  }

  const dobTimestamp = Math.floor(new Date(dobStr).getTime() / 1000);
  if (isNaN(dobTimestamp) || dobTimestamp >= Math.floor(Date.now() / 1000)) {
    showToast("Please select a valid date of birth in the past", "warning");
    return;
  }

  try {
    showToast("Broadcasting transaction to blockchain...", "info");
    
    if (currentPassportData && currentPassportData.fullName) {
      // Update existing passport
      await didContract.methods.updatePassport(name, avatar).send({ from: account });
      showToast("Passport profile updated successfully!", "success");
    } else {
      // Register new passport
      await didContract.methods.registerPassport(name, nat, dobTimestamp, avatar).send({ from: account });
      showToast("Decentralized ID Passport minted successfully!", "success");
    }

    await handleAccountChanged();
    switchTab('tab-passport');
  } catch (err) {
    console.error("Passport submit error:", err);
    showToast(err.message || "Transaction failed", "error");
  }
}

// Toggle Identity Status (Freeze / Unfreeze)
async function togglePassportStatus() {
  if (!currentPassportData) return;

  const targetState = !currentPassportData.isActive;
  try {
    showToast(`Submitting status change to ${targetState ? 'Active' : 'Frozen'}...`, "info");
    await didContract.methods.togglePassportStatus(targetState).send({ from: account });
    showToast(`Identity status set to ${targetState ? 'Active' : 'Suspended'}!`, "success");
    await loadPassportData();
  } catch (err) {
    console.error("Toggle status error:", err);
    showToast(err.message || "Failed to update status", "error");
  }
}

// Preset Selector for Issuing Visas
function applyVisaPreset(type) {
  const titleInput = document.getElementById('issueTitle');
  const validityInput = document.getElementById('issueValidity');
  const hashInput = document.getElementById('issueDataHash');

  switch (type) {
    case 'SCHENGEN_VISA':
      titleInput.value = 'European Digital Border Pass';
      validityInput.value = '90';
      hashInput.value = 'ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
      break;
    case 'GLOBAL_NOMAD':
      titleInput.value = 'Web3 Global Nomad Residency';
      validityInput.value = '365';
      hashInput.value = 'ipfs://QmNomadResidenceAttestationVerifiedBorderZone';
      break;
    case 'KYC_TIER_2':
      titleInput.value = 'KYC Tier 2 Identity Verification';
      validityInput.value = '730';
      hashInput.value = 'ipfs://QmBiometricProofAuditPassTier2OfficialKYC';
      break;
    case 'PROOF_OF_HUMANITY':
      titleInput.value = 'Proof of Humanity Sovereign Seal';
      validityInput.value = '0'; // Permanent
      hashInput.value = 'ipfs://QmSybilResistanceProofOfHumanityTokenStamp';
      break;
    case 'DEVCON_VIP':
      titleInput.value = 'Devcon Global Diplomatic Pass';
      validityInput.value = '14';
      hashInput.value = 'ipfs://QmDiplomaticEntryPassDevconConsensus2026';
      break;
    default:
      titleInput.value = '';
      validityInput.value = '30';
      hashInput.value = 'ipfs://...';
      break;
  }
}

// Issue Credential / Visa Stamp
async function handleIssueCredential() {
  const subject = document.getElementById('issueSubject').value.trim();
  const credType = document.getElementById('issueCredType').value;
  const validity = parseInt(document.getElementById('issueValidity').value) || 0;
  const title = document.getElementById('issueTitle').value.trim();
  const dataHash = document.getElementById('issueDataHash').value.trim();

  if (!web3.utils.isAddress(subject)) {
    showToast("Please enter a valid Ethereum address for Subject", "warning");
    return;
  }

  if (!title) {
    showToast("Please enter a title for the stamp", "warning");
    return;
  }

  try {
    showToast("Stamping visa credential onto subject identity on-chain...", "info");
    await didContract.methods.issueCredential(subject, credType, title, dataHash, validity).send({ from: account });
    showToast("Visa stamp successfully issued and signed!", "success");

    // Reset or refresh
    if (subject.toLowerCase() === account.toLowerCase()) {
      await loadCredentials();
    }
    await loadRegisteredCitizensQuickPick();
  } catch (err) {
    console.error("Issue credential error:", err);
    showToast(err.message || "Failed to issue credential", "error");
  }
}

// Revoke Credential
async function handleRevokeCredential(credId) {
  if (!confirm("Are you sure you want to revoke this visa stamp? This action is recorded permanently on-chain.")) return;

  try {
    showToast("Revoking credential on-chain...", "info");
    await didContract.methods.revokeCredential(credId).send({ from: account });
    showToast("Credential marked as revoked!", "success");
    await loadCredentials();
  } catch (err) {
    console.error("Revoke error:", err);
    showToast(err.message || "Failed to revoke", "error");
  }
}

// Admin: Add New Authorized Issuer
async function handleAddIssuer() {
  const newAddr = document.getElementById('newIssuerAddress').value.trim();
  const newName = document.getElementById('newIssuerName').value.trim();

  if (!web3.utils.isAddress(newAddr)) {
    showToast("Invalid address for new issuer", "warning");
    return;
  }
  if (!newName) {
    showToast("Please enter authority agency name", "warning");
    return;
  }

  try {
    showToast("Authorizing new authority on-chain...", "info");
    await didContract.methods.addIssuer(newAddr, newName).send({ from: account });
    showToast(`Authorized "${newName}" as official issuer!`, "success");
    document.getElementById('newIssuerAddress').value = "";
    document.getElementById('newIssuerName').value = "";
  } catch (err) {
    console.error("Add issuer error:", err);
    showToast(err.message || "Failed to authorize", "error");
  }
}

// W3C DID Document Formatter
function updateDIDDocumentJSON() {
  if (!currentPassportData) return;

  const doc = {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1"
    ],
    "id": currentPassportData.did,
    "controller": account,
    "verificationMethod": [{
      "id": `${currentPassportData.did}#controller`,
      "type": "EcdsaSecp256k1RecoveryMethod2020",
      "controller": currentPassportData.did,
      "blockchainAccountId": `eip155:5777:${account}`
    }],
    "authentication": [`${currentPassportData.did}#controller`],
    "assertionMethod": [`${currentPassportData.did}#controller`],
    "passportProfile": {
      "passportNumber": currentPassportData.passportNumber,
      "nationality": currentPassportData.nationality,
      "active": currentPassportData.isActive,
      "issuedAt": new Date(currentPassportData.issuedAt * 1000).toISOString(),
      "expiresAt": new Date(currentPassportData.expiresAt * 1000).toISOString()
    }
  };

  const container = document.getElementById('didDocJson');
  if (container) container.innerText = JSON.stringify(doc, null, 2);
}

function toggleDIDDocModal() {
  const modal = document.getElementById('didDocModal');
  modal.style.display = (modal.style.display === 'none' || modal.style.display === '') ? 'block' : 'none';
}

function copyDIDDoc() {
  const text = document.getElementById('didDocJson').innerText;
  navigator.clipboard.writeText(text).then(() => showToast("W3C DID Document copied to clipboard!", "info"));
}

// Privacy Selective Proof Generator
async function updateSelectiveProof() {
  if (!currentPassportData) {
    document.getElementById('presentationTokenJson').innerText = '// Register a passport first to generate selective disclosure presentations.';
    return;
  }

  const claimAge = document.getElementById('claimAge').checked;
  const claimActive = document.getElementById('claimActive').checked;
  const claimNat = document.getElementById('claimNationality').checked;
  const claimCreds = document.getElementById('claimCredentials').checked;

  const isAdult = await didContract.methods.isAdult(account).call();

  const presentation = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiablePresentation", "SelectiveDisclosurePresentation"],
    "holder": currentPassportData.did,
    "verifiableClaims": {
      ...(claimAge && { "isAdult": isAdult, "claim": "Holder is >= 18 years old without disclosing date of birth" }),
      ...(claimActive && { "passportActive": currentPassportData.isActive }),
      ...(claimNat && { "sovereignNationality": currentPassportData.nationality }),
      ...(claimCreds && { "verifiedCredentialsCount": currentPassportData.credentialCount })
    },
    "proof": {
      "type": "EthereumEip712Signature2021",
      "created": new Date().toISOString(),
      "verificationMethod": `${currentPassportData.did}#controller`,
      "proofPurpose": "assertionMethod",
      "smartContractRegistry": didContract.options.address
    }
  };

  document.getElementById('presentationTokenJson').innerText = JSON.stringify(presentation, null, 2);
}

function copySelectiveProof() {
  const text = document.getElementById('presentationTokenJson').innerText;
  navigator.clipboard.writeText(text).then(() => showToast("Selective Presentation Token copied!", "info"));
}

// Universal Verifier Audit
function verifyCurrentConnectedAccount() {
  document.getElementById('verifierQueryInput').value = account;
  performVerification();
}

async function performVerification() {
  let query = document.getElementById('verifierQueryInput').value.trim();
  if (!query) {
    showToast("Please enter an address or DID", "warning");
    return;
  }

  // Extract address if query is a DID (e.g. did:ethr:0x...)
  let targetAddress = query;
  if (query.startsWith("did:ethr:")) {
    targetAddress = query.replace("did:ethr:", "");
  }

  if (!web3.utils.isAddress(targetAddress)) {
    showToast("Invalid Ethereum address format", "warning");
    return;
  }

  try {
    showToast("Auditing on-chain decentralized identity records...", "info");
    const verif = await didContract.methods.verifyPassport(targetAddress).call();
    const resultsBox = document.getElementById('verifierResultsBox');
    resultsBox.style.display = 'block';

    if (!verif.isRegistered) {
      document.getElementById('verifStatusBadge').className = 'verif-status-pill invalid';
      document.getElementById('verifStatusIcon').innerText = '✕';
      document.getElementById('verifStatusTitle').innerText = 'NO PASSPORT REGISTERED';
      document.getElementById('verifSubjectDID').innerText = `Address: ${targetAddress}`;
      document.getElementById('verifName').innerText = "Not Found";
      document.getElementById('verifPassportNo').innerText = "-";
      document.getElementById('verifNationality').innerText = "-";
      document.getElementById('verifActiveCreds').innerText = "0";
      document.getElementById('verifCredentialsList').innerHTML = `<p style="color: var(--text-muted);">No records on-chain.</p>`;
      return;
    }

    const p = await didContract.methods.getPassport(targetAddress).call();
    const isAdult = await didContract.methods.isAdult(targetAddress).call();

    // Validity state
    if (verif.isValid) {
      document.getElementById('verifStatusBadge').className = 'verif-status-pill valid';
      document.getElementById('verifStatusIcon').innerText = '✓';
      document.getElementById('verifStatusTitle').innerText = 'VALID SOVEREIGN PASSPORT';
    } else if (verif.isSuspended) {
      document.getElementById('verifStatusBadge').className = 'verif-status-pill invalid';
      document.getElementById('verifStatusIcon').innerText = '⚠';
      document.getElementById('verifStatusTitle').innerText = 'PASSPORT SUSPENDED / FROZEN';
    } else {
      document.getElementById('verifStatusBadge').className = 'verif-status-pill invalid';
      document.getElementById('verifStatusIcon').innerText = '⌛';
      document.getElementById('verifStatusTitle').innerText = 'PASSPORT EXPIRED';
    }

    document.getElementById('verifSubjectDID').innerText = p.did;
    document.getElementById('verifAgeBadge').innerText = isAdult ? "Age: Over 18 Verified" : "Age: Minor (<18)";
    document.getElementById('verifName').innerText = p.fullName;
    document.getElementById('verifPassportNo').innerText = p.passportNumber;
    document.getElementById('verifNationality').innerText = p.nationality;
    document.getElementById('verifActiveCreds').innerText = verif.activeCredentialsCount;

    // Load credentials for verified address
    const creds = await didContract.methods.getCredentials(targetAddress).call();
    const credsContainer = document.getElementById('verifCredentialsList');

    if (!creds.length) {
      credsContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No credentials or visas issued to this passport.</p>`;
    } else {
      credsContainer.innerHTML = creds.map(c => `
        <div class="visa-stamp-card ${c.isRevoked ? 'revoked' : ''}">
          ${c.isRevoked ? '<div class="revocation-stamp">REVOKED</div>' : ''}
          <div class="stamp-header">
            <span style="font-size: 1.2rem;">${c.isRevoked ? '✕' : '✓'}</span>
            <span class="stamp-type-pill">${c.credentialType}</span>
          </div>
          <h4 style="color: #fff; font-size: 1rem; margin-bottom: 0.25rem;">${c.title}</h4>
          <p style="font-size: 0.75rem; color: var(--text-muted);">Issuer: ${c.issuerName}</p>
          <p style="font-size: 0.72rem; color: var(--cyan); font-family: var(--font-mono); margin-top: 0.25rem;">${c.dataHash}</p>
        </div>
      `).join("");
    }

    showToast("Audit complete: Record verified on-chain!", "success");

  } catch (err) {
    console.error("Audit error:", err);
    showToast("Failed to audit record: " + err.message, "error");
  }
}

// Bootstrap on page load
window.addEventListener('DOMContentLoaded', init);
