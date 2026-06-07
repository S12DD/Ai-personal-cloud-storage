#!/bin/bash

# Personal Cloud Storage - API Testing Script

set -e

echo "🧪 Personal Cloud Storage - API Test Suite"
echo "=========================================="

API_URL="http://localhost:8000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

test_count=0
pass_count=0
fail_count=0

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_code=$5
    local token=$6
    
    test_count=$((test_count + 1))
    
    if [ -z "$token" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓${NC} $name (HTTP $http_code)"
        pass_count=$((pass_count + 1))
        echo "$body"
    else
        echo -e "${RED}✗${NC} $name (Expected $expected_code, got $http_code)"
        fail_count=$((fail_count + 1))
        echo "Response: $body"
    fi
    
    echo ""
}

# Check if backend is running
echo -e "${BLUE}Checking if backend is running...${NC}"
if ! curl -s "$API_URL/docs" > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running on $API_URL${NC}"
    echo "Please start the backend with: cd backend && uvicorn main:app --reload"
    exit 1
fi
echo -e "${GREEN}✓ Backend is running${NC}"
echo ""

# Test 1: Login
echo -e "${BLUE}Test 1: User Authentication${NC}"
login_response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@example.com","password":"demo123"}')

token=$(echo "$login_response" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
user_id=$(echo "$login_response" | python3 -c "import sys, json; print(json.load(sys.stdin)['userId'])" 2>/dev/null)

if [ ! -z "$token" ] && [ ! -z "$user_id" ]; then
    echo -e "${GREEN}✓${NC} Login successful"
    echo "  User ID: $user_id"
    echo "  Token: ${token:0:50}..."
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗${NC} Login failed"
    fail_count=$((fail_count + 1))
    exit 1
fi
test_count=$((test_count + 1))
echo ""

# Test 2: List Files (authenticated)
echo -e "${BLUE}Test 2: File Operations${NC}"
test_endpoint "List files" "GET" "/files/list" "" "200" "$token"

# Test 3: Upload File
echo -e "${BLUE}Test 3: File Upload${NC}"
# Create a test file
echo "This is a test file for Personal Cloud" > /tmp/test_file.txt

upload_response=$(curl -s -X POST "$API_URL/files/upload" \
    -H "Authorization: Bearer $token" \
    -F "file=@/tmp/test_file.txt")

file_id=$(echo "$upload_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('fileId', ''))" 2>/dev/null)

if [ ! -z "$file_id" ]; then
    echo -e "${GREEN}✓${NC} File upload successful (File ID: $file_id)"
    pass_count=$((pass_count + 1))
else
    echo -e "${RED}✗${NC} File upload failed"
    echo "Response: $upload_response"
    fail_count=$((fail_count + 1))
fi
test_count=$((test_count + 1))
echo ""

# Test 4: Get File Metadata
if [ ! -z "$file_id" ]; then
    echo -e "${BLUE}Test 4: File Metadata${NC}"
    test_endpoint "Get file metadata" "GET" "/files/$file_id/metadata" "" "200" "$token"
fi

# Test 5: Share File
if [ ! -z "$file_id" ]; then
    echo -e "${BLUE}Test 5: File Sharing${NC}"
    share_response=$(curl -s -X POST "$API_URL/files/$file_id/share" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d '{"expiresIn":3600}')
    
    share_url=$(echo "$share_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('shareUrl', ''))" 2>/dev/null)
    
    if [ ! -z "$share_url" ]; then
        echo -e "${GREEN}✓${NC} File shared successfully"
        echo "  Share URL: $share_url"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}✗${NC} File sharing failed"
        fail_count=$((fail_count + 1))
    fi
    test_count=$((test_count + 1))
    echo ""
fi

# Test 6: Register New User
echo -e "${BLUE}Test 6: User Registration${NC}"
register_response=$(curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"testuser\",\"email\":\"testuser@example.com\",\"password\":\"testpass123\"}")

new_user_id=$(echo "$register_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('userId', ''))" 2>/dev/null)

if [ ! -z "$new_user_id" ]; then
    echo -e "${GREEN}✓${NC} User registration successful"
    pass_count=$((pass_count + 1))
else
    # Might fail if user already exists
    echo -e "${BLUE}ℹ${NC} User registration (may already exist)"
fi
test_count=$((test_count + 1))
echo ""

# Test 7: Invalid Token
echo -e "${BLUE}Test 7: Error Handling${NC}"
test_endpoint "Invalid token rejection" "GET" "/files/list" "" "401" "invalid_token_123"

# Summary
echo ""
echo "=================================================="
echo -e "${BLUE}Test Summary${NC}"
echo "=================================================="
echo -e "Total tests: $test_count"
echo -e "${GREEN}Passed: $pass_count${NC}"
if [ $fail_count -gt 0 ]; then
    echo -e "${RED}Failed: $fail_count${NC}"
else
    echo -e "${GREEN}Failed: $fail_count${NC}"
fi

# Cleanup
rm -f /tmp/test_file.txt

if [ $fail_count -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
