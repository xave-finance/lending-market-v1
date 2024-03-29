import { task } from 'hardhat/config';
import {
  getAaveOracle,
  getATokensAndRatesHelper,
  getLendingPoolAddressesProvider,
  getLendingPoolAddressesProviderRegistry,
  getLendingRateOracle,
  getStableAndVariableTokensHelper,
  getWETHGateway,
} from '../../../helpers/contracts-getters';
import { getEthersSigners } from '../../../helpers/contracts-helpers';

import { haloContractAddresses } from '../../../helpers/halo-contract-address-network';

task(`external:batch-change-ownership`, `Change ownership of all lending market contracts`).setAction(
  async ({ symbol, lp }, localBRE) => {
    await localBRE.run('set-DRE');
    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }

    const network = localBRE.network.name;
    // Change back to ops multisig
    const NEW_OWNER = '0x009c4ba01488A15816093F96BA91210494E2C644'; // ledger ops

    const admin = await (await getEthersSigners())[0].getAddress();

    console.log(`admin address/caller address: ${admin}`);
    console.log('Checking contract addresses: ');
    console.log(`
    lendingPoolAddressesProvider: ${
      haloContractAddresses(network).lendingMarket!.protocol.lendingPoolAddressesProvider
    },
    lendingPoolAddressesProviderRegistry: ${
      haloContractAddresses(network).lendingMarket!.protocol.lendingPoolAddressesProviderRegistry
    },
    stableAndVariableTokensHelper: ${
      haloContractAddresses(network).lendingMarket!.protocol.stableAndVariableTokensHelper
    },
    aTokensAndRatesHelper: ${haloContractAddresses(network).lendingMarket!.protocol.aTokensAndRatesHelper},
    aaveOracle: ${haloContractAddresses(network).lendingMarket!.protocol.aaveOracle},
    lendingRateOracle: ${haloContractAddresses(network).lendingMarket!.protocol.lendingRateOracle},
    wethGateWay: ${haloContractAddresses(network).lendingMarket!.protocol.wethGateway},
    `);

    // LendingPoolAddressesProvider
    const lendingPoolAddressesProvider = await getLendingPoolAddressesProvider(
      haloContractAddresses(network).lendingMarket!.protocol.lendingPoolAddressesProvider
    );
    const txn1 = await lendingPoolAddressesProvider.transferOwnership(NEW_OWNER);
    await txn1.wait();

    console.log('txn 1 done - LendingPoolAddressesProvider');
    console.log(`${await lendingPoolAddressesProvider.owner()} is ${NEW_OWNER}`);

    // lendingPoolAddressesProviderRegistry
    const lendingPoolAddressesProviderRegistry = await getLendingPoolAddressesProviderRegistry(
      haloContractAddresses(network).lendingMarket!.protocol.lendingPoolAddressesProviderRegistry
    );

    const txn2 = await lendingPoolAddressesProviderRegistry.transferOwnership(NEW_OWNER);
    await txn2.wait();
    console.log('txn 2 done - lendingPoolAddressesProviderRegistry');
    console.log(`${await lendingPoolAddressesProviderRegistry.owner()} is ${NEW_OWNER}`);

    // stableAndVariableTokensHelper
    const stableAndVariableTokensHelper = await getStableAndVariableTokensHelper(
      haloContractAddresses(network).lendingMarket!.protocol.stableAndVariableTokensHelper
    );

    const txn3 = await stableAndVariableTokensHelper.transferOwnership(NEW_OWNER);
    await txn3.wait();
    console.log('txn 3 done - stableAndVariableTokensHelper');
    console.log(`${await stableAndVariableTokensHelper.owner()} is ${NEW_OWNER}`);

    // aTokensAndRatesHelper
    const aTokensAndRatesHelper = await getATokensAndRatesHelper(
      haloContractAddresses(network).lendingMarket!.protocol.aTokensAndRatesHelper
    );
    const txn4 = await aTokensAndRatesHelper.transferOwnership(NEW_OWNER);
    await txn4.wait();
    console.log('txn 4 done - aTokensAndRatesHelper');
    console.log(`${await aTokensAndRatesHelper.owner()} is ${NEW_OWNER}`);

    // aaveOracle
    const aaveOracle = await getAaveOracle(haloContractAddresses(network).lendingMarket!.protocol.aaveOracle);
    const txn5 = await aaveOracle.transferOwnership(NEW_OWNER);
    await txn5.wait();
    console.log('txn 5 done -  aaveOracle');
    console.log(`${await aaveOracle.owner()} is ${NEW_OWNER}`);

    // lendingRateOracle
    const lendingRateOracle = await getLendingRateOracle(
      haloContractAddresses(network).lendingMarket!.protocol.lendingRateOracle
    );
    const txn6 = await lendingRateOracle.transferOwnership(NEW_OWNER);
    await txn6.wait();
    console.log('txn 6 done - lendingRateOracle');
    console.log(`${await lendingRateOracle.owner()} is ${NEW_OWNER}`);

    // wethGateway
    const wethGateWay = await getWETHGateway(haloContractAddresses(network).lendingMarket!.protocol.wethGateway);
    const txn7 = await wethGateWay.transferOwnership(NEW_OWNER);
    await txn7.wait();
    console.log('txn 7 done - wethGateWay');
    console.log(`${await wethGateWay.owner()} is ${NEW_OWNER}`);
  }
);
