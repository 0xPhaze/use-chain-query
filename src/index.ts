import create from "zustand";
import shallow from "zustand/shallow";
import { subscribeWithSelector } from "zustand/middleware";
import { ethers } from "ethers";

import { MulticallCode, MulticallSingleTargetCode } from "./Multicall.json";

export const getCallKey = (target: string, func: Function, args: any[], chainId = 1): any =>
  target == undefined ||
  func == undefined ||
  args == undefined ||
  (Array.isArray(args) && args.some((arg) => arg == undefined))
    ? undefined
    : `${chainId}::${target}::${func}(${args})`;

export const buildCall = (target: string, func: Function, args: any[], argsList?: any[][], chainId = 1) => {
  return Object.assign(
    {},
    ...(argsList || [args]).map((args) => ({
      [getCallKey(target, func, args, chainId)]: {
        target,
        func,
        args: Array.isArray(args) ? args : [args],
      },
    }))
  );
};

export const initializeChainQuery = (
  provider = null,
  iface = null,
  maxCallQueue = 20,
  queueCallDelay = 2000,
  verbosity = 0
) => {
  const useChainQueryStore = create(
    // return create(
    subscribeWithSelector((set: Function, get: Function) => ({
      provider,
      iface,
      cachedResults: {},
      queuedCalls: {},
      dispatchedCalls: {},
      failedCalls: {},
      queueTimeout: undefined,
      updateInterface(iface: ethers.utils.Interface) {
        if (verbosity > 0) console.log("CQ: Updating interface", iface);
        get().iface = iface;
        get().runQueueDispatchCheck();
      },
      updateProvider(provider: ethers.providers.Provider) {
        if (verbosity > 0) console.log("CQ: Updating provider", provider);
        get().provider = provider;
        get().runQueueDispatchCheck();
      },
      getQueryResult(target: string, func: Function, args: [any]) {
        const key = getCallKey(target, func, args);

        if (verbosity > 1) console.log("CQ: Checking cache", key);
        if (key in get().cachedResults) return get().cachedResults[key];
        if (key !== undefined) get().queueCall(target, func, args);
      },
      queueCall(target: string, func: Function, args: [any]) {
        const key = getCallKey(target, func, args);

        if (
          key !== undefined && // key is valid (all args defined)
          !(key in get().queuedCalls) && // not already aggregated
          !(key in get().dispatchedCalls) // not waiting for call result
        ) {
          if (verbosity > 0) console.log("CQ: Aggregating", key);

          get().queuedCalls = {
            ...get().queuedCalls,
            ...buildCall(target, func, args),
          };

          get().runQueueDispatchCheck();
        }
      },
      runQueueDispatchCheck() {
        if (verbosity > 2) console.log("CQ: Running dispatch check");

        if (get().provider !== undefined && get().iface !== undefined) {
          const aggregatedCallsLen = Object.keys(get().queuedCalls).length;
          // if max call queue is reached, dispatch immediately
          if (aggregatedCallsLen >= maxCallQueue) get().dispatchQueuedCalls();
          // else set up new dispatch to run after time delay
          else if (aggregatedCallsLen > 0 && get().queueTimeout == undefined) {
            if (verbosity > 0) console.log("CQ: Setting new dispatch timeout");

            get().queueTimeout = setTimeout(get().dispatchQueuedCalls, queueCallDelay);
          }
        }
      },
      dispatchQueuedCalls() {
        if (get().provider === undefined || get().iface === undefined) return;

        const currentCalls = get().queuedCalls;

        // clear aggregated calls
        get().queuedCalls = {};

        // clear queueTimeout, so new calls can be aggregated
        clearTimeout(get().queueTimeout);
        get().queueTimeout = undefined;

        get().dispatchCalls(currentCalls);
      },
      async dispatchCalls(calls: object) {
        if (get().provider === undefined) return;
        if (get().iface === undefined) return;

        // add calls to dispatched queue
        get().dispatchedCalls = { ...get().dispatchedCalls, ...calls };

        if (verbosity > 0) console.log("CQ: Dispatching", calls);

        let result: [any];
        try {
          result = await multiCall(get().provider, get().iface, Object.values(calls));
        } catch (e) {
          get().failedCalls = {
            ...get().failedCalls,
            ...calls,
          };
          throw e;
        }

        // set new results in cache
        set({
          cachedResults: Object.assign(
            get().cachedResults,
            ...Object.keys(calls).map((key, i) => ({
              [key]: result[i] ?? undefined,
            })) // failed call => null
          ),
        });

        // clear keys from dispatching queue
        for (let key of Object.keys(calls)) delete get().dispatchedCalls[key];
      },
    }))
  );

  // return useChainQueryStore

  function useChainQuery(target: string, func: Function, args: any[], argsList: any[][]) {
    if (verbosity > 2)
      console.log("CQ: Hook call", `target: ${target}, func: ${func}, args: ${args}, argsList: ${argsList}`);

    return useChainQueryStore(
      ({ getQueryResult, queueCall }: { getQueryResult: Function; queueCall: Function }) =>
        [
          argsList !== undefined
            ? argsList?.map((args) => getQueryResult(target, func, args))
            : getQueryResult(target, func, args),
          argsList !== undefined
            ? () => argsList.map((args) => queueCall(target, func, args))
            : () => queueCall(target, func, args),
        ] as any,
      ([a]: [any], [b]: [any]) => shallow(a, b) // this only updates `updateQuery` after a successful result
    );
  }

  useChainQuery.store = useChainQueryStore;

  return useChainQuery;
};

export const useChainQuery = initializeChainQuery();

export async function multiCall(provider: ethers.providers.Provider, iface: ethers.utils.Interface, calls: any[]) {
  const callData = calls.map(({ func, args }) => iface.encodeFunctionData(func, args));
  const targets = calls.map(({ target }) => target);

  const singleTarget = targets.every((target) => target == targets[0]);
  const constructorArgs = singleTarget
    ? ethers.utils.defaultAbiCoder.encode(["address", "bytes[]"], [targets[0], callData])
    : ethers.utils.defaultAbiCoder.encode(["address[]", "bytes[]"], [targets, callData]);
  const code = singleTarget ? MulticallSingleTargetCode : MulticallCode;
  const encodedData = code.concat(constructorArgs.slice(2));
  const encodedReturnData = await provider.call({ data: encodedData });
  const [returnData] = ethers.utils.defaultAbiCoder.decode(["bytes[]"], encodedReturnData);
  const results = returnData.map((data: string, i: number) => {
    const result = iface.decodeFunctionResult(calls[i].func, data);
    return Array.isArray(result) && result.length == 1 ? result[0] : result;
  });
  return results;
}
