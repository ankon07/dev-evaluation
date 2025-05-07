// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./DevToken.sol";

/**
 * @title TaskRewardManager
 * @dev Contract for managing automatic rewards for completed tasks
 */
contract TaskRewardManager is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");
    
    // Reference to the DevToken contract
    DevToken public devToken;
    
    // Task difficulty levels and their base rewards
    mapping(string => uint256) public difficultyRewards;
    
    // Task type multipliers (in basis points, 100 = 1.0x)
    mapping(string => uint256) public typeMultipliers;
    
    // Status multipliers (in basis points, 100 = 1.0x)
    mapping(string => uint256) public statusMultipliers;
    
    // Task reward history
    struct TaskReward {
        string taskId;
        address developer;
        uint256 amount;
        string difficulty;
        string taskType;
        string status;
        uint256 timestamp;
    }
    
    TaskReward[] public taskRewards;
    
    // Events
    event RewardIssued(string indexed taskId, address indexed developer, uint256 amount);
    event RewardConfigUpdated(string paramType, string key, uint256 value);
    
    /**
     * @dev Constructor
     * @param _devTokenAddress Address of the DevToken contract
     */
    constructor(address _devTokenAddress) {
        require(_devTokenAddress != address(0), "Invalid token address");
        
        devToken = DevToken(_devTokenAddress);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(REWARD_MANAGER_ROLE, msg.sender);
        
        // Set default difficulty rewards (in token units)
        difficultyRewards["easy"] = 0.5 ether;    // 0.5 tokens
        difficultyRewards["medium"] = 1 ether;    // 1 token
        difficultyRewards["hard"] = 2 ether;      // 2 tokens
        
        // Set default type multipliers (in basis points)
        typeMultipliers["feature"] = 120;         // 1.2x
        typeMultipliers["bug"] = 110;             // 1.1x
        typeMultipliers["improvement"] = 100;     // 1.0x
        typeMultipliers["documentation"] = 80;    // 0.8x
        typeMultipliers["test"] = 90;             // 0.9x
        
        // Set default status multipliers (in basis points)
        statusMultipliers["done"] = 100;          // 1.0x
        statusMultipliers["verified"] = 125;      // 1.25x
    }
    
    /**
     * @dev Issue a reward for a completed task
     * @param taskId The ID of the completed task
     * @param developer The address of the developer to reward
     * @param difficulty The difficulty level of the task
     * @param taskType The type of the task
     * @param status The status of the task
     * @return The amount of tokens rewarded
     */
    function issueTaskReward(
        string memory taskId,
        address developer,
        string memory difficulty,
        string memory taskType,
        string memory status
    ) 
        external
        onlyRole(REWARD_MANAGER_ROLE)
        whenNotPaused
        returns (uint256)
    {
        require(developer != address(0), "Invalid developer address");
        require(difficultyRewards[difficulty] > 0, "Invalid difficulty level");
        require(typeMultipliers[taskType] > 0, "Invalid task type");
        require(statusMultipliers[status] > 0, "Invalid status");
        
        // Calculate reward amount
        uint256 baseReward = difficultyRewards[difficulty];
        uint256 typeMultiplier = typeMultipliers[taskType];
        uint256 statusMultiplier = statusMultipliers[status];
        
        // Apply multipliers (using basis points)
        uint256 rewardAmount = (baseReward * typeMultiplier * statusMultiplier) / (100 * 100);
        
        // Mint tokens to the developer
        devToken.mint(developer, rewardAmount, string(abi.encodePacked("Task reward: ", taskId)));
        
        // Record the reward
        taskRewards.push(TaskReward({
            taskId: taskId,
            developer: developer,
            amount: rewardAmount,
            difficulty: difficulty,
            taskType: taskType,
            status: status,
            timestamp: block.timestamp
        }));
        
        emit RewardIssued(taskId, developer, rewardAmount);
        
        return rewardAmount;
    }
    
    /**
     * @dev Set the reward amount for a difficulty level
     * @param difficulty The difficulty level
     * @param amount The reward amount in token units
     */
    function setDifficultyReward(string memory difficulty, uint256 amount) 
        external
        onlyRole(ADMIN_ROLE)
    {
        difficultyRewards[difficulty] = amount;
        emit RewardConfigUpdated("difficulty", difficulty, amount);
    }
    
    /**
     * @dev Set the multiplier for a task type
     * @param taskType The task type
     * @param multiplier The multiplier in basis points (100 = 1.0x)
     */
    function setTypeMultiplier(string memory taskType, uint256 multiplier) 
        external
        onlyRole(ADMIN_ROLE)
    {
        require(multiplier > 0, "Multiplier must be greater than 0");
        typeMultipliers[taskType] = multiplier;
        emit RewardConfigUpdated("type", taskType, multiplier);
    }
    
    /**
     * @dev Set the multiplier for a task status
     * @param status The task status
     * @param multiplier The multiplier in basis points (100 = 1.0x)
     */
    function setStatusMultiplier(string memory status, uint256 multiplier) 
        external
        onlyRole(ADMIN_ROLE)
    {
        require(multiplier > 0, "Multiplier must be greater than 0");
        statusMultipliers[status] = multiplier;
        emit RewardConfigUpdated("status", status, multiplier);
    }
    
    /**
     * @dev Get the total number of task rewards issued
     * @return The number of task rewards
     */
    function getTaskRewardsCount() external view returns (uint256) {
        return taskRewards.length;
    }
    
    /**
     * @dev Get task rewards for a specific developer
     * @param developer The developer address
     * @param limit The maximum number of rewards to return
     * @return An array of task reward indices for the developer
     */
    function getDeveloperRewards(address developer, uint256 limit) 
        external
        view
        returns (uint256[] memory)
    {
        // Count rewards for the developer
        uint256 count = 0;
        for (uint256 i = 0; i < taskRewards.length; i++) {
            if (taskRewards[i].developer == developer) {
                count++;
            }
        }
        
        // Apply limit
        uint256 resultCount = count < limit ? count : limit;
        uint256[] memory result = new uint256[](resultCount);
        
        // Fill result array with reward indices
        if (resultCount > 0) {
            uint256 resultIndex = 0;
            for (uint256 i = taskRewards.length; i > 0 && resultIndex < resultCount; i--) {
                uint256 index = i - 1;
                if (taskRewards[index].developer == developer) {
                    result[resultIndex] = index;
                    resultIndex++;
                }
            }
        }
        
        return result;
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Update the DevToken contract address
     * @param newDevTokenAddress The new DevToken contract address
     */
    function updateDevTokenAddress(address newDevTokenAddress) 
        external
        onlyRole(ADMIN_ROLE)
    {
        require(newDevTokenAddress != address(0), "Invalid token address");
        devToken = DevToken(newDevTokenAddress);
    }
}
