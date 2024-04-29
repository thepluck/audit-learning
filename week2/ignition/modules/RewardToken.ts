import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('RewardToken', m => {
  const rewardToken = m.contract('MyToken', [m.getParameter('name'), m.getParameter('symbol')]);
  return { rewardToken };
});
