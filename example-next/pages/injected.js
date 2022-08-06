// import { createChainQuery } from "use-chain-query";
import { createChainQuery, abiConcat } from "../../dist/index.js";
import { ethers } from "ethers";
import { initializeConnector } from "@web3-react/core";
import { MetaMask } from "@web3-react/metamask";

import ERC20ABI from "../data/ERC20ABI.json";
import ERC721ABI from "../data/ERC721ABI.json";

import { useEffect } from "react";

const [metamask, { useProvider, useAccount }] = initializeConnector((actions) => new MetaMask(actions, false));

const contractAddress = "0x3ad30c5e3496be07968579169a96f00d56de4c1a";

const combinedInterface = new ethers.utils.Interface(abiConcat([ERC20ABI, ERC721ABI]));

const useChainQuery = createChainQuery(undefined, combinedInterface, 10, 2000, 2);

export default function Container() {
  return (
    <>
      <InjectProvider />
      <Home />
    </>
  );
}

function Home() {
  const account = useAccount();

  const [name] = useChainQuery(contractAddress, "name", []);
  const [symbol] = useChainQuery(contractAddress, "symbol", []);
  const [balance = ethers.constants.Zero, updateBalance] = useChainQuery(contractAddress, "balanceOf", [account]);

  return (
    <>
      <p>{name}</p>
      <p>{symbol}</p>
      <p>{balance.toString()}</p>
      <button onClick={updateBalance}>Update Balance!</button>
    </>
  );
}

function InjectProvider() {
  const provider = useProvider();

  // useEffect(() => {
  //   const provider = new ethers.providers.Web3Provider(window.ethereum);
  //   useChainQuery.store.getState().updateProvider(provider);
  // }, []);

  useEffect(() => {
    metamask.activate(1);
  }, []);

  useEffect(() => {
    useChainQuery.useStore.getState().updateProvider(provider);
  }, [provider]);

  return null;
}
