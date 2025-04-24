#!/bin/bash

# Blockchain Functionality Testing Script for Dev Evaluation Blockchain Backend
# This script tests the blockchain-related endpoints of the API

# Set the base URL
BASE_URL="http://localhost:5000/api"
TOKEN=""
USER_ID=""
WALLET_ADDRESS="0x1234567890123456789012345678901234567890"

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
      "name": "Blockchain Test User",
      "email": "blockchainuser@example.com",
      "password": "password123",
      "role": "developer"
    }')
  
  echo "$response"
  
  if check_error "$response"; then
    # Extract token from response
    TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}Registration successful${NC}"
    echo "Token: $TOKEN"
    
    # Get user ID using the token
    if [ -n "$TOKEN" ]; then
      user_response=$(curl -s -X GET "${BASE_URL}/auth/me" \
        -H "Authorization: Bearer $TOKEN")
      
      USER_ID=$(echo "$user_response" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
      echo "User ID: $USER_ID"
    fi
    
    return 0
  else
    echo -e "${RED}Registration failed${NC}"
    return 1
  fi
}

# 2. Test Login (if registration fails)
test_login() {
  print_header "Testing User Login"
  
  response=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "blockchainuser@example.com",
      "password": "password123"
    }')
  
  echo "$response"
  
  if check_error "$response"; then
    TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
      echo -e "${GREEN}Login successful. Token obtained.${NC}"
      echo "Token: $TOKEN"
      
      # Get user ID
      user_response=$(curl -s -X GET "${BASE_URL}/auth/me" \
        -H "Authorization: Bearer $TOKEN")
      
      USER_ID=$(echo "$user_response" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
      echo "User ID: $USER_ID"
      
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
    -d "{
      \"walletAddress\": \"$WALLET_ADDRESS\"
    }")
  
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

# 5. Test Mint Tokens (Admin only)
test_mint_tokens() {
  print_header "Testing Mint Tokens (Admin Only)"
  
  response=$(curl -s -X POST "${BASE_URL}/admin/mint-tokens" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"to\": \"$USER_ID\",
      \"amount\": 10,
      \"reason\": \"Testing token minting\"
    }")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Mint tokens successful${NC}"
    return 0
  else
    echo -e "${RED}Mint tokens failed (expected if not admin)${NC}"
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

# 8. Test Get Staking Info
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

# Main test execution
main() {
  echo -e "${BLUE}Starting Blockchain Functionality Tests for Dev Evaluation Blockchain Backend${NC}"
  echo -e "${BLUE}Base URL: $BASE_URL${NC}"
  
  # Run tests
  test_registration
  
  # If registration failed, try login
  if [ -z "$TOKEN" ]; then
    test_login
  fi
  
  # If authentication successful, run authenticated tests
  if [ -n "$TOKEN" ]; then
    test_connect_wallet
    test_token_balance
    test_mint_tokens
    test_stake_tokens
    test_transaction_history
    test_staking_info
  else
    echo -e "${RED}Authentication failed, skipping authenticated tests${NC}"
  fi
  
  echo -e "\n${BLUE}Blockchain Functionality Testing Complete${NC}"
}

# Run the main function
main
