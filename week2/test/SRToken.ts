import { loadFixture, mine, mineUpTo } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { tokenEvents } from './mintTest.json';
import { SRToken } from '../typechain-types/contracts/core/SRToken';

describe('SRToken', function () {
  const SCALING = 10n ** 18n;

  async function deploySRToken() {
    const [owner, account1, account2] = await ethers.getSigners();
    const srTokenFactory = await ethers.getContractFactory('SRToken');
    const MyTokenFactory = await ethers.getContractFactory('MyToken');
    const stakingToken = await MyTokenFactory.deploy('StakingToken', 'STK');
    const rewardToken = await MyTokenFactory.deploy('RewardsToken', 'RTK');
    const start = 100n;
    const end = 400n;
    const rate = 40n;
    await stakingToken.mint(account1, 10n ** 18n);
    await stakingToken.mint(account2, 10n ** 18n);
    const srToken = await srTokenFactory.deploy(stakingToken, rewardToken, start, end, rate, 'SRToken', 'SRT');
    await stakingToken.connect(account1).approve(srToken, 2n ** 256n - 1n);
    await stakingToken.connect(account2).approve(srToken, 2n ** 256n - 1n);
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
      await mineUpTo(start + 1n);
      expect(await srToken.isInRewardPeriod()).to.be.true;
      await mineUpTo(end + 1n);
      expect(await srToken.isInRewardPeriod()).to.be.false;
    });
  });

  describe('#updateRewardPeriod', function () {
    it('should revert if called by a non-owner', async function () {
      const { srToken, account1, end, rate } = await loadFixture(deploySRToken);
      const newStart = end + 1n;
      const newEnd = end + 100n;
      await expect(srToken.connect(account1).updateRewardPeriod(newStart, newEnd, rate)).to.be.revertedWithCustomError(
        srToken,
        'OwnableUnauthorizedAccount'
      );
    });

    it('should revert if new rewards rate is 0', async function () {
      const { srToken, end } = await loadFixture(deploySRToken);
      const newStart = end + 1n;
      const newEnd = end + 100n;
      const newrate = 0;
      await mineUpTo(newStart - 1n);
      await expect(srToken.updateRewardPeriod(newStart, newEnd, newrate)).to.be.revertedWithCustomError(
        srToken,
        'UpdateInvalidRewardRate'
      );
    });

    it('should revert if start block is greater than end block', async function () {
      const { srToken, end, rate } = await loadFixture(deploySRToken);
      const newStart = end + 1n;
      const newEnd = end;
      await expect(srToken.updateRewardPeriod(newStart, newEnd, rate))
        .to.be.revertedWithCustomError(srToken, 'UpdateInvalidNewPeriod')
        .withArgs(newStart, newEnd);
    });

    it('should revert if updating during the current reward period', async function () {
      const { srToken, start, end, rate } = await loadFixture(deploySRToken);
      const newStart = end + 1n;
      const newEnd = end + 100n;
      const current = end - 1n;
      await mineUpTo(current - 1n);
      await expect(srToken.updateRewardPeriod(newStart, newEnd, rate))
        .to.be.revertedWithCustomError(srToken, 'UpdateDuringCurrentPeriod')
        .withArgs(start, end, current);
    });

    it('should revert if updating to started reward period', async function () {
      const { srToken, end, rate } = await loadFixture(deploySRToken);
      const newStart = end + 1n;
      const newEnd = end + 100n;
      await mineUpTo(newStart);
      await expect(srToken.updateRewardPeriod(newStart, newEnd, rate))
        .to.be.revertedWithCustomError(srToken, 'UpdateStartedNewPeriod')
        .withArgs(newStart, newStart + 1n);
    });

    it('should update the reward period', async function () {
      const { srToken, end, rate } = await loadFixture(deploySRToken);
      const newStart = end;
      const newEnd = end + 100n;
      await mineUpTo(newStart - 1n);
      await expect(srToken.updateRewardPeriod(newStart, newEnd, rate))
        .to.emit(srToken, 'UpdateRewardPeriod')
        .withArgs(newStart, newEnd, rate);
    });
  });

  describe('#updateRewardRate', function () {
    it('should revert if new rewards rate is 0', async function () {
      const { srToken, start, end, account1, account2 } = await loadFixture(deploySRToken);
      await expect(srToken.updateRewardRate(0)).to.be.revertedWithCustomError(srToken, 'UpdateInvalidRewardRate');
    });

    it('should update reward rate', async function () {
      const { srToken, start, end, account1, account2 } = await loadFixture(deploySRToken);
      await srToken.connect(account1).mint(9, account1);
      await srToken.connect(account1).mint(10, account2);
      await mineUpTo(start - 1n);
      await mineUpTo(199);
      await srToken.updateRewardRate(50n);
      await mineUpTo(end);
      let expectedReward = (((100n * 40n * SCALING) / 19n + (200n * 50n * SCALING) / 19n) * 9n) / SCALING;
      expect(await srToken.accruedReward(account1)).to.equal(expectedReward);
    });
  });

  describe('#mint', function () {
    it('minted before start', async function () {
      const { srToken, end, account1, account2 } = await loadFixture(deploySRToken);
      srToken.connect(account1).mint(9, account1);
      srToken.connect(account1).mint(10, account2);
      await mineUpTo(end);
      console.log(await srToken.accruedReward(account1));
    });

    it('start with zero balance', async function () {
      const { srToken, rate, account1, account2 } = await loadFixture(deploySRToken);

      for (const curEvent of tokenEvents) {
        if (curEvent.shares == -100) {
          /// ask
          let lastIndex = 0n;
          let userIndex = 0n;
          let lastBlock = 0n;
          let staked = 0n;
          let totalStaked = 0n;
          let reward = 0n;
          for (const pastEvent of tokenEvents) {
            if (pastEvent.block >= curEvent.block) break;
            if (pastEvent.shares == -100) continue;
            let newIndex = lastIndex;
            if (totalStaked > 0) {
              newIndex += ((BigInt(pastEvent.block) - lastBlock) * SCALING * rate) / totalStaked;
            }
            lastIndex = newIndex;
            lastBlock = BigInt(pastEvent.block);
            totalStaked += BigInt(pastEvent.shares);
            if (curEvent.user == pastEvent.user) {
              reward += ((newIndex - userIndex) * staked) / SCALING;
              userIndex = newIndex;
              staked += BigInt(pastEvent.shares);
            }
          }
          {
            let newIndex = lastIndex;
            if (totalStaked > 0) {
              newIndex += ((BigInt(curEvent.block) - lastBlock) * SCALING * rate) / totalStaked;
            }
            reward += ((newIndex - userIndex) * staked) / SCALING;
          }
          const user = curEvent.user == 1 ? account1 : account2;
          await mineUpTo(curEvent.block);
          expect(await srToken.accruedReward(user)).to.equal(reward);
        } else {
          /// mint
          await mineUpTo(curEvent.block - 1);
          const user = curEvent.user == 1 ? account1 : account2;
          if (curEvent.shares < 0) {
            await srToken.connect(user).redeem(-curEvent.shares, user, user);
          } else {
            await srToken.connect(user).mint(curEvent.shares, user);
          }
        }
      }
    });
  });

  describe('#pause & unpause', function () {
    it('should pause and unpause', async function () {
      const { srToken, account1 } = await loadFixture(deploySRToken);
      srToken.pause();
      await expect(srToken.connect(account1).mint(1, account1)).to.be.revertedWithCustomError(srToken, 'EnforcedPause');
      srToken.unpause();
      await srToken.connect(account1).mint(1, account1);
    });
  });

  describe('#claimReward', function () {
    it('should claim', async function () {
      const { srToken, start, end, account1 } = await loadFixture(deploySRToken);
      mineUpTo(start - 1n);
      srToken.connect(account1).mint(1, account1);
      mineUpTo(end - 1n);
      await expect(srToken.connect(account1).claimReward(account1))
        .to.emit(srToken, 'ClaimReward')
        .withArgs(account1, account1, srToken.accruedReward(account1));
    });
  });
});
