# handy for running fargate image locally
set -e

# utility function to ensure
check_env_var() {
  local var_name="$1"
  if [ -z "${!var_name+x}" ]; then
    echo "Error: Environment variable '$var_name' is not set."
    return 1
  fi
  return 0
}

# verify we have all the required env vars
required_vars=(
  "AWS_ACCESS_KEY_ID"
  "AWS_SECRET_ACCESS_KEY"
  "AWS_SESSION_TOKEN"
  "STACK_PREFIX"
)
for var in "${required_vars[@]}"; do
  if ! check_env_var "$var"; then
    exit 1
  fi
done

HOST_PORT=${PORT:=3000}
: "${AWS_REGION:=us-east-1}"

docker run \
  -p $HOST_PORT:3000 \
  -e AWS_REGION=$AWS_REGION \
  -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  -e AWS_SESSION_TOKEN="$AWS_SESSION_TOKEN" \
  -e LOG_LEVEL \
  -e AUTH_CONFIG_SECRET_NAME=${STACK_PREFIX}/AuthConfig \
  -e APP_CONFIG_SECRET_NAME=${STACK_PREFIX}/AppConfig \
  -e PENDING_STATE_TABLE=${STACK_PREFIX}-pending-oauth-state \
  -e SESSION_TABLE=${STACK_PREFIX}-user-sessions \
  -e DEALS_TABLE=${STACK_PREFIX}-deals \
  carfinance-api
