pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import 'forge-std/Test.sol';
import {Vm} from 'forge-std/Vm.sol';
import 'forge-std/console.sol';

import {IERC20} from '../contracts/incentives/interfaces/IERC20.sol';

import {ILendingPool} from '../contracts/interfaces/ILendingPool.sol';
import {ILendingPoolAddressesProvider} from '../contracts/interfaces/ILendingPoolAddressesProvider.sol';
import {IAaveOracle} from '../contracts/misc/interfaces/IAaveOracle.sol';
import {AaveOracle} from '../contracts/misc/AaveOracle.sol';

import {MockAggregator} from '../contracts/mocks/oracle/CLAggregators/MockAggregator.sol';
import {IHaloUiPoolDataProvider} from '../contracts/misc/interfaces/IHaloUiPoolDataProvider.sol';

import {DataTypes} from '../contracts/protocol/libraries/types/DataTypes.sol';
import {IAToken} from '../contracts/interfaces/IAToken.sol';

contract IOracle {
  function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {}
}

contract LiquididateIntegrationTest is Test {
  address constant LENDINPOOL_PROXY_ADDRESS = 0xC73b2c6ab14F25e1EAd3DE75b4F6879DEde3968E;
  address constant USDC_MAINNET = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
  string private RPC_URL = vm.envString('MAINNET_RPC_URL');
  uint256 constant FORK_BLOCK = 15432282;
  address constant ORACLE_OWNER = 0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA;
  address constant ETH_USD_CHAINLINK = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419;
  address constant USDC_USD_CHAINLINK = 0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6;
  address constant HLP_XSGD = 0x64DCbDeb83e39f152B7Faf83E5E5673faCA0D42A;
  address constant HLP_XSGD_ORACLE = 0xE911bA4d01b64830160284E42BfC9b9933fA19BA;
  address constant A_TOKEN = 0x07F540613ea0B7e723ffB5978515A342a134be07;
  address constant AAVE_ORACLE = 0x50FDeD029612F6417e9c9Cb9a42848EEc772b9cC;
  address constant UI_DATA_PROVIDER = 0x6c00EC488A2D2EB06b2Ed28e1F9f12C38fBCF426;
  address constant LENDINGPOOL_ADDRESS_PROVIDER = 0xD8708572AfaDccE523a8B8883a9b882a79cbC6f2;
  address constant LP_USER = 0x01e198818a895f01562E0A087595E5b1C7bb8d5c;
  ILendingPool constant LP = ILendingPool(LENDINPOOL_PROXY_ADDRESS);

  function setUp() public {
    vm.createSelectFork(RPC_URL, FORK_BLOCK);
  }

  function testLiquidate() public {
    _printUserAccountData(LP_USER);

    (, int256 ethUsdPrice, , , ) = IOracle(ETH_USD_CHAINLINK).latestRoundData();
    (, int256 usdcUsdPrice, , , ) = IOracle(USDC_USD_CHAINLINK).latestRoundData();
    console.log('ethUsdPrice', uint256(ethUsdPrice));
    console.log('usdcUsdPrice', uint256(usdcUsdPrice));

    _borrowToLimit(LP_USER);

    _repayLoan(LP_USER);

    // get the price for the collateral

    IHaloUiPoolDataProvider.UserReserveData[] memory userReserves = IHaloUiPoolDataProvider(UI_DATA_PROVIDER)
      .getUserReservesData(ILendingPoolAddressesProvider(LENDINGPOOL_ADDRESS_PROVIDER), LP_USER);

    console.log(userReserves[0].underlyingAsset, userReserves[0].scaledATokenBalance);
    console.log(userReserves[1].underlyingAsset, userReserves[1].scaledATokenBalance);
    console.log(userReserves[2].underlyingAsset, userReserves[2].scaledATokenBalance);
    console.log(userReserves[3].underlyingAsset, userReserves[3].scaledATokenBalance);
    console.log(userReserves[4].underlyingAsset, userReserves[4].scaledATokenBalance);
    console.log(userReserves[5].underlyingAsset, userReserves[5].scaledATokenBalance);
    console.log(userReserves[6].underlyingAsset, userReserves[6].scaledATokenBalance);

    _manipulateOraclePrice();

    _liquididatePosition(LP_USER);

    // manipulate the oracle to make the loan undercollateralized

    // liquidate the loan

    // check that the liquidator received the collateral
  }

  function _repayLoan(address _user) private {
    (IHaloUiPoolDataProvider.AggregatedReserveData[] memory rd1, ) = IHaloUiPoolDataProvider(UI_DATA_PROVIDER)
      .getReservesData(ILendingPoolAddressesProvider(LENDINGPOOL_ADDRESS_PROVIDER));
    console.log('li before', rd1[1].liquidityIndex);

    vm.roll(block.number + 1000);

    (IHaloUiPoolDataProvider.AggregatedReserveData[] memory rd2, ) = IHaloUiPoolDataProvider(UI_DATA_PROVIDER)
      .getReservesData(ILendingPoolAddressesProvider(LENDINGPOOL_ADDRESS_PROVIDER));

    console.log('li after', rd2[1].liquidityIndex);

    IERC20(USDC_MAINNET).approve(LENDINPOOL_PROXY_ADDRESS, type(uint).max);
    LP.repay(USDC_MAINNET, type(uint).max, 2, _user);
  }

  function _setXsgdHLPOracle(address _oracle) private {
    address aaveOracle = ILendingPoolAddressesProvider(LENDINGPOOL_ADDRESS_PROVIDER).getPriceOracle();

    address[] memory assets = new address[](1);
    assets[0] = HLP_XSGD;
    address[] memory sources = new address[](1);
    sources[0] = HLP_XSGD_ORACLE;

    address oracleOwner = AaveOracle(aaveOracle).owner();
    vm.prank(oracleOwner);
    AaveOracle(aaveOracle).setAssetSources(assets, sources);
  }

  function _borrowToLimit(address _user) private {
    _setXsgdHLPOracle(HLP_XSGD_ORACLE);

    (
      ,
      /*uint256 totalCollateralETH*/
      uint256 totalDebtETH,
      uint256 availableBorrowsETH,
      uint256 currentLiquidationThreshold,
      uint256 ltv,
      uint256 healthFactor
    ) = LP.getUserAccountData(_user);
    console.log('[_borrowToLimit] healthFactor', healthFactor);

    (, int256 ethUsdPrice, , , ) = IOracle(ETH_USD_CHAINLINK).latestRoundData();
    (, int256 usdcUsdPrice, , , ) = IOracle(USDC_USD_CHAINLINK).latestRoundData();

    vm.startPrank(_user);
    // @note might be rounding off issue?
    uint256 totalUsdcBorrows = (((availableBorrowsETH - totalDebtETH) * (uint256(ethUsdPrice))) /
      uint256(usdcUsdPrice)) / 1e12;

    console.log('totalUsdcBorrows', totalUsdcBorrows);

    uint256 balBefore = IERC20(USDC_MAINNET).balanceOf(_user);
    console.log('balBefore', balBefore);

    LP.borrow(
      USDC_MAINNET,
      totalUsdcBorrows + uint256(1169 * 1e6), // @todo check if it make sense: difference between total calculated usdc to be borrowed vs actual limit
      2, // stablecoin borrowing
      0, // referral code
      _user
    );

    uint256 balAfter = IERC20(USDC_MAINNET).balanceOf(_user);
    console.log('balAfter', balAfter);

    (
      ,
      ,
      /*uint256 totalCollateralETH*/ uint256 availableBorrowsETH2,
      uint256 currentLiquidationThreshold2 /*uint256 ltv*/,
      ,
      uint256 healthFactor2
    ) = LP.getUserAccountData(_user);

    console.log('availableBorrowsETH2', availableBorrowsETH2);
    console.log('healthFactor2: ', healthFactor2);

    vm.stopPrank();
  }

  function _printUserAccountData(address _user) private {
    (
      ,
      //uint256 totalCollateralETH
      uint256 totalDebtETH,
      uint256 availableBorrowsETH,
      uint256 currentLiquidationThreshold,
      ,
      /*uint256 ltv*/ uint256 healthFactor
    ) = LP.getUserAccountData(_user);
    // console.log('totalCollateralETH', totalCollateralETH);
    console.log('totalDebtETH', totalDebtETH);

    console.log('availableBorrowsETH', availableBorrowsETH);
    console.log('currentLiquidationThreshold', currentLiquidationThreshold);
    console.log('healthFactor', healthFactor);
    // console.log('currentLiquidationThreshold', currentLiquidationThreshold);
    // console.log('ltv', ltv);
    console.log('healthFactor', healthFactor);
  }

  function _liquididatePosition(address _lpUser) private {
    address me = address(this);

    vm.prank(0xE982615d461DD5cD06575BbeA87624fda4e3de17); // usdc masterMinter
    IUsdcToken(USDC_MAINNET).configureMinter(me, 2_000_000_000_000 * 1e6);
    // mint usdc tokens to us
    IUsdcToken(USDC_MAINNET).mint(me, 2_000_000_000_000 * 1e6);

    DataTypes.ReserveData memory rd = LP.getReserveData(USDC_MAINNET);
    address aToken = rd.aTokenAddress;

    console.log('aToken', IERC20(aToken).balanceOf(me));

    IERC20(USDC_MAINNET).approve(LENDINPOOL_PROXY_ADDRESS, type(uint).max);
    LP.liquidationCall(USDC_MAINNET, USDC_MAINNET, _lpUser, type(uint).max, true);

    // check that the liquidator received the collateral
    console.log('aToken', IERC20(aToken).balanceOf(me));

    uint256 beforeBal = IERC20(USDC_MAINNET).balanceOf(me);

    LP.withdraw(USDC_MAINNET, type(uint).max, me);
    console.log('USDC received', IERC20(USDC_MAINNET).balanceOf(me) - beforeBal);
  }

  function _manipulateOraclePrice() private {
    address aaveOracle = ILendingPoolAddressesProvider(LENDINGPOOL_ADDRESS_PROVIDER).getPriceOracle();

    address oracleOwner = AaveOracle(aaveOracle).owner();
    uint256 _price = AaveOracle(aaveOracle).getAssetPrice(HLP_XSGD);

    console.log('price', _price);

    address assSource = AaveOracle(aaveOracle).getSourceOfAsset(HLP_XSGD);
    console.log('assSource', assSource);
    console.log('fallbackOracle', AaveOracle(aaveOracle).getFallbackOracle());
    console.log('BASE_CURRENCY', AaveOracle(aaveOracle).BASE_CURRENCY());

    address[] memory assets = new address[](1);
    assets[0] = HLP_XSGD;
    address[] memory sources = new address[](1);
    sources[0] = address(new MockAggregator(int256(_price / 2)));
    vm.prank(oracleOwner);
    AaveOracle(aaveOracle).setAssetSources(assets, sources);
  }
}

interface IUsdcToken {
  function mint(address to, uint256 amount) external;

  function configureMinter(address minter, uint256 minterAllowedAmount) external;
}
