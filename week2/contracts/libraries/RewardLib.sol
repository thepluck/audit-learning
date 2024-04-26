/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

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

library RewardLib {
    using SafeCast for uint256;
    using Math for uint256;

    uint256 public constant SCALING = 1e18;

    function currentRewardState(
        RewardPeriod memory rewardPeriod,
        RewardState memory lastRewardState,
        uint256 totalStaked,
        uint256 currentBlock
    ) internal pure returns (RewardState memory) {
        if (currentBlock <= rewardPeriod.start) {
            return lastRewardState;
        }

        uint256 updatingBlock = currentBlock < rewardPeriod.end ? currentBlock : rewardPeriod.end;
        uint256 elapsed = updatingBlock - lastRewardState.lastUpdated;
        if (elapsed == 0) {
            return lastRewardState;
        }

        if (totalStaked == 0) {
            return lastRewardState;
        }

        return
            RewardState({
                index: (lastRewardState.index + SCALING.mulDiv(elapsed * rewardPeriod.rate, totalStaked)).toUint128(),
                lastUpdated: updatingBlock.toUint32()
            });
    }

    function calcUserReward(uint256 staked, uint128 lastIndex, uint128 currentIndex) internal pure returns (uint128) {
        return staked.mulDiv(currentIndex - lastIndex, SCALING).toUint128();
    }
}
