const DIDPassport = artifacts.require("DIDPassport");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(DIDPassport);
  const passport = await DIDPassport.deployed();

  console.log("DIDPassport deployed at:", passport.address);

  // Authorize Account[0] and Account[1] as demo authorities if on development network
  if (accounts && accounts.length > 1) {
    try {
      await passport.addIssuer(accounts[1], "Global Digital Border & Visa Agency", { from: accounts[0] });
      console.log(`Authorized secondary authority: ${accounts[1]} (Global Digital Border & Visa Agency)`);
    } catch (err) {
      console.warn("Notice: Secondary authority setup skipped:", err.message);
    }
  }
};
