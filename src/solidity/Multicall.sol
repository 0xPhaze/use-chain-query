// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Multicall
/// @notice Multicall allows for batch-reading data from the blockchain
/// @notice Optimized so that memory copies are skipped
/// @author 0xPhaze (https://github.com/0xPhaze/Multicall)
/// @author Modified from Solady (https://github.com/vectorized/solady/blob/main/src/utils/Multicallable.sol)
/// @author Modified from Solmate (https://github.com/transmissions11/solmate/blob/main/src/utils/Multicallable.sol)
contract Multicall {
    constructor(
        address[] memory targets,
        bytes[] memory data,
        bool strict
    ) payable {
        assembly {
            let dataLength := mload(data)
            let targetsLength := mload(targets)

            if iszero(eq(dataLength, targetsLength)) {
                revert(0, 0)
            }

            let returndata := mload(0x40) // Point `results` to start of free memory
            let results := add(returndata, 0x20) // Pointer to `results`.

            mstore(returndata, 0x20) // Store offset to `results` in returndata.
            mstore(results, dataLength) // Store `dataLength` into `results`.

            let currentResultPtr := add(results, 0x20) // Pointer to current result.
            let dataLengthBytes := shl(5, dataLength) // `shl` 5 is equivalent to multiplying by 0x20.

            // Pointer to the top of the memory (i.e. start of the free memory).
            let end := add(currentResultPtr, dataLengthBytes)
            let memPtr := end

            let resultOffset := dataLengthBytes // Pointer to offset of `result` in abi-encoded returndata.

            let dataPtr := add(data, 0x20) // Pointer to data[i].
            let dataPtrEnd := add(dataPtr, dataLengthBytes)
            let targetPtr := add(targets, 0x20) // Pointer to targets[i].

            let returndatasz

            // prettier-ignore
            for {} iszero(eq(dataPtr, dataPtrEnd)) {} {
                // The position of the current bytes in memory.
                let currentData := mload(dataPtr)

                switch call(gas(), mload(targetPtr), 0, add(currentData, 0x20), mload(currentData), 0x00, 0x00) 
                case 0 {
                    if strict {
                        // Bubble up the revert if the call reverts.
                    returndatacopy(0x00, 0x00, returndatasize())
                    revert(0x00, returndatasize())
                }

                    returndatasz := 0
                }
                case 1 {
                    returndatasz := returndatasize()
                }
                // Append the current result at `memPtr` into `results`
                // by storing the abi-encoded relative offset.
                mstore(currentResultPtr, resultOffset)
                currentResultPtr := add(currentResultPtr, 0x20)

                // Append the `returndatasz`, and the return data.
                mstore(memPtr, returndatasz)
                returndatacopy(add(memPtr, 0x20), 0x00, returndatasz)
                // Advance the `memPtr` by `returndatasz + 0x20`,
                // rounded up to the next multiple of 32.
                let advancePtr := shl(5, shr(5, add(returndatasz, 0x3f)))

                memPtr := add(memPtr, advancePtr)
                resultOffset := add(resultOffset, advancePtr)

                dataPtr := add(dataPtr, 0x20)
                targetPtr := add(targetPtr, 0x20)
            }

            return(returndata, sub(memPtr, returndata))
        }
    }
}

contract MulticallSingleTarget {
    constructor(
        address target,
        bytes[] memory data,
        bool strict
    ) payable {
        assembly {
            let dataLength := mload(data)
            let returndata := mload(0x40) // Point `results` to start of free memory
            let results := add(returndata, 0x20) // Pointer to `results`.

            mstore(returndata, 0x20) // Store offset to `results` in returndata.
            mstore(results, dataLength) // Store `dataLength` into `results`.

            let currentResultPtr := add(results, 0x20) // Pointer to current result.
            let dataLengthBytes := shl(5, dataLength) // `shl` 5 is equivalent to multiplying by 0x20.

            // Pointer to the top of the memory (i.e. start of the free memory).
            let end := add(currentResultPtr, dataLengthBytes)
            let memPtr := end

            let resultOffset := dataLengthBytes // Pointer to offset of `result` in returndata.

            let dataPtr := add(data, 0x20) // Pointer to data[i].
            let dataPtrEnd := add(dataPtr, dataLengthBytes)

            let returndatasz

            // prettier-ignore
            for {} iszero(eq(dataPtr, dataPtrEnd)) {} {
                // The position of the current bytes in memory.
                let currentData := mload(dataPtr)


                switch call(gas(), target, 0, add(currentData, 0x20), mload(currentData), 0x00, 0x00) 
                case 0 {
                    if strict {
                        // Bubble up the revert if the delegatecall reverts.
                        returndatacopy(0x00, 0x00, returndatasize())
                        revert(0x00, returndatasize())
                    }

                    returndatasz := 0
                }
                case 1 {
                    returndatasz := returndatasize()
                }

                // Append the current result at `memPtr` into `results`
                // by storing the abi-encoded relative offset.
                mstore(currentResultPtr, resultOffset)
                currentResultPtr := add(currentResultPtr, 0x20)

                // Append the `returndatasz`, and the return data.
                mstore(memPtr, returndatasz)
                returndatacopy(add(memPtr, 0x20), 0x00, returndatasz)
                // Advance the `memPtr` by `returndatasz + 0x20`,
                // rounded up to the next multiple of 32.
                let advancePtr := shl(5, shr(5, add(returndatasz, 0x3f)))

                memPtr := add(memPtr, advancePtr)
                resultOffset := add(resultOffset, advancePtr)

                dataPtr := add(dataPtr, 0x20)
            }

            return(returndata, sub(memPtr, returndata))
        }
    }
}

contract MulticallRef {
    constructor(
        address[] memory targets,
        bytes[] memory datas,
        bool strict
    ) payable {
        uint256 len = targets.length;
        require(datas.length == len);

        bytes[] memory returnDatas = new bytes[](len);

        for (uint256 i = 0; i < len; ++i) {
            address target = targets[i];
            (bool success, bytes memory returnData) = target.call(datas[i]);
            if (!success) {
                if (strict) {
                    assembly {
                        // Bubble up the revert if the call reverts.
                        returndatacopy(0x00, 0x00, returndatasize())
                        revert(0x00, returndatasize())
                    }
                }
                returnDatas[i] = bytes("");
            } else {
                returnDatas[i] = returnData;
            }
        }

        bytes memory data = abi.encode(returnDatas);

        assembly {
            return(add(data, 32), data)
        }
    }
}
