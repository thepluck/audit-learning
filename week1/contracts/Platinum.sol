/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ERC20.sol";

contract Platinum is ERC20 {
    constructor() ERC20("Platinum", "PLT", 18) {}
}
