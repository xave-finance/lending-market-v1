pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import 'forge-std/Test.sol';
import 'forge-std/console2.sol';
import {IERC20} from '../contracts/incentives/interfaces/IERC20.sol';

import {LendingMarketTestHelper, IOracle, IAssimilator} from './LendingMarketTestHelper.t.sol';
import {FXLPEthPriceFeedOracle, IFXPool, IAggregatorV3Interface} from '../contracts/xave-oracles/FXLPEthPriceFeedOracle.sol';
import {ILendingPoolAddressesProvider} from '../contracts/interfaces/ILendingPoolAddressesProvider.sol';
import {IHaloUiPoolDataProvider} from '../contracts/misc/interfaces/IHaloUiPoolDataProvider.sol';

contract LendingMarketUiPoolProvider is Test, LendingMarketTestHelper {
  // Buildbear
  address constant LP_ADDRESS_PROVIDER_ADD = 0x201f4C703c769EFbe230af7043ec766Fa53A5b4C;
  address constant UI_POOL_PROVIDER_ADD = 0x9cFf4A10b6Fb163a4DF369AaFed9d95838222ca6;

  function setUp() public {
    vm.createSelectFork('https://rpc.buildbear.io/xclabs');
  }

  function testUiProvider() public {
    (IHaloUiPoolDataProvider.AggregatedReserveData[] memory reservesData, ) = IHaloUiPoolDataProvider(
      UI_POOL_PROVIDER_ADD
    ).getReservesData(ILendingPoolAddressesProvider(LP_ADDRESS_PROVIDER_ADD));
    // must not revert

    console2.log(reservesData[0].name);
  }
}

interface UiProvider {
  function ETH_CURRENCY_UNIT() external view returns (uint256);

  function networkBaseTokenPriceInUsdProxyAggregator() external view returns (address);

  function marketReferenceCurrencyPriceInUsdProxyAggregator() external view returns (address);
}

interface LPETHOracle {
  function oracleDecimals() external view returns (uint8);

  function quotePriceFeed() external view returns (address);

  function fxp() external view returns (address);
}

interface IAaveOracle {
  function BASE_CURRENCY() external view returns (address); // if usd returns 0x0, if eth returns weth address

  function BASE_CURRENCY_UNIT() external view returns (uint256);

  /***********
    @dev returns the asset price in ETH
     */
  function getAssetPrice(address asset) external view returns (uint256);

  function getSourceOfAsset(address asset) external view returns (address);

  function setAssetSources(address[] memory assets, address[] memory sources) external;
}
