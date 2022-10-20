// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../Multicall.sol";

contract MockReturnData {
    bytes returndata;
    bool reverts;

    constructor(bytes memory returndata_, bool reverts_) {
        returndata = returndata_;
        reverts = reverts_;
    }

    fallback() external {
        bytes memory returndatamem = returndata;

        if (reverts) {
            assembly {
                revert(add(returndatamem, 0x20), mload(returndatamem))
            }
        }
        assembly {
            return(add(returndatamem, 0x20), mload(returndatamem))
        }
    }
}

contract MulticallTest is Test {
    function setUp() public {}

    function test(bytes[] memory mockcalldata, bytes[] memory mockreturndata)
        public
    {
        vm.assume(mockcalldata.length == mockreturndata.length);
        // bytes memory mockreturndata = abi.encode(123, "hello");

        address[] memory targets = new address[](mockreturndata.length);
        for (uint256 i; i < targets.length; i++) {
            targets[i] = address(new MockReturnData(mockreturndata[i], false));
        }

        // bytes[] memory datas = new bytes[](1);
        // datas[0] = abi.encodeWithSelector(0x12345678, abi.encode(123));
        // datas[0] = abi.encodeWithSelector(bytes4(keccak256("testxvar()")));

        bytes memory resultsEnc = address(
            new Multicall(targets, mockcalldata, true)
            // new MulticallSingleTarget(targets[0], mockcalldata, true)
        ).code;
        bytes[] memory results = abi.decode(resultsEnc, (bytes[]));

        // assertEq(results[0], mockreturndata);
        for (uint256 i; i < targets.length; i++) {
            assertEq(results[i], mockreturndata[i]);
        }
    }

    // function testGas(bytes[] memory mockreturndata) public {
    //     // bytes memory mockreturndata = abi.encode(123, "hello");

    //     address[] memory targets = new address[](mockreturndata.length);
    //     for (uint256 i; i < targets.length; i++) {
    //         targets[i] = address(new MockReturnData(mockreturndata[i], false));
    //     }

    //     bytes[] memory datas = new bytes[](1);
    //     // datas[0] = abi.encodeWithSelector(0x12345678, abi.encode(123));
    //     datas[0] = abi.encodeWithSelector(bytes4(keccak256("testxvar()")));

    //     bytes memory resultsEnc = address(
    //         new MulticallSingleTarget(targets[0], datas, true)
    //     ).code;
    //     bytes[] memory results = abi.decode(resultsEnc, (bytes[]));

    //     // assertEq(results[0], mockreturndata);
    //     assertEq(results[0], abi.encode(234));
    // }
}
