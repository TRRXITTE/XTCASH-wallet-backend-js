"use strict";
// Copyright (c) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const request = require("request-promise-native");
const events_1 = require("events");
const http = require("http");
const https = require("https");
const Assert_1 = require("./Assert");
const Types_1 = require("./Types");
const Config_1 = require("./Config");
const ValidateParameters_1 = require("./ValidateParameters");
const Logger_1 = require("./Logger");
const WalletError_1 = require("./WalletError");
/**
 * @noInheritDoc
 */
class Daemon extends events_1.EventEmitter {
    /**
     * @param host The host to access the API on. Can be an IP, or a URL, for
     *             example, 1.1.1.1, or blockapi.turtlepay.io
     *
     * @param port The port to access the API on. Normally 14486 for a traaittCASH
     *             daemon, 80 for a HTTP api, or 443 for a HTTPS api.
     *
     * @param isCacheApi You can optionally specify whether this API is a
     *                   blockchain cache API to save a couple of requests.
     *                   If you're not sure, do not specify this parameter -
     *                   we will work it out automatically.
     *
     * @param ssl        You can optionally specify whether this API supports
     *                   ssl/tls/https to save a couple of requests.
     *                   If you're not sure, do not specify this parameter -
     *                   we will work it out automatically.
     */
    constructor(host, port, isCacheApi, ssl) {
        super();
        /**
         * Whether we should use https for our requests
         */
        this.ssl = true;
        /**
         * Have we determined if we should be using ssl or not?
         */
        this.sslDetermined = false;
        /**
         * Whether we're talking to a conventional daemon, or a blockchain cache API
         */
        this.isCacheApi = false;
        /**
         * Have we determined if this is a cache API or not?
         */
        this.isCacheApiDetermined = false;
        /**
         * The address node fees will go to
         */
        this.feeAddress = '';
        /**
         * The amount of the node fee in atomic units
         */
        this.feeAmount = 0;
        /**
         * The amount of blocks the daemon we're connected to has
         */
        this.localDaemonBlockCount = 0;
        /**
         * The amount of blocks the network has
         */
        this.networkBlockCount = 0;
        /**
         * The amount of peers we have, incoming+outgoing
         */
        this.peerCount = 0;
        /**
         * The hashrate of the last known local block
         */
        this.lastKnownHashrate = 0;
        this.config = new Config_1.Config();
        this.httpAgent = new http.Agent({
            keepAlive: true,
            maxSockets: Infinity,
            keepAliveMsecs: 20000,
        });
        this.httpsAgent = new https.Agent({
            keepAlive: true,
            maxSockets: Infinity,
            keepAliveMsecs: 20000,
        });
        /**
         * Last time the network height updated. If this goes over the configured
         * limit, we'll emit deadnode.
         */
        this.lastUpdatedNetworkHeight = new Date();
        /**
         * Last time the daemon height updated. If this goes over the configured
         * limit, we'll emit deadnode.
         */
        this.lastUpdatedLocalHeight = new Date();
        /**
         * Did our last contact with the daemon succeed. Set to true initially
         * so initial failure to connect will fire disconnect event.
         */
        this.connected = true;
        this.setMaxListeners(0);
        Assert_1.assertString(host, 'host');
        Assert_1.assertNumber(port, 'port');
        Assert_1.assertBooleanOrUndefined(isCacheApi, 'isCacheApi');
        Assert_1.assertBooleanOrUndefined(ssl, 'ssl');
        this.host = host;
        this.port = port;
        /* Raw IP's very rarely support SSL. This fixes the warning from
           https://github.com/nodejs/node/pull/23329 */
        if (/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/.test(this.host) && ssl === undefined) {
            ssl = false;
        }
        if (isCacheApi !== undefined) {
            this.isCacheApi = isCacheApi;
            this.isCacheApiDetermined = true;
        }
        if (ssl !== undefined) {
            this.ssl = ssl;
            this.sslDetermined = true;
        }
    }
    updateConfig(config) {
        this.config = Config_1.MergeConfig(config);
    }
    /**
     * Get the amount of blocks the network has
     */
    getNetworkBlockCount() {
        return this.networkBlockCount;
    }
    /**
     * Get the amount of blocks the daemon we're connected to has
     */
    getLocalDaemonBlockCount() {
        return this.localDaemonBlockCount;
    }
    /**
     * Initialize the daemon and the fee info
     */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            /* Note - if one promise throws, the other will be cancelled */
            yield Promise.all([this.updateDaemonInfo(), this.updateFeeInfo()]);
            if (this.networkBlockCount === 0) {
                this.emit('deadnode');
            }
        });
    }
    /**
     * Update the daemon info
     */
    updateDaemonInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            let info;
            const haveDeterminedSsl = this.sslDetermined;
            try {
                info = yield this.makeGetRequest('/info');
            }
            catch (err) {
                Logger_1.logger.log('Failed to update daemon info: ' + err.toString(), Logger_1.LogLevel.INFO, [Logger_1.LogCategory.DAEMON]);
                const diff1 = (new Date().getTime() - this.lastUpdatedNetworkHeight.getTime()) / 1000;
                const diff2 = (new Date().getTime() - this.lastUpdatedLocalHeight.getTime()) / 1000;
                if (diff1 > this.config.maxLastUpdatedNetworkHeightInterval
                    || diff2 > this.config.maxLastUpdatedLocalHeightInterval) {
                    this.emit('deadnode');
                }
                return;
            }
            /* Possibly determined daemon type was HTTPS, got a valid response,
               but not valid data. Manually set to http and try again. */
            if (info.height === undefined && !haveDeterminedSsl) {
                this.sslDetermined = true;
                this.ssl = false;
                const diff1 = (new Date().getTime() - this.lastUpdatedNetworkHeight.getTime()) / 1000;
                const diff2 = (new Date().getTime() - this.lastUpdatedLocalHeight.getTime()) / 1000;
                if (diff1 > this.config.maxLastUpdatedNetworkHeightInterval
                    || diff2 > this.config.maxLastUpdatedLocalHeightInterval) {
                    this.emit('deadnode');
                }
                return this.updateDaemonInfo();
            }
            /* Are we talking to a cache API or not? */
            if (!this.isCacheApiDetermined) {
                if (info.isCacheApi !== undefined && _.isBoolean(info.isCacheApi)) {
                    this.isCacheApi = info.isCacheApi;
                    this.isCacheApiDetermined = true;
                }
                else {
                    this.isCacheApi = false;
                    this.isCacheApiDetermined = true;
                }
            }
            /* Height returned is one more than the current height - but we
               don't want to overflow if the height returned is zero */
            if (info.network_height !== 0) {
                info.network_height--;
            }
            if (this.localDaemonBlockCount !== info.height
                || this.networkBlockCount !== info.network_height) {
                this.emit('heightchange', info.height, info.network_height);
                this.lastUpdatedNetworkHeight = new Date();
                this.lastUpdatedLocalHeight = new Date();
            }
            else {
                const diff1 = (new Date().getTime() - this.lastUpdatedNetworkHeight.getTime()) / 1000;
                const diff2 = (new Date().getTime() - this.lastUpdatedLocalHeight.getTime()) / 1000;
                if (diff1 > this.config.maxLastUpdatedNetworkHeightInterval
                    || diff2 > this.config.maxLastUpdatedLocalHeightInterval) {
                    this.emit('deadnode');
                }
            }
            this.localDaemonBlockCount = info.height;
            this.networkBlockCount = info.network_height;
            this.peerCount = info.incoming_connections_count + info.outgoing_connections_count;
            this.lastKnownHashrate = info.difficulty / this.config.blockTargetTime;
        });
    }
    /**
     * Get the node fee and address
     */
    nodeFee() {
        return [this.feeAddress, this.feeAmount];
    }
    /**
     * @param blockHashCheckpoints  Hashes of the last known blocks. Later
     *                              blocks (higher block height) should be
     *                              ordered at the front of the array.
     *
     * @param startHeight           Height to start taking blocks from
     * @param startTimestamp        Block timestamp to start taking blocks from
     *
     * Gets blocks from the daemon. Blocks are returned starting from the last
     * known block hash (if higher than the startHeight/startTimestamp)
     */
    getWalletSyncData(blockHashCheckpoints, startHeight, startTimestamp, blockCount) {
        return __awaiter(this, void 0, void 0, function* () {
            let data;
            try {
                data = yield this.makePostRequest('/getwalletsyncdata', {
                    blockCount,
                    blockHashCheckpoints,
                    skipCoinbaseTransactions: !this.config.scanCoinbaseTransactions,
                    startHeight,
                    startTimestamp,
                });
            }
            catch (err) {
                Logger_1.logger.log('Failed to get wallet sync data: ' + err.toString(), Logger_1.LogLevel.INFO, [Logger_1.LogCategory.DAEMON]);
                return [[], false];
            }
            /* The node is not dead if we're fetching blocks. */
            if (data.items.length >= 0) {
                this.lastUpdatedNetworkHeight = new Date();
                this.lastUpdatedLocalHeight = new Date();
            }
            if (data.synced && data.topBlock && data.topBlock.height && data.topBlock.hash) {
                return [data.items.map(Types_1.Block.fromJSON), data.topBlock];
            }
            return [data.items.map(Types_1.Block.fromJSON), true];
        });
    }
    /**
     * @returns Returns a mapping of transaction hashes to global indexes
     *
     * Get global indexes for the transactions in the range
     * [startHeight, endHeight]
     */
    getGlobalIndexesForRange(startHeight, endHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isCacheApi) {
                throw new Error('This call is not supported on the cache api. The cache API ' +
                    'returns global indexes directly from /getWalletSyncData');
            }
            try {
                const data = yield this.makePostRequest('/get_global_indexes_for_range', {
                    startHeight,
                    endHeight,
                });
                const indexes = new Map();
                for (const index of data.indexes) {
                    indexes.set(index.key, index.value);
                }
                return indexes;
            }
            catch (err) {
                Logger_1.logger.log('Failed to get global indexes: ' + err.toString(), Logger_1.LogLevel.ERROR, Logger_1.LogCategory.DAEMON);
                return new Map();
            }
        });
    }
    getCancelledTransactions(transactionHashes) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.makePostRequest('/get_transactions_status', {
                    transactionHashes,
                });
                return data.transactionsUnknown || [];
            }
            catch (err) {
                Logger_1.logger.log('Failed to get transactions status: ' + err.toString(), Logger_1.LogLevel.ERROR, Logger_1.LogCategory.DAEMON);
                return [];
            }
        });
    }
    /**
     * Gets random outputs for the given amounts. requestedOuts per. Usually mixin+1.
     *
     * @returns Returns an array of amounts to global indexes and keys. There
     *          should be requestedOuts indexes if the daemon fully fulfilled
     *          our request.
     */
    getRandomOutputsByAmount(amounts, requestedOuts) {
        return __awaiter(this, void 0, void 0, function* () {
            let data;
            try {
                if (this.isCacheApi) {
                    data = yield this.makePostRequest('/randomOutputs', {
                        amounts: amounts,
                        mixin: requestedOuts,
                    });
                }
                else {
                    const tmp = yield this.makePostRequest('/getrandom_outs', {
                        amounts: amounts,
                        outs_count: requestedOuts,
                    });
                    data = tmp.outs || [];
                }
            }
            catch (err) {
                Logger_1.logger.log('Failed to get random outs: ' + err.toString(), Logger_1.LogLevel.ERROR, [Logger_1.LogCategory.TRANSACTIONS, Logger_1.LogCategory.DAEMON]);
                return [];
            }
            const outputs = [];
            for (const output of data) {
                const indexes = [];
                for (const outs of output.outs) {
                    indexes.push([outs.global_amount_index, outs.out_key]);
                }
                /* Sort by output index to make it hard to determine real one */
                outputs.push([output.amount, _.sortBy(indexes, ([index, key]) => index)]);
            }
            return outputs;
        });
    }
    sendTransaction(rawTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.makePostRequest('/sendrawtransaction', {
                tx_as_hex: rawTransaction,
            });
            /* Success. */
            if (result.status.toUpperCase() === 'OK') {
                return [true, undefined];
            }
            /* Fail, no extra error message. */
            if (!result || !result.status || !result.error) {
                return [false, undefined];
            }
            /* Fail, extra error message */
            return [false, result.error];
        });
    }
    getConnectionInfo() {
        return {
            host: this.host,
            port: this.port,
            daemonType: this.isCacheApi ? Types_1.DaemonType.BlockchainCacheApi : Types_1.DaemonType.ConventionalDaemon,
            daemonTypeDetermined: this.isCacheApiDetermined,
            ssl: this.ssl,
            sslDetermined: this.sslDetermined,
        };
    }
    getConnectionString() {
        return this.host + ':' + this.port;
    }
    /**
     * Update the fee address and amount
     */
    updateFeeInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            let feeInfo;
            try {
                feeInfo = yield this.makeGetRequest('/fee');
            }
            catch (err) {
                Logger_1.logger.log('Failed to update fee info: ' + err.toString(), Logger_1.LogLevel.INFO, [Logger_1.LogCategory.DAEMON]);
                return;
            }
            if (feeInfo.address === '') {
                return;
            }
            const integratedAddressesAllowed = false;
            const err = ValidateParameters_1.validateAddresses(new Array(feeInfo.address), integratedAddressesAllowed, this.config).errorCode;
            if (err !== WalletError_1.WalletErrorCode.SUCCESS) {
                Logger_1.logger.log('Failed to validate address from daemon fee info: ' + err.toString(), Logger_1.LogLevel.WARNING, [Logger_1.LogCategory.DAEMON]);
                return;
            }
            if (feeInfo.amount > 0) {
                this.feeAddress = feeInfo.address;
                this.feeAmount = feeInfo.amount;
            }
        });
    }
    makeGetRequest(endpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.makeRequest(endpoint, 'GET');
        });
    }
    makePostRequest(endpoint, body) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.makeRequest(endpoint, 'POST', body);
        });
    }
    /**
     * Makes a get request to the given endpoint
     */
    makeRequest(endpoint, method, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                body,
                json: true,
                method,
                timeout: this.config.requestTimeout,
                headers: { 'User-Agent': this.config.customUserAgentString },
            };
            try {
                const protocol = this.sslDetermined ? (this.ssl ? 'https' : 'http') : 'https';
                Logger_1.logger.log(`Making request to ${endpoint} with params ${body ? JSON.stringify(body) : '{}'}`, Logger_1.LogLevel.TRACE, [Logger_1.LogCategory.DAEMON]);
                const data = yield request(Object.assign(Object.assign(Object.assign({}, options), this.config.customRequestOptions), { 
                    /* Start by trying HTTPS if we haven't determined whether it's
                       HTTPS or HTTP yet. */
                    url: `${protocol}://${this.host}:${this.port}${endpoint}`, agent: protocol === 'https' ? this.httpsAgent : this.httpAgent }));
                /* Cool, https works. Store for later. */
                if (!this.sslDetermined) {
                    this.ssl = true;
                    this.sslDetermined = true;
                }
                if (!this.connected) {
                    this.emit('connect');
                    this.connected = true;
                }
                Logger_1.logger.log(`Got response from ${endpoint} with body ${JSON.stringify(data)}`, Logger_1.LogLevel.TRACE, [Logger_1.LogCategory.DAEMON]);
                return data;
            }
            catch (err) {
                /* No point trying again with SSL - we already have decided what
                   type it is. */
                if (this.sslDetermined) {
                    if (this.connected) {
                        this.emit('disconnect', err);
                        this.connected = false;
                    }
                    throw err;
                }
                try {
                    const data = yield request(Object.assign(Object.assign({}, options), { 
                        /* Lets try HTTP now. */
                        url: `http://${this.host}:${this.port}${endpoint}`, agent: this.httpAgent }));
                    this.ssl = false;
                    this.sslDetermined = true;
                    if (!this.connected) {
                        this.emit('connect');
                        this.connected = true;
                    }
                    Logger_1.logger.log(`Got response from ${method} with body ${JSON.stringify(data)}`, Logger_1.LogLevel.TRACE, [Logger_1.LogCategory.DAEMON]);
                    return data;
                }
                catch (err) {
                    if (this.connected) {
                        this.emit('disconnect', err);
                        this.connected = false;
                    }
                    throw err;
                }
            }
        });
    }
}
exports.Daemon = Daemon;
