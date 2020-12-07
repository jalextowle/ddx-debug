import { RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { addressUtils, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { InsuranceFundContract, TraderContract } from '@derivadex/contract-wrappers';
import { readFile } from 'fs';
import { resolve } from 'path';
import { promisify } from 'util';
import * as yargs from 'yargs';

// TODO(jalextowle): Update to use `getDerivaDEXContractAddressesByChainOrThrow`
// once `@derivadex/contract-addresses` has been fixed.
export const derivadexAddress = '0x6fb8aa6fc6f27e591423009194529ae126660027';
export const cliYargs = yargs
    .parserConfiguration({
        'parse-numbers': false,
    })
    .options('from', {
        describe: 'address to use in the queries',
        type: 'string',
    })
    .options('rpcUrl', {
        describe: 'Ethereum JSON RPC URL to use when making requests',
        type: 'string',
    })
    .option('config', {
        describe: 'path to config file',
        type: 'string',
    })
    .help();

function isDefined(arg: string | undefined): boolean {
    return arg === '' || arg === undefined ? false : true;
}

async function getProviderFromConfigAsync(): Promise<{ provider: Web3ProviderEngine; from: string }> {
    let from = '';
    let rpcUrl = '';
    const args = cliYargs.argv;
    // If no options were provided, show the help.
    if (!isDefined(args['from']) && !isDefined(args['rpcUrl']) && !isDefined(args['config'])) {
        yargs.showHelp();
        throw new Error('ddx-debug: "from" and "rpcUrl" must be provided through CLI options or a config file');
    } else if (!isDefined(args['from']) !== !isDefined(args['rpcUrl'])) {
        throw new Error(
            `ddx-debug: One of "from" ("${args['from']}") or "rpcUrl" ("${args['rpcUrl']}") is undefined. Both must be defined if either is provided`,
        );
    } else if (args['from'] !== '' && args['from'] !== undefined) {
        from = args['from'].toLowerCase();
        rpcUrl = args['rpcUrl'] as string;
        if (from === undefined || !addressUtils.isAddress(from)) {
            throw new Error(`ddx-debug: "from" must be a valid address ("${from}" was found)."`);
        }
    } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const configPath = resolve(args['config']!);
        let config: any = {};
        try {
            config = JSON.parse((await promisify(readFile)(configPath)).toString());
        } catch (error) {
            throw new Error(`ddx-debug: Encountered error while opening config ("${configPath}"):\n  ${error}`);
        }
        if (!isDefined(config.from) || !isDefined(config.rpcUrl)) {
            throw new Error(
                `ddx-debug: "from" ("${args['from']}") and/or "rpcUrl" ("${args['rpcUrl']}") is undefined in the provided config ("${args['config']}"). Both arguments are required.`,
            );
        }
        ({ from, rpcUrl } = config);
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

    const insuranceFund = new InsuranceFundContract(derivadexAddress, provider);
    const claimantState = await insuranceFund.getDDXClaimantState(from).callAsync();
    const unclaimedDDX = await insuranceFund.getUnclaimedDDXRewards(from).callAsync();
    const totalStakes = await insuranceFund.getCurrentTotalStakes(from).callAsync();

    console.log();
    console.log(`  DerivaDEX Stats ("${from}")`);
    console.log();
    console.log('    DDX Wallet');
    console.log(`      - DDX Balance:        ${Web3Wrapper.toUnitAmount(traderState.ddxBalance, 18).toString()}`);
    console.log(`      - DDX Wallet Address: ${traderState.ddxWalletContract}`);
    console.log();
    console.log('    Insurance Mining');
    console.log(`      - Claimed DDX:        ${Web3Wrapper.toUnitAmount(claimantState.claimedDDX, 18)}`);
    console.log(`      - Unclaimed DDX:      ${Web3Wrapper.toUnitAmount(unclaimedDDX, 18)}`);
    console.log(`      - Total Stake:        ${Web3Wrapper.toUnitAmount(totalStakes[0], 6)}`);
    console.log();
})()
    .then(() => {
        process.exit(0);
    })
    .catch(error => {
        console.log(error);
        process.exit(1);
    });
