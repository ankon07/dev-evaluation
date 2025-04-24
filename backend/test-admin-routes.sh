#!/bin/bash

# Admin Routes Testing Script for Dev Evaluation Blockchain Backend
# This script tests the admin-specific routes of the API

# Set the base URL
BASE_URL="http://localhost:5000/api"
TOKEN=""

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

# 1. Test Admin Login
test_admin_login() {
  print_header "Testing Admin Login"
  
  response=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@example.com",
      "password": "admin123"
    }')
  
  echo "$response"
  
  if check_error "$response"; then
    TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
      echo -e "${GREEN}Admin login successful. Token obtained.${NC}"
      echo "Token: $TOKEN"
      return 0
    else
      echo -e "${RED}Login successful but no token found${NC}"
      return 1
    fi
  else
    echo -e "${RED}Admin login failed${NC}"
    return 1
  fi
}

# 2. Test Get System Configuration
test_get_system_config() {
  print_header "Testing Get System Configuration"
  
  response=$(curl -s -X GET "${BASE_URL}/admin/config" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get system configuration successful${NC}"
    return 0
  else
    echo -e "${RED}Get system configuration failed${NC}"
    return 1
  fi
}

# 3. Test Get Reward Rules
test_get_reward_rules() {
  print_header "Testing Get Reward Rules"
  
  response=$(curl -s -X GET "${BASE_URL}/admin/rules" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get reward rules successful${NC}"
    return 0
  else
    echo -e "${RED}Get reward rules failed${NC}"
    return 1
  fi
}

# 4. Test Get System Stats
test_get_system_stats() {
  print_header "Testing Get System Stats"
  
  response=$(curl -s -X GET "${BASE_URL}/admin/stats" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get system stats successful${NC}"
    return 0
  else
    echo -e "${RED}Get system stats failed${NC}"
    return 1
  fi
}

# 5. Test Generate Report
test_generate_report() {
  print_header "Testing Generate Report"
  
  response=$(curl -s -X GET "${BASE_URL}/admin/reports?type=evaluations" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Generate report successful${NC}"
    return 0
  else
    echo -e "${RED}Generate report failed${NC}"
    return 1
  fi
}

# 6. Test Get Audit Logs
test_get_audit_logs() {
  print_header "Testing Get Audit Logs"
  
  response=$(curl -s -X GET "${BASE_URL}/admin/logs" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get audit logs successful${NC}"
    return 0
  else
    echo -e "${RED}Get audit logs failed${NC}"
    return 1
  fi
}

# 7. Test Get Users
test_get_users() {
  print_header "Testing Get Users"
  
  response=$(curl -s -X GET "${BASE_URL}/admin/users" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get users successful${NC}"
    return 0
  else
    echo -e "${RED}Get users failed${NC}"
    return 1
  fi
}

# 8. Test Mint Tokens
test_mint_tokens() {
  print_header "Testing Mint Tokens"
  
  # First, get a developer ID
  users_response=$(curl -s -X GET "${BASE_URL}/admin/users" \
    -H "Authorization: Bearer $TOKEN")
  
  # Extract the first developer ID
  developer_id=$(echo "$users_response" | grep -o '"_id":"[^"]*' | grep -v "admin" | head -1 | cut -d'"' -f4)
  
  if [ -z "$developer_id" ]; then
    echo -e "${RED}No developer found to mint tokens to${NC}"
    return 1
  fi
  
  echo "Developer ID for minting: $developer_id"
  
  response=$(curl -s -X POST "${BASE_URL}/admin/mint-tokens" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"to\": \"$developer_id\",
      \"amount\": 10,
      \"reason\": \"Testing token minting\"
    }")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Mint tokens successful${NC}"
    return 0
  else
    echo -e "${RED}Mint tokens failed${NC}"
    return 1
  fi
}

# Main test execution
main() {
  echo -e "${BLUE}Starting Admin Routes Tests for Dev Evaluation Blockchain Backend${NC}"
  echo -e "${BLUE}Base URL: $BASE_URL${NC}"
  
  # Run tests
  test_admin_login
  
  # If authentication successful, run authenticated tests
  if [ -n "$TOKEN" ]; then
    test_get_system_config
    test_get_reward_rules
    test_get_system_stats
    test_generate_report
    test_get_audit_logs
    test_get_users
    test_mint_tokens
  else
    echo -e "${RED}Admin authentication failed, skipping admin tests${NC}"
  fi
  
  echo -e "\n${BLUE}Admin Routes Testing Complete${NC}"
}

# Run the main function
main
