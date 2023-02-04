const { ethers, network } = require("hardhat")
const frontEndContractsFile = "../frontend-nft-maketplace-fcc/constants/networkMapping.json"
const frontEndContractsAbi = "../frontend-nft-maketplace-fcc/constants/"
const fs = require("fs")
module.exports = async function () {
    if (process.env.UPDATE_TO_FRONTEND) {
        console.log("updating front end ....")
        await updateContractAddress()
        await updateAbi()
    }
}
async function updateAbi(){
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    fs.writeFileSync(`${frontEndContractsAbi}NftMarketplace.json`,nftMarketplace.interface.format(ethers.utils.FormatTypes.json))
    const basicNft = await ethers.getContract("simple_NFT")
    fs.writeFileSync(`${frontEndContractsAbi}basicNft.json`,basicNft.interface.format(ethers.utils.FormatTypes.json))

}
async function updateContractAddress() {
    
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("simple_NFT")

    const chainId = network.config.chainId.toString()
    const contractAddress = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf-8"))
    if (chainId in contractAddress) {
        if (!contractAddress[chainId]["NftMarketplace"].includes(nftMarketplace.address) || !contractAddress[chainId]["basicNft"].includes(basicNft.address)) {
            contractAddress[chainId]["NftMarketplace"] = nftMarketplace.address
            contractAddress[chainId]["basicNft"]= basicNft.address 
        }
    } else {
        contractAddress[chainId] = {NftMarketplace:[nftMarketplace.address],basicNft:[basicNft.address ]}
        
        
    }
    fs.writeFileSync(frontEndContractsFile,JSON.stringify(contractAddress))
}

module.exports.tags= ["all","frontend" ]