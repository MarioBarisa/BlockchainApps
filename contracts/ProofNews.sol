// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IProofNewsToken, IProofNewsModul} from "./IProofNews.sol";

// ABI slijedi IProofNewsToken; ERC20 i Ownable vec deklariraju njegove dogadjaje.
contract ProofNewsToken is ERC20, Ownable {
    // Uloga: svi mogu citati. SPEC: K1, K2, K4, K5, K37, K60.
    address public registry;

    // Uloga: objavitelj. SPEC: K1.
    constructor() ERC20("ProofNews Proof", "PNP") Ownable(msg.sender) {}

    // Uloga: svi. SPEC: K1.
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    // Uloga: vlasnik tokena, samo jednom. SPEC: K2, K3, K4, K5, K60.
    function setRegistry(address registryAddress) external onlyOwner {
        require(registry == address(0), "Registar je vec postavljen");
        require(registryAddress.code.length > 0, "Neispravan registar");

        (bool success, bytes memory result) = registryAddress.staticcall(
            abi.encodeCall(IProofNewsModul.token, ())
        );
        require(success && result.length == 32, "Neispravan registar");

        // Provjera cijele rijeci odbija i neispravno ABI kodiranu adresu.
        uint256 returnedAddress = abi.decode(result, (uint256));
        require(returnedAddress == uint256(uint160(address(this))), "Neispravan registar");

        registry = registryAddress;
        emit IProofNewsToken.RegistrySet(registryAddress);
    }

    // Uloga: samo povezani registar. SPEC: K6, K7, K8, K9, K44.
    function mintProof(address recipient) external {
        require(msg.sender == registry, "Samo registar moze izdati token");
        require(recipient != address(0), "Neispravan primatelj");
        require(totalSupply() < type(uint256).max, "Dosegnuta maksimalna kolicina");

        _mint(recipient, 1);
    }

    // Uloga: nitko; svi prijenosi padaju. SPEC: K10.
    function transfer(address, uint256) public pure override returns (bool) {
        revert("Prijenos tokena nije dopusten");
    }

    // Uloga: nitko; ni odobrenje ne dopusta prijenos. SPEC: K10.
    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert("Prijenos tokena nije dopusten");
    }

    // Uloga: nitko; poziv uvijek pada. SPEC: K11.
    function approve(address, uint256) public pure override returns (bool) {
        revert("Odobravanje tokena nije dopusteno");
    }

    // Uloga: svi; odobrenja ne postoje. SPEC: K11, K12.
    function allowance(address, address) public pure override returns (uint256) {
        return 0;
    }

    // Uloga: vlasnik tokena. SPEC: K13, K14, K15, K61.
    function transferOwnership(address newOwner) public override onlyOwner {
        require(newOwner != address(0), "Neispravan vlasnik");
        _transferOwnership(newOwner);
    }

    // Uloga: nitko; vlasnistvo ostaje postavljeno. SPEC: K16.
    function renounceOwnership() public pure override {
        revert("Odricanje vlasnistva nije dopusteno");
    }

    // Interna provjera vlasnika s porukom iz SPEC-a. SPEC: K3, K13.
    function _checkOwner() internal view override {
        require(owner() == _msgSender(), "Nisi vlasnik");
    }
}
