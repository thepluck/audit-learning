import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('MyToken', function () {
  async function deployMyToken() {
    const [owner, account] = await ethers.getSigners();
    const myTokenFactory = await ethers.getContractFactory('MyToken');
    const myToken = await myTokenFactory.deploy('MyToken', 'MTK');
    return { myToken, owner, account };
  }

  describe('#mint', function () {
    it('should mint tokens', async function () {
      const { myToken, account } = await loadFixture(deployMyToken);
      await myToken.mint(account, 100);
      expect(await myToken.balanceOf(account)).to.equal(100);
    });

    it('should not allow minting by non-owner', async function () {
      const { myToken, account } = await loadFixture(deployMyToken);
      await expect(myToken.connect(account).mint(account, 100)).to.be.revertedWithCustomError(
        myToken,
        'OwnableUnauthorizedAccount'
      );
    });

    it('should not allow minting more than the cap', async function () {
      const { myToken, owner, account } = await loadFixture(deployMyToken);
      const cap = await myToken.cap();
      await myToken.mint(account, 100);
      await expect(myToken.mint(account, cap - 99n))
        .to.be.revertedWithCustomError(myToken, 'ERC20ExceededCap')
        .withArgs(cap + 1n, cap);
    });
  });

  describe('#burn', function () {
    it('should burn tokens', async function () {
      const { myToken, account } = await loadFixture(deployMyToken);
      await myToken.mint(account, 100);
      await myToken.connect(account).burn(50);
      expect(await myToken.balanceOf(account)).to.equal(50);
    });

    it('should not allow burning more than the balance', async function () {
      const { myToken, account } = await loadFixture(deployMyToken);
      await myToken.mint(account, 100);
      await expect(myToken.connect(account).burn(101))
        .to.be.revertedWithCustomError(myToken, 'ERC20InsufficientBalance')
        .withArgs(account, 100, 101);
    });
  });

  describe('#burnFrom', function () {
    it('should burn tokens', async function () {
      const { myToken, owner, account } = await loadFixture(deployMyToken);
      await myToken.mint(account, 100);
      await myToken.connect(account).approve(owner, 50);
      await myToken.burnFrom(account, 50);
      expect(await myToken.balanceOf(account)).to.equal(50);
    });

    it('should not allow burning more than the allowance', async function () {
      const { myToken, owner, account } = await loadFixture(deployMyToken);
      await myToken.mint(account, 100);
      await myToken.connect(account).approve(owner, 50);
      await expect(myToken.burnFrom(account, 51))
        .to.be.revertedWithCustomError(myToken, 'ERC20InsufficientAllowance')
        .withArgs(owner, 50, 51);
    });

    it('should not allow burning more than the balance', async function () {
      const { myToken, owner, account } = await loadFixture(deployMyToken);
      await myToken.mint(account, 100);
      await myToken.connect(account).approve(owner, 101);
      await expect(myToken.burnFrom(account, 101))
        .to.be.revertedWithCustomError(myToken, 'ERC20InsufficientBalance')
        .withArgs(account, 100, 101);
    });
  });
});
