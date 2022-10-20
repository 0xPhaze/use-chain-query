// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../Multicall.sol";

contract MockContract {
    uint256 public version = 1;
    string public name = "Mock";

    function func(uint256 data) public pure returns (uint256) {
        require(data == 123);
        return 0x1337;
    }
}

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

contract MockReturnDataSingleTarget {
    bytes[] returndata;
    bool[] reverts;
    uint256 numCalls;

    constructor(bytes[] memory returndata_, bool[] memory reverts_) {
        returndata = returndata_;
        reverts = reverts_;
    }

    fallback() external {
        uint256 callId = numCalls++;
        bytes memory returndatamem = returndata[callId];
        console.log("callid", callId, reverts[callId]);

        if (reverts[callId]) {
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

    function test_multicall_mock() public {
        bytes[] memory mockcalldata = new bytes[](3);
        address[] memory targets = new address[](3);
        bytes[] memory mockreturndata = new bytes[](3);

        mockcalldata[0] = abi.encodeWithSelector(
            bytes4(keccak256("version()"))
        );
        mockcalldata[1] = abi.encodeWithSelector(bytes4(keccak256("name()")));
        mockcalldata[2] = abi.encodeWithSelector(
            bytes4(keccak256("func(uint256)")),
            123
        );

        mockreturndata[0] = abi.encode(1);
        mockreturndata[1] = abi.encode("Mock");
        mockreturndata[2] = abi.encode(0x1337);

        address target = address(new MockContract());
        targets[0] = target;
        targets[1] = target;
        targets[2] = target;

        address resultsAddress = address(
            new Multicall(targets, mockcalldata, true)
        );
        bytes[] memory results = abi.decode(resultsAddress.code, (bytes[]));

        assertEq(results[0], mockreturndata[0]);
        assertEq(results[1], mockreturndata[1]);
        assertEq(results[2], mockreturndata[2]);

        resultsAddress = address(
            new MulticallSingleTarget(target, mockcalldata, true)
        );
        results = abi.decode(resultsAddress.code, (bytes[]));

        assertEq(results[0], mockreturndata[0]);
        assertEq(results[1], mockreturndata[1]);
        assertEq(results[2], mockreturndata[2]);
    }

    function test_multicall() public {
        bytes[] memory mockcalldata = new bytes[](2);
        address[] memory targets = new address[](2);
        bytes[] memory mockreturndata = new bytes[](2);

        mockcalldata[0] = abi.encodeWithSelector(
            bytes4(0x11338844),
            abi.encode("yo")
        );

        mockreturndata[0] = abi.encode(0x333);
        mockreturndata[1] = abi.encode(0x1337, "long stringy string");

        targets[0] = address(new MockReturnData(mockreturndata[0], false));
        targets[1] = address(new MockReturnData(mockreturndata[1], false));

        address resultsAddress = address(
            new Multicall(targets, mockcalldata, true)
        );
        bytes[] memory results = abi.decode(resultsAddress.code, (bytes[]));

        assertEq(results[0], mockreturndata[0]);
        assertEq(results[1], mockreturndata[1]);
    }

    function test_multicall_nonStrict(
        bytes[] memory mockcalldata_,
        bytes[] memory mockreturndata,
        bool[] memory reverts_
    ) public {
        uint256 len = mockreturndata.length;

        bytes[] memory mockcalldata = new bytes[](len);
        address[] memory targets = new address[](len);

        for (uint256 i; i < len; i++) {
            if (i < mockcalldata_.length) mockcalldata[i] = mockcalldata_[i];

            bool reverts = i < reverts_.length ? reverts_[i] : false;

            targets[i] = address(
                new MockReturnData(mockreturndata[i], reverts)
            );
        }

        address resultsAddress = address(
            new Multicall(targets, mockcalldata, false)
        );
        bytes[] memory results = abi.decode(resultsAddress.code, (bytes[]));

        for (uint256 i; i < len; i++) {
            bool reverts = i < reverts_.length ? reverts_[i] : false;
            assertEq(results[i], reverts ? new bytes(0) : mockreturndata[i]);
        }
    }

    // // function test_multicallSingleTarget() public {
    // //     this.test_multicallSingleTarget();
    // // }

    function test_multicallSingleTarget(
        bytes[] memory mockcalldata_,
        bytes[] memory mockreturndata
    ) public {
        uint256 len = mockreturndata.length;

        bytes[] memory mockcalldata = new bytes[](len);

        for (uint256 i; i < len && i < mockcalldata_.length; i++) {
            if (i < mockcalldata_.length) mockcalldata[i] = mockcalldata_[i];
        }

        address target = address(
            new MockReturnDataSingleTarget(mockreturndata, new bool[](len))
        );

        address resultsAddress = address(
            new MulticallSingleTarget(target, mockcalldata, true)
        );
        bytes[] memory results = abi.decode(resultsAddress.code, (bytes[]));

        for (uint256 i; i < len; i++) {
            assertEq(results[i], mockreturndata[i]);
        }
    }

    // function test_multicallSingleTarget(
    //     bytes[] memory mockcalldata_,
    //     bytes[] memory mockreturndata,
    //     bool[] memory reverts_
    // ) public {
    //     uint256 len = mockreturndata.length;

    //     bytes[] memory mockcalldata = new bytes[](len);
    //     bool[] memory reverts = new bool[](len);

    //     for (uint256 i; i < len; i++) {
    //         if (i < mockcalldata_.length) mockcalldata[i] = mockcalldata_[i];
    //         if (i < reverts_.length) reverts[i] = reverts_[i];
    //         console.log("reverts", reverts[i]);
    //     }

    //     address target = address(
    //         new MockReturnDataSingleTarget(mockreturndata, reverts)
    //     );

    //     address resultsAddress = address(
    //         new MulticallSingleTarget(target, mockcalldata, false)
    //     );
    //     bytes[] memory results = abi.decode(resultsAddress.code, (bytes[]));

    //     for (uint256 i; i < len; i++) {
    //         assertEq(results[i], reverts[i] ? new bytes(0) : mockreturndata[i]);
    //     }
    // }

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
