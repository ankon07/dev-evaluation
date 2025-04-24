const DevToken = artifacts.require("DevToken");

module.exports = function (deployer, network, accounts) {
  // Deploy the DevToken contract
  deployer.deploy(DevToken);
};
