// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import { MixinLimit, MixinLimits } from './MixinLimits';

const version = require('../../package.json').version;

/**
 * Configuration for the wallet backend.
 *
 * Everything is optional.
 */
export interface IConfig {
    /**
     * The amount of decimal places your coin has, e.g. traaittCASH has two
     * decimals
     */
    decimalPlaces?: number;

    /**
     * The address prefix your coin uses - you can find this in CryptoNoteConfig.h.
     * In traaittCASH, this converts to cash
     */
    addressPrefix?: number;

    /**
     * Request timeout for daemon operations in milliseconds
     */
    requestTimeout?: number;

    /**
     * The block time of your coin, in seconds
     */
    blockTargetTime?: number;

    /**
     * How often to process blocks, in millseconds
     */
    syncThreadInterval?: number;

    /**
     * How often to update the daemon info
     */
    daemonUpdateInterval?: number;

    /**
     * How often to check on locked transactions
     */
    lockedTransactionsCheckInterval?: number;

    /**
     * The amount of blocks to process per 'tick' of the mainloop. Note: too
     * high a value will cause the event loop to be blocked, and your interaction
     * to be laggy.
     */
    blocksPerTick?: number;

    /**
     * Your coins 'ticker', generally used to refer to the coin, i.e. 123 TR
     */
    ticker?: string;

    /**
     * Most people haven't mined any blocks, so lets not waste time scanning
     * them
     */
    scanCoinbaseTransactions?: boolean;

    /**
     * The minimum fee allowed for transactions, in ATOMIC units
     */
    minimumFee?: number;

    /**
     * Mapping of height to mixin maximum and mixin minimum
     */
    mixinLimits?: MixinLimits;

    /**
     * The length of a standard address for your coin
     */
    standardAddressLength?: number;

    /**
     * The length of an integrated address for your coin - It's the same as
     * a normal address, but there is a paymentID included in there - since
     * payment ID's are 64 chars, and base58 encoding is done by encoding
     * chunks of 8 chars at once into blocks of 11 chars, we can calculate
     * this automatically
     */
    integratedAddressLength?: number;

    /**
     * A replacement function for the JS/C++ underivePublicKey.
     */
    underivePublicKey?: (derivation: string,
                         outputIndex: number,
                         outputKey: string) => string;

    /**
     * A replacement function for the JS/C++ derivePublicKey.
     */
    derivePublicKey?: (derivation: string,
                       outputIndex: number,
                       publicKey: string) => string;

    /**
     * A replacement function for the JS/C++ deriveSecretKey.
     */
    deriveSecretKey?: (derivation: string,
                       outputIndex: number,
                       privateKey: string) => string;

    /**
     * A replacement function for the JS/C++ generateKeyImage.
     */
    generateKeyImage?: (publicKey: string,
                        privateKey: string) => string;

    /**
     * A replacement function for the JS/C++ secretKeyToPublicKey.
     */
    secretKeyToPublicKey?: (privateKey: string) => string;

    /**
     * A replacement function for the JS/C++ cnFastHash.
     */
    cnFastHash?: (input: string) => string;

    /**
     * A replacement function for the JS/C++ generateRingSignatures.
     */
    generateRingSignatures?: (transactionPrefixHash: string,
                              keyImage: string,
                              inputKeys: string[],
                              privateKey: string,
                              realIndex: number) => string[];

    /**
     * A replacement function for the JS/C++ checkRingSignatures.
     */
    checkRingSignatures?: (transactionPrefixHash: string,
                           keyImage: string,
                           publicKeys: string[],
                           signatures: string[]) => boolean;

    /**
     * A replacement function for the JS/C++ generateKeyDerivation.
     */
    generateKeyDerivation?: (transactionPublicKey: string,
                             privateViewKey: string) => string;

    /**
     * The max amount of memory to use, storing downloaded blocks to be processed.
     */
    blockStoreMemoryLimit?: number;

    /**
     * The amount of blocks to take from the daemon per request. Cannot take
     * more than 100.
     */
    blocksPerDaemonRequest?: number;

    /**
     * The amount of seconds to permit not having fetched a block from the
     * daemon before emitting 'deadnode'. Note that this just means contacting
     * the daemon for data - if you are synced and it returns TopBlock - the
     * event will not be emitted.
     */
    maxLastFetchedBlockInterval?: number;

    /**
     * The amount of seconds to permit not having fetched a new network height
     * from the daemon before emitting 'deadnode'.
     */
    maxLastUpdatedNetworkHeightInterval?: number;

    /**
     * The amount of seconds to permit not having fetched a new local height
     * from the daemon before emitting 'deadnode'.
     */
    maxLastUpdatedLocalHeightInterval?: number;

    /**
     * Allows specifying a custom user agent string to use with requests.
     */
    customUserAgentString?: string;

    /**
     * Allows specifying a custom configuration object for the request module.
     */
    customRequestOptions?: any;

    [key: string]: any;
}

/**
 * Configuration for the wallet backend
 *
 * @hidden
 */
export class Config implements IConfig {
    /**
     * The amount of decimal places your coin has, e.g. traaittCASH has eight
     * decimals
     */
    public decimalPlaces: number = 2;

    /**
     * The address prefix your coin uses - you can find this in CryptoNoteConfig.h.
     * In traaittCASH, this converts to cash
     */
    public addressPrefix: number = 925524;

    /**
     * Request timeout for daemon operations in milliseconds
     */
    public requestTimeout: number = 10 * 1000;

    /**
     * The block time of your coin, in seconds
     */
    public blockTargetTime: number = 32;

    /**
     * How often to process blocks, in millseconds
     */
    public syncThreadInterval: number = 10;

    /**
     * How often to update the daemon info
     */
    public daemonUpdateInterval: number = 10 * 1000;

    /**
     * How often to check on locked transactions
     */
    public lockedTransactionsCheckInterval: number = 30 * 1000;

    /**
     * The amount of blocks to process per 'tick' of the mainloop. Note: too
     * high a value will cause the event loop to be blocked, and your interaction
     * to be laggy.
     */
    public blocksPerTick: number = 1;

    /**
     * Your coins 'ticker', generally used to refer to the coin, i.e. 123 TR
     */
    public ticker: string = 'XTCASH';

    /**
     * Most people haven't mined any blocks, so lets not waste time scanning
     * them
     */
    public scanCoinbaseTransactions: boolean = false;

    /**
     * The minimum fee allowed for transactions, in ATOMIC units
     */
    public minimumFee: number = 100;

    /**
     * Mapping of height to mixin maximum and mixin minimum
     */
    public mixinLimits: MixinLimits = new MixinLimits([
        /* Height: 440,000, minMixin: 0, maxMixin: 10, defaultMixin: 3 */
        new MixinLimit(1000000, 0, 5, 3),

        /* At height of 620000, static mixin of 7 */
        new MixinLimit(5000000, 0, 8),

        /* At height of 800000, static mixin of 3 */
        new MixinLimit(8000000, 0, 10),
    ], 3 /* Default mixin of 3 before block 440,000 */);

    /**
     * The length of a standard address for your coin
     */
    public standardAddressLength: number = 98;

    /* The length of an integrated address for your coin - It's the same as
       a normal address, but there is a paymentID included in there - since
       payment ID's are 64 chars, and base58 encoding is done by encoding
       chunks of 8 chars at once into blocks of 11 chars, we can calculate
       this automatically */
    public integratedAddressLength: number = 98 + ((64 * 11) / 8);

    /**
     * A replacement function for the JS/C++ underivePublicKey.
     */
    public underivePublicKey?: (derivation: string,
                                outputIndex: number,
                                outputKey: string) => string = undefined;

    /**
     * A replacement function for the JS/C++ derivePublicKey.
     */
    public derivePublicKey?: (derivation: string,
                              outputIndex: number,
                              publicKey: string) => string = undefined;

    /**
     * A replacement function for the JS/C++ deriveSecretKey.
     */
    public deriveSecretKey?: (derivation: string,
                              outputIndex: number,
                              privateKey: string) => string = undefined;

    /**
     * A replacement function for the JS/C++ generateKeyImage.
     */
    public generateKeyImage?: (publicKey: string,
                               privateKey: string) => string = undefined;

    /**
     * A replacement function for the JS/C++ secretKeyToPublicKey.
     */
    public secretKeyToPublicKey?: (privateKey: string) => string = undefined;

    /**
     * A replacement function for the JS/C++ cnFastHash.
     */
    public cnFastHash?: (input: string) => string = undefined;

    /**
     * A replacement function for the JS/C++ generateRingSignatures.
     */
    public generateRingSignatures?: (transactionPrefixHash: string,
                                     keyImage: string,
                                     inputKeys: string[],
                                     privateKey: string,
                                     realIndex: number) => string[] = undefined;
    /**
     * A replacement function for the JS/C++ checkRingSignatures.
     */
    public checkRingSignatures?: (transactionPrefixHash: string,
                           keyImage: string,
                           publicKeys: string[],
                           signatures: string[]) => boolean = undefined;

    /**
     * A replacement function for the JS/C++ generateKeyDerivation.
     */
    public generateKeyDerivation?: (transactionPublicKey: string,
                                    privateViewKey: string) => string = undefined;

    /**
     * The amount of memory to use storing downloaded blocks - 50MB
     */
    public blockStoreMemoryLimit: number = 1024 * 1024 * 50;

    /**
     * The amount of blocks to take from the daemon per request. Cannot take
     * more than 100.
     */
    public blocksPerDaemonRequest: number = 100;

    /**
     * The amount of seconds to permit not having fetched a block from the
     * daemon before emitting 'deadnode'. Note that this just means contacting
     * the daemon for data - if you are synced and it returns TopBlock - the
     * event will not be emitted.
     */
    public maxLastFetchedBlockInterval: number = 60 * 3;

    /**
     * The amount of seconds to permit not having fetched a new network height
     * from the daemon before emitting 'deadnode'.
     */
    public maxLastUpdatedNetworkHeightInterval: number = 60 * 3;

    /**
     * The amount of seconds to permit not having fetched a new local height
     * from the daemon before emitting 'deadnode'.
     */
    public maxLastUpdatedLocalHeightInterval: number = 60 * 3;

    /**
     * Allows setting a customer user agent string
     */
    public customUserAgentString: string = `${this.ticker.toLowerCase()}-wallet-backend-${version}`;

    /**
     * Allows specifying a custom configuration object for the request module.
     */
    public customRequestOptions: any = {};

    [key: string]: any;
}

/**
 * Merge the default config with the provided config
 *
 * @hidden
 */
export function MergeConfig(config?: IConfig, currentConfig = new Config()): Config {
    /* Clone the given config so we don't alter it */
    const finalConfig = Object.create(
        Object.getPrototypeOf(currentConfig),
        Object.getOwnPropertyDescriptors(currentConfig),
    );

    if (!config) {
        return finalConfig;
    }

    for (const [key, value] of Object.entries(config)) {
        finalConfig[key] = value;
    }

    return finalConfig;
}
