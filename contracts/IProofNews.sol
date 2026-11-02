// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Konstruktori i izvanlancane API funkcije nisu dio sucelja.
interface IProofNewsToken {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event RegistrySet(address indexed registry);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Uloga: svi. SPEC: K1.
    function name() external view returns (string memory);

    // Uloga: svi. SPEC: K1.
    function symbol() external view returns (string memory);

    // Uloga: svi. SPEC: K1.
    function decimals() external view returns (uint8);

    // Uloga: svi. SPEC: K1, K7, K9, K12, K44.
    function totalSupply() external view returns (uint256);

    // Uloga: svi. SPEC: K7, K10, K12, K44.
    function balanceOf(address account) external view returns (uint256);

    // Uloga: svi. SPEC: K11, K12.
    function allowance(address account, address spender) external view returns (uint256);

    // Uloga: svi. SPEC: K1, K2, K4, K5, K37, K60.
    function registry() external view returns (address);

    // Uloga: vlasnik tokena, samo jednom. SPEC: K2, K3, K4, K5, K60.
    function setRegistry(address registryAddress) external;

    // Uloga: samo povezani registar. SPEC: K6, K7, K8, K9, K44.
    function mintProof(address recipient) external;

    // Uloga: nitko; poziv mora pasti. SPEC: K10.
    function transfer(address to, uint256 amount) external returns (bool);

    // Uloga: nitko; poziv mora pasti. SPEC: K10.
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    // Uloga: nitko; poziv mora pasti. SPEC: K11.
    function approve(address spender, uint256 amount) external returns (bool);

    // Uloga: svi. SPEC: K1, K13, K14, K15, K16, K61.
    function owner() external view returns (address);

    // Uloga: vlasnik tokena. SPEC: K13, K14, K15, K61.
    function transferOwnership(address newOwner) external;

    // Uloga: nitko; poziv mora pasti. SPEC: K16.
    function renounceOwnership() external;
}

interface IProofNewsModul {
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ServerSignerUpdated(
        address indexed previousSigner,
        address indexed newSigner,
        uint256 signerVersion
    );
    event EIP712DomainChanged();
    event ProofRegistered(
        bytes32 indexed generationId,
        bytes32 indexed contentHash,
        address indexed creator,
        uint256 registeredAt,
        address attestor,
        uint256 signerVersion
    );

    // Uloga: registrator uz potvrdu za vlastitu adresu.
    // SPEC: K7, K33, K34, K35, K36, K37, K38, K39, K40, K44, K72.
    function registerProof(
        bytes32 generationId,
        bytes32 contentHash,
        address creator,
        uint256 version,
        bytes calldata signature
    ) external;

    // Uloga: svi. SPEC: K33, K45, K49, K50.
    function getProof(bytes32 generationId)
        external
        view
        returns (
            bytes32 contentHash,
            address creator,
            uint256 registeredAt,
            address attestor,
            uint256 signerVersion
        );

    // Uloga: svi. SPEC: K47, K48, K49, K50.
    function verifyProof(bytes32 generationId, bytes32 candidateHash)
        external
        view
        returns (bool exists, bool matches);

    // Uloga: svi. SPEC: K31, K37, K60.
    function token() external view returns (address);

    // Uloga: svi. SPEC: K31, K40, K41, K45.
    function serverSigner() external view returns (address);

    // Uloga: svi. SPEC: K31, K40, K41, K42.
    function signerVersion() external view returns (uint256);

    // Uloga: svi. SPEC: K39, K59.
    function eip712Domain()
        external
        view
        returns (
            bytes1 fields,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        );

    // Uloga: vlasnik registra. SPEC: K13, K40, K41, K42.
    function setServerSigner(address newSigner) external;

    // Uloga: svi. SPEC: K13, K14, K15, K16, K31, K45, K61.
    function owner() external view returns (address);

    // Uloga: vlasnik registra. SPEC: K13, K14, K15, K61.
    function transferOwnership(address newOwner) external;

    // Uloga: nitko; poziv mora pasti. SPEC: K16.
    function renounceOwnership() external;
}
