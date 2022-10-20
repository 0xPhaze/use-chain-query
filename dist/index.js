"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiCall = exports.createChainQuery = exports.buildCall = exports.getCallKey = exports.abiConcat = void 0;
const zustand_1 = __importDefault(require("zustand"));
const shallow_1 = __importDefault(require("zustand/shallow"));
const middleware_1 = require("zustand/middleware");
const ethers_1 = require("ethers");
const Multicall_json_1 = require("./Multicall.json");
const fragmentSignature = ({ inputs, name, type }) => name +
    (["function", "event", "error"].includes(type) && (inputs === null || inputs === void 0 ? void 0 : inputs.length) > 0 ? `(${inputs.map(({ type }) => type)})` : "");
const abiConcat = (arr) => Object.values(Object.assign({}, ...[].concat(...arr).map((fragment) => ({ [fragmentSignature(fragment)]: fragment }))));
exports.abiConcat = abiConcat;
const getCallKey = (target, func, args = [], chainId = 1) => {
    var _a, _b, _c;
    return target == undefined ||
        func == undefined ||
        args.some((arg) => arg == undefined) ||
        (((_b = (_a = func === null || func === void 0 ? void 0 : func.split("(")[1]) === null || _a === void 0 ? void 0 : _a.split(")")[0]) === null || _b === void 0 ? void 0 : _b.length) && args.length == 0)
        ? undefined
        : `${chainId}::${(_c = target === null || target === void 0 ? void 0 : target.toLowerCase) === null || _c === void 0 ? void 0 : _c.call(target)}::${func}` + (func.endsWith("()") ? "" : `(${args})`);
};
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
const createChainQuery = (iface, provider, maxCallQueue = 20, queueCallDelay = 1000, strict = true, verbosity = 0) => {
    const useChainQueryStore = (0, zustand_1.default)((0, middleware_1.subscribeWithSelector)((set, get) => ({
        iface,
        provider,
        chainId: undefined,
        cachedResults: {},
        queuedCalls: {},
        dispatchedCalls: {},
        failedCalls: {},
        lastUpdateTime: {},
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
        updateChainId(chainId) {
            if (verbosity > 0)
                console.log("CQ: Updating chainId", chainId);
            get().chainId = chainId;
        },
        getQueryResult(target, func, args) {
            const key = (0, exports.getCallKey)(target, func, args);
            const val = get().cachedResults[key];
            if (key in get().cachedResults && val != undefined) {
                // `val` will only be undefined when `key` is also in `cachedResults`
                // when using strict == false and returning an invalid encoded result
                if (verbosity > 1)
                    console.log("CQ: Reading cache", key);
                return get().cachedResults[key];
            }
            if (key !== undefined)
                get().queueCall(target, func, args);
        },
        queueCall(target, func, args) {
            const chainId = get().chainId;
            const key = (0, exports.getCallKey)(target, func, args, chainId);
            if (key !== undefined && // key is valid (all args defined)
                !(key in get().queuedCalls) && // not already aggregated
                !(key in get().dispatchedCalls) // not waiting for call result
            ) {
                if (verbosity > 0)
                    console.log("CQ: Aggregating", key);
                get().queuedCalls = {
                    ...get().queuedCalls,
                    ...(0, exports.buildCall)(target, func, args, chainId),
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
                result = await multiCall(get().provider, get().iface, Object.values(calls), strict);
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
            (0, exports.buildCall)(target, func, args, argsList),
        ], ([a], [b]) => (0, shallow_1.default)(a, b) // this only updates `updateQuery` after a successful result
        );
    }
    useChainQuery.useStore = useChainQueryStore;
    return useChainQuery;
};
exports.createChainQuery = createChainQuery;
async function multiCall(provider, iface, calls, strict) {
    const callData = calls.map(({ func, args }) => {
        try {
            return iface.encodeFunctionData(func, args);
        }
        catch (e) {
            console.log("CQ: ERROR: Failed encoding function call", func, "with args", args);
            throw e;
        }
    });
    const targets = calls.map(({ target }) => target);
    const singleTarget = targets.every((target) => target == targets[0]);
    // const singleTarget = false;
    const code = singleTarget ? Multicall_json_1.MulticallSingleTargetBytecode : Multicall_json_1.MulticallBytecode;
    const constructorArgs = singleTarget
        ? ethers_1.ethers.utils.defaultAbiCoder.encode(["address", "bytes[]", "bool"], [targets[0], callData, strict])
        : ethers_1.ethers.utils.defaultAbiCoder.encode(["address[]", "bytes[]", "bool"], [targets, callData, strict]);
    const encodedData = code.concat(constructorArgs.slice(2));
    let encodedReturnData;
    try {
        encodedReturnData = await provider.call({ data: encodedData });
    }
    catch (e) {
        console.log("CQ: ERROR: Multicall reverted on calls", calls);
        throw e;
    }
    try {
        const [returnData] = ethers_1.ethers.utils.defaultAbiCoder.decode(["bytes[]"], encodedReturnData);
        const results = returnData.map((data, i) => {
            if (!strict && data === "0x")
                return undefined;
            try {
                const result = iface.decodeFunctionResult(calls[i].func, data);
                return Array.isArray(result) && result.length == 1 ? result[0] : result;
            }
            catch (e) {
                console.log("CQ: ERROR: Failed decoding result from call", calls[i], "with data", data);
                throw e;
            }
        });
        return results;
    }
    catch (e) {
        console.log("CQ: ERROR: Failed decoding returndata", encodedReturnData, "with calls", calls);
        throw e;
    }
}
exports.multiCall = multiCall;
