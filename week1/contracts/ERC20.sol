/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC20.sol";

contract ERC20 is IERC20 {
    uint256 public constant MAX_TOTAL_SUPPLY = 10 ** 18;

    mapping(address account => uint256 balance) private _balances;
    mapping(address owner => mapping(address spender => uint256 amount))
        private _allowances;

    uint256 public totalSupply;
    uint8 public immutable decimals;

    string public name;
    string public symbol;

    address private _owner;

    modifier onlyOwner() {
        require(msg.sender == _owner, "Only owner can call this function");
        _;
    }

    constructor(string memory name_, string memory symbol_, uint8 decimals_) {
        name = name_;
        symbol = symbol_;
        decimals = decimals_;
        _owner = msg.sender;
    }

    function mint(address account, uint256 amount) public onlyOwner {
        totalSupply += amount;
        require(totalSupply <= MAX_TOTAL_SUPPLY, "Total supply exceeds max");
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);
    }

    function burn(address account, uint256 amount) public onlyOwner {
        require(_balances[account] >= amount, "Insufficient balance");
        _balances[account] -= amount;
        totalSupply -= amount;
        emit Transfer(account, address(0), amount);
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(
        address to,
        uint256 amount
    ) public override returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(
        address owner,
        address spender
    ) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(
        address spender,
        uint256 amount
    ) public override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        require(
            allowance(from, msg.sender) >= amount,
            "Insufficient allowance"
        );
        require(_balances[from] >= amount, "Insufficient balance");
        _allowances[from][msg.sender] -= amount;
        _balances[from] -= amount;
        _balances[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
