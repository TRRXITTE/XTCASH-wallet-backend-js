"use strict";
// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.
Object.defineProperty(exports, "__esModule", { value: true });
const MixinLimits_1 = require("./MixinLimits");
const version = require('../../package.json').version;
/**
 * Configuration for the wallet backend
 *
 * @hidden
 */
class Config {
    constructor() {
        /**
         * The amount of decimal places your coin has, e.g. traaittCASH has eight
         * decimals
         */
        this.decimalPlaces = 2;
        /**
         * The address prefix your coin uses - you can find this in CryptoNoteConfig.h.
         * In traaittCASH, this converts to cash
         */
        this.addressPrefix = 925524;
        /**
         * Request timeout for daemon operations in milliseconds
         */
        this.requestTimeout = 10 * 1000;
        /**
         * The block time of your coin, in seconds
         */
        this.blockTargetTime = 32;
        /**
         * How often to process blocks, in millseconds
         */
        this.syncThreadInterval = 10;
        /**
         * How often to update the daemon info
         */
        this.daemonUpdateInterval = 10 * 1000;
        /**
         * How often to check on locked transactions
         */
        this.lockedTransactionsCheckInterval = 30 * 1000;
        /**
         * The amount of blocks to process per 'tick' of the mainloop. Note: too
         * high a value will cause the event loop to be blocked, and your interaction
         * to be laggy.
         */
        this.blocksPerTick = 1;
        /**
         * Your coins 'ticker', generally used to refer to the coin, i.e. 123 TR
         */
        this.ticker = 'XTCASH';
        /**
         * Most people haven't mined any blocks, so lets not waste time scanning
         * them
         */
        this.scanCoinbaseTransactions = false;
        /**
         * The minimum fee allowed for transactions, in ATOMIC units
         */
        this.minimumFee = 100;
        /**
         * Mapping of height to mixin maximum and mixin minimum
         */
        this.mixinLimits = new MixinLimits_1.MixinLimits([
            /* Height: 440,000, minMixin: 0, maxMixin: 10, defaultMixin: 3 */
            new MixinLimits_1.MixinLimit(1000000, 0, 5, 3),
            /* At height of 620000, static mixin of 7 */
            new MixinLimits_1.MixinLimit(5000000, 0, 8),
            /* At height of 800000, static mixin of 3 */
            new MixinLimits_1.MixinLimit(8000000, 0, 10),
        ], 3 /* Default mixin of 3 before block 440,000 */);
        /**
         * The length of a standard address for your coin
         */
        this.standardAddressLength = 98;
        /* The length of an integrated address for your coin - It's the same as
           a normal address, but there is a paymentID included in there - since
           payment ID's are 64 chars, and base58 encoding is done by encoding
           chunks of 8 chars at once into blocks of 11 chars, we can calculate
           this automatically */
        this.integratedAddressLength = 98 + ((64 * 11) / 8);
        /**
         * A replacement function for the JS/C++ underivePublicKey.
         */
        this.underivePublicKey = undefined;
        /**
         * A replacement function for the JS/C++ derivePublicKey.
         */
        this.derivePublicKey = undefined;
        /**
         * A replacement function for the JS/C++ deriveSecretKey.
         */
        this.deriveSecretKey = undefined;
        /**
         * A replacement function for the JS/C++ generateKeyImage.
         */
        this.generateKeyImage = undefined;
        /**
         * A replacement function for the JS/C++ secretKeyToPublicKey.
         */
        this.secretKeyToPublicKey = undefined;
        /**
         * A replacement function for the JS/C++ cnFastHash.
         */
        this.cnFastHash = undefined;
        /**
         * A replacement function for the JS/C++ generateRingSignatures.
         */
        this.generateRingSignatures = undefined;
        /**
         * A replacement function for the JS/C++ checkRingSignatures.
         */
        this.checkRingSignatures = undefined;
        /**
         * A replacement function for the JS/C++ generateKeyDerivation.
         */
        this.generateKeyDerivation = undefined;
        /**
         * The amount of memory to use storing downloaded blocks - 50MB
         */
        this.blockStoreMemoryLimit = 1024 * 1024 * 50;
        /**
         * The amount of blocks to take from the daemon per request. Cannot take
         * more than 100.
         */
        this.blocksPerDaemonRequest = 100;
        /**
         * The amount of seconds to permit not having fetched a block from the
         * daemon before emitting 'deadnode'. Note that this just means contacting
         * the daemon for data - if you are synced and it returns TopBlock - the
         * event will not be emitted.
         */
        this.maxLastFetchedBlockInterval = 60 * 3;
        /**
         * The amount of seconds to permit not having fetched a new network height
         * from the daemon before emitting 'deadnode'.
         */
        this.maxLastUpdatedNetworkHeightInterval = 60 * 3;
        /**
         * The amount of seconds to permit not having fetched a new local height
         * from the daemon before emitting 'deadnode'.
         */
        this.maxLastUpdatedLocalHeightInterval = 60 * 3;
        /**
         * Allows setting a customer user agent string
         */
        this.customUserAgentString = `${this.ticker.toLowerCase()}-wallet-backend-${version}`;
        /**
         * Allows specifying a custom configuration object for the request module.
         */
        this.customRequestOptions = {};
    }
}
exports.Config = Config;
/**
 * Merge the default config with the provided config
 *
 * @hidden
 */
function MergeConfig(config, currentConfig = new Config()) {
    /* Clone the given config so we don't alter it */
    const finalConfig = Object.create(Object.getPrototypeOf(currentConfig), Object.getOwnPropertyDescriptors(currentConfig));
    if (!config) {
        return finalConfig;
    }
    for (const [key, value] of Object.entries(config)) {
        finalConfig[key] = value;
    }
    return finalConfig;
}
exports.MergeConfig = MergeConfig;
