const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ERC20", (m) => {
  const erc20 = m.contract("ERC20", [
    m.getParameter("name", "ERC20"),
    m.getParameter("symbol", "ERC20"),
    m.getParameter("decimals", 18),
  ]);
  return { erc20 };
});