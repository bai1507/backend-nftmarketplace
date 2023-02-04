// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error NftMarketplace_PriceMustBeAboveZero();
error NftMarketplace_NotApprovedForMarketplace();
error NftMarketplace_AlreadyListed(address, uint256);
error NftMarketplace_NotListed(address, uint256);
error NftMarketplace_NotOwner();
error NftMarketplace_PriceNotMet(address, uint256, uint256);
error NftMarketplace_NotEnoughMoney();

// 1. `listItem`:list NFTS on the Marketplace
// 2. `butItem`: Buy the NFTS
// 3. `cancelItem`: Cancel a listing
// 4. `updateListing`: Update Price
// 5. `withdrawProceeds`: Withdraw payment for my bought NFTS
contract NftMarketplace is ReentrancyGuard {
    event ItemListed(
        address indexed sender,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    event ItemBought(
        address indexed sender,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    event ItemCanceled(address indexed sender, address indexed nftAddress, uint256 indexed tokenId);
    event ItemUpdated(
        address indexed,
        address indexed,
        uint256 indexed,
        uint256
    );
    event ItemWithdraw(address indexed, uint256 indexed);

    struct Listing {
        uint256 price;
        address seller;
    }
    //nft contract address => tokenId => listing
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    // Seller address => Amount eaned
    mapping(address => uint256) private s_proceeds;

    /*******************/
    /**  modifiers *****/
    /*******************/
    modifier notListed(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketplace_AlreadyListed(nftAddress, tokenId);
        }
        _;
    }
    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NftMarketplace_NotListed(nftAddress, tokenId);
        }
        _;
    }
    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert NftMarketplace_NotOwner();
        }
        _;
    }

    /*******************/
    /** main function  */
    /*******************/

    /// @notice `listItem`:list NFTS on the Marketplace
    /// @param nftAddress :address of the NFT
    /// @param tokenId :the token Id of the NFT
    /// @param price :sale price of the listed NFT
    ///
    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        notListed(nftAddress, tokenId, msg.sender)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        if (price <= 0) {
            revert NftMarketplace_PriceMustBeAboveZero();
        }
        //Owners can still hold their NFT, and give the marketplace approval to sell the Nft for THEM!
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketplace_NotApprovedForMarketplace();
        }
        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    /// @notice `buyItem`: Buy the NFTS
    /// @param nftAddress :address of the NFT
    /// @param tokenId :the token Id of the NFT
    function buyItem(address nftAddress, uint256 tokenId)
        external
        payable
        isListed(nftAddress, tokenId)
        nonReentrant
    {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if (msg.value < listedItem.price) {
            revert NftMarketplace_PriceNotMet(
                nftAddress,
                tokenId,
                listedItem.price
            );
        }
        //为啥不直接转账给用户，为啥还有用一个变量来保存余额
        //pull over push :https://fravoll.github.io/solidity-patterns/pull_over_push.html
        //如果对象是合约，会发送到fallback中，可能会导致重入攻击，也有可能对方的合约没有设置withdraw
        //将转移eth的风险移交给用户
        s_proceeds[listedItem.seller] =
            s_proceeds[listedItem.seller] +
            msg.value;
        delete (s_listings[nftAddress][tokenId]);
        //nonReentrant可以防止重入攻击，在开始设置状态为true,代码执行后再设置为false
        IERC721(nftAddress).safeTransferFrom(
            listedItem.seller,
            msg.sender,
            tokenId
        );
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    /// @notice `cancelListIng`:Cancel a listing
    /// @param nftAddress :address of the NFT
    /// @param tokenId :the token Id of the NFT
    function cancelListIng(address nftAddress, uint256 tokenId)
        external
        isListed(nftAddress, tokenId)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    /// @notice `updateListing`:Update Price
    /// @param nftAddress :address of the NFT
    /// @param tokenId :the token Id of the NFT
    /// @param newPrice :new price that u wanted to update
    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        isListed(nftAddress, tokenId)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemUpdated(msg.sender, nftAddress, tokenId, newPrice);
    }

    /// @notice `withdrawProceeds`:Withdraw payment for my bought NFTS
    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) {
            revert NftMarketplace_NotEnoughMoney();
        }
        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        require(success, "Transaction Failed");
        emit ItemWithdraw(msg.sender, proceeds);
    }

    /*******************/
    /** getter function*/
    /*******************/
    function getProceeds(address seller) public view returns (uint256) {
        return s_proceeds[seller];
    }

    function getListing(address nftAddress, uint256 tokenId)
        public
        view
        returns (Listing memory)
    {
        return s_listings[nftAddress][tokenId];
    }
}
