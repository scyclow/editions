const { expect } = require('chai')
const { ethers, waffle } = require('hardhat')
const { expectRevert } = require('@openzeppelin/test-helpers')




const num = n => Number(n)
const utf8Clean = raw => raw.replace(/data.*utf8,/, '')
const getJsonURI = rawURI => JSON.stringify(JSON.parse(utf8Clean(rawURI)), null, 4)

const encodeWithSignature = (functionName, argTypes, params) => {
  const iface = new ethers.utils.Interface([`function ${functionName}(${argTypes.join(',')})`])
  return iface.encodeFunctionData(functionName, params)
}

const emptyEncoded = () => {
  const iface = new ethers.utils.Interface([])
  return iface.encodeFunctionData('')
}

describe('Editions', () => {
  const provider = waffle.provider

  let artist, collector1, collector2
  let Editions, EditionsFactory, WOWTokenURI, RPAATokenURI
  beforeEach(async () => {
    // await network.provider.send("hardhat_reset", [
    //   {
    //     forking: {
    //       jsonRpcUrl: config.networks.hardhat.forking.url,
    //       blockNumber: config.networks.hardhat.forking.blockNumber,
    //     },
    //   },
    // ])

    const signers = await ethers.getSigners()

    artist = signers[0]
    collector1 = signers[1]
    collector2 = signers[2]


    EditionsFactory = await ethers.getContractFactory('Editions', artist)
    Editions = await EditionsFactory.deploy()
    await Editions.deployed()

    const WOWTokenURIFactory = await ethers.getContractFactory('WOWTokenURI', artist)
    WOWTokenURI = await WOWTokenURIFactory.deploy()
    await WOWTokenURI.deployed()

    const RPAATokenURIFactory = await ethers.getContractFactory('RPAATokenURI', artist)
    RPAATokenURI = await RPAATokenURIFactory.deploy()
    await RPAATokenURI.deployed()
  })


  describe('everything', () => {
    it('works', async () => {
      await expectRevert(
        Editions.connect(collector1).setURIContractForToken(0, WOWTokenURI.address),
        'Ownable:'
      )

      await expectRevert(
        Editions.connect(collector1).setMinterForToken(0, collector1.address),
        'Ownable:'
      )

      await expectRevert(
        Editions.connect(collector1).mint(collector1.address, 0, 100),
        'Caller is not the minter'
      )

      await expectRevert(
        Editions.connect(collector1).batchMint([collector1.address, artist.address], 1, [69, 420]),
        'Caller is not the minter'
      )

      await expectRevert(
        Editions.connect(collector1).setDefaultURIContract(RPAATokenURI.address),
        'Ownable:'
      )


      await Editions.connect(artist).setURIContractForToken(0, WOWTokenURI.address)
      await Editions.connect(artist).setMinterForToken(0, artist.address)

      await Editions.connect(artist).setURIContractForToken(1, RPAATokenURI.address)
      await Editions.connect(artist).setMinterForToken(1, artist.address)


      await Editions.connect(artist).mint(collector1.address, 0, 100)

      expect(num(await Editions.connect(artist).balanceOf(collector1.address, 0))).to.equal(100)

      await Editions.connect(artist).batchMint([artist.address, collector1.address], 1, [69, 420])
      expect(num(await Editions.connect(artist).balanceOf(collector1.address, 1))).to.equal(420)
      expect(num(await Editions.connect(artist).balanceOf(artist.address, 1))).to.equal(69)


      const WOWMetadata = await Editions.connect(artist).uri(0)

      console.log(getJsonURI(WOWMetadata))


      await Editions.connect(artist).setDefaultURIContract(WOWTokenURI.address)
      const DefaultMetadata = await Editions.connect(artist).uri(3)
      expect(DefaultMetadata).to.equal(WOWMetadata)



      await Editions.connect(artist).emitProjectEvent('project event', 'content')
      await Editions.connect(collector1).emitTokenEvent(0, 'token event', 'content')

      await expectRevert(
        Editions.connect(collector1).emitProjectEvent('project event', 'content'),
        'Ownable:'
      )

      await expectRevert(
        Editions.connect(collector2).emitTokenEvent(0, 'token event', 'content'),
        'Only project or token owner can emit token event'
      )

    })
  })

})

describe('RPAAMinter', () => {
  const provider = waffle.provider

  let Editions, RPAAMinter
  let artist, collector, benefactor

  beforeEach(async () => {
    const signers = await ethers.getSigners()

    artist = signers[0]
    collector = signers[1]
    benefactor = signers[2]

    const EditionsFactory = await ethers.getContractFactory('Editions', artist)
    Editions = await EditionsFactory.deploy()
    await Editions.deployed()

    const WOWTokenURIFactory = await ethers.getContractFactory('WOWTokenURI', artist)
    const WOWTokenURI = await WOWTokenURIFactory.deploy()
    await WOWTokenURI.deployed()

    const RPAATokenURIFactory = await ethers.getContractFactory('RPAATokenURI', artist)
    const RPAATokenURI = await RPAATokenURIFactory.deploy()
    await RPAATokenURI.deployed()

    const RPAAMinterFactory = await ethers.getContractFactory('RPAAMinter', artist)
    RPAAMinter = await RPAAMinterFactory.deploy(Editions.address, benefactor.address)
    await RPAAMinter.deployed()

    console.log(`Editions:`, Editions.address)
    console.log(`WOWTokenURI:`, WOWTokenURI.address)
    console.log(`RPAATokenURI:`, RPAATokenURI.address)
    console.log(`RPAAMinter:`, RPAAMinter.address)


    console.log('WOW URI')
    await Editions.connect(artist).setURIContractForToken(0, WOWTokenURI.address)
    console.log('WOW minter')
    await Editions.connect(artist).setMinterForToken(0, artist.address)
    console.log(await Editions.connect(artist).tokenIdToMinter(0), artist.address)
    console.log('mint WOW')
    await Editions.connect(artist).mint(artist.address, 0, 100)

    console.log('RPAA URI')
    await Editions.connect(artist).setURIContractForToken(1, RPAATokenURI.address)
    console.log('RPAA minter')
    await Editions.connect(artist).setMinterForToken(1, RPAAMinter.address)
  })

  it.only('should work', async () => {

    const startingBenefactorBalance = num(await benefactor.getBalance()) / 10**18
    const startingCollectorBalance = num(await collector.getBalance()) / 10**18

    await expectRevert(
      RPAAMinter.connect(collector).mint(11, {
        value: ethers.utils.parseEther('0.1')
      }),
      'Must pay 0.01 ETH per token'
    )

    await expectRevert(
      RPAAMinter.connect(collector).mint(9, {
        value: ethers.utils.parseEther('0.1')
      }),
      'Must pay 0.01 ETH per token'
    )

    await RPAAMinter.connect(collector).mint(10, {
      value: ethers.utils.parseEther('0.1')
    })

    const endingBenefactorBalance = num(await benefactor.getBalance()) / 10**18
    const endingCollectorBalance = num(await collector.getBalance()) / 10**18

    expect(await Editions.connect(collector).balanceOf(collector.address, 1)).to.equal(10)

    expect(endingBenefactorBalance - startingBenefactorBalance).to.be.closeTo(0.10, 0.001)
    expect(endingCollectorBalance - startingCollectorBalance).to.be.closeTo(-0.10, 0.001)
  })
})