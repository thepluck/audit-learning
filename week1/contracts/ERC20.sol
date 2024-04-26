/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC20.sol";

contract ERC20 is IERC20 {
    mapping(address account => uint256 balance) private _balances;
    mapping(address owner => mapping(address spender => uint256 amount))
        private _allowances;

    uint256 public totalSupply;
    uint8 public immutable decimals;
    uint256 public immutable maxTotalSupply;

    string public name;
    string public symbol;

    address private _owner;

    modifier onlyOwner() {
        if (msg.sender != _owner) revert InvalidOwner();
        _;
    }

    constructor(string memory name_, string memory symbol_, uint8 decimals_) {
        name = name_;
        symbol = symbol_;
        decimals = decimals_;
        maxTotalSupply = (10 ** 9) * (10 ** decimals);
        _owner = msg.sender;
    }

    function mint(address account, uint256 amount) public onlyOwner {
        _transfer(address(0), account, amount);
    }

    function burn(uint256 amount) public {
        _transfer(msg.sender, address(0), amount);
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(
        address owner,
        address spender
    ) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public returns (bool) {
        _allowances[from][msg.sender] -= amount;
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        if (from == address(0)) {
            totalSupply += amount;
            if (totalSupply > maxTotalSupply) {
                revert MaxTotalSupplyExceeded(totalSupply, maxTotalSupply);
            }
        } else {
            _balances[from] -= amount;
        }
        if (to == address(0)) {
            totalSupply -= amount;
        } else {
            _balances[to] += amount;
        }
        emit Transfer(from, to, amount);
    }
}
