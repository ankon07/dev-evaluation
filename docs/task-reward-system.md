# Automatic Task Reward System

This document describes the automatic task reward system implemented in the Dev Evaluation Blockchain platform. The system automatically rewards developers with DEV tokens when they complete tasks, based on task difficulty, type, and status.

## Overview

The automatic task reward system consists of:

1. **TaskRewardManager Smart Contract**: A smart contract that manages task rewards and calculates token amounts based on task properties.
2. **Backend Integration**: API endpoints and services that trigger rewards when tasks are completed.
3. **Transaction System**: A system that records all token transactions for transparency and auditing.

## Smart Contracts

### DevToken

The existing `DevToken` contract is used as the token for rewards. It implements the ERC20 standard with additional features like staking and vesting.

### TaskRewardManager

The `TaskRewardManager` contract is responsible for:

- Calculating reward amounts based on task properties
- Issuing tokens to developers
- Maintaining reward history
- Configuring reward parameters

#### Reward Calculation

Rewards are calculated using the following formula:

```
Reward = BaseReward × TypeMultiplier × StatusMultiplier
```

Where:
- **BaseReward**: The base reward amount for a task of a given difficulty (easy, medium, hard)
- **TypeMultiplier**: A multiplier based on the task type (feature, bug, improvement, etc.)
- **StatusMultiplier**: A multiplier based on the task status (done, verified)

#### Default Configuration

| Difficulty | Base Reward |
|------------|-------------|
| Easy       | 0.5 DEV     |
| Medium     | 1.0 DEV     |
| Hard       | 2.0 DEV     |

| Task Type      | Multiplier |
|----------------|------------|
| Feature        | 1.2x       |
| Bug            | 1.1x       |
| Improvement    | 1.0x       |
| Documentation  | 0.8x       |
| Test           | 0.9x       |

| Status    | Multiplier |
|-----------|------------|
| Done      | 1.0x       |
| Verified  | 1.25x      |

## Backend Integration

### API Endpoints

The system adds a new API endpoint to process completed tasks:

```
POST /api/evaluations/tasks/:taskId/process
```

This endpoint:
1. Checks if the task is completed and not already processed
2. Calculates the token reward based on task properties
3. Creates a token transaction
4. Processes the transaction on the blockchain
5. Marks the task as processed
6. Notifies the developer about the reward

### Services

#### EvaluationService

The `EvaluationService` has been extended with:

- `processCompletedTask(taskId)`: Processes a completed task and rewards the developer
- `calculateTaskTokenReward(task)`: Calculates the token reward for a task

#### TokenService

The `TokenService` has been extended with:

- `issueTaskReward(taskId, developerAddress, difficulty, taskType, status)`: Issues a task reward using the TaskRewardManager contract

## Transaction System

All task rewards are recorded in the `Transaction` model with:

- `type`: "mint"
- `reason`: "task_completion_reward"
- `taskId`: Reference to the completed task
- `to`: Developer's user ID
- `amount`: Token reward amount

## How to Use

### For Administrators

1. **Deploy Smart Contracts**:
   ```bash
   cd smart-contracts
   npx hardhat run scripts/deploy.js --network <network>
   ```

2. **Configure Environment Variables**:
   Update `.env` with the deployed contract addresses:
   ```
   DEV_TOKEN_ADDRESS=<deployed_dev_token_address>
   TASK_REWARD_MANAGER_ADDRESS=<deployed_task_reward_manager_address>
   ```

3. **Test Task Rewards**:
   ```bash
   npx hardhat run scripts/test-task-rewards.js --network <network>
   ```

4. **Configure Reward Parameters** (optional):
   Use the TaskRewardManager contract to adjust reward parameters:
   - `setDifficultyReward(difficulty, amount)`
   - `setTypeMultiplier(taskType, multiplier)`
   - `setStatusMultiplier(status, multiplier)`

5. **Process Completed Tasks**:
   ```
   POST /api/evaluations/tasks/:taskId/process
   ```

### For Developers

Developers automatically receive DEV tokens when:

1. They complete a task (status changes to "done" or "verified")
2. An administrator processes the task through the API
3. The task is not already processed

Developers can view their rewards in:
- Their wallet balance
- Transaction history
- Task history

## Integration with Task Management Systems

The automatic task reward system can be integrated with task management systems like Jira, Trello, or GitHub Issues. When a task is marked as completed in these systems, a webhook can trigger the task processing endpoint to reward the developer.

## Monitoring and Auditing

All task rewards are recorded in:

1. **Blockchain**: All token transfers are recorded on the blockchain
2. **Transaction Model**: All transactions are recorded in the database
3. **TaskRewardManager Contract**: All rewards are recorded in the contract's history

Administrators can:
- View all transactions in the admin dashboard
- View task reward history in the TaskRewardManager contract
- Generate reports on token distribution

## Troubleshooting

### Common Issues

1. **Task Not Processed**:
   - Check if the task status is "done" or "verified"
   - Check if the task is already processed (`evaluationProcessed` flag)
   - Check if the developer has a wallet address

2. **Transaction Failed**:
   - Check blockchain connection
   - Check if TaskRewardManager has MINTER_ROLE
   - Check if the contract has enough gas

3. **Incorrect Reward Amount**:
   - Check task difficulty, type, and status
   - Check reward parameters in TaskRewardManager contract

### Logs and Debugging

- Check backend logs for transaction processing
- Check blockchain explorer for transaction status
- Use the `test-task-rewards.js` script to test reward calculations
