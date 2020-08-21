import rawBRE from '@nomiclabs/buidler';
import {MockContract} from 'ethereum-waffle';
import {
  deployLendingPoolAddressesProvider,
  deployMintableErc20,
  deployLendingPoolAddressesProviderRegistry,
  deployLendingPoolConfigurator,
  deployLendingPool,
  deployPriceOracle,
  getLendingPoolConfiguratorProxy,
  deployChainlinkProxyPriceProvider,
  deployLendingRateOracle,
  deployLendingPoolLiquidationManager,
  deployMockFlashLoanReceiver,
  deployWalletBalancerProvider,
  getLendingPool,
  insertContractAddressInDb,
  deployAaveProtocolTestHelpers,
  getEthersSigners,
  registerContractInJsonDb,
  getPairsTokenAggregator,
  initReserves,
} from '../helpers/contracts-helpers';
import {Signer} from 'ethers';
import {TokenContractId, eContractid, tEthereumAddress, AavePools} from '../helpers/types';
import {MintableErc20} from '../types/MintableErc20';
import {
  MOCK_USD_PRICE_IN_WEI,
  ALL_ASSETS_INITIAL_PRICES,
  USD_ADDRESS,
  MOCK_CHAINLINK_AGGREGATORS_PRICES,
  LENDING_RATE_ORACLE_RATES_COMMON,
  getReservesConfigByPool,
} from '../helpers/constants';
import {initializeMakeSuite} from './helpers/make-suite';

import {
  setInitialAssetPricesInOracle,
  setInitialMarketRatesInRatesOracle,
  deployAllMockAggregators,
} from '../helpers/oracles-helpers';
import {waitForTx} from '../helpers/misc-utils';
import {enableReservesToBorrow, enableReservesAsCollateral} from '../helpers/init-helpers';

const deployAllMockTokens = async (deployer: Signer) => {
  const tokens: {[symbol: string]: MockContract | MintableErc20} = {};

  const protoConfigData = getReservesConfigByPool(AavePools.proto);
  const secondaryConfigData = getReservesConfigByPool(AavePools.secondary);

  for (const tokenSymbol of Object.keys(TokenContractId)) {
    let decimals = 18;

    let configData = (<any>protoConfigData)[tokenSymbol];

    if (!configData) {
      configData = (<any>secondaryConfigData)[tokenSymbol];
    }

    if (!configData) {
      decimals = 18;
    }

    tokens[tokenSymbol] = await deployMintableErc20([
      tokenSymbol,
      tokenSymbol,
      configData ? configData.reserveDecimals : 18,
    ]);
    await registerContractInJsonDb(tokenSymbol.toUpperCase(), tokens[tokenSymbol]);
  }

  return tokens;
};

const buildTestEnv = async (deployer: Signer, secondaryWallet: Signer) => {
  console.time('setup');
  const lendingPoolManager = await deployer.getAddress();

  const mockTokens = await deployAllMockTokens(deployer);

  const addressesProvider = await deployLendingPoolAddressesProvider();
  await waitForTx(await addressesProvider.setLendingPoolManager(lendingPoolManager));

  const addressesProviderRegistry = await deployLendingPoolAddressesProviderRegistry();
  await waitForTx(
    await addressesProviderRegistry.registerAddressesProvider(addressesProvider.address, 0)
  );

  const lendingPoolImpl = await deployLendingPool();

  console.log('Deployed lending pool, address:', lendingPoolImpl.address);
  await waitForTx(await addressesProvider.setLendingPoolImpl(lendingPoolImpl.address));

  console.log('Added pool to addresses provider');

  const address = await addressesProvider.getLendingPool();
  console.log('Address is ', address);
  const lendingPoolProxy = await getLendingPool(address);

  console.log('implementation set, address:', lendingPoolProxy.address);

  await insertContractAddressInDb(eContractid.LendingPool, lendingPoolProxy.address);

  const lendingPoolConfiguratorImpl = await deployLendingPoolConfigurator();
  await waitForTx(
    await addressesProvider.setLendingPoolConfiguratorImpl(lendingPoolConfiguratorImpl.address)
  );
  const lendingPoolConfiguratorProxy = await getLendingPoolConfiguratorProxy(
    await addressesProvider.getLendingPoolConfigurator()
  );
  await insertContractAddressInDb(
    eContractid.LendingPoolConfigurator,
    lendingPoolConfiguratorProxy.address
  );

  const fallbackOracle = await deployPriceOracle();
  await waitForTx(await fallbackOracle.setEthUsdPrice(MOCK_USD_PRICE_IN_WEI));
  await setInitialAssetPricesInOracle(
    ALL_ASSETS_INITIAL_PRICES,
    {
      WETH: mockTokens.WETH.address,
      DAI: mockTokens.DAI.address,
      TUSD: mockTokens.TUSD.address,
      USDC: mockTokens.USDC.address,
      USDT: mockTokens.USDT.address,
      SUSD: mockTokens.SUSD.address,
      LEND: mockTokens.LEND.address,
      BAT: mockTokens.BAT.address,
      REP: mockTokens.REP.address,
      MKR: mockTokens.MKR.address,
      LINK: mockTokens.LINK.address,
      KNC: mockTokens.KNC.address,
      WBTC: mockTokens.WBTC.address,
      MANA: mockTokens.MANA.address,
      ZRX: mockTokens.ZRX.address,
      SNX: mockTokens.SNX.address,
      BUSD: mockTokens.BUSD.address,

      USD: USD_ADDRESS,

      UNI_DAI_ETH: mockTokens.UNI_DAI_ETH.address,
      UNI_USDC_ETH: mockTokens.UNI_USDC_ETH.address,
      UNI_SETH_ETH: mockTokens.UNI_SETH_ETH.address,
      UNI_LEND_ETH: mockTokens.UNI_LEND_ETH.address,
      UNI_MKR_ETH: mockTokens.UNI_MKR_ETH.address,
      UNI_LINK_ETH: mockTokens.UNI_LINK_ETH.address,
    },
    fallbackOracle
  );

  const mockAggregators = await deployAllMockAggregators(MOCK_CHAINLINK_AGGREGATORS_PRICES);

  const allTokenAddresses = Object.entries(mockTokens).reduce(
    (accum: {[tokenSymbol: string]: tEthereumAddress}, [tokenSymbol, tokenContract]) => ({
      ...accum,
      [tokenSymbol]: tokenContract.address,
    }),
    {}
  );
  const allAggregatorsAddresses = Object.entries(mockAggregators).reduce(
    (accum: {[tokenSymbol: string]: tEthereumAddress}, [tokenSymbol, aggregator]) => ({
      ...accum,
      [tokenSymbol]: aggregator.address,
    }),
    {}
  );

  const [tokens, aggregators] = getPairsTokenAggregator(allTokenAddresses, allAggregatorsAddresses);

  const chainlinkProxyPriceProvider = await deployChainlinkProxyPriceProvider([
    tokens,
    aggregators,
    fallbackOracle.address,
  ]);
  await waitForTx(await addressesProvider.setPriceOracle(fallbackOracle.address));

  const lendingRateOracle = await deployLendingRateOracle();
  await waitForTx(await addressesProvider.setLendingRateOracle(lendingRateOracle.address));

  const {USD, ...tokensAddressesWithoutUsd} = allTokenAddresses;
  const allReservesAddresses = {
    ...tokensAddressesWithoutUsd,
  };
  await setInitialMarketRatesInRatesOracle(
    LENDING_RATE_ORACLE_RATES_COMMON,
    allReservesAddresses,
    lendingRateOracle
  );

  const {
    UNI_DAI_ETH,
    UNI_USDC_ETH,
    UNI_SETH_ETH,
    UNI_LINK_ETH,
    UNI_MKR_ETH,
    UNI_LEND_ETH,
    ...protoPoolReservesAddresses
  } = <{[symbol: string]: tEthereumAddress}>allReservesAddresses;

  const reservesParams = getReservesConfigByPool(AavePools.proto);

  console.log('Initialize configuration');
  await initReserves(
    reservesParams,
    protoPoolReservesAddresses,
    addressesProvider,
    lendingPoolProxy,
    lendingPoolConfiguratorProxy,
    AavePools.proto
  );
  await enableReservesToBorrow(
    reservesParams,
    protoPoolReservesAddresses,
    lendingPoolProxy,
    lendingPoolConfiguratorProxy
  );
  await enableReservesAsCollateral(
    reservesParams,
    protoPoolReservesAddresses,
    lendingPoolProxy,
    lendingPoolConfiguratorProxy
  );

  const liquidationManager = await deployLendingPoolLiquidationManager();
  await waitForTx(
    await addressesProvider.setLendingPoolLiquidationManager(liquidationManager.address)
  );

  const mockFlashLoanReceiver = await deployMockFlashLoanReceiver(addressesProvider.address);
  await insertContractAddressInDb(eContractid.MockFlashLoanReceiver, mockFlashLoanReceiver.address);

  await deployWalletBalancerProvider(addressesProvider.address);

  const testHelpers = await deployAaveProtocolTestHelpers(addressesProvider.address);

  await insertContractAddressInDb(eContractid.AaveProtocolTestHelpers, testHelpers.address);

  console.timeEnd('setup');
};

before(async () => {
  await rawBRE.run('set-bre');
  const [deployer, secondaryWallet] = await getEthersSigners();
  console.log('-> Deploying test environment...');
  await buildTestEnv(deployer, secondaryWallet);
  await initializeMakeSuite();
  console.log('\n***************');
  console.log('Setup and snapshot finished');
  console.log('***************\n');
});
