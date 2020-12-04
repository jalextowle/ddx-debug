import { RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { addressUtils, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { TraderContract } from '@derivadex/contract-wrappers';
import { readFileSync } from 'fs';
import * as yargs from 'yargs';

// TODO(jalextowle): Update to use `getDerivaDEXContractAddressesByChainOrThrow`
// once `@derivadex/contract-addresses` has been fixed.
export const derivadexAddress = '0x6fb8aa6fc6f27e591423009194529ae126660027';
export const cliYargs = yargs
    .parserConfiguration({
        'parse-numbers': false,
    })
    .config('config', function(configPath) {
        return JSON.parse(readFileSync(configPath, { encoding: 'utf-8' }));
    })
    .demandOption('config')
    .help();

async function getProviderFromConfigAsync(): Promise<{ provider: Web3ProviderEngine; from: string }> {
    const args = cliYargs.argv;
    const rpcUrl = args['rpcUrl'] === undefined ? undefined : (args['rpcUrl'] as string);
    if (rpcUrl === undefined) {
        throw new Error(
            'ddx-debug: cannot continue unless "rpcUrl" is defined. Check that your config contains a valid "rpcUrl."',
        );
    }
    const from = args['from'] === undefined ? undefined : (args['from'] as string).toLowerCase();
    if (from === undefined || !addressUtils.isAddress(from)) {
        throw new Error(
            `ddx-debug: cannot continue unless "from" is a valid address ("${from}" was found). Check that your config contains a valid "from."`,
        );
    }
    const provider = new Web3ProviderEngine();
    const rpcSubprovider = new RPCSubprovider(rpcUrl);
    provider.addProvider(rpcSubprovider);
    provider.start();
    const chainId = await providerUtils.getChainIdAsync(provider);
    if (chainId !== 1) {
        throw new Error(
            `ddx-debug: Non-mainnet RPC URLs are currently unsupported ("${chainId}" was found). Please specify a Mainnet RPC URL`,
        );
    }
    return { from, provider };
}

(async () => {
    const { from, provider } = await getProviderFromConfigAsync();
    const trader = new TraderContract(derivadexAddress, provider);
    const traderState = await trader.getTrader(from).callAsync();

    console.log();
    console.log(`  Trader ${from} State`);
    console.log(`    - ddxBalance:       ${Web3Wrapper.toUnitAmount(traderState.ddxBalance, 18).toString()}`);
    console.log(`    - ddxWalletAddress: ${traderState.ddxWalletContract}`);
    console.log();
})()
    .then(() => {
        process.exit(0);
    })
    .catch(error => {
        console.log(error);
        process.exit(1);
    });
