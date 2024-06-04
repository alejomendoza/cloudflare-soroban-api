#!/bin/bash

set -e

NETWORK="$1"

SOROBAN_RPC_HOST="$2"

CTR="contract-id"

PATH=./target/bin:$PATH

cd ./contract

if [[ -f "./.vars/$CTR" ]]; then
  echo "Found existing contract directory; already initialized."
  exit 0
fi


if [[ "$SOROBAN_RPC_HOST" == "" ]]; then
  # If soroban-cli is called inside the soroban-preview docker container,
  # it can call the stellar standalone container just using its name "stellar"
  if [[ "$IS_USING_DOCKER" == "true" ]]; then
    SOROBAN_RPC_HOST="http://stellar:8000"
    SOROBAN_RPC_URL="$SOROBAN_RPC_HOST"
    FRIENDBOT_URL="http://localhost:8000/friendbot"
  elif [[ "$NETWORK" == "futurenet" ]]; then
    SOROBAN_RPC_HOST="https://rpc-futurenet.stellar.org:443"
    SOROBAN_RPC_URL="$SOROBAN_RPC_HOST"
    FRIENDBOT_URL="https://friendbot-futurenet.stellar.org"
  elif [[ "$NETWORK" == "testnet" ]]; then
    SOROBAN_RPC_HOST="https://soroban-testnet.stellar.org:443"
    SOROBAN_RPC_URL="$SOROBAN_RPC_HOST"
    FRIENDBOT_URL="https://friendbot.stellar.org"
  else
     # assumes standalone on quickstart, which has the soroban/rpc path
    SOROBAN_RPC_HOST="http://localhost:8000"
    SOROBAN_RPC_URL="$SOROBAN_RPC_HOST/soroban/rpc"
    FRIENDBOT_URL="http://localhost:8000/friendbot"
  fi
else 
  SOROBAN_RPC_URL="$SOROBAN_RPC_HOST"  
fi

case "$1" in
standalone)
  SOROBAN_NETWORK_PASSPHRASE="Standalone Network ; February 2017"
  FRIENDBOT_URL="$SOROBAN_RPC_HOST/friendbot"
  ;;
futurenet)
  SOROBAN_NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
  FRIENDBOT_URL="https://friendbot-futurenet.stellar.org/"
  ;;
testnet)
  SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
  FRIENDBOT_URL="https://friendbot.stellar.org"
  ;;
*)
  echo "Usage: $0 standalone|futurenet|testnet [rpc-host]"
  exit 1
  ;;
esac

echo "Using $NETWORK network"
echo "  RPC URL: $SOROBAN_RPC_URL"
echo "  Friendbot URL: $FRIENDBOT_URL"

echo Add the $NETWORK network to cli client
soroban network add \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" "$NETWORK"

echo Add $NETWORK to .vars for use with npm scripts
mkdir -p .vars
echo $NETWORK > ./.vars/network
echo -n $SOROBAN_RPC_URL > ./.vars/rpc-url
echo -n "$SOROBAN_NETWORK_PASSPHRASE" > ./.vars/passphrase
echo $FRIENDBOT_URL > ./.vars/friendbot-url

echo -n GD7BAZM73BXQTMRHA2JVJPE5X4AATOMOIXGA76N22JNTNMVXRQW5DR4B > ./.vars/public-key
echo -n SB6NGNDLFKMRK4XW2W5OWFMJ2LIJ5SBXJU2X5TRSPXR2UNDOXHHZNKWY > ./.vars/secret-key

if !(soroban keys ls | grep token-admin 2>&1 >/dev/null); then
  echo Create the token-admin identity
  soroban keys generate token-admin --rpc-url "$SOROBAN_RPC_URL" --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" --network "$NETWORK" 
fi
ADMIN_ADDRESS="$(soroban keys address token-admin)"

# This will fail if the account already exists, but it'll still be fine.
echo Fund token-admin account from friendbot
curl --silent -X POST "$FRIENDBOT_URL?addr=$ADMIN_ADDRESS" >/dev/null

ARGS="--network $NETWORK --source token-admin"

echo Install dependencies

npm i

echo Build contracts

soroban contract build 

# echo Deploy the voting contracts
echo Deploy contract $CTR
  DEPLOYED_CTR_ID="$(
    soroban contract deploy $ARGS \
      --wasm ./target/wasm32-unknown-unknown/release/skyhitz.wasm
  )"
  echo "Contract deployed succesfully with ID: $DEPLOYED_CTR_ID"
  echo -n "$DEPLOYED_CTR_ID" > .vars/$CTR

  mkdir -p client

  # we do not use bindings for now but they're sometimes useful - they contain a lot of code that interacts with blockchain
  # plus we may switch to using them one day
  # echo Build Bindings for $CTR
  soroban contract bindings typescript \
    --wasm ./target/wasm32-unknown-unknown/release/skyhitz.wasm \
    --output-dir ./client \
    --network $(cat ./.vars/network) \
    --contract-id $(cat ./.vars/$CTR) \
    --overwrite

cd ../




