const { ethers } = require("hardhat")
const PRICE = ethers.utils.parseEther("0.1")
async function mintAndList() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("simple_NFT")
    console.log("minting.....")
    const mintTx = await basicNft.mintNFT()
    const mintReceipt = await mintTx.wait(1)
    const tokenId = mintReceipt.events[0].args.tokenId
    console.log("Approving NFT .....")
    const approvalTx = await basicNft.approve(nftMarketplace.address, tokenId)
    await approvalTx.wait(1)
    console.log("Listing....")
    const tx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE)
    await tx.wait(1)
    console.log("listed!!")
}
async function getTopic() {
    // 'ItemBought(address,address,uint256,uint256)': [EventFragment],
    // 'ItemCanceled(address,address,uint256)': [EventFragment],
    // 'ItemListed(address,address,uint256,uint256)': [EventFragment],
    // 'ItemUpdated(address,address,uint256,uint256)': [EventFragment],
    // 'ItemWithdraw(address,uint256)': [EventFragment]
    //const contracts = await ethers.getContractAt("NftMarketplace","0x41AAda0BBfcA474D61FB632b3DfaAD54f4ae571F");
   const itemListedPack= ethers.utils.solidityPack(["string"],["ItemListed(address,address,uint256,uint256)"])
   const ItemBoughtPack= ethers.utils.solidityPack(["string"],["ItemBought(address,address,uint256,uint256)"])
   const ItemCanceledPack= ethers.utils.solidityPack(["string"],["ItemCanceled(address,address,uint256)"])

   const a =ethers.utils.keccak256(itemListedPack)
   const b =ethers.utils.keccak256(ItemBoughtPack)
   const c =ethers.utils.keccak256(ItemCanceledPack)

    console.log(a)
    console.log(b)
    console.log(c)
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
