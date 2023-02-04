const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Nft Marketplace Tests", function () {
          let nftMarketplace, basicNft, deployer, player
          const price = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              const accounts = await ethers.getSigners()
              player = accounts[1]
              await deployments.fixture(["all"])
              nftMarketplace = await ethers.getContract("NftMarketplace")
              basicNft = await ethers.getContract("simple_NFT")

              await basicNft.mintNFT()
              await basicNft.approve(nftMarketplace.address, TOKEN_ID)
          })
          describe("listItem function testing...", function () {
              it("lists and can be bought", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, price)
                  const playerConnectedNftMarketplace = nftMarketplace.connect(player)
                  await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                      value: price,
                  })
                  const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  const deployerProceeds = await nftMarketplace.getProceeds(deployer)
                  assert(newOwner.toString() == player.address)
                  assert(deployerProceeds.toString() == price.toString())
              })
              it("lists and emit", async function () {
                  await expect(nftMarketplace.listItem(basicNft.address, TOKEN_ID, price)).to.emit(
                      nftMarketplace,
                      "ItemListed"
                  )
              })
              it("listItem:check modifier is not Listed ", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, price)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, price)
                  ).to.revertedWith("NftMarketplace_AlreadyListed")
              })
              it("listItem:check modifier is owner ", async function () {
                  const playerConnectedNftMarketplace = nftMarketplace.connect(player)
                  await expect(
                      playerConnectedNftMarketplace.listItem(basicNft.address, TOKEN_ID, price)
                  ).to.revertedWith("NftMarketplace_NotOwner")
              })
              it("listItem:check wrong token or wrong price", async function () {
                  const fake_token = 1
                  const fake_price = 0
                  await basicNft.mintNFT()
                  await expect(
                      nftMarketplace.listItem(basicNft.address, fake_token, price)
                  ).to.revertedWith("NftMarketplace_NotApprovedForMarketplace")
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, fake_price)
                  ).to.revertedWith("NftMarketplace_PriceMustBeAboveZero")
              })
          })
          describe("buyItem function testing...", function () {
              beforeEach(async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, price)
              })
              it("buyitem and emit", async function () {
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: price,
                      })
                  ).to.emit(nftMarketplace, "ItemBought")
              })
              it("buyItem:check modifier is Listed", async function () {
                  const fake_tokenId = 1
                  const playerConnectedNftMarketplace = nftMarketplace.connect(player)
                  await expect(
                      playerConnectedNftMarketplace.buyItem(basicNft.address, fake_tokenId, {
                          value: price,
                      })
                  ).to.revertedWith("NftMarketplace_NotListed")
              })
              it("buyItem:check price error", async function () {
                  const newPrice = ethers.utils.parseEther("0.01")
                  const playerConnectedNftMarketplace = nftMarketplace.connect(player)
                  await expect(
                      playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: newPrice,
                      })
                  ).to.revertedWith("NftMarketplace_PriceNotMet")
              })
          })
          describe("cancelListIng function testing...", function () {
              beforeEach(async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, price)
              })
              it("using address and tokenId cancel the list", async function () {
                  const listItem = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert(listItem.price.toString() == price.toString())
                  assert(listItem.seller.toString() == deployer)
                  await nftMarketplace.cancelListIng(basicNft.address, TOKEN_ID)
                  const listItem1 = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert(listItem1.price.toString() == "0")
                  assert(listItem1.seller.toString() == ethers.constants.AddressZero)
              })
              it("cancelListIng and emit", async function () {
                  await expect(nftMarketplace.cancelListIng(basicNft.address, TOKEN_ID)).to.emit(
                      nftMarketplace,
                      "ItemCanceled"
                  )
              })
          })
          describe("updateListing function testing...", function () {
              const newPrice = ethers.utils.parseEther("0.01")
              beforeEach(async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, price)
              })
              it("testing update new price", async function () {
                  const listItem = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert(listItem.price.toString() == price.toString())
                  await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
                  const listItem1 = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert(listItem1.price.toString() == newPrice.toString())
              })
              it("updateListing and emit", async function () {
                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
                  ).to.emit(nftMarketplace, "ItemUpdated")
              })
          })
          describe("withdrawProceeds function testing...", function () {
              let playerConnectedNftMarketplace
              beforeEach(async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, price)
                  playerConnectedNftMarketplace = nftMarketplace.connect(player)
                  await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                      value: price,
                  })
              })
              it("withdraw Proceeds and verify value", async function () {
                  const before_Balance = await ethers.provider.getBalance(deployer)
                  const balance = await nftMarketplace.getProceeds(deployer)
                  const withdrawTransaction = await nftMarketplace.withdrawProceeds()
                  const responseReceipt = await withdrawTransaction.wait(1)
                  const { gasUsed, effectiveGasPrice } = responseReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const after_Balance = await ethers.provider.getBalance(deployer)
                  assert(
                      after_Balance.toString() ==
                          before_Balance.add(balance).sub(gasCost).toString()
                  )
              })
              it("withdrawProceeds and emit", async function () {
                  await expect(nftMarketplace.withdrawProceeds()).to.emit(
                      nftMarketplace,
                      "ItemWithdraw"
                  )
              })
              it("withdrawProceeds:withdraw error", async function () {
                  await expect(playerConnectedNftMarketplace.withdrawProceeds()).to.revertedWith(
                      "NftMarketplace_NotEnoughMoney"
                  )
              })
          })
          describe("getter function testing...", function () {
              let playerConnectedNftMarketplace

              beforeEach(async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, price)
                  playerConnectedNftMarketplace = nftMarketplace.connect(player)
                  await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                      value: price,
                  })
              })
              it("getProceeds func", async function () {
                  await expect(nftMarketplace.getProceeds(player)).to.reverted
              })
              it("getListing func", async function () {
                const fakeId = 1
                const listItem=  await nftMarketplace.getListing(basicNft.address, fakeId)
                assert(listItem.price.toString()=="0")
            })
          })
      })
