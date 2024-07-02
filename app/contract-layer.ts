import "./adapter";

import {
  Keypair,
  Transaction,
  hash,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import { Client, Entry, networks } from "../contract/client/src/index";
// import { getAuthenticatedUser } from '../auth/logic';
// import { decrypt } from 'src/util/encryption';

// const userKeys = Keypair.fromSecret(decrypt(user.seed));

// GBZP6P7QNKI342HNDUWXG5TE6DPIRIJBMERMZY5VCVHKVI67TJAYSK2C
const userKeys = Keypair.fromSecret(
  "SC5FF7SJOUA3XVCSPIXEG6L2ORFHQ6BTVJBJH345W2GRSACKYIUXUDUP"
);

// GD7BAZM73BXQTMRHA2JVJPE5X4AATOMOIXGA76N22JNTNMVXRQW5DR4B
const sourceKeys = Keypair.fromSecret(
  "SB6NGNDLFKMRK4XW2W5OWFMJ2LIJ5SBXJU2X5TRSPXR2UNDOXHHZNKWY"
);

const fetchCurrentLedger = async () => {
  const url = "https://horizon-testnet.stellar.org";
  try {
    const response = await fetch(url);
    const data: any = await response.json();
    return data.core_latest_ledger;
  } catch (error) {
    console.error("Error fetching current ledger:", error);
    return null;
  }
};

const defaultOptions = { timeoutInSeconds: 60, fee: 100000000 };

function getClientForKeypair(keys: Keypair) {
  return new Client({
    contractId: networks.testnet.contractId,
    networkPassphrase: networks.testnet.networkPassphrase,
    rpcUrl: "https://soroban-testnet.stellar.org",
    publicKey: keys.publicKey(),
    signTransaction: async (tx: string, opts) => {
      const txFromXDR = new Transaction(tx, networks.testnet.networkPassphrase);

      txFromXDR.sign(keys);

      return txFromXDR.toXDR();
    },
    signAuthEntry: async (entryXdr, opts) => {
      return keys
        .sign(hash(Buffer.from(entryXdr, "base64")))
        .toString("base64");
    },
  });
}

const new_entry: Entry = {
  ipfs_hash: "yeah",
  total_invested: BigInt(0),
  apr: BigInt(0),
  equity_shares: new Map(),
  escrow: BigInt(0),
};

export const setEntry = async () => {
  const contract = getClientForKeypair(sourceKeys);
  const tx = await contract.set_entry({ entry: new_entry }, defaultOptions);
  //   const res = await tx.signAndSend();

  const res = await tx.signAndSend();

  res.getTransactionResponseAll;

  console.log(res.getTransactionResponse);
  console.log(res.result);
  //   console.log(res);
  //   return res.getTransactionResponse;
  return res;
};

export const getEntry = async (ipfs_hash: string) => {
  const contract = getClientForKeypair(sourceKeys);
  const tx = await contract.get_entry(
    {
      ipfs_hash,
    },
    defaultOptions
  );
  console.log(tx);
  console.log(tx.simulationData);

  return tx.result;
};

const distributePayouts = async () => {
  const contract = getClientForKeypair(sourceKeys);

  // get mft issuer with our logic
  let tx = await contract.distribute_payouts();
  return tx.result;
};

export const invest = async (ipfs_hash: string, amount: number) => {
  const contract = getClientForKeypair(sourceKeys);

  // get mft issuer with our logic
  let tx = await contract.invest(
    {
      user: userKeys.publicKey(),
      ipfs_hash,
      amount: BigInt(amount),
    },
    defaultOptions
  );

  const jsonFromRoot = tx.toJSON();

  const userClient = getClientForKeypair(userKeys);

  const txUser = userClient.fromJSON["invest"](jsonFromRoot);

  const ledger = (await fetchCurrentLedger()) + 100;

  await txUser.signAuthEntries({ expiration: ledger });

  const jsonFromUser = txUser.toJSON();

  const txRoot = contract.fromJSON["invest"](jsonFromUser);

  const result = await txRoot.signAndSend();

  // console.log('send res', result.sendTransactionResponseAll);
  // console.log('get res', result.getTransactionResponseAll);
  const getRes = result.getTransactionResponse as any;

  // console.log(getRes.resultMetaXdr.toXDR('base64'));

  console.log(getRes.resultXdr.toXDR("base64"));

  xdr.TransactionMeta.fromXDR(getRes.resultMetaXdr.toXDR("base64"), "base64")
    .v3()
    .sorobanMeta()
    ?.diagnosticEvents()
    .forEach((event: any) => {
      // console.log(event);
      // console.log('event', event.event().body().v0().data().toXDR('base64'));
      console.log(scValToNative(event.event().body().v0().data()));
    });

  return result.getTransactionResponse;
};

export const callContract = async (_: any, args: any, ctx: any) => {
  // const user = await getAuthenticatedUser(ctx);

  const { fn, ipfs_hash } = args;

  switch (fn) {
    case "setEntry":
      return setEntry();
    case "getEntry":
      return getEntry(ipfs_hash);
    case "invest":
      return invest(ipfs_hash, 10000000);
    case "distribute":
      return distributePayouts();
  }

  return {};
};
