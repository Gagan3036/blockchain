const DIDPassport = artifacts.require("DIDPassport");

contract("DIDPassport", (accounts) => {
  const [admin, authority, citizen1, citizen2, unauthorizedUser] = accounts;
  let passportContract;

  before(async () => {
    passportContract = await DIDPassport.new({ from: admin });
  });

  describe("Initialization & Authorization", () => {
    it("should set deployer as owner and default authorized authority", async () => {
      const owner = await passportContract.owner();
      assert.equal(owner, admin, "Owner should be admin");

      const isOwnerAuthorized = await passportContract.authorizedIssuers(admin);
      assert.isTrue(isOwnerAuthorized, "Admin should be authorized issuer");
    });

    it("should allow admin to authorize a new issuer", async () => {
      await passportContract.addIssuer(authority, "Federal Digital Border Agency", { from: admin });
      const isAuthorized = await passportContract.authorizedIssuers(authority);
      const issuerName = await passportContract.issuerNames(authority);

      assert.isTrue(isAuthorized, "Authority should be authorized");
      assert.equal(issuerName, "Federal Digital Border Agency", "Issuer name should match");
    });

    it("should prevent non-admin from adding issuers", async () => {
      try {
        await passportContract.addIssuer(citizen1, "Fake Agency", { from: unauthorizedUser });
        assert.fail("Should have thrown error");
      } catch (err) {
        assert.include(err.message, "Only owner can perform this action");
      }
    });
  });

  describe("Passport Registration & Lifecycle", () => {
    const citizen1DOB = Math.floor(new Date("1995-05-20").getTime() / 1000);

    it("should register a new DID passport for citizen1", async () => {
      const tx = await passportContract.registerPassport(
        "Elena Rostova",
        "Estonia",
        citizen1DOB,
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        { from: citizen1 }
      );

      assert.isOk(tx.receipt.status, "Transaction should succeed");

      const p = await passportContract.getPassport(citizen1);
      assert.include(p.did.toLowerCase(), citizen1.toLowerCase(), "DID should contain wallet address");
      assert.equal(p.fullName, "Elena Rostova", "Full name should match");
      assert.equal(p.nationality, "Estonia", "Nationality should match");
      assert.equal(p.dateOfBirth.toString(), citizen1DOB.toString(), "DOB should match");
      assert.isTrue(p.isActive, "Passport should be active by default");
      assert.isTrue(p.exists, "Passport should exist");
      assert.match(p.passportNumber, /^P-[A-Z0-9]{7}$/, "Passport number format should be valid");
    });

    it("should prevent duplicate registration for the same wallet", async () => {
      try {
        await passportContract.registerPassport(
          "Elena Clone",
          "Estonia",
          citizen1DOB,
          "avatar.png",
          { from: citizen1 }
        );
        assert.fail("Should have prevented duplicate");
      } catch (err) {
        assert.include(err.message, "Passport already exists for this wallet");
      }
    });

    it("should allow holder to update their profile info", async () => {
      await passportContract.updatePassport(
        "Elena Rostova-Vance",
        "https://example.com/new-avatar.png",
        { from: citizen1 }
      );

      const p = await passportContract.getPassport(citizen1);
      assert.equal(p.fullName, "Elena Rostova-Vance", "Name should be updated");
      assert.equal(p.avatarUrl, "https://example.com/new-avatar.png", "Avatar should be updated");
    });

    it("should allow holder to freeze and unfreeze their passport", async () => {
      await passportContract.togglePassportStatus(false, { from: citizen1 });
      let p = await passportContract.getPassport(citizen1);
      assert.isFalse(p.isActive, "Passport should be frozen");

      await passportContract.togglePassportStatus(true, { from: citizen1 });
      p = await passportContract.getPassport(citizen1);
      assert.isTrue(p.isActive, "Passport should be active again");
    });
  });

  describe("Verifiable Credentials (Visas & Stamps)", () => {
    let credId;

    it("should allow authorized authority to issue a travel visa / credential", async () => {
      const tx = await passportContract.issueCredential(
        citizen1,
        "SCHENGEN_VISA",
        "European Digital Border Pass",
        "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        90, // 90 days validity
        { from: authority }
      );

      const event = tx.logs.find(l => l.event === "CredentialIssued");
      assert.isOk(event, "CredentialIssued event should be emitted");
      credId = event.args.id;

      const creds = await passportContract.getCredentials(citizen1);
      assert.equal(creds.length, 1, "Should have 1 credential");
      assert.equal(creds[0].title, "European Digital Border Pass");
      assert.equal(creds[0].credentialType, "SCHENGEN_VISA");
      assert.equal(creds[0].issuer, authority);
      assert.isFalse(creds[0].isRevoked);
    });

    it("should prevent unauthorized entities from issuing credentials", async () => {
      try {
        await passportContract.issueCredential(
          citizen1,
          "ILLEGAL_VISA",
          "Black Market Entry Stamp",
          "ipfs://fake",
          30,
          { from: unauthorizedUser }
        );
        assert.fail("Unauthorized issuer should be rejected");
      } catch (err) {
        assert.include(err.message, "Caller is not an authorized issuer");
      }
    });

    it("should allow issuer to revoke a credential", async () => {
      await passportContract.revokeCredential(credId, { from: authority });
      const cred = await passportContract.getCredential(credId);
      assert.isTrue(cred.isRevoked, "Credential should be marked as revoked");
    });

    it("should prevent unauthorized users from revoking credentials", async () => {
      // Issue a new credential first
      const tx = await passportContract.issueCredential(
        citizen1,
        "KYC_TIER_2",
        "Proof of Identity KYC Stamp",
        "ipfs://QmKYCHash",
        365,
        { from: authority }
      );
      const newCredId = tx.logs.find(l => l.event === "CredentialIssued").args.id;

      try {
        await passportContract.revokeCredential(newCredId, { from: unauthorizedUser });
        assert.fail("Unauthorized user should not revoke credential");
      } catch (err) {
        assert.include(err.message, "Only issuer or owner can revoke");
      }
    });
  });

  describe("Selective Disclosure & Fast Verification", () => {
    it("should verify adult status without revealing DOB", async () => {
      // Citizen 1 was born in 1995 -> Over 18
      const isAdult1 = await passportContract.isAdult(citizen1);
      assert.isTrue(isAdult1, "Citizen 1 should be verified as adult");

      // Register a minor born recently
      const recentDOB = Math.floor(Date.now() / 1000) - (10 * 365 * 24 * 3600); // 10 years old
      await passportContract.registerPassport(
        "Young Traveler",
        "Digital Republic",
        recentDOB,
        "avatar-minor.png",
        { from: citizen2 }
      );

      const isAdult2 = await passportContract.isAdult(citizen2);
      assert.isFalse(isAdult2, "Citizen 2 should NOT be adult");
    });

    it("should run fast verification check for third-party verifiers", async () => {
      const verif = await passportContract.verifyPassport(citizen1);
      assert.isTrue(verif.isRegistered, "Should be registered");
      assert.isTrue(verif.isValid, "Should be valid");
      assert.isFalse(verif.isSuspended, "Should not be suspended");
      assert.isFalse(verif.isExpired, "Should not be expired");
      assert.isAbove(Number(verif.activeCredentialsCount), 0, "Should have active credentials");
    });
  });
});
