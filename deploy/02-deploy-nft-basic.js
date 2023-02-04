const {network} = require("hardhat")
const {developmentChains} = require("../helper-hardhat-config");
const {verify} = require("../utils/verify");

module.exports = async ({getNamedAccounts,deployments}) => {
    const {deploy,log} = deployments;
    const {deployer} = await getNamedAccounts();

    args = []
    const simple_NFT = await deploy("simple_NFT",{
        from:deployer,
        args:args,
        log:true,
        waitConfirmations:1
    })
    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        log("verifying...")
        await verify(simple_NFT.address,args);
    }
    log("------------------")
}

module.exports.tags = ["all","basic"]