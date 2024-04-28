/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RewardManager.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SRToken is ERC4626, RewardManager {
    constructor(
        IERC20 stakingToken_,
        IERC20 rewardToken_,
        uint32 start,
        uint32 end,
        uint128 rate,
        string memory name_,
        string memory symbol_
    )
        ERC4626(stakingToken_)
        ERC20(name_, symbol_)
        RewardManager(rewardToken_, start, end, rate)
        Ownable(_msgSender())
    {}

    function _update(address from, address to, uint256 amount) internal override {
        if (from != address(0)) {
            _updateUserReward(from);
        }
        if (to != address(0)) {
            _updateUserReward(to);
        }
        super._update(from, to, amount);
    }

    function stakingToken() public view returns (IERC20) {
        return IERC20(asset());
    }

    function staked(address user) internal view override returns (uint256) {
        return balanceOf(user);
    }

    function totalStaked() internal view override returns (uint256) {
        return totalSupply();
    }
}
