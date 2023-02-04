//require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config("/.env");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("solhint");
require("hardhat-deploy");



//npm安装后dotenv后，记得导入包如上所示

const GOERLI_NEW_WORK = process.env.GOERLI_NEW_WORK;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL;
const POLYGON_MAINNET_RPC_URL = process.env.POLYGON_MAINNET_RPC_URL;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  //有默认的网络,一般测试部署都在这个网络上
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,

      // forking: {
      //   url: MAINNET_RPC_URL,
      // },
    },
    goerli: {
      url: GOERLI_NEW_WORK,
      accounts: [PRIVATE_KEY],
      chainId: 5,
    },
    localhost: {
      //将本地网络和节点网络连接
      // url: "http://127.0.0.1:8545/",
      chainId: 31337,
    },
    mainnet: {
      url: MAINNET_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      //   accounts: {
      //     mnemonic: MNEMONIC,
      //   },
      chainId: 1,
    },
    polygon: {
      url: POLYGON_MAINNET_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 137,
    }
  },
  solidity: {
    compilers: [
      { version: "0.8.17" },
      { version: "0.4.19" },
      { version: "0.6.12" },
      { version: "0.6.6" },
    ],
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: false,
    outputFile: "gas-report.txt",
    currency: "USD",
    noColors: true,
    //coinmarketcap:COINMARKETCAP_API_KEY,
    token: "ETH",
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    },
  },
};
