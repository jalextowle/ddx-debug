# ddx-debug

This CLI tool allows users to specify an Ethereum address and a provider RPC URL
in order to check their balance with DerivaDEX's on-chain DDX wallet.

## Installation

This command can be installed by running the command:

```bash
yarn global add ddx-debug
```

## Upgrade

You can upgrade this command using the command:

```bash
yarn global upgrade ddx-debug
```

## Usage

Once you've installed the `ddx-debug` command, you can invoke it on a BASH compliant
command-line. This command will query the state of a trader's account using a
specified user address.

In order for `ddx-debug` to function properly, a `from` string and a `rpc-url`
string must be provided. `from` specifies the address to use when making the query
to the `DerivaDEX` contract. `rpc-url` specifies an Ethereum JSON RPC URL that can
be used to query an Ethereum node. You can use the RPC URL provided by a local
Ethereum node, but it's easy to create a `rpc-url` by creating an account on
[Infura](https://infura.io/) or [Alchemy](https://alchemyapi.io/) if you aren't
running an Ethereum node.

The parameters to `ddx-debug` can be provided as command-line options. Make sure
to replace `$FROM_ADDRESS` and `$RPC_URL` with the desired `from`
address and `rpc-url` before running the command.

```bash
ddx-debug --from "$FROM_ADDRESS" --rpc-url "$RPC_URL"
```

Alternatively, `ddx-debug` accepts a configuration file with the `--config` option.

```bash
ddx-debug --config "$CONFIG_PATH"
```

`ddx-debug` config paths should be formatted as JSON objects and they must contain
`from` and `rpc-url` fields.
