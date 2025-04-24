#!/bin/bash

# Evaluations API Testing Script for Dev Evaluation Blockchain Backend
# This script tests the evaluation-related endpoints of the API

# Set the base URL
BASE_URL="http://localhost:5000/api"
ADMIN_TOKEN=""
DEVELOPER_TOKEN=""
DEVELOPER_ID=""
EVALUATION_ID=""

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

# 2. Test Developer Registration
test_developer_registration() {
  print_header "Testing Developer Registration"
  
  response=$(curl -s -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Developer",
      "email": "testdev@example.com",
      "password": "password123",
      "role": "developer"
    }')
  
  echo "$response"
  
  if check_error "$response"; then
    DEVELOPER_ID=$(echo "$response" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}Developer registration successful${NC}"
    echo "Developer ID: $DEVELOPER_ID"
    return 0
  else
    echo -e "${RED}Developer registration failed${NC}"
    return 1
  fi
}

# 3. Test Developer Login
test_developer_login() {
  print_header "Testing Developer Login"
  
  response=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "testdev@example.com",
      "password": "password123"
    }')
  
  echo "$response"
  
  if check_error "$response"; then
    DEVELOPER_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$DEVELOPER_TOKEN" ]; then
      echo -e "${GREEN}Developer login successful. Token obtained.${NC}"
      return 0
    else
      echo -e "${RED}Developer login successful but no token found${NC}"
      return 1
    fi
  else
    echo -e "${RED}Developer login failed${NC}"
    return 1
  fi
}

# 4. Test Create Evaluation (Admin)
test_create_evaluation() {
  print_header "Testing Create Evaluation"
  
  if [ -z "$DEVELOPER_ID" ]; then
    echo -e "${RED}Developer ID not available, skipping evaluation creation${NC}"
    return 1
  fi
  
  response=$(curl -s -X POST "${BASE_URL}/evaluations" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "developerId": "'$DEVELOPER_ID'",
      "title": "Test Evaluation",
      "description": "This is a test evaluation",
      "criteria": {
        "codeQuality": 5,
        "efficiency": 4,
        "documentation": 4,
        "teamwork": 5
      },
      "rewardAmount": 10,
      "evaluationPeriod": {
        "startDate": "2025-01-01",
        "endDate": "2025-01-31"
      }
    }')
  
  echo "$response"
  
  if check_error "$response"; then
    EVALUATION_ID=$(echo "$response" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}Create evaluation successful${NC}"
    echo "Evaluation ID: $EVALUATION_ID"
    return 0
  else
    echo -e "${RED}Create evaluation failed${NC}"
    return 1
  fi
}

# 5. Test Get Evaluations (Admin)
test_get_evaluations() {
  print_header "Testing Get Evaluations"
  
  response=$(curl -s -X GET "${BASE_URL}/evaluations" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get evaluations successful${NC}"
    return 0
  else
    echo -e "${RED}Get evaluations failed${NC}"
    return 1
  fi
}

# 6. Test Get Evaluation by ID
test_get_evaluation_by_id() {
  print_header "Testing Get Evaluation by ID"
  
  if [ -z "$EVALUATION_ID" ]; then
    echo -e "${RED}Evaluation ID not available, skipping get evaluation by ID${NC}"
    return 1
  fi
  
  response=$(curl -s -X GET "${BASE_URL}/evaluations/$EVALUATION_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get evaluation by ID successful${NC}"
    return 0
  else
    echo -e "${RED}Get evaluation by ID failed${NC}"
    return 1
  fi
}

# 7. Test Get Developer Evaluations
test_get_developer_evaluations() {
  print_header "Testing Get Developer Evaluations"
  
  if [ -z "$DEVELOPER_ID" ]; then
    echo -e "${RED}Developer ID not available, skipping get developer evaluations${NC}"
    return 1
  fi
  
  response=$(curl -s -X GET "${BASE_URL}/evaluations/developer/$DEVELOPER_ID" \
    -H "Authorization: Bearer $DEVELOPER_TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get developer evaluations successful${NC}"
    return 0
  else
    echo -e "${RED}Get developer evaluations failed${NC}"
    return 1
  fi
}

# 8. Test Process Evaluation (Admin)
test_process_evaluation() {
  print_header "Testing Process Evaluation"
  
  if [ -z "$EVALUATION_ID" ]; then
    echo -e "${RED}Evaluation ID not available, skipping process evaluation${NC}"
    return 1
  fi
  
  response=$(curl -s -X POST "${BASE_URL}/evaluations/$EVALUATION_ID/process" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "status": "completed",
      "feedback": "Great work on this evaluation!",
      "finalScore": 9.5,
      "rewardAmount": 10
    }')
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Process evaluation successful${NC}"
    return 0
  else
    echo -e "${RED}Process evaluation failed${NC}"
    return 1
  fi
}

# 9. Test Get Evaluation Metrics
test_get_evaluation_metrics() {
  print_header "Testing Get Evaluation Metrics"
  
  if [ -z "$EVALUATION_ID" ]; then
    echo -e "${RED}Evaluation ID not available, skipping get evaluation metrics${NC}"
    return 1
  fi
  
  response=$(curl -s -X GET "${BASE_URL}/evaluations/$EVALUATION_ID/metrics" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get evaluation metrics successful${NC}"
    return 0
  else
    echo -e "${RED}Get evaluation metrics failed${NC}"
    return 1
  fi
}

# 10. Test Get Evaluation History
test_get_evaluation_history() {
  print_header "Testing Get Evaluation History"
  
  if [ -z "$DEVELOPER_ID" ]; then
    echo -e "${RED}Developer ID not available, skipping get evaluation history${NC}"
    return 1
  fi
  
  response=$(curl -s -X GET "${BASE_URL}/evaluations/developer/$DEVELOPER_ID/history" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  echo "$response"
  
  if check_error "$response"; then
    echo -e "${GREEN}Get evaluation history successful${NC}"
    return 0
  else
    echo -e "${RED}Get evaluation history failed${NC}"
    return 1
  fi
}

# Main test execution
main() {
  echo -e "${BLUE}Starting Evaluations API Tests for Dev Evaluation Blockchain Backend${NC}"
  echo -e "${BLUE}Base URL: $BASE_URL${NC}"
  
  # Run admin login test
  test_admin_login
  
  # Run developer registration and login tests
  test_developer_registration
  test_developer_login
  
  # If admin login successful, run admin-specific tests
  if [ -n "$ADMIN_TOKEN" ]; then
    test_create_evaluation
    test_get_evaluations
    test_get_evaluation_by_id
    test_process_evaluation
    test_get_evaluation_metrics
    test_get_evaluation_history
  else
    echo -e "${RED}Admin authentication failed, skipping admin-specific tests${NC}"
  fi
  
  # If developer login successful, run developer-specific tests
  if [ -n "$DEVELOPER_TOKEN" ]; then
    test_get_developer_evaluations
  else
    echo -e "${RED}Developer authentication failed, skipping developer-specific tests${NC}"
  fi
  
  echo -e "\n${BLUE}Evaluations API Testing Complete${NC}"
}

# Run the main function
main
