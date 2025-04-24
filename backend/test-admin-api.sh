#!/bin/bash

# Admin API Testing Script for Dev Evaluation Blockchain Backend
# This script tests the admin-specific endpoints of the API

# Set the base URL
BASE_URL="http://localhost:5000/api"
ADMIN_TOKEN=""

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
  
  # Using the admin credentials from .env
  response=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@example.com",
      "password": "secure_admin_password"
    }')
  
  echo "$response"
  
  if check_error "$response"; then
    ADMIN_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$ADMIN_TOKEN" ]; then
      echo -e "${GREEN}Admin login successful. Token obtained.${NC}"
      echo "Token: $ADMIN_TOKEN"
      return 0
    else
      echo -e "${RED}Admin login successful but no token found${NC}"
      return 1
    fi
  else
    echo -e "${RED}Admin login failed${NC}"
    return 1
  fi
}

# 2. Test Get System Config
test_system_config() {
  print_header "Testing Get System Config"
  
  response=$(curl -s -X GET "${BASE_URL}/admin/config" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get system config successful${NC}"
    return 0
  else
    echo -e "${RED}Get system config failed${NC}"
    return 1
  fi
}

# 3. Test Get Reward Rules
test_reward_rules() {
  print_header "Testing Get Reward Rules"
  
  response=$(curl -s -X GET "${BASE_URL}/admin/rules" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
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
test_system_stats() {
  print_header "Testing Get System Stats"
  
  response=$(curl -s -X GET "${BASE_URL}/admin/stats" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
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
  
  response=$(curl -s -X GET "${BASE_URL}/admin/reports" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
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
test_audit_logs() {
  print_header "Testing Get Audit Logs"
  
  response=$(curl -s -X GET "${BASE_URL}/admin/logs" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get audit logs successful${NC}"
    return 0
  else
    echo -e "${RED}Get audit logs failed${NC}"
    return 1
  fi
}

# 7. Test Manage Users
test_manage_users() {
  print_header "Testing Manage Users"
  
  response=$(curl -s -X GET "${BASE_URL}/admin/users" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Manage users successful${NC}"
    return 0
  else
    echo -e "${RED}Manage users failed${NC}"
    return 1
  fi
}

# Main test execution
main() {
  echo -e "${BLUE}Starting Admin API Tests for Dev Evaluation Blockchain Backend${NC}"
  echo -e "${BLUE}Base URL: $BASE_URL${NC}"
  
  # Run admin login test
  test_admin_login
  
  # If admin login successful, run admin tests
  if [ -n "$ADMIN_TOKEN" ]; then
    test_system_config
    test_reward_rules
    test_system_stats
    test_generate_report
    test_audit_logs
    test_manage_users
  else
    echo -e "${RED}Admin authentication failed, skipping admin tests${NC}"
  fi
  
  echo -e "\n${BLUE}Admin API Testing Complete${NC}"
}

# Run the main function
main
