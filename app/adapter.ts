import { Horizon } from "@stellar/stellar-sdk";

// set adapter to fetch
Horizon.AxiosClient.defaults.adapter = "fetch";

// serialize big int
(BigInt.prototype as any).toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};
