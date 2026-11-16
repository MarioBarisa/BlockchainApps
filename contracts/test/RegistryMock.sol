// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IProofNewsToken} from "../IProofNews.sol";

// Samo testna zamjena registra; ne provjerava potvrde niti sprema dokaze.
contract RegistryMock {
    address public immutable token;

    constructor(address tokenAddress) {
        token = tokenAddress;
    }

    function mintProof(address recipient) external {
        IProofNewsToken(token).mintProof(recipient);
    }
}

// Nacin odgovora: 0 nema gettera, 1 revert, 2 prazno, 3 kraci, 4 duzi, 5 neispravna adresa.
contract InvalidRegistryMock {
    uint256 private immutable mode;

    constructor(uint256 responseMode) {
        mode = responseMode;
    }

    fallback(bytes calldata) external returns (bytes memory) {
        require(mode != 0 && mode != 1, "Nema valjanog gettera");
        if (mode == 2) return hex"";
        if (mode == 3) return hex"01";
        if (mode == 4) return abi.encode(uint256(0), uint256(0));
        return abi.encode(type(uint256).max);
    }
}
