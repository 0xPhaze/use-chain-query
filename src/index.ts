import create from "zustand";
import shallow from "zustand/shallow";
import { subscribeWithSelector } from "zustand/middleware";
import { ethers } from "ethers";

import { MulticallBytecode, MulticallSingleTargetBytecode } from "./Multicall.json";

const fragmentSignature = ({ inputs, name, type }: { inputs: []; name: string; type: string }) =>
  name +
  (["function", "event", "error"].includes(type) && inputs?.length > 0 ? `(${inputs.map(({ type }) => type)})` : "");

export const abiConcat = (arr: any) =>
  Object.values(
    Object.assign({}, ...[].concat(...arr).map((fragment) => ({ [fragmentSignature(fragment)]: fragment })))
  );

export const getCallKey = (target: string, func: string, args: any[] = [], chainId = 1): any =>
  target == undefined ||
  func == undefined ||
  args.some((arg) => arg == undefined) ||
  (func?.split("(")[1]?.split(")")[0]?.length && args.length == 0)
    ? undefined
    : `${chainId}::${target?.toLowerCase?.()}::${func}` + (func.endsWith("()") ? "" : `(${args})`);

export const buildCall = (target: string, func: string, args: any[], argsList?: any[][], chainId = 1) => {
  return Object.assign(
    {},
    ...(argsList || [args]).map((args) => ({
      [getCallKey(target, func, args, chainId)]: {
        target,
        func,
        args,
      },
    }))
  );
};

export const createChainQuery = (
  iface: ethers.utils.Interface,
  provider: ethers.providers.Provider,
  maxCallQueue = 20,
  queueCallDelay = 1000,
  strict = true,
  verbosity = 0
) => {
  const useChainQueryStore = create(
    subscribeWithSelector((set: Function, get: Function) => ({
      iface,
      provider,
      chainId: undefined,
      cachedResults: {},
      queuedCalls: {},
      dispatchedCalls: {},
      failedCalls: {},
      lastUpdateTime: {},
      queueTimeout: undefined,
      updateInterface(iface: ethers.utils.Interface) {
        if (get().iface != iface) {
          if (verbosity > 0) console.log("CQ: Updating interface", iface);
          get().iface = iface;
          get().runQueueDispatchCheck();
        }
      },
      updateProvider(provider: ethers.providers.Provider) {
        if (get().provider != provider) {
          if (verbosity > 0) console.log("CQ: Updating provider", provider);
          get().provider = provider;
          get().runQueueDispatchCheck();
        }
      },
      updateChainId(chainId: number) {
        if (verbosity > 0) console.log("CQ: Updating chainId", chainId);
        get().chainId = chainId;
      },
      getQueryResult(target: string, func: string, args: any[]): any {
        const key = getCallKey(target, func, args);

        const val = get().cachedResults[key];

        if (key in get().cachedResults && val != undefined) {
          // `val` will only be undefined when `key` is also in `cachedResults`
          // when using strict == false and returning an invalid encoded result
          if (verbosity > 1) console.log("CQ: Reading cache", key);
          return get().cachedResults[key];
        }
        if (key !== undefined) get().queueCall(target, func, args);
      },
      queueCall(target: string, func: string, args: any[]) {
        const chainId = get().chainId;
        const key = getCallKey(target, func, args, chainId);

        if (
          key !== undefined && // key is valid (all args defined)
          !(key in get().queuedCalls) && // not already aggregated
          !(key in get().dispatchedCalls) // not waiting for call result
        ) {
          if (verbosity > 0) console.log("CQ: Aggregating", key);

          get().queuedCalls = {
            ...get().queuedCalls,
            ...buildCall(target, func, args, chainId),
          };

          get().runQueueDispatchCheck();
        }
      },
      runQueueDispatchCheck() {
        if (get().provider === undefined || get().iface === undefined) return;

        const aggregatedCallsLen = Object.keys(get().queuedCalls).length;
        // if max call queue is reached, dispatch immediately
        if (aggregatedCallsLen >= maxCallQueue) get().dispatchQueuedCalls();
        // else set up new dispatch to run after time delay
        else if (aggregatedCallsLen > 0 && get().queueTimeout == undefined) {
          if (verbosity > 1) console.log("CQ: Setting new dispatch timeout");

          get().queueTimeout = setTimeout(get().dispatchQueuedCalls, queueCallDelay);
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
        if (get().provider === undefined || get().iface === undefined) return;

        // add calls to dispatched queue
        get().dispatchedCalls = { ...get().dispatchedCalls, ...calls };

        if (verbosity > 0) console.log("CQ: Dispatching", calls);

        let result: any[];

        try {
          result = await multiCall(get().provider, get().iface, Object.values(calls), strict);
        } catch (e) {
          get().failedCalls = {
            ...get().failedCalls,
            ...calls,
          };
          throw e;
        }

        result = Object.keys(calls).map((key, i) => ({
          [key]: result[i],
        }));

        if (verbosity > 1) console.log("CQ: Received", result);

        const now = new Date().getTime();
        const newUpdateTime = Object.keys(calls).map((key) => ({
          [key]: now,
        }));

        // set new results in cache
        set({
          cachedResults: Object.assign(get().cachedResults, ...result),
          lastUpdateTime: Object.assign(get().lastUpdateTime, ...newUpdateTime),
        });

        // clear keys from dispatching queue
        for (let key of Object.keys(calls)) delete get().dispatchedCalls[key];
      },
    }))
  );

  function useChainQuery(target: string, func: string, args: any[], argsList: any[][]) {
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
          buildCall(target, func, args, argsList),
        ] as any,
      ([a]: [any], [b]: [any]) => shallow(a, b) // this only updates `updateQuery` after a successful result
    );
  }

  useChainQuery.useStore = useChainQueryStore;

  return useChainQuery;
};

export async function multiCall(
  provider: ethers.providers.Provider,
  iface: ethers.utils.Interface,
  calls: any[],
  strict: boolean
) {
  const callData = calls.map(({ func, args }) => {
    try {
      return iface.encodeFunctionData(func, args);
    } catch (e) {
      console.log("CQ: ERROR: Failed encoding function call", func, "with args", args);
      throw e;
    }
  });

  const targets = calls.map(({ target }) => target);

  const singleTarget = targets.every((target) => target == targets[0]);
  // const singleTarget = false;

  const code = singleTarget ? MulticallSingleTargetBytecode : MulticallBytecode;
  const constructorArgs = singleTarget
    ? ethers.utils.defaultAbiCoder.encode(["address", "bytes[]", "bool"], [targets[0], callData, strict])
    : ethers.utils.defaultAbiCoder.encode(["address[]", "bytes[]", "bool"], [targets, callData, strict]);

  const encodedData = code.concat(constructorArgs.slice(2));

  let encodedReturnData: any;
  try {
    encodedReturnData = await provider.call({ data: encodedData });
  } catch (e) {
    console.log("CQ: ERROR: Multicall reverted on calls", calls);
    throw e;
  }
  try {
    const [returnData] = ethers.utils.defaultAbiCoder.decode(["bytes[]"], encodedReturnData);
    const results = returnData.map((data: string, i: number) => {
      if (!strict && data === "0x") return undefined;
      try {
        const result = iface.decodeFunctionResult(calls[i].func, data);
        return Array.isArray(result) && result.length == 1 ? result[0] : result;
      } catch (e) {
        console.log("CQ: ERROR: Failed decoding result from call", calls[i], "with data", data);
        throw e;
      }
    });

    return results;
  } catch (e) {
    console.log("CQ: ERROR: Failed decoding returndata", encodedReturnData, "with calls", calls);
    throw e;
  }
}
