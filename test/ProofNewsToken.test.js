import { network, artifacts } from 'hardhat'
import { expect } from 'chai'
import { describe, it, beforeEach } from 'mocha'
import { readFile } from 'node:fs/promises'

const { ethers } = await network.connect()

describe('ProofNewsToken', function () {
  let token, registry, owner, server, user, other

  beforeEach(async function () {
    [owner, server, user, other] = await ethers.getSigners()
    token = await ethers.deployContract('ProofNewsToken')
    await token.waitForDeployment()
    registry = await ethers.deployContract('RegistryMock', [await token.getAddress()])
    await registry.waitForDeployment()
  })

  it('K1: objava postavlja metapodatke, vlasnika i nultu ponudu', async function () {
    expect(await token.name()).to.equal('ProofNews Proof')
    expect(await token.symbol()).to.equal('PNP')
    expect(await token.decimals()).to.equal(0n)
    expect(await token.totalSupply()).to.equal(0n)
    expect(await token.owner()).to.equal(owner.address)
    expect(await token.registry()).to.equal(ethers.ZeroAddress)
    expect(await token.balanceOf(owner.address)).to.equal(0n)
    await expect(token.deploymentTransaction())
      .to.emit(token, 'OwnershipTransferred')
      .withArgs(ethers.ZeroAddress, owner.address)
  })

  it('K2: vlasnik jednom povezuje registar uz RegistrySet', async function () {
    await expect(token.setRegistry(await registry.getAddress()))
      .to.emit(token, 'RegistrySet')
      .withArgs(await registry.getAddress())
    expect(await token.registry()).to.equal(await registry.getAddress())
    expect(await token.totalSupply()).to.equal(0n)
  })

  it('K3: nevlasnik ne moze povezati registar', async function () {
    await expect(token.connect(user).setRegistry(await registry.getAddress()))
      .to.be.revertedWith('Nisi vlasnik')
    expect(await token.registry()).to.equal(ethers.ZeroAddress)
  })

  it('K4: postavljeni registar ne moze se zamijeniti', async function () {
    await (await token.setRegistry(await registry.getAddress())).wait()
    const secondRegistry = await ethers.deployContract('RegistryMock', [await token.getAddress()])
    for (const address of [await registry.getAddress(), await secondRegistry.getAddress(), ethers.ZeroAddress]) {
      await expect(token.setRegistry(address)).to.be.revertedWith('Registar je vec postavljen')
      expect(await token.registry()).to.equal(await registry.getAddress())
    }
  })

  it('K5: nulta adresa i adresa bez koda nisu registar', async function () {
    for (const address of [ethers.ZeroAddress, user.address]) {
      await expect(token.setRegistry(address)).to.be.revertedWith('Neispravan registar')
      expect(await token.registry()).to.equal(ethers.ZeroAddress)
    }
  })

  it('K6: samo povezani registar moze izdati token', async function () {
    await expect(token.mintProof(user.address)).to.be.revertedWith('Samo registar moze izdati token')
    await (await token.setRegistry(await registry.getAddress())).wait()
    for (const caller of [owner, server, user, other]) {
      await expect(token.connect(caller).mintProof(user.address))
        .to.be.revertedWith('Samo registar moze izdati token')
      expect(await token.totalSupply()).to.equal(0n)
      expect(await token.balanceOf(user.address)).to.equal(0n)
    }
  })

  // K7 ovdje provjerava tokenov mint; stvarna registracija pripada buducim testovima registra.
  it('K7: poziv registra izdaje tocno jedan PNP uz Transfer', async function () {
    await (await token.setRegistry(await registry.getAddress())).wait()
    await (await registry.mintProof(user.address)).wait()
    const supply = await token.totalSupply()
    const balance = await token.balanceOf(user.address)
    await expect(registry.mintProof(user.address))
      .to.emit(token, 'Transfer')
      .withArgs(ethers.ZeroAddress, user.address, 1n)
    expect(await token.totalSupply()).to.equal(supply + 1n)
    expect(await token.balanceOf(user.address)).to.equal(balance + 1n)
    expect(await token.balanceOf(owner.address)).to.equal(0n)
    expect(await token.balanceOf(other.address)).to.equal(0n)
  })

  it('K8: registar ne moze izdati token nultoj adresi', async function () {
    await (await token.setRegistry(await registry.getAddress())).wait()
    await expect(registry.mintProof(ethers.ZeroAddress)).to.be.revertedWith('Neispravan primatelj')
    expect(await token.totalSupply()).to.equal(0n)
    expect(await token.balanceOf(ethers.ZeroAddress)).to.equal(0n)
  })

  it('K9: ponuda na uint256 granici odbija mint bez promjene stanja', async function () {
    await (await token.setRegistry(await registry.getAddress())).wait()
    // Slot citamo iz kompajlera; ne pretpostavljamo OpenZeppelin raspored pohrane.
    const buildId = await artifacts.getBuildInfoId('ProofNewsToken')
    const outputPath = await artifacts.getBuildInfoOutputPath(buildId)
    const { output } = JSON.parse(await readFile(outputPath, 'utf8'))
    const contracts = Object.values(output.contracts)
    const { storage } = contracts.find((source) => source.ProofNewsToken).ProofNewsToken.storageLayout
    const supplySlot = storage.find((variable) => variable.label === '_totalSupply')
    expect(supplySlot, 'Kompajler mora navesti slot ukupne ponude').to.exist
    await ethers.provider.send('hardhat_setStorageAt', [
      await token.getAddress(), ethers.toQuantity(BigInt(supplySlot.slot)), ethers.toBeHex(ethers.MaxUint256, 32),
    ])
    expect(await token.totalSupply()).to.equal(ethers.MaxUint256)
    await expect(registry.mintProof(user.address)).to.be.revertedWith('Dosegnuta maksimalna kolicina')
    expect(await token.totalSupply()).to.equal(ethers.MaxUint256)
    expect(await token.balanceOf(user.address)).to.equal(0n)
  })

  it('K10: transfer i transferFrom uvijek padaju i cuvaju salda', async function () {
    await (await token.setRegistry(await registry.getAddress())).wait()
    await (await registry.mintProof(user.address)).wait()
    for (const caller of [owner, server, user, other]) {
      for (const to of [user.address, other.address, ethers.ZeroAddress]) {
        for (const amount of [0n, 1n, 2n, ethers.MaxUint256]) {
          await expect(token.connect(caller).transfer(to, amount))
            .to.be.revertedWith('Prijenos tokena nije dopusten')
          await expect(token.connect(caller).transferFrom(caller.address, to, amount))
            .to.be.revertedWith('Prijenos tokena nije dopusten')
          await expect(token.connect(caller).transferFrom(user.address, to, amount))
            .to.be.revertedWith('Prijenos tokena nije dopusten')
        }
      }
    }
    expect(await token.balanceOf(user.address)).to.equal(1n)
    expect(await token.balanceOf(owner.address)).to.equal(0n)
    expect(await token.balanceOf(server.address)).to.equal(0n)
    expect(await token.balanceOf(other.address)).to.equal(0n)
    expect(await token.balanceOf(ethers.ZeroAddress)).to.equal(0n)
    expect(await token.totalSupply()).to.equal(1n)
  })

  it('K11: approve uvijek pada bez allowance i Approval dogadjaja', async function () {
    await (await token.setRegistry(await registry.getAddress())).wait()
    await (await registry.mintProof(user.address)).wait()
    const firstBlock = await ethers.provider.getBlockNumber()
    for (const caller of [owner, server, user, other]) {
      for (const spender of [caller.address, other.address, ethers.ZeroAddress]) {
        for (const amount of [0n, 1n, ethers.MaxUint256]) {
          await expect(token.connect(caller).approve(spender, amount))
            .to.be.revertedWith('Odobravanje tokena nije dopusteno')
          expect(await token.allowance(caller.address, spender)).to.equal(0n)
        }
      }
    }
    expect(await token.queryFilter(token.filters.Approval(), firstBlock)).to.have.length(0)
    expect(await token.totalSupply()).to.equal(1n)
    expect(await token.balanceOf(user.address)).to.equal(1n)
  })

  it('K12: javna citanja ne mijenjaju stanje i nema javnog spaljivanja', async function () {
    await (await token.setRegistry(await registry.getAddress())).wait()
    await (await registry.mintProof(user.address)).wait()
    const block = await ethers.provider.getBlockNumber()
    for (const caller of [owner, server, user, other]) {
      expect(await token.connect(caller).totalSupply()).to.equal(1n)
      expect(await token.connect(caller).balanceOf(user.address)).to.equal(1n)
      expect(await token.connect(caller).balanceOf(ethers.ZeroAddress)).to.equal(0n)
      expect(await token.connect(caller).allowance(user.address, caller.address)).to.equal(0n)
    }
    expect(await ethers.provider.getBlockNumber()).to.equal(block)
    const burnInterface = new ethers.Interface(['function burn(uint256)', 'function burnFrom(address,uint256)'])
    for (const signature of ['burn(uint256)', 'burnFrom(address,uint256)']) {
      expect(token.interface.getFunction(signature)).to.equal(null)
      const args = signature.startsWith('burnFrom') ? [user.address, 1n] : [1n]
      const data = burnInterface.encodeFunctionData(signature, args)
      await expect(user.sendTransaction({ to: await token.getAddress(), data })).to.revert(ethers)
    }
    expect(await token.totalSupply()).to.equal(1n)
    expect(await token.balanceOf(user.address)).to.equal(1n)
  })

  // K13-K16 i K61 ovdje pokrivaju token; produkcijski registar jos nije implementiran.
  it('K13: nevlasnik ne moze prenijeti vlasnistvo tokena', async function () {
    await expect(token.connect(user).transferOwnership(other.address)).to.be.revertedWith('Nisi vlasnik')
    await expect(token.connect(user).transferOwnership(ethers.ZeroAddress)).to.be.revertedWith('Nisi vlasnik')
    expect(await token.owner()).to.equal(owner.address)
  })

  it('K14: novi vlasnik preuzima ovlasti a stari ih gubi', async function () {
    await expect(token.transferOwnership(user.address))
      .to.emit(token, 'OwnershipTransferred')
      .withArgs(owner.address, user.address)
    expect(await token.owner()).to.equal(user.address)
    await expect(token.setRegistry(await registry.getAddress())).to.be.revertedWith('Nisi vlasnik')
    await expect(token.transferOwnership(other.address)).to.be.revertedWith('Nisi vlasnik')
    await expect(token.connect(user).setRegistry(await registry.getAddress()))
      .to.emit(token, 'RegistrySet')
      .withArgs(await registry.getAddress())
    expect(await token.registry()).to.equal(await registry.getAddress())
  })

  it('K15: vlasnistvo se ne moze prenijeti nultoj adresi', async function () {
    await expect(token.transferOwnership(ethers.ZeroAddress)).to.be.revertedWith('Neispravan vlasnik')
    expect(await token.owner()).to.equal(owner.address)
  })

  it('K16: nitko se ne moze odreci vlasnistva', async function () {
    for (const caller of [owner, server, user, other]) {
      await expect(token.connect(caller).renounceOwnership())
        .to.be.revertedWith('Odricanje vlasnistva nije dopusteno')
      expect(await token.owner()).to.equal(owner.address)
    }
  })

  it('K60: neispravan token getter ili drugi token ne mogu povezati registar', async function () {
    for (const mode of [0, 1, 2, 3, 4, 5]) {
      const invalid = await ethers.deployContract('InvalidRegistryMock', [mode])
      await expect(token.setRegistry(await invalid.getAddress())).to.be.revertedWith('Neispravan registar')
      expect(await token.registry()).to.equal(ethers.ZeroAddress)
    }
    const secondToken = await ethers.deployContract('ProofNewsToken')
    const wrongRegistry = await ethers.deployContract('RegistryMock', [await secondToken.getAddress()])
    await expect(token.setRegistry(await wrongRegistry.getAddress())).to.be.revertedWith('Neispravan registar')
    expect(await token.registry()).to.equal(ethers.ZeroAddress)
    await expect(token.setRegistry(await registry.getAddress()))
      .to.emit(token, 'RegistrySet')
      .withArgs(await registry.getAddress())
  })

  it('K61: prijenos vlasnistva sebi emitira dogadjaj i zadrzava ovlasti', async function () {
    await expect(token.transferOwnership(owner.address))
      .to.emit(token, 'OwnershipTransferred')
      .withArgs(owner.address, owner.address)
    expect(await token.owner()).to.equal(owner.address)
    await expect(token.setRegistry(await registry.getAddress()))
      .to.emit(token, 'RegistrySet')
      .withArgs(await registry.getAddress())
  })
})
