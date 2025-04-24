#!/bin/bash

# API Testing Script for Dev Evaluation Blockchain Backend
# This script tests the main endpoints of the API

# Set the base URL
BASE_URL="http://localhost:5000/api"
TOKEN=""
USER_ID=""

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

# 1. Test Registration
test_registration() {
  print_header "Testing User Registration"
  
  response=$(curl -s -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test User",
      "email": "testuser@example.com",
      "password": "password123",
      "role": "developer"
    }')
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Registration successful${NC}"
    USER_ID=$(echo "$response" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
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
      "email": "testuser@example.com",
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

# 3. Test Get Current User
test_get_me() {
  print_header "Testing Get Current User"
  
  response=$(curl -s -X GET "${BASE_URL}/auth/me" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get current user successful${NC}"
    return 0
  else
    echo -e "${RED}Get current user failed${NC}"
    return 1
  fi
}

# 4. Test Token Balance
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

# 5. Test Developer Stats
test_developer_stats() {
  print_header "Testing Get Developer Stats"
  
  response=$(curl -s -X GET "${BASE_URL}/developers/stats" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get developer stats successful${NC}"
    return 0
  else
    echo -e "${RED}Get developer stats failed${NC}"
    return 1
  fi
}

# 6. Test Connect Wallet (if user ID is available)
test_connect_wallet() {
  if [ -z "$USER_ID" ]; then
    echo -e "${RED}User ID not available, skipping wallet connection test${NC}"
    return 1
  fi
  
  print_header "Testing Connect Wallet"
  
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
  echo -e "${BLUE}Starting API Tests for Dev Evaluation Blockchain Backend${NC}"
  echo -e "${BLUE}Base URL: $BASE_URL${NC}"
  
  # Run tests
  test_registration
  test_login
  
  # If login successful, run authenticated tests
  if [ -n "$TOKEN" ]; then
    test_get_me
    test_token_balance
    test_developer_stats
    test_connect_wallet
    test_transaction_history
    test_staking_info
  else
    echo -e "${RED}Authentication failed, skipping authenticated tests${NC}"
  fi
  
  echo -e "\n${BLUE}API Testing Complete${NC}"
}

# Run the main function
main
