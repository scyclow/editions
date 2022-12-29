async function main() {
  const [artist, collector1, collector2] = await ethers.getSigners()
  console.log('Deploying base contract for artist addr:', artist.address)

  const EditionsFactory = await ethers.getContractFactory('Editions', artist)
  const Editions = await EditionsFactory.deploy()
  await Editions.deployed()

  // const WOWTokenURIFactory = await ethers.getContractFactory('WOWTokenURI', artist)
  // const WOWTokenURI = await WOWTokenURIFactory.deploy()
  // await WOWTokenURI.deployed()

  const RPAATokenURIFactory = await ethers.getContractFactory('RPAATokenURI', artist)
  const RPAATokenURI = await RPAATokenURIFactory.deploy()
  await RPAATokenURI.deployed()

  console.log(artist?.address, collector1?.address, collector2?.address)

  const RPAAMinterFactory = await ethers.getContractFactory('RPAAMinter', artist)
  const RPAAMinter = await RPAAMinterFactory.deploy(Editions.address, collector2.address)
  await RPAAMinter.deployed()

  console.log(`Editions:`, Editions.address)
  // console.log(`WOWTokenURI:`, WOWTokenURI.address)
  console.log(`RPAATokenURI:`, RPAATokenURI.address)
  console.log(`RPAAMinter:`, RPAAMinter.address)


  // console.log('WOW URI')
  // await Editions.connect(artist).setURIContractForToken(0, WOWTokenURI.address)
  // console.log('WOW minter')
  // await Editions.connect(artist).setMinterForToken(0, artist.address)
  // console.log(await Editions.connect(artist).tokenIdToMinter(0), artist.address)
  // console.log('mint WOW')
  // await Editions.connect(artist).mint(artist.address, 0, 100)

  console.log('RPAA URI')
  await Editions.connect(artist).setURIContractForToken(1, RPAATokenURI.address)
  console.log('RPAA minter')
  await Editions.connect(artist).setMinterForToken(1, RPAAMinter.address)


}

function wait(ms) {
  return new Promise(res => setTimeout(res, ms))
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });