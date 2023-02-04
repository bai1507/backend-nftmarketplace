// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract simple_NFT is ERC721 {
    uint256 private tokenId;
    string public constant TOKEN_URI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";

    constructor() ERC721("kuDog", "KD") {
        tokenId = 0;
    }

    function mintNFT() public returns (uint256) {
        _safeMint(msg.sender, tokenId);
        tokenId += 1;
        return tokenId;
    }

    function getTokenCounter() public view returns (uint256) {
        return tokenId;
    }

    function tokenURI(
        uint256 _tokenId
    ) public pure override returns (string memory) {
        return TOKEN_URI;
    }
}
