"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiCall = exports.useChainQuery = exports.createChainQuery = exports.buildCall = exports.getCallKey = exports.abiConcat = void 0;
const zustand_1 = __importDefault(require("zustand"));
const shallow_1 = __importDefault(require("zustand/shallow"));
const middleware_1 = require("zustand/middleware");
const ethers_1 = require("ethers");
const Multicall_json_1 = require("./Multicall.json");
const fragmentSignature = ({ inputs, name, type }) => name +
    (["function", "event", "error"].includes(type) && (inputs === null || inputs === void 0 ? void 0 : inputs.length) > 0 ? `(${inputs.map(({ type }) => type)})` : "");
const abiConcat = (arr) => Object.values(Object.assign({}, ...[].concat(...arr).map((fragment) => ({ [fragmentSignature(fragment)]: fragment }))));
exports.abiConcat = abiConcat;
const getCallKey = (target, func, args, chainId = 1) => target == undefined || func == undefined || args == undefined || args.some((arg) => arg == undefined)
    ? undefined
    : `${chainId}::${target}::${func}(${args})`;
exports.getCallKey = getCallKey;
const buildCall = (target, func, args, argsList, chainId = 1) => {
    return Object.assign({}, ...(argsList || [args]).map((args) => ({
        [(0, exports.getCallKey)(target, func, args, chainId)]: {
            target,
            func,
            args,
        },
    })));
};
exports.buildCall = buildCall;
const createChainQuery = (provider = undefined, iface = undefined, maxCallQueue = 20, queueCallDelay = 1000, verbosity = 0) => {
    const useChainQueryStore = (0, zustand_1.default)((0, middleware_1.subscribeWithSelector)((set, get) => ({
        provider,
        iface,
        cachedResults: {},
        queuedCalls: {},
        dispatchedCalls: {},
        failedCalls: {},
        queueTimeout: undefined,
        updateInterface(iface) {
            if (get().iface != iface) {
                if (verbosity > 0)
                    console.log("CQ: Updating interface", iface);
                get().iface = iface;
                get().runQueueDispatchCheck();
            }
        },
        updateProvider(provider) {
            if (get().provider != provider) {
                if (verbosity > 0)
                    console.log("CQ: Updating provider", provider);
                get().provider = provider;
                get().runQueueDispatchCheck();
            }
        },
        getQueryResult(target, func, args) {
            const key = (0, exports.getCallKey)(target, func, args);
            if (key in get().cachedResults) {
                if (verbosity > 1)
                    console.log("CQ: Reading cache", key);
                return get().cachedResults[key];
            }
            if (key !== undefined)
                get().queueCall(target, func, args);
        },
        queueCall(target, func, args) {
            const key = (0, exports.getCallKey)(target, func, args);
            if (key !== undefined && // key is valid (all args defined)
                !(key in get().queuedCalls) && // not already aggregated
                !(key in get().dispatchedCalls) // not waiting for call result
            ) {
                if (verbosity > 0)
                    console.log("CQ: Aggregating", key);
                get().queuedCalls = {
                    ...get().queuedCalls,
                    ...(0, exports.buildCall)(target, func, args),
                };
                get().runQueueDispatchCheck();
            }
        },
        runQueueDispatchCheck() {
            if (get().provider === undefined || get().iface === undefined)
                return;
            const aggregatedCallsLen = Object.keys(get().queuedCalls).length;
            // if max call queue is reached, dispatch immediately
            if (aggregatedCallsLen >= maxCallQueue)
                get().dispatchQueuedCalls();
            // else set up new dispatch to run after time delay
            else if (aggregatedCallsLen > 0 && get().queueTimeout == undefined) {
                if (verbosity > 1)
                    console.log("CQ: Setting new dispatch timeout");
                get().queueTimeout = setTimeout(get().dispatchQueuedCalls, queueCallDelay);
            }
        },
        dispatchQueuedCalls() {
            if (get().provider === undefined || get().iface === undefined)
                return;
            const currentCalls = get().queuedCalls;
            // clear aggregated calls
            get().queuedCalls = {};
            // clear queueTimeout, so new calls can be aggregated
            clearTimeout(get().queueTimeout);
            get().queueTimeout = undefined;
            get().dispatchCalls(currentCalls);
        },
        async dispatchCalls(calls) {
            if (get().provider === undefined || get().iface === undefined)
                return;
            // add calls to dispatched queue
            get().dispatchedCalls = { ...get().dispatchedCalls, ...calls };
            if (verbosity > 0)
                console.log("CQ: Dispatching", calls);
            let result;
            try {
                result = await multiCall(get().provider, get().iface, Object.values(calls));
            }
            catch (e) {
                get().failedCalls = {
                    ...get().failedCalls,
                    ...calls,
                };
                throw e;
            }
            result = Object.keys(calls).map((key, i) => ({
                [key]: result[i],
            }));
            if (verbosity > 1)
                console.log("CQ: Received", result);
            // set new results in cache
            set({
                cachedResults: Object.assign(get().cachedResults, ...result),
            });
            // clear keys from dispatching queue
            for (let key of Object.keys(calls))
                delete get().dispatchedCalls[key];
        },
    })));
    function useChainQuery(target, func, args, argsList) {
        if (verbosity > 2)
            console.log("CQ: Hook call", `target: ${target}, func: ${func}, args: ${args}, argsList: ${argsList}`);
        return useChainQueryStore(({ getQueryResult, queueCall }) => [
            argsList !== undefined
                ? argsList === null || argsList === void 0 ? void 0 : argsList.map((args) => getQueryResult(target, func, args))
                : getQueryResult(target, func, args),
            argsList !== undefined
                ? () => argsList.map((args) => queueCall(target, func, args))
                : () => queueCall(target, func, args),
        ], ([a], [b]) => (0, shallow_1.default)(a, b) // this only updates `updateQuery` after a successful result
        );
    }
    useChainQuery.useStore = useChainQueryStore;
    return useChainQuery;
};
exports.createChainQuery = createChainQuery;
exports.useChainQuery = (0, exports.createChainQuery)();
async function multiCall(provider, iface, calls) {
    const callData = calls.map(({ func, args }) => iface.encodeFunctionData(func, args));
    const targets = calls.map(({ target }) => target);
    const singleTarget = targets.every((target) => target == targets[0]);
    const constructorArgs = singleTarget
        ? ethers_1.ethers.utils.defaultAbiCoder.encode(["address", "bytes[]"], [targets[0], callData])
        : ethers_1.ethers.utils.defaultAbiCoder.encode(["address[]", "bytes[]"], [targets, callData]);
    const code = singleTarget ? Multicall_json_1.MulticallSingleTargetCode : Multicall_json_1.MulticallCode;
    const encodedData = code.concat(constructorArgs.slice(2));
    const encodedReturnData = await provider.call({ data: encodedData });
    const [returnData] = ethers_1.ethers.utils.defaultAbiCoder.decode(["bytes[]"], encodedReturnData);
    const results = returnData.map((data, i) => {
        const result = iface.decodeFunctionResult(calls[i].func, data);
        return Array.isArray(result) && result.length == 1 ? result[0] : result;
    });
    return results;
}
exports.multiCall = multiCall;
