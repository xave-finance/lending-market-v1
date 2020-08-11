/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import { Contract, ContractTransaction, EventFilter, Signer } from "ethers";
import { Listener, Provider } from "ethers/providers";
import { Arrayish, BigNumber, BigNumberish, Interface } from "ethers/utils";
import {
  TransactionOverrides,
  TypedEventDescription,
  TypedFunctionDescription
} from ".";

interface MockAggregatorUniMkrEthInterface extends Interface {
  functions: {
    latestAnswer: TypedFunctionDescription<{ encode([]: []): string }>;
  };

  events: {
    AnswerUpdated: TypedEventDescription<{
      encodeTopics([current, roundId, timestamp]: [
        BigNumberish | null,
        BigNumberish | null,
        null
      ]): string[];
    }>;
  };
}

export class MockAggregatorUniMkrEth extends Contract {
  connect(
    signerOrProvider: Signer | Provider | string
  ): MockAggregatorUniMkrEth;
  attach(addressOrName: string): MockAggregatorUniMkrEth;
  deployed(): Promise<MockAggregatorUniMkrEth>;

  on(event: EventFilter | string, listener: Listener): MockAggregatorUniMkrEth;
  once(
    event: EventFilter | string,
    listener: Listener
  ): MockAggregatorUniMkrEth;
  addListener(
    eventName: EventFilter | string,
    listener: Listener
  ): MockAggregatorUniMkrEth;
  removeAllListeners(eventName: EventFilter | string): MockAggregatorUniMkrEth;
  removeListener(eventName: any, listener: Listener): MockAggregatorUniMkrEth;

  interface: MockAggregatorUniMkrEthInterface;

  functions: {
    latestAnswer(): Promise<BigNumber>;
  };

  latestAnswer(): Promise<BigNumber>;

  filters: {
    AnswerUpdated(
      current: BigNumberish | null,
      roundId: BigNumberish | null,
      timestamp: null
    ): EventFilter;
  };

  estimate: {
    latestAnswer(): Promise<BigNumber>;
  };
}
