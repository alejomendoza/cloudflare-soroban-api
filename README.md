This is a [Next.js](https://nextjs.org/) project bootstrapped with [`c3`](https://developers.cloudflare.com/pages/get-started/c3).

## Requirements

Soroban CLI `21.0.0-rc.1`

```
stellar 21.0.0-rc.1 (bc3031e7c2609d7e57ef6f3d8a482091cc0e1eab)
soroban-env 21.0.1 (f2b734b6360ae04ba730307be3988619dd0f59a3)
soroban-env interface version 90194313216
stellar-xdr 21.0.1 (da0cbc6f75eaf03423810b8e9d730a03dfa8517e)
xdr curr (1a04392432dacc0092caaeae22a600ea1af3c6a5)
```

## Steps

1. Install soroban cli `cargo install --locked soroban-cli@21.0.0-rc.1`

2. `npm i`

3. `npm run contract:redeploy`

4. `npm run preview`

5. `curl --location --request POST 'http://localhost:8788'`

6. `curl --location --request GET 'http://localhost:8788'`

7. `curl --location --request POST 'http://localhost:8788/?invest=true'` -> txSuccess

8. `curl --location --request GET 'http://localhost:8788'` -> check new data on the entry

9. `curl --location --request POST 'http://localhost:8788/?invest=true'` try to invest again -> txFailed
