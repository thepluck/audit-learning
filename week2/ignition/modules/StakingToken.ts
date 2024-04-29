import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import { accounts } from '../parameters.json';

export default buildModule('StakingToken', m => {
  const stakingToken = m.contract('MyToken', [m.getParameter('name'), m.getParameter('symbol')]);
  return { stakingToken };
});
