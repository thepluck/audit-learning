import { HardhatUserConfig, vars } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const SEPOLIA_PRIVATE_KEY = vars.get('SEPOLIA_PRIVATE_KEY');
const ETHERSCAN_API_KEY = vars.get('ETHERSCAN_API_KEY');

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
  },
  networks: {
    sepolia: {
      url: 'https://rpc.sepolia.org',
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY
    }
  }
};

export default config;
