import { loadFixture, mine, mineUpTo } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('SRToken', function () {
  async function deploySRToken() {
    const [owner, account1, account2] = await ethers.getSigners();
    const srTokenFactory = await ethers.getContractFactory('SRToken');
    const MyTokenFactory = await ethers.getContractFactory('MyToken');
    const stakingToken = await MyTokenFactory.deploy('StakingToken', 'STK');
    const rewardToken = await MyTokenFactory.deploy('RewardsToken', 'RTK');
    const start = 100;
    const end = 200;
    const rate = 40;
    const srToken = await srTokenFactory.deploy(stakingToken, rewardToken, start, end, rate, 'SRToken', 'SRT');
    return { srToken, stakingToken, rewardToken, start, end, rate, owner, account1, account2 };
  }

  describe('#constructor', function () {
    it('should set the correct values', async function () {
      const { srToken, stakingToken, rewardToken, start, end, rate } = await loadFixture(deploySRToken);
      expect(await srToken.stakingToken()).to.equal(stakingToken);
      expect(await srToken.rewardToken()).to.equal(rewardToken);
      expect(await srToken.rewardPeriod()).to.deep.equal([start, end, rate]);
    });
  });

  describe('#isDuringRewardPeriod', function () {
    it('should return true if the block number is within the reward period', async function () {
      const { srToken, start, end } = await loadFixture(deploySRToken);
      await mineUpTo(start + 1);
      expect(await srToken.isInRewardPeriod()).to.be.true;
      await mineUpTo(end + 1);
      expect(await srToken.isInRewardPeriod()).to.be.false;
    });
  });

  describe('#updateRewardPeriod', function () {
    it('should revert if called by a non-owner', async function () {
      const { srToken, account1, end, rate } = await loadFixture(deploySRToken);
      const newStart = end + 1;
      const newEnd = end + 100;
      await expect(srToken.connect(account1).updateRewardPeriod(newStart, newEnd, rate)).to.be.revertedWithCustomError(
        srToken,
        'OwnableUnauthorizedAccount'
      );
    });

    it('should revert if new rewards rate is 0', async function () {
      const { srToken, end } = await loadFixture(deploySRToken);
      const newStart = end + 1;
      const newEnd = end + 100;
      const newrate = 0;
      await mineUpTo(newStart - 1);
      await expect(srToken.updateRewardPeriod(newStart, newEnd, newrate)).to.be.revertedWithCustomError(
        srToken,
        'UpdateInvalidRewardRate'
      );
    });

    it('should revert if start block is greater than end block', async function () {
      const { srToken, end, rate } = await loadFixture(deploySRToken);
      const newStart = end + 1;
      const newEnd = end;
      await expect(srToken.updateRewardPeriod(newStart, newEnd, rate))
        .to.be.revertedWithCustomError(srToken, 'UpdateInvalidNewPeriod')
        .withArgs(newStart, newEnd);
    });

    it('should revert if updating during the current reward period', async function () {
      const { srToken, start, end, rate } = await loadFixture(deploySRToken);
      const newStart = end + 1;
      const newEnd = end + 100;
      const current = end - 1;
      await mineUpTo(current - 1);
      await expect(srToken.updateRewardPeriod(newStart, newEnd, rate))
        .to.be.revertedWithCustomError(srToken, 'UpdateDuringCurrentPeriod')
        .withArgs(start, end, current);
    });

    it('should revert if updating to started reward period', async function () {
      const { srToken, end, rate } = await loadFixture(deploySRToken);
      const newStart = end + 1;
      const newEnd = end + 100;
      await mineUpTo(newStart);
      await expect(srToken.updateRewardPeriod(newStart, newEnd, rate))
        .to.be.revertedWithCustomError(srToken, 'UpdateStartedNewPeriod')
        .withArgs(newStart, newStart + 1);
    });

    it('should update the reward period', async function () {
      const { srToken, end, rate } = await loadFixture(deploySRToken);
      const newStart = end;
      const newEnd = end + 100;
      await mineUpTo(newStart - 1);
      await expect(srToken.updateRewardPeriod(newStart, newEnd, rate))
        .to.emit(srToken, 'UpdateRewardPeriod')
        .withArgs(newStart, newEnd, rate);
    });
  });

  describe('#mint', function () {
    let mintSeq1, mintSeq2: Array<bigint>;
  });
});
