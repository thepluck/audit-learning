const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("ERC20", function () {
  async function deployEmptyERC20Fixture() {
    const [owner, account] = await ethers.getSigners();
    const ERC20 = await ethers.getContractFactory("ERC20");
    const erc20 = await ERC20.deploy("ERC20", "ERC20", 18);
    return { erc20, owner, account };
  }

  async function deployERC20Fixture() {
    const { erc20, owner, account } = await loadFixture(
      deployEmptyERC20Fixture
    );
    await erc20.mint(account.address, 1000);
    return { erc20, owner, account };
  }

  describe("totalSupply", function () {
    it("Should return the initial supply", async function () {
      const { erc20 } = await deployEmptyERC20Fixture();
      expect(await erc20.totalSupply()).to.equal(0);
    });

    it("Should return the total supply", async function () {
      const { erc20 } = await deployERC20Fixture();
      expect(await erc20.totalSupply()).to.equal(1000);
    });
  });

  describe("balanceOf", function () {
    it("Should return 0 for an account without balance", async function () {
      const { erc20, owner } = await deployERC20Fixture();
      expect(await erc20.balanceOf(owner.address)).to.equal(0);
    });

    it("Should return the balance of an account", async function () {
      const { erc20, account } = await deployERC20Fixture();
      expect(await erc20.balanceOf(account.address)).to.equal(1000);
    });
  });

  describe("transfer", function () {
    it("Should transfer tokens", async function () {
      const { erc20, owner, account } = await deployERC20Fixture();
      await expect(erc20.connect(account).transfer(owner.address, 100))
        .to.emit(erc20, "Transfer")
        .withArgs(account.address, owner.address, 100);
      expect(await erc20.balanceOf(owner.address)).to.equal(100);
      expect(await erc20.balanceOf(account.address)).to.equal(900);
    });

    it("Should fail if the sender doesn't have enough tokens", async function () {
      const { erc20, owner, account } = await deployERC20Fixture();
      await expect(erc20.connect(account).transfer(owner.address, 1001)).to.be
        .reverted;
    });
  });

  describe("approve", function () {
    it("Should approve tokens", async function () {
      const { erc20, owner, account } = await deployERC20Fixture();
      await expect(erc20.connect(account).approve(owner.address, 100))
        .to.emit(erc20, "Approval")
        .withArgs(account.address, owner.address, 100);
      expect(await erc20.allowance(account.address, owner.address)).to.equal(
        100
      );
    });

    it("Should update the approval", async function () {
      const { erc20, owner, account } = await deployERC20Fixture();
      await erc20.connect(account).approve(owner.address, 100);
      await expect(erc20.connect(account).approve(owner.address, 200))
        .to.emit(erc20, "Approval")
        .withArgs(account.address, owner.address, 200);
      expect(await erc20.allowance(account.address, owner.address)).to.equal(
        200
      );
    });
  });

  describe("transferFrom", function () {
    it("Should transfer tokens", async function () {
      const { erc20, owner, account } = await deployERC20Fixture();
      await erc20.connect(account).approve(owner.address, 100);
      await expect(
        erc20.connect(owner).transferFrom(account.address, owner.address, 100)
      )
        .to.emit(erc20, "Transfer")
        .withArgs(account.address, owner.address, 100);
      expect(await erc20.balanceOf(owner.address)).to.equal(100);
      expect(await erc20.balanceOf(account.address)).to.equal(900);
      expect(await erc20.allowance(account.address, owner.address)).to.equal(0);
    });

    it("Should fail if the spender doesn't have enough allowance", async function () {
      const { erc20, owner, account } = await deployERC20Fixture();
      await expect(
        erc20.connect(owner).transferFrom(account.address, owner.address, 100)
      ).to.be.reverted;
    });

    it("Should fail if the sender doesn't have enough tokens", async function () {
      const { erc20, owner, account } = await deployERC20Fixture();
      await erc20.connect(account).approve(owner.address, 1001);
      await expect(
        erc20.connect(owner).transferFrom(account.address, owner.address, 1001)
      ).to.be.reverted;
    });
  });

  describe("mint", function () {
    it("Should fail if the caller is not the owner", async function () {
      const { erc20, account } = await deployERC20Fixture();
      await expect(
        erc20.connect(account).mint(account.address, 100)
      ).to.be.revertedWithCustomError(erc20, "InvalidOwner");
    });

    it("Should fail if exceeding max total supply", async function () {
      const { erc20, account } = await deployEmptyERC20Fixture();
      const maxTotalSupply = 10n ** 9n * 10n ** 18n;
      await expect(erc20.mint(account.address, maxTotalSupply + 1n))
        .to.be.revertedWithCustomError(erc20, "MaxTotalSupplyExceeded")
        .withArgs(maxTotalSupply + 1n, maxTotalSupply);
    });

    it("Should mint tokens", async function () {
      const { erc20, account } = await deployEmptyERC20Fixture();
      await expect(erc20.mint(account.address, 1000))
        .to.emit(erc20, "Transfer")
        .withArgs(ethers.ZeroAddress, account.address, 1000);
      expect(await erc20.balanceOf(account.address)).to.equal(1000);
    });
  });

  describe("burn", function () {
    it("Should fail if the account doesn't have enough tokens", async function () {
      const { erc20, account } = await deployERC20Fixture();
      await expect(erc20.connect(account).burn(1001)).to.be.reverted;
    });

    it("Should burn tokens", async function () {
      const { erc20, account } = await deployERC20Fixture();
      await expect(erc20.connect(account).burn(1000))
        .to.emit(erc20, "Transfer")
        .withArgs(account.address, ethers.ZeroAddress, 1000);
      expect(await erc20.balanceOf(account.address)).to.equal(0);
    });
  });
});
