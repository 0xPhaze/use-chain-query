"use strict";
// import MulticallCode from "./Multicall.json";
exports.__esModule = true;
exports.multiply = void 0;
function multiply(a, b) {
    console.log(a, b);
    return a * b;
}
exports.multiply = multiply;
// console.log(MulticallCode);
// import { useCallback, useEffect, useRef, useState } from 'react'
// import { config } from '../config'
// import {
//   childProvider,
//   rootProvider,
//   usePriorityAccount,
//   usePriorityChainId,
//   usePriorityProvider
// } from '../lib'
// import { IAll } from './useContracts'
// // import { multiCall } from '@indexed-finance/multicall'
// import create from 'zustand'
// import shallow from 'zustand/shallow'
// import { subscribeWithSelector } from 'zustand/middleware'
// import { ethers } from 'ethers'
// const chainId = config.child.chainId
// export const getCallKey = (target, func, args) =>
//   target != undefined &&
//   func != undefined &&
//   args != undefined &&
//   args.every(arg => arg != undefined)
//     ? `${chainId}::${target}::${func}(${args})`
//     : undefined
// export const buildCallObject = (target, func, args, argsList) => {
//   return Object.assign(
//     {},
//     ...(argsList || [args]).map(args => ({
//       [getCallKey(target, func, args)]: {
//         target,
//         func,
//         args
//       }
//     }))
//   )
// }
// const createBundleQuery = (
//   provider,
//   maxCallQueue = 10,
//   queueCallDelay = 2000
// ) => {
//   return create(
//     subscribeWithSelector((set, get) => ({
//       provider,
//       cachedResults: {},
//       queuedCalls: {},
//       dispatchedCalls: {},
//       queueTimeout: undefined,
//       updateProvider(provider) {
//         get().provider = provider
//         get().runQueueDispatchCheck()
//       },
//       getQueryResult(target, func, args) {
//         const key = getCallKey(target, func, args)
//         // console.log("query for", key);
//         // console.log("exists", key in get().cachedResults);
//         if (key in get().cachedResults) return get().cachedResults[key]
//         if (key !== undefined) get().queueCall(target, func, args)
//       },
//       runQueueDispatchCheck() {
//         if (get().provider !== undefined) {
//           const aggregatedCallsLen = Object.keys(get().queuedCalls).length
//           // if max call queue is reached, dispatch immediately
//           if (aggregatedCallsLen >= maxCallQueue) get().dispatchQueuedCalls()
//           // else set up new dispatch to run after time delay
//           else if (aggregatedCallsLen > 0 && get().queueTimeout == undefined) {
//             // console.log("setting timeout");
//             get().queueTimeout = setTimeout(
//               get().dispatchQueuedCalls,
//               queueCallDelay
//             )
//           }
//         }
//       },
//       queueCall(target, func, args) {
//         const key = getCallKey(target, func, args)
//         if (
//           key !== undefined && // key is valid (all args defined)
//           !(key in get().queuedCalls) && // not already aggregated
//           !(key in get().dispatchedCalls) // not waiting for call result
//         ) {
//           // console.log("aggregating", key);
//           get().queuedCalls = {
//             ...get().queuedCalls,
//             [key]: {
//               target,
//               func,
//               args
//             }
//           }
//           get().runQueueDispatchCheck()
//         }
//       },
//       dispatchQueuedCalls() {
//         if (get().provider === undefined) return
//         const currentCalls = get().queuedCalls
//         // clear aggregated calls
//         get().queuedCalls = {}
//         // clear queueTimeout, so new calls can be aggregated
//         clearTimeout(get().queueTimeout)
//         get().queueTimeout = undefined
//         get().dispatchCalls(currentCalls)
//       },
//       async dispatchCalls(calls) {
//         if (get().provider === undefined) return
//         // add calls to dispatch queue
//         get().dispatchedCalls = { ...get().dispatchedCalls, ...calls }
//         // console.log('dispatching', calls)
//         const result = await multiCall(
//           get().provider,
//           IAll,
//           Object.values(calls)
//         )
//         // set new results in cache
//         set({
//           cachedResults: Object.assign(
//             get().cachedResults,
//             ...Object.keys(calls).map((key, i) => ({
//               [key]: result[i] ?? undefined
//             })) // failed call => null
//           )
//         })
//         // clear keys from dispatching queue
//         for (let key of Object.keys(calls)) delete get().dispatchedCalls[key]
//       }
//     }))
//   )
// }
// export const useBundleQuery = createBundleQuery()
// export const useBundleQueryChild = createBundleQuery(childProvider)
// export const useBundleQueryRoot = createBundleQuery(rootProvider)
// export function useChainQueryChild(target, func, args, argsList) {
//   // const [result, updateQuery] = useBundleQueryChild(
//   return useBundleQueryChild(
//     ({ getQueryResult, queueCall }) => [
//       argsList !== undefined
//         ? argsList?.map(args => getQueryResult(target, func, args))
//         : getQueryResult(target, func, args),
//       argsList !== undefined
//         ? () => argsList.map(args => queueCall(target, func, args))
//         : () => queueCall(target, func, args)
//     ],
//     ([a], [b]) => shallow(a, b) // this only updates `updateQuery` after a successful result
//   )
// }
// export function useERC721NameQuery(address) {
//   return useChainQuery(address, 'name')
// }
// export function useERC20BalanceQuery(address, account) {
//   return useChainQuery(address, 'balanceOf', [account])
// }
// async function multiCall(provider, iface, inputs) {
//   const callData = inputs.map(({ func, args }) =>
//     iface.encodeFunctionData(func, args)
//   )
//   const targets = inputs.map(({ target }) => target)
//   const singleTarget = targets.every(target => target == targets[0])
//   const constructorArgs = singleTarget
//     ? ethers.utils.defaultAbiCoder.encode(
//         ['address', 'bytes[]'],
//         [targets[0], callData]
//       )
//     : ethers.utils.defaultAbiCoder.encode(
//         ['address[]', 'bytes[]'],
//         [targets, callData]
//       )
//   const code = singleTarget ? MulticallSingleTargetCode : MulticallCode
//   const encodedData = code.concat(constructorArgs.slice(2))
//   const encodedReturnData = await provider.call({ data: encodedData })
//   console.log(targets)
//   if (singleTarget) console.log('calling single')
//   const [returnData] = ethers.utils.defaultAbiCoder.decode(
//     ['bytes[]'],
//     encodedReturnData
//   )
//   const results = returnData.map((data, i) => {
//     const result = iface.decodeFunctionResult(inputs[i].func, data)
//     return Array.isArray(result) && result.length == 1 ? result[0] : result
//   })
//   return results
// }
