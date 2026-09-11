const DIDPassport = artifacts.require("DIDPassport");

module.exports = async function (callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const passport = await DIDPassport.deployed();

    console.log("Seeding DID Passport at:", passport.address);
    console.log("Admin (Account 0):", accounts[0]);
    console.log("Border Authority (Account 1):", accounts[1]);
    console.log("Citizen (Account 2):", accounts[2]);

    // 1. Register Passport for Account 0 (Aria Vance)
    const p0 = await passport.getPassport(accounts[0]);
    if (!p0.exists) {
      const dob0 = Math.floor(new Date("1996-08-14").getTime() / 1000);
      await passport.registerPassport(
        "Aria Vance",
        "Estonia / Sovereign Nomad",
        dob0,
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
        { from: accounts[0] }
      );
      console.log("✓ Registered passport for Account 0 (Aria Vance)");
    } else {
      console.log("- Account 0 already has a passport");
    }

    // 2. Register Passport for Account 2 (Marcus Chen)
    const p2 = await passport.getPassport(accounts[2]);
    if (!p2.exists) {
      const dob2 = Math.floor(new Date("1998-11-20").getTime() / 1000);
      await passport.registerPassport(
        "Marcus Chen",
        "Singapore",
        dob2,
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
        { from: accounts[2] }
      );
      console.log("✓ Registered passport for Account 2 (Marcus Chen)");
    } else {
      console.log("- Account 2 already has a passport");
    }

    // 3. Issue stamps from Account 1 (Border Authority) to Account 0
    const creds0 = await passport.getCredentials(accounts[0]);
    if (creds0.length === 0) {
      await passport.issueCredential(
        accounts[0],
        "SCHENGEN_VISA",
        "European Digital Border Pass",
        "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        90,
        { from: accounts[1] }
      );

      await passport.issueCredential(
        accounts[0],
        "GLOBAL_NOMAD",
        "Web3 Global Nomad Residency",
        "ipfs://QmNomadResidenceAttestationVerifiedBorderZone",
        365,
        { from: accounts[1] }
      );

      await passport.issueCredential(
        accounts[0],
        "KYC_TIER_2",
        "KYC Tier 2 Identity Verification",
        "ipfs://QmBiometricProofAuditPassTier2OfficialKYC",
        730,
        { from: accounts[1] }
      );

      console.log("✓ Issued 3 visa credentials to Account 0 from Border Agency (Account 1)");
    } else {
      console.log(`- Account 0 already has ${creds0.length} credentials`);
    }

    // 4. Issue stamp to Account 2
    const creds2 = await passport.getCredentials(accounts[2]);
    if (creds2.length === 0) {
      await passport.issueCredential(
        accounts[2],
        "DEVCON_VIP",
        "Devcon Global Diplomatic Pass",
        "ipfs://QmDiplomaticEntryPassDevconConsensus2026",
        14,
        { from: accounts[0] }
      );
      console.log("✓ Issued Devcon Diplomatic Pass to Account 2 from Genesis Authority");
    } else {
      console.log(`- Account 2 already has ${creds2.length} credentials`);
    }

    console.log("\nDemo seeding completed successfully!");
    callback();
  } catch (err) {
    console.error("Seeding error:", err);
    callback(err);
  }
};
