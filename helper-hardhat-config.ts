// @ts-ignore
import { HardhatNetworkForkingUserConfig, HardhatUserConfig } from 'hardhat/types';
import {
  eAvalancheNetwork,
  eEthereumNetwork,
  ePolygonNetwork,
  eXDaiNetwork,
  iParamsPerNetwork,
  eArbitrumNetwork,
} from './helpers/types';

require('dotenv').config();

const INFURA_KEY = process.env.INFURA_KEY || '';
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '';
const TENDERLY_FORK_ID = process.env.TENDERLY_FORK_ID || '';
const FORK = process.env.FORK || '';
const FORK_BLOCK_NUMBER = process.env.FORK_BLOCK_NUMBER ? parseInt(process.env.FORK_BLOCK_NUMBER) : 0;

const GWEI = 1000 * 1000 * 1000;

export const buildForkConfig = (): HardhatNetworkForkingUserConfig | undefined => {
  let forkMode;
  if (FORK) {
    forkMode = {
      url: NETWORKS_RPC_URL[FORK],
    };
    if (FORK_BLOCK_NUMBER || BLOCK_TO_FORK[FORK]) {
      forkMode.blockNumber = FORK_BLOCK_NUMBER || BLOCK_TO_FORK[FORK];
    }
  }
  return forkMode;
};

export const NETWORKS_RPC_URL: iParamsPerNetwork<string> = {
  [eEthereumNetwork.kovan]: ALCHEMY_KEY
    ? `https://eth-kovan.alchemyapi.io/v2/${ALCHEMY_KEY}`
    : `https://kovan.infura.io/v3/${INFURA_KEY}`,
  [eEthereumNetwork.ropsten]: ALCHEMY_KEY
    ? `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_KEY}`
    : `https://ropsten.infura.io/v3/${INFURA_KEY}`,
  [eEthereumNetwork.main]: ALCHEMY_KEY
    ? `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`
    : `https://mainnet.infura.io/v3/${INFURA_KEY}`,
  [eEthereumNetwork.coverage]: 'http://localhost:8555',
  [eEthereumNetwork.hardhat]: 'http://localhost:8545',
  [eEthereumNetwork.buidlerevm]: 'http://localhost:8545',
  [eEthereumNetwork.tenderly]: `https://rpc.tenderly.co/fork/`,
  [ePolygonNetwork.mumbai]: 'https://rpc-mumbai.maticvigil.com',
  [ePolygonNetwork.matic]:
    // 'https://rpc-mainnet.maticvigil.com/v1/e616b9ddc7598ffae92629f8145614d55094c722',
    // 'https://polygon-mainnet.g.alchemy.com/v2/6NUmfWDZw6lC3RPAphj0p_2vm7ElOn2U',
    `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`,
  // [ePolygonNetwork.matic]: 'https://rpc-mainnet.matic.network',
  [eXDaiNetwork.xdai]: 'https://rpc.xdaichain.com/',
  [eAvalancheNetwork.avalanche]: 'https://api.avax.network/ext/bc/C/rpc',
  [eAvalancheNetwork.fuji]: 'https://api.avax-test.network/ext/bc/C/rpc',
  [eArbitrumNetwork.arbitrum]: `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`,
  [eArbitrumNetwork.arbitrumRinkeby]: `https://arbitrum-rinkeby.infura.io/v3/${INFURA_KEY}`,
  [eEthereumNetwork.sepolia]: 'https://eth-sepolia.g.alchemy.com/v2/Qe-DPG2Ezrlc4opOXzKP6swK57aHMv1e',
};

export const NETWORKS_DEFAULT_GAS: iParamsPerNetwork<number> = {
  [eEthereumNetwork.kovan]: 3 * GWEI,
  [eEthereumNetwork.ropsten]: 65 * GWEI,
  [eEthereumNetwork.main]: 40 * GWEI,
  [eEthereumNetwork.coverage]: 65 * GWEI,
  [eEthereumNetwork.hardhat]: 65 * GWEI,
  [eEthereumNetwork.buidlerevm]: 65 * GWEI,
  [eEthereumNetwork.tenderly]: 1 * GWEI,
  [ePolygonNetwork.mumbai]: 1 * GWEI,
  [ePolygonNetwork.matic]: 65 * GWEI,
  [eXDaiNetwork.xdai]: 1 * GWEI,
  [eAvalancheNetwork.avalanche]: 225 * GWEI,
  [eAvalancheNetwork.fuji]: 85 * GWEI,
  [eArbitrumNetwork.arbitrum]: 10 * GWEI,
  [eArbitrumNetwork.arbitrumRinkeby]: 65 * GWEI,
  [eEthereumNetwork.sepolia]: 3 * GWEI,
};

export const NETWORK_DEFAULT_PRIORITYFEE: iParamsPerNetwork<number> = {
  [eEthereumNetwork.kovan]: 1 * GWEI,
  [eEthereumNetwork.ropsten]: 1 * GWEI,
  [eEthereumNetwork.main]: 1 * GWEI,
  [eEthereumNetwork.coverage]: 1 * GWEI,
  [eEthereumNetwork.hardhat]: 1 * GWEI,
  [eEthereumNetwork.buidlerevm]: 1 * GWEI,
  [eEthereumNetwork.tenderly]: 1 * GWEI,
  [ePolygonNetwork.mumbai]: 1 * GWEI,
  [ePolygonNetwork.matic]: 2 * GWEI,
  [eXDaiNetwork.xdai]: 1 * GWEI,
  [eAvalancheNetwork.avalanche]: 1 * GWEI,
  [eAvalancheNetwork.fuji]: 1 * GWEI,
  [eEthereumNetwork.sepolia]: 1 * GWEI,
};

export const BLOCK_TO_FORK: iParamsPerNetwork<number | undefined> = {
  [eEthereumNetwork.main]: 12406069,
  [eEthereumNetwork.kovan]: undefined,
  [eEthereumNetwork.sepolia]: undefined,
  [eEthereumNetwork.ropsten]: undefined,
  [eEthereumNetwork.coverage]: undefined,
  [eEthereumNetwork.hardhat]: undefined,
  [eEthereumNetwork.buidlerevm]: undefined,
  [eEthereumNetwork.tenderly]: undefined,
  [ePolygonNetwork.mumbai]: undefined,
  [ePolygonNetwork.matic]: undefined,
  [eXDaiNetwork.xdai]: undefined,
  [eAvalancheNetwork.avalanche]: undefined,
  [eAvalancheNetwork.fuji]: undefined,
  [eArbitrumNetwork.arbitrum]: undefined,
  [eArbitrumNetwork.arbitrumRinkeby]: undefined,
};
