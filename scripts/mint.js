const { ethers } = require("hardhat")
const PRICE = ethers.utils.parseEther("0.1")
async function mint() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("simple_NFT")
    console.log("minting.....")
    const mintTx = await basicNft.mintNFT()
    const mintReceipt = await mintTx.wait(1)
    const tokenId = mintReceipt.events[0].args.tokenId
    console.log("minted...")
    console.log(`here is tokenId ${tokenId}`)
    console.log(`here is NFT Address ${basicNft.address}`)
}
async function getApproved(){
    const basicNft = await ethers.getContract("simple_NFT")
    console.log("get Approving.....")
    const tokenId =  4;
    const approveTx = await basicNft.getApproved(tokenId)
    //const approveReceipt = await approveTx.wait(1)
    console.log(approveTx)
}

getApproved()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
