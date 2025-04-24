// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title DevToken
 * @dev ERC20 token for rewarding developers based on performance metrics
 */
contract DevToken is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Staking functionality
    mapping(address => uint256) private _stakes;
    mapping(address => uint256) private _stakeStartTime;
    uint256 public stakingAPY = 5; // 5% annual yield
    
    // Vesting functionality
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 duration;
        uint256 cliff;
    }
    
    mapping(address => VestingSchedule) private _vestingSchedules;
    
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);
    event StakeCreated(address indexed account, uint256 amount);
    event StakeReleased(address indexed account, uint256 amount, uint256 reward);
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount, uint256 duration, uint256 cliff);
    event VestingTokensReleased(address indexed beneficiary, uint256 amount);

    constructor() ERC20("Developer Evaluation Token", "DEV") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Mints tokens to a developer's address
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     * @param reason A description of why tokens are being minted
     */
    function mint(address to, uint256 amount, string memory reason) public onlyRole(MINTER_ROLE) whenNotPaused {
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @dev Burns tokens from a developer's address
     * @param from The address from which to burn tokens
     * @param amount The amount of tokens to burn
     * @param reason A description of why tokens are being burned
     */
    function burnTokens(address from, uint256 amount, string memory reason) public onlyRole(MINTER_ROLE) whenNotPaused {
        _burn(from, amount);
        emit TokensBurned(from, amount, reason);
    }
    
    /**
     * @dev Pauses all token transfers
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpauses all token transfers
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Creates a stake for the sender
     * @param amount The amount of tokens to stake
     */
    function createStake(uint256 amount) public whenNotPaused {
        require(amount > 0, "Cannot stake 0 tokens");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Update stake information
        _stakes[msg.sender] += amount;
        if (_stakeStartTime[msg.sender] == 0) {
            _stakeStartTime[msg.sender] = block.timestamp;
        }
        
        emit StakeCreated(msg.sender, amount);
    }
    
    /**
     * @dev Releases stake and rewards for the sender
     */
    function releaseStake() public whenNotPaused {
        require(_stakes[msg.sender] > 0, "No active stake");
        
        uint256 stakedAmount = _stakes[msg.sender];
        uint256 stakeDuration = block.timestamp - _stakeStartTime[msg.sender];
        
        // Calculate reward (APY prorated by time)
        uint256 reward = (stakedAmount * stakingAPY * stakeDuration) / (365 days * 100);
        
        // Reset stake information
        _stakes[msg.sender] = 0;
        _stakeStartTime[msg.sender] = 0;
        
        // Return staked tokens to user
        _transfer(address(this), msg.sender, stakedAmount);
        
        // Mint reward tokens
        _mint(msg.sender, reward);
        
        emit StakeReleased(msg.sender, stakedAmount, reward);
    }
    
    /**
     * @dev Creates a vesting schedule for a beneficiary
     * @param beneficiary The address that will receive the vested tokens
     * @param amount The total amount of tokens to vest
     * @param duration The duration of the vesting period in seconds
     * @param cliff The cliff period in seconds
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 duration,
        uint256 cliff
    ) public onlyRole(ADMIN_ROLE) whenNotPaused {
        require(beneficiary != address(0), "Beneficiary cannot be zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(cliff <= duration, "Cliff must be less than or equal to duration");
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Create vesting schedule
        _vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            releasedAmount: 0,
            startTime: block.timestamp,
            duration: duration,
            cliff: cliff
        });
        
        emit VestingScheduleCreated(beneficiary, amount, duration, cliff);
    }
    
    /**
     * @dev Releases vested tokens for the sender
     */
    function releaseVestedTokens() public whenNotPaused {
        VestingSchedule storage schedule = _vestingSchedules[msg.sender];
        
        require(schedule.totalAmount > 0, "No vesting schedule found");
        
        uint256 elapsedTime = block.timestamp - schedule.startTime;
        
        // Check if cliff period has passed
        require(elapsedTime >= schedule.cliff, "Cliff period not yet passed");
        
        // Calculate vested amount
        uint256 vestedAmount;
        if (elapsedTime >= schedule.duration) {
            vestedAmount = schedule.totalAmount;
        } else {
            vestedAmount = (schedule.totalAmount * elapsedTime) / schedule.duration;
        }
        
        // Calculate releasable amount
        uint256 releasableAmount = vestedAmount - schedule.releasedAmount;
        
        require(releasableAmount > 0, "No tokens available for release");
        
        // Update released amount
        schedule.releasedAmount += releasableAmount;
        
        // Transfer tokens to beneficiary
        _transfer(address(this), msg.sender, releasableAmount);
        
        emit VestingTokensReleased(msg.sender, releasableAmount);
    }
    
    /**
     * @dev Returns the amount of tokens staked by an account
     * @param account The address to check
     * @return The amount of staked tokens
     */
    function getStakedAmount(address account) public view returns (uint256) {
        return _stakes[account];
    }
    
    /**
     * @dev Returns the vesting schedule for an account
     * @param account The address to check
     * @return totalAmount The total amount of tokens in the vesting schedule
     * @return releasedAmount The amount of tokens already released
     * @return startTime The start time of the vesting schedule
     * @return duration The duration of the vesting schedule
     * @return cliff The cliff period of the vesting schedule
     */
    function getVestingSchedule(address account) public view returns (
        uint256 totalAmount,
        uint256 releasedAmount,
        uint256 startTime,
        uint256 duration,
        uint256 cliff
    ) {
        VestingSchedule memory schedule = _vestingSchedules[account];
        return (
            schedule.totalAmount,
            schedule.releasedAmount,
            schedule.startTime,
            schedule.duration,
            schedule.cliff
        );
    }
    
    /**
     * @dev Override of the ERC20 transfer function to check if the sender has staked tokens
     * @param to The address to transfer to
     * @param amount The amount to transfer
     * @return A boolean that indicates if the operation was successful
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        require(amount <= balanceOf(msg.sender) - _stakes[msg.sender], "Cannot transfer staked tokens");
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Override of the ERC20 transferFrom function to check if the sender has staked tokens
     * @param from The address to transfer from
     * @param to The address to transfer to
     * @param amount The amount to transfer
     * @return A boolean that indicates if the operation was successful
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        require(amount <= balanceOf(from) - _stakes[from], "Cannot transfer staked tokens");
        return super.transferFrom(from, to, amount);
    }
}
