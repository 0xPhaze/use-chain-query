# useChainQuery
A hook that bundles all requests to the blockchain and efficiently provides cached results.
Intentionally left to be very flexible and lenient.

With useChainQuery
- calls are aggregated for a small duration (1 second by default) and sent in one batched call
- results are cached and re-rendering components won't re-fire calls
- any required refresh can be triggered manually

```javascript
function Component() {
  const [name, updateName] = useChainQuery(erc20Address, 'name')
  const [symbol, updateSymbol] = useChainQuery(erc20Address, 'symbol')

  return <p>name: {name?.toString()}</p>
}
```

## Installation
```sh
npm i use-chain-query
```

## Importing

```javascript
import { ethers } from 'ethers'
import { createChainQuery } from 'use-chain-query'
import { abi, contractAddress } from '.'

const provider = ethers.getDefaultProvider('mainnet')
const contract = new ethers.Contract(contractAddress, abi)

export const useChainQuery = createChainQuery(contract.interface, provider)
```

## Usage with React

While useChainQuery does not require to be used with react, its original intent is to be called as a hook. The function takes in an address
to which the call is directed to, a name of the function to be
called, and arguments (in an array) to pass along. 

```javascript
function Component() {
  const account = useAccount();
  // @param address string: contract address
  // @param functionName string: name of the function to call
  // @param args any[]: arguments
  // @param argsList any[][] (optional): list of arguments
  // @return [result, update]
  // @return result any: ethers interface decoded result
  // @return update function: function that will trigger a new call
  const [ids = [], updateIds] = useChainQuery(contractAddress, 'getOwnedIds', [account])

  return (
    <>
      <h1>Owned Ids for {`${account}`}:</h1>
      {ids.forEach((id, i) => (
        <p>
          {i}: {id.toString()}
        </p>
      ))}
    </>
  )
}
```

Using useChainQuery as seen above will immediately update the result with new ids as soon as `account` changes.

An empty array `[]` is set as the default return parameter for `ids` as `result` will be undefined when it has not been returned yet.
`updateIds` will place the call in the call-queue again and refresh the result.

## Flexible Nested Component Calls

useChainQuery doesn't mind if arguments are undefined or change.
As soon as all elements of the arguments array are well-defined, a request will
be sent and the response will trigger a state-update.

```javascript
function Component() {
  const ids = usePagination(20)

  const [marketItems = []] = useChainQuery(contractAddress, 'getMarketItem', undefined, ids.map(id => [id]))

  return (
    <>
      <h1>Market items</h1>
      {ids.forEach(id => <MarketItem id={id}>)}
    </>
  )
}

function MarketItem({id}) {
  const account = useAccount();

  const [marketItem] = useChainQuery(contractAddress, 'getMarketItem', [id])
  const [balance = ethers.constants.Zero, updateBalance] = useChainQuery(erc20Address, "balanceOf", [account]);

  return (
      <p>
        id {i}: name {marketItem.name} price {ethers.utils.formatEther(marketItem.price)}
      </p>
  )
}
```

Internally useChainQuery stores every individual function call result in a cache and only ever re-sends a request when an explicit update is needed.
That's why it's possible to pass in a list of arguments (this equates to multiple function calls), as in the above example with `marketItems` and fetch the results for an individual `marketItem` in a different component without having to worry about any additional requests being made.

## Parameters
```javascript
createChainQuery(
    interface, // ethersjs-interface
    provider, // ethersjs-provider
    maxCallQueue, // maximum number of calls in call queue
    callDelay, // delay for batching calls
    strict // if set to `true` ethers will throw when receiving incorrect data
);
```

## Concatenating ABIs

Currently, useChainQuery requires one complete interface to be passed for initialization. That's why there is a helper function that will concatenate ABIs allowing for one combined interface to be created when multiple contracts are being used.

```javascript
import { abiConcat } from "use-chain-query";

const combinedInterface = new ethers.utils.Interface(abiConcat([ERC20ABI, ERC721ABI]));
const useChainQuery = createChainQuery(combinedInterface, provider);
```

## Usage with Web3-React

useChainQuery is intended to be used with a provider with a constant connection, though it can also be used with [web3-react](https://github.com/Uniswap/web3-react), making use of the user's provider. 
However, the allowed chain ids should be restricted as
useChainQuery does not check whether the provider is on the correct chain.
Alternatively, `window.ethereum` could also be used.

```javascript
import { initializeConnector } from "@web3-react/core";
import { MetaMask } from "@web3-react/metamask";

const allowedChainIds = [1];
const [metamask, { useProvider, useAccount }] = initializeConnector(
  (actions) => new MetaMask(actions, false),
  allowedChainIds
);

function InjectProvider() {
  const provider = useProvider();

  useEffect(() => {
    metamask.activate(1);
  }, []);

  useEffect(() => {
    useChainQuery.useStore.getState().updateProvider(provider);
  }, [provider]);

  return null;
}
```

## Usage without React

useChainQuery is a wrapper around [zustand](https://github.com/pmndrs/zustand)'s state-management
system.
This can be directly accessed and listeners for updates can be placed on certain keys.

```javascript
import { buildCall } from "use-chain-query";

const calls = buildCall(
  contractAddress,
  'getMarketItem',
  undefined,
  [...Array(20)].map((_, id) => [id])
)

const useChainQueryStore = useChainQuery.useStore

// immediately dispatch queries for first 20 market items
useChainQueryStore.getState().dispatchCalls(calls)

// only want to listen for our "subscribed" keys
const subscribedKeys = Object.keys(calls)

const itemUpdateListener = (item) => {
  console.log('update for item registered', item)
}

// listen to updates in cached results only for keys
useChainQueryStore.subscribe(
  (state) => subscribedKeys.map((key) => state.cachedResults[key]),
  itemUpdateListener,
  {
    equalityFn: shallow
  }
)
```

Alternatively calls can be queued and aggregated individually.

```javascript
useChainQueryStore.getState().queueCall(target, functionName, args)
```

## Acknowledgements

- [indexed-finance](https://github.com/indexed-finance/multicall) for the return trick on multicall
- [Solady](https://github.com/Vectorized/solady/blob/main/src/utils/Multicallable.sol) for an optimized multicall implementation