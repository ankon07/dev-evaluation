#!/bin/bash

# Tokens API Testing Script for Dev Evaluation Blockchain Backend
# This script tests the token-related endpoints of the API

# Set the base URL
BASE_URL="http://localhost:5000/api"
TOKEN=""
USER_ID=""
TRANSACTION_ID=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
  echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Function to check if the response contains an error
check_error() {
  if echo "$1" | grep -q "error"; then
    echo -e "${RED}Error: $1${NC}"
    return 1
  fi
  return 0
}

# 1. Test User Registration
test_registration() {
  print_header "Testing User Registration"
  
  response=$(curl -s -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Token Test User",
      "email": "tokenuser@example.com",
      "password": "password123",
      "role": "developer"
    }')
  
  echo "$response"
  
  if check_error "$response"; then
    USER_ID=$(echo "$response" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}Registration successful${NC}"
    echo "User ID: $USER_ID"
    return 0
  else
    echo -e "${RED}Registration failed${NC}"
    return 1
  fi
}

# 2. Test Login
test_login() {
  print_header "Testing User Login"
  
  response=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "tokenuser@example.com",
      "password": "password123"
    }')
  
  echo "$response"
  
  if check_error "$response"; then
    TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
      echo -e "${GREEN}Login successful. Token obtained.${NC}"
      echo "Token: $TOKEN"
      return 0
    else
      echo -e "${RED}Login successful but no token found${NC}"
      return 1
    fi
  else
    echo -e "${RED}Login failed${NC}"
    return 1
  fi
}

# 3. Test Connect Wallet
test_connect_wallet() {
  print_header "Testing Connect Wallet"
  
  if [ -z "$USER_ID" ]; then
    echo -e "${RED}User ID not available, skipping wallet connection test${NC}"
    return 1
  fi
  
  response=$(curl -s -X POST "${BASE_URL}/developers/$USER_ID/wallet" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "walletAddress": "0x1234567890123456789012345678901234567890"
    }')
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Connect wallet successful${NC}"
    return 0
  else
    echo -e "${RED}Connect wallet failed${NC}"
    return 1
  fi
}

# 4. Test Get Token Balance
test_token_balance() {
  print_header "Testing Get Token Balance"
  
  response=$(curl -s -X GET "${BASE_URL}/tokens/balance" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get token balance successful${NC}"
    return 0
  else
    echo -e "${RED}Get token balance failed${NC}"
    return 1
  fi
}

# 5. Test Transfer Tokens
test_transfer_tokens() {
  print_header "Testing Transfer Tokens"
  
  response=$(curl -s -X POST "${BASE_URL}/tokens/transfer" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "toAddress": "0x0987654321098765432109876543210987654321",
      "amount": 1,
      "reason": "Test transfer"
    }')
  
  echo "$response"
  
  if check_error "$response"; then
    TRANSACTION_ID=$(echo "$response" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}Transfer tokens successful${NC}"
    echo "Transaction ID: $TRANSACTION_ID"
    return 0
  else
    echo -e "${RED}Transfer tokens failed${NC}"
    return 1
  fi
}

# 6. Test Stake Tokens
test_stake_tokens() {
  print_header "Testing Stake Tokens"
  
  response=$(curl -s -X POST "${BASE_URL}/tokens/stake" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "amount": 1
    }')
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Stake tokens successful${NC}"
    return 0
  else
    echo -e "${RED}Stake tokens failed${NC}"
    return 1
  fi
}

# 7. Test Get Transaction History
test_transaction_history() {
  print_header "Testing Get Transaction History"
  
  response=$(curl -s -X GET "${BASE_URL}/tokens/transactions" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get transaction history successful${NC}"
    return 0
  else
    echo -e "${RED}Get transaction history failed${NC}"
    return 1
  fi
}

# 8. Test Get Transaction Status
test_transaction_status() {
  print_header "Testing Get Transaction Status"
  
  if [ -z "$TRANSACTION_ID" ]; then
    echo -e "${RED}Transaction ID not available, skipping transaction status test${NC}"
    return 1
  fi
  
  response=$(curl -s -X GET "${BASE_URL}/tokens/transactions/$TRANSACTION_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get transaction status successful${NC}"
    return 0
  else
    echo -e "${RED}Get transaction status failed${NC}"
    return 1
  fi
}

# 9. Test Get Staking Info
test_staking_info() {
  print_header "Testing Get Staking Info"
  
  response=$(curl -s -X GET "${BASE_URL}/tokens/staking" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get staking info successful${NC}"
    return 0
  else
    echo -e "${RED}Get staking info failed${NC}"
    return 1
  fi
}

# 10. Test Redeem Tokens
test_redeem_tokens() {
  print_header "Testing Redeem Tokens"
  
  response=$(curl -s -X POST "${BASE_URL}/tokens/redeem" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "amount": 1,
      "rewardType": "gift card",
      "details": "Test redemption"
    }')
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Redeem tokens successful${NC}"
    return 0
  else
    echo -e "${RED}Redeem tokens failed${NC}"
    return 1
  fi
}

# 11. Test Unstake Tokens
test_unstake_tokens() {
  print_header "Testing Unstake Tokens"
  
  response=$(curl -s -X POST "${BASE_URL}/tokens/unstake" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Unstake tokens successful${NC}"
    return 0
  else
    echo -e "${RED}Unstake tokens failed${NC}"
    return 1
  fi
}

# Main test execution
main() {
  echo -e "${BLUE}Starting Tokens API Tests for Dev Evaluation Blockchain Backend${NC}"
  echo -e "${BLUE}Base URL: $BASE_URL${NC}"
  
  # Run tests
  test_registration
  test_login
  
  # If login successful, run authenticated tests
  if [ -n "$TOKEN" ]; then
    test_connect_wallet
    test_token_balance
    test_transfer_tokens
    test_stake_tokens
    test_transaction_history
    test_transaction_status
    test_staking_info
    test_redeem_tokens
    test_unstake_tokens
  else
    echo -e "${RED}Authentication failed, skipping authenticated tests${NC}"
  fi
  
  echo -e "\n${BLUE}Tokens API Testing Complete${NC}"
}

# Run the main function
main
