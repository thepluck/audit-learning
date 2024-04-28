/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IRewardManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

abstract contract RewardManager is IRewardManager, Ownable, Pausable {
    using SafeERC20 for IERC20;
    using SafeCast for uint256;
    using Math for uint256;

    struct RewardPeriod {
        uint32 start;
        uint32 end;
        uint128 rate;
    }

    struct RewardState {
        uint128 index;
        uint32 lastUpdated;
    }

    struct UserReward {
        uint128 index;
        uint128 accrued;
    }

    uint256 public constant SCALING = 1e18;

    IERC20 public immutable rewardToken;
    RewardPeriod public rewardPeriod;
    RewardState public lastRewardState;
    mapping(address user => UserReward) userRewards;

    constructor(IERC20 rewardToken_, uint32 start, uint32 end, uint128 rate) {
        rewardToken = rewardToken_;
        updateRewardPeriod(start, end, rate);
    }

    function updateRewardPeriod(uint32 start, uint32 end, uint128 rate) public onlyOwner {
        if (rate == 0) {
            revert UpdateInvalidRewardRate();
        }
        if (start >= end) {
            revert UpdateInvalidNewPeriod(start, end);
        }
        if (isInRewardPeriod()) {
            revert UpdateDuringCurrentPeriod(rewardPeriod.start, rewardPeriod.end, block.number);
        }
        if (start < block.number) {
            revert UpdateStartedNewPeriod(start, block.number);
        }
        _updateRewardState();

        /**
         * Crucial for further calculation
         */
        lastRewardState.lastUpdated = start;
        rewardPeriod = RewardPeriod(start, end, rate);

        emit UpdateRewardPeriod(start, end, rate);
    }

    function updateRewardRate(uint128 rate) public onlyOwner {
        if (rate == 0) {
            revert UpdateInvalidRewardRate();
        }
        _updateRewardState();
        rewardPeriod.rate = rate;

        emit UpdateRewardRate(rate);
    }

    function claimReward(address receiver) public returns (uint128 amount) {
        amount = accruedReward(_msgSender());
        _claim(_msgSender(), receiver, amount);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function isInRewardPeriod() public view returns (bool) {
        return block.number >= rewardPeriod.start && block.number < rewardPeriod.end;
    }

    function accruedReward(address user) public view returns (uint128) {
        RewardState memory currentRewardState = _currentRewardState();
        UserReward storage userReward = userRewards[user];

        return userReward.accrued + _calcUserReward(staked(user), userReward.index, currentRewardState.index);
    }

    function _updateRewardState() internal returns (RewardState memory currentRewardState) {
        currentRewardState = _currentRewardState();
        if (lastRewardState.lastUpdated < block.number) {
            lastRewardState = currentRewardState;
        }
    }

    function _updateUserReward(address user) internal returns (UserReward memory userReward) {
        RewardState memory currentRewardState = _updateRewardState();
        userReward = userRewards[user];
        if (userReward.index < currentRewardState.index) {
            userReward.accrued += _calcUserReward(staked(user), userReward.index, currentRewardState.index);
            userReward.index = currentRewardState.index;
        }
        userRewards[user] = userReward;
    }

    function _claim(address owner, address receiver, uint128 amount) internal {
        UserReward memory userReward = _updateUserReward(owner);
        userRewards[owner].accrued = userReward.accrued - amount;
        rewardToken.safeTransfer(receiver, amount);

        emit ClaimReward(owner, receiver, amount);
    }

    function _currentRewardState() internal view whenNotPaused returns (RewardState memory currentRewardState) {
        uint256 currentBlock = block.number;
        uint256 totalStaked_ = totalStaked();
        currentRewardState = lastRewardState;
        if (currentBlock <= rewardPeriod.start) {
            return currentRewardState;
        }

        uint256 updatingBlock = currentBlock < rewardPeriod.end ? currentBlock : rewardPeriod.end;
        uint256 elapsed = updatingBlock - currentRewardState.lastUpdated;
        if (elapsed == 0) {
            return currentRewardState;
        }
        currentRewardState.lastUpdated = updatingBlock.toUint32();
        if (totalStaked_ > 0) {
            currentRewardState.index = (lastRewardState.index +
                SCALING.mulDiv(elapsed * rewardPeriod.rate, totalStaked_)).toUint128();
        }
    }

    function _calcUserReward(uint256 staked_, uint128 lastIndex, uint128 currentIndex) internal pure returns (uint128) {
        return staked_.mulDiv(currentIndex - lastIndex, SCALING).toUint128();
    }

    function staked(address user) internal view virtual returns (uint256);

    function totalStaked() internal view virtual returns (uint256);
}
