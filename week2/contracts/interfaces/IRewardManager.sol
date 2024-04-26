/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IRewardManager {
    /**
     * @dev Emitted when the reward period is updated
     */
    event UpdateRewardPeriod(uint256 start, uint256 end, uint256 rate);

    /**
     * @dev Emitted when the reward rate is updated
     */
    event UpdateRewardRate(uint256 rate);

    /**
     * @dev Emitted when a user claims reward
     */
    event ClaimReward(address indexed sender, address indexed receiver, uint256 amount);

    /**
     * @dev Throws if new reward period is invalid, i.e. start >= end
     */
    error UpdateInvalidNewPeriod(uint256 start, uint256 end);

    /*
     * @dev Throws if updating during current reward period
     */
    error UpdateDuringCurrentPeriod(uint256 start, uint256 end, uint256 current);

    /**
     * @dev Throws if new reward period is started
     */
    error UpdateStartedNewPeriod(uint256 start, uint256 current);

    /**
     * @dev Throws if new reward rate is 0
     */
    error UpdateInvalidRewardRate();

    /**
     * @dev Update new reward period
     */
    function updateRewardPeriod(uint32 start, uint32 end, uint128 rate) external;

    /**
     * @dev Update the reward rate
     */
    function updateRewardRate(uint128 rate) external;

    /**
     * @dev Claim reward for
     */
    function claimReward(address receiver) external returns (uint128 amount);

    /**
     * Check if current block is in reward period
     */
    function isInRewardPeriod() external view returns (bool);

    /**
     * @dev Return the accrued reward of a user
     */
    function accruedReward(address user) external view returns (uint128);

    /**
     * @dev Return the staking token
     */
    function stakingToken() external view returns (IERC20);
}
