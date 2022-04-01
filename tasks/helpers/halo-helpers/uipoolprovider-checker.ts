import { task } from 'hardhat/config';
import { eAvalancheNetwork, eContractid, eEthereumNetwork, eNetwork, ePolygonNetwork } from '../../../helpers/types';

import {
  getHaloUiPoolDataProvider,
  getIncentivePoolDataProvider,
  getUiPoolDataProvider,
  getWETHMocked,
} from '../../../helpers/contracts-getters';
import { parseEther } from 'ethers/lib/utils';

task(`external:uipoolprovider-checker`, `Check UI Pool Provider`).setAction(async ({ verify }, localBRE) => {
  await localBRE.run('set-DRE');
  if (!localBRE.network.config.chainId) {
    throw new Error('INVALID_CHAIN_ID');
  }
  const network = localBRE.network.name;

  const uiPoolDataProvider = await getHaloUiPoolDataProvider('0x6Af1ffC2F20e54CDED0549CEde1ba6269A615717');
  const uiIncentivesDataProvider = await getIncentivePoolDataProvider('0x22fA9599D8007B279BB935718DeE408fCad9Ea0B');

  console.log(await uiPoolDataProvider.getReservesData('0x737a452ec095D0fd6740E0190670847841cE7F93'));
});
