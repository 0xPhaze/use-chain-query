// import { createChainQuery } from "use-chain-query";
import { createChainQuery } from "../../dist/index.js";
import { ethers } from "ethers";

import ERC20ABI from "../data/ERC20ABI.json";

const contractAddress = "0x3ad30c5e3496be07968579169a96f00d56de4c1a";

const provider = ethers.getDefaultProvider("mainnet");
const contract = new ethers.Contract(contractAddress, ERC20ABI);

const useChainQuery = createChainQuery(provider, contract.interface);
const account = "0x74De159B3a9372b7e85Fd00569a0929265b630eF";

export default function Home() {
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
