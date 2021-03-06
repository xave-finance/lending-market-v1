import { task } from 'hardhat/config';
import * as marketConfigs from '../../../markets/halo';
import { getIErc20Detailed, getLendingPool, getMintableERC20 } from '../../../helpers/contracts-getters';
import { setDRE } from '../../../helpers/misc-utils';
import { formatEther, parseEther } from '@ethersproject/units';
import { ethers } from 'ethers';

task('external:lendingpool-action', 'Trigger individual lending pool')
  .addParam('action', 'Pool action to call')
  .addParam('amount', 'Amount to use')
  .setAction(async ({ verify, symbol, action, amount }, localBRE) => {
    const network = localBRE.network.name;
    setDRE(localBRE);

    const DEPLOYER_ADDRESS = '0x235A2ac113014F9dcb8aBA6577F20290832dDEFd';
    const TEST_ASSET = marketConfigs.HaloConfig.ReserveAssets[network].USDC;

    const lendingPool = await getLendingPool(marketConfigs.HaloConfig.LendingPool[network]);
    const TEST_AMOUNT = parseEther(amount);
    const token = await getMintableERC20(TEST_ASSET);
    const TOKEN_NAME = await token.name();

    switch (action) {
      case 'mintToken':
        await token.mint(amount);
        console.log(`Minted ${amount} ${TOKEN_NAME}`);
        break;
      case 'approveToken':
        await token.approve(lendingPool.address, ethers.constants.MaxUint256);
        console.log(`${TOKEN_NAME} approved spend in lending market!`);
        break;
      case 'deposit':
        await lendingPool.deposit(TEST_ASSET, TEST_AMOUNT, DEPLOYER_ADDRESS, 0);
        console.log('Deposit successful!');
        break;
      case 'withdraw':
        await lendingPool.withdraw(TEST_ASSET, TEST_AMOUNT, DEPLOYER_ADDRESS);
        console.log('Withdraw successful!');
        break;
      case 'borrow':
        await lendingPool.borrow(TEST_ASSET, TEST_AMOUNT, 2, 0, DEPLOYER_ADDRESS);
        console.log('Borrow successful!');
        break;
      case 'repay':
        await lendingPool.repay(TEST_ASSET, TEST_AMOUNT, 2, DEPLOYER_ADDRESS);
        console.log('Repay successful!');
        break;
      case 'getUserReserveData':
        const reserveData = await lendingPool.getReserveData(TEST_ASSET);
        console.log(`
        Reserve Data for ${TOKEN_NAME}: 
        liquidityIndex: ${reserveData.liquidityIndex},
        variableBorrowIndex: ${reserveData.variableBorrowIndex},
        currentLiquidityRate: ${reserveData.currentLiquidityRate},
        currentVariableBorrowRate: ${reserveData.currentVariableBorrowRate},
        currentStableBorrowRate: ${reserveData.currentStableBorrowRate},
        lastUpdateTimestamp: ${reserveData.lastUpdateTimestamp},
        aTokenAddress: ${reserveData.aTokenAddress},
        stableDebtTokenAddress: ${reserveData.stableDebtTokenAddress},
        variableDebtTokenAddress: ${reserveData.variableDebtTokenAddress}',
        interestRateStrategyAddress: ${reserveData.interestRateStrategyAddress},
        id: ${reserveData.id}
        `);
        break;
      case 'getReservesList':
        console.log(await lendingPool.getReservesList());
        break;
      case 'setUserUseReserveAsCollateral':
        await lendingPool.setUserUseReserveAsCollateral(TEST_ASSET, true);
        console.log(`${TOKEN_NAME} set as collateral!`);
      case 'getUserAccountData':
        const accountData = await lendingPool.getUserAccountData(DEPLOYER_ADDRESS);
        console.log(
          `
          Account Data for ${DEPLOYER_ADDRESS}:
          totalCollateralETH: ${accountData.totalCollateralETH}, 
          totalDebtEth: ${accountData.totalDebtETH}, 
          availableBorrowsETH: ${accountData.availableBorrowsETH}, 
          currentLiquidationThreshold: ${accountData.currentLiquidationThreshold}, L
          TV: ${accountData.ltv}, 
          healthfactor: ${accountData.healthFactor}`
        );
        break;
      default:
        console.log('action not found');
        break;
    }
  });
