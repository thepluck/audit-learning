import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import StakingToken from "./StakingToken";
import RewardToken from './RewardToken';

export default buildModule('SRToken', m => {
  const { stakingToken } = m.useModule(StakingToken);
  const { rewardToken } = m.useModule(RewardToken);
  console.log(m.getParameter('start'));
  const srToken = m.contract('SRToken',
    [
      stakingToken,
      rewardToken,
      m.getParameter('start'),
      m.getParameter('end'),
      m.getParameter('rate'),
      m.getParameter('name'),
      m.getParameter('symbol'),
    ]
  )
  return { srToken };
});
