"use strict";
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
const colors = require("colors");
const fs = require("fs");
const index_1 = require("../lib/index");
const CnUtils_1 = require("../lib/CnUtils");
const doPerformanceTests = process.argv.includes('--do-performance-tests');
const daemonAddress = 'blockapi.turtlepay.io';
const daemonPort = 443;
class Tester {
    constructor() {
        this.totalTests = 0;
        this.testsFailed = 0;
        this.testsPassed = 0;
        console.log(colors.yellow('=== Started testing ===\n'));
    }
    test(testFunc, testDescription, successMsg, failMsg) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(colors.yellow(`=== ${testDescription} ===`));
            const success = yield testFunc();
            this.totalTests++;
            if (success) {
                console.log(colors.green(' ✔️  ') + successMsg);
                this.testsPassed++;
            }
            else {
                console.log(colors.red(' ❌ ') + failMsg);
                this.testsFailed++;
            }
            console.log('');
        });
    }
    summary() {
        console.log(colors.yellow('=== Testing complete! ==='));
        console.log(colors.white(' 📰  ')
            + colors.white('Total tests:  ')
            + colors.white(this.totalTests.toString()));
        console.log(colors.green(' ✔️  ')
            + colors.white('Tests passed: ')
            + colors.green(this.testsPassed.toString()));
        console.log(colors.red(' ❌  ')
            + colors.white('Tests failed: ')
            + colors.red(this.testsFailed.toString()));
    }
    setExitCode() {
        process.exitCode = this.testsFailed === 0 ? 0 : 1;
    }
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function encryptDecryptWallet(wallet, daemon, password) {
    const encryptedString = wallet.encryptWalletToString(password);
    const [newWallet, error] = index_1.WalletBackend.openWalletFromEncryptedString(daemon, encryptedString, password);
    if (error) {
        return false;
    }
    return true;
}
function roundTrip(wallet, daemon, password) {
    /* Save wallet to file */
    if (!wallet.saveWalletToFile('tmp.wallet', password)) {
        return false;
    }
    /* Check we can re-open saved file */
    const [loadedWallet, error] = index_1.WalletBackend.openWalletFromFile(daemon, 'tmp.wallet', password);
    /* Remove file */
    fs.unlinkSync('tmp.wallet');
    if (error) {
        return false;
    }
    /* Loaded file should equal original JSON */
    return wallet.toJSONString() === loadedWallet.toJSONString();
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    /* Setup test class */
    const tester = new Tester();
    /* Setup a daemon */
    const daemon = new index_1.Daemon(daemonAddress, daemonPort);
    /* Begin testing */
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        /* Create a new wallet */
        const wallet = index_1.WalletBackend.createWallet(daemon);
        /* Convert the wallet to JSON */
        const initialJSON = JSON.stringify(wallet, null, 4);
        /* Load a new wallet from the dumped JSON */
        const [loadedWallet, error] = index_1.WalletBackend.loadWalletFromJSON(daemon, initialJSON);
        /* Re-dump to JSON  */
        const finalJSON = JSON.stringify(loadedWallet, null, 4);
        return initialJSON === finalJSON;
    }), 'Checking wallet JSON serialization', 'Wallet serialization was successful', 'Initial JSON is not equal to final json!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        /* Load a test file to check compatibility with C++ wallet backend */
        const [testWallet, error] = index_1.WalletBackend.openWalletFromFile(daemon, './tests/test.wallet', 'password');
        return error === undefined;
    }), 'Loading test wallet file', 'Wallet loading succeeded', 'Wallet loading failed');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const wallet = index_1.WalletBackend.createWallet(daemon);
            if (!roundTrip(wallet, daemon, 'password')) {
                return false;
            }
            /* Verify loaded wallet runs */
            yield wallet.start();
            yield delay(1000 * 2);
            yield wallet.stop();
        }
        catch (err) {
            return false;
        }
        return true;
    }), 'Checking can open saved file', 'Can open saved file', 'Can\'t open saved file!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const wallet = index_1.WalletBackend.createWallet(daemon);
        /* Blank password */
        const test1 = roundTrip(wallet, daemon, '');
        /* Nipponese */
        const test2 = roundTrip(wallet, daemon, 'お前はもう死んでいる');
        /* A variety of unicode symbols, suggested by VMware */
        const test3 = roundTrip(wallet, daemon, '表ポあA鷗ŒéＢ逍Üßªąñ丂㐀𠀀');
        /* Emojis */
        const test4 = roundTrip(wallet, daemon, '❤️ 💔 💌 💕 💞 💓 💗 💖 💘 💝 💟 💜 💛 💚 💙');
        /* Right to left test */
        const test5 = roundTrip(wallet, daemon, 'בְּרֵאשִׁית, בָּרָא אֱלֹהִים, אֵת הַשָּׁמַיִם, וְאֵת הָאָרֶץ');
        /* Cyrillic */
        const test6 = roundTrip(wallet, daemon, 'Дайте советов чтоли!');
        return test1 && test2 && test3 && test4 && test5 && test6;
    }), 'Verifying special passwords work as expected', 'Special passwords work as expected', 'Special passwords do not work as expected!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const wallet = index_1.WalletBackend.createWallet(daemon);
        return encryptDecryptWallet(wallet, daemon, 'password');
    }), 'Verifying wallet encryption and decryption work as expected', 'Encrypt/Decrypt wallet works as expected', 'Encrypt/Decrypt wallet does not work as expected!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const [seedWallet, error] = index_1.WalletBackend.importWalletFromSeed(daemon, 0, 'skulls woozy ouch summon gifts huts waffle ourselves obtains hexagon ' +
            'tadpoles hacksaw dormant hence abort listen history atom cadets stylishly ' +
            'snout vegan girth guest history');
        const [privateSpendKey, privateViewKey] = seedWallet.getPrimaryAddressPrivateKeys();
        return privateSpendKey === 'd61a57a59318d70ff77cc7f8ad7f62887c828da1d5d3f3b0d2f7d3fa596c2904'
            && privateViewKey === '688e5229df6463ec4c27f6ee11c3f1d3d4b4d2480c0aabe64fb807182cfdc801';
    }), 'Verifying seed restore works correctly', 'Mnemonic seed wallet has correct keys', 'Mnemonic seed wallet has incorrect keys!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const [keyWallet, error] = index_1.WalletBackend.importWalletFromKeys(daemon, 0, '688e5229df6463ec4c27f6ee11c3f1d3d4b4d2480c0aabe64fb807182cfdc801', 'd61a57a59318d70ff77cc7f8ad7f62887c828da1d5d3f3b0d2f7d3fa596c2904');
        const [seed, error2] = keyWallet.getMnemonicSeed();
        return seed === 'skulls woozy ouch summon gifts huts waffle ourselves obtains ' +
            'hexagon tadpoles hacksaw dormant hence abort listen history ' +
            'atom cadets stylishly snout vegan girth guest history';
    }), 'Verifying key restore works correctly', 'Deterministic key wallet has correct seed', 'Deterministic key wallet has incorrect seed!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const [keyWallet, error] = index_1.WalletBackend.importWalletFromKeys(daemon, 0, '1f3f6c220dd9f97619dbf44d967f79f3041b9b1c63da2c895f980f1411d5d704', '55e0aa4ca65c0ae016c7364eec313f56fc162901ead0e38a9f846686ac78560f');
        const [seed, err] = keyWallet.getMnemonicSeed();
        return err.errorCode === index_1.WalletErrorCode.KEYS_NOT_DETERMINISTIC;
    }), 'Verifying non deterministic wallet doesn\'t create seed', 'Non deterministic wallet has no seed', 'Non deterministic wallet has seed!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const [viewWallet, error] = index_1.WalletBackend.importViewWallet(daemon, 0, '3c6cfe7a29a371278abd9f5725a3d2af5eb73d88b4ed9b8d6c2ff993bbc4c20a', 'TRuybJFCU8BjP18bH3VZCNAu1fZ2r3d85SsU2w3VnJAHoRfnzLKgtTK2b58nfwDu59hKxwVuSMhTN31gmUW8nN9aoAN9N8Qyb');
        const [privateSpendKey, privateViewKey] = viewWallet.getPrimaryAddressPrivateKeys();
        return privateSpendKey === '0'.repeat(64);
    }), 'Verifying view wallet has null private spend key', 'View wallet has null private spend key', 'View wallet has private spend key!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const [seedWallet, error] = index_1.WalletBackend.importWalletFromSeed(daemon, 0, 'skulls woozy ouch summon gifts huts waffle ourselves obtains hexagon ' +
            'tadpoles hacksaw dormant hence abort listen history atom cadets stylishly ' +
            'snout vegan girth guest history');
        const address = seedWallet.getPrimaryAddress();
        return address === 'TRv1s9JQeHAJFoHvcqVBPyHYom2ynKeK6dpYptbp8gQNzdzE73ZD' +
            'kNmNurqfhhcMSUXpS1ZGEJKiKJUcPCyw7vYaCc354DCN1';
    }), 'Verifying correct address is created from seed', 'Seed wallet has correct address', 'Seed wallet has incorrect address!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const test1 = index_1.prettyPrintAmount(12345607) === '123,456.07 TR';
        const test2 = index_1.prettyPrintAmount(0) === '0.00 TR';
        const test3 = index_1.prettyPrintAmount(-1234) === '-12.34 TR';
        return test1 && test2 && test3;
    }), 'Testing prettyPrintAmount', 'prettyPrintAmount works', 'prettyPrintAmount gave unexpected output!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        /* Create a new wallet */
        const wallet = index_1.WalletBackend.createWallet(daemon);
        const [seed, err1] = wallet.getMnemonicSeedForAddress('');
        /* Verify invalid address is detected */
        const test1 = err1.errorCode === index_1.WalletErrorCode.ADDRESS_WRONG_LENGTH;
        const [seed2, err2] = wallet.getMnemonicSeedForAddress('TRv1s9JQeHAJFoHvcqVBPyHYom2ynKeK6dpYptbp8gQNzdzE73ZD' +
            'kNmNurqfhhcMSUXpS1ZGEJKiKJUcPCyw7vYaCc354DCN1');
        /* Random address shouldn't be present in wallet */
        const test2 = _.isEqual(err2, new index_1.WalletError(index_1.WalletErrorCode.ADDRESS_NOT_IN_WALLET));
        /* Should get a seed back when we supply our address */
        const test3 = wallet.getMnemonicSeedForAddress(wallet.getPrimaryAddress())[0] !== undefined;
        /* TODO: Add a test for testing a new subwallet address, when we add
           subwallet creation */
        return test1 && test2 && test3;
    }), 'Testing getMnemonicSeedForAddress', 'getMnemonicSeedForAddress works', 'getMnemonicSeedForAddress doesn\'t work!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const wallet = index_1.WalletBackend.createWallet(daemon);
        /* Not called wallet.start(), so node fee should be unset here */
        const [feeAddress, feeAmount] = wallet.getNodeFee();
        return feeAddress === '' && feeAmount === 0;
    }), 'Testing getNodeFee', 'getNodeFee works', 'getNodeFee doesn\'t work!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const wallet = index_1.WalletBackend.createWallet(daemon);
        const address = wallet.getPrimaryAddress();
        const err = index_1.validateAddresses([address], false);
        return _.isEqual(err, index_1.SUCCESS);
    }), 'Testing getPrimaryAddress', 'getPrimaryAddress works', 'getPrimaryAddress doesn\'t work!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const privateViewKey = '3c6cfe7a29a371278abd9f5725a3d2af5eb73d88b4ed9b8d6c2ff993bbc4c20a';
        const [viewWallet, error] = index_1.WalletBackend.importViewWallet(daemon, 0, privateViewKey, 'TRuybJFCU8BjP18bH3VZCNAu1fZ2r3d85SsU2w3VnJAHoRfnzLKgtTK2b58nfwDu59hKxwVuSMhTN31gmUW8nN9aoAN9N8Qyb');
        return viewWallet.getPrivateViewKey() === privateViewKey;
    }), 'Testing getPrivateViewKey', 'getPrivateViewKey works', 'getPrivateViewKey doesn\'t work!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const [keyWallet, error] = index_1.WalletBackend.importWalletFromKeys(daemon, 0, '1f3f6c220dd9f97619dbf44d967f79f3041b9b1c63da2c895f980f1411d5d704', '55e0aa4ca65c0ae016c7364eec313f56fc162901ead0e38a9f846686ac78560f');
        const wallet = keyWallet;
        const [publicSpendKey, privateSpendKey, error2] = wallet.getSpendKeys(wallet.getPrimaryAddress());
        return publicSpendKey === 'ff9b6e048297ee435d6219005974c2c8df620a4aca9ca5c4e13f071823482029' &&
            privateSpendKey === '55e0aa4ca65c0ae016c7364eec313f56fc162901ead0e38a9f846686ac78560f';
    }), 'Testing getSpendKeys', 'getSpendKeys works', 'getSpendKeys doesn\'t work!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        let address;
        try {
            address = index_1.createIntegratedAddress('TRv2Fyavy8CXG8BPEbNeCHFZ1fuDCYCZ3vW5H5LXN4K2M2MHUpTENip9bbavpHvvPwb4NDkBWrNgURAd5DB38FHXWZyoBh4wW', 'b23df6e84c1dd619d3601a28e5948d92a0d096aea1621969c591a90e986794a0');
        }
        catch (err) {
            console.log(JSON.stringify(err));
        }
        const test1 = address === 'TRuyzDT8wJ6bAmnmBLyRHmBNrRrafuR9G3bJTNzPiTAS4xKDQKHd9Aa2sF2q22DF9EXi5HNpZGcHGBwqgVAqc2AZxUBMMSegm8CXG8BPEbNeCHFZ1fuDCYCZ3vW5H5LXN4K2M2MHUpTENip9bbavpHvvPwb4NDkBWrNgURAd5DB38FHXWZyhJk2yR';
        let test2 = false;
        try {
            index_1.createIntegratedAddress('TRv2Fyavy8CXG8BPEbNeCHFZ1fuDCYCZ3vW5H5LXN4K2M2MHUpTENip9bbavpHvvPwb4NDkBWrNgURAd5DB38FHXWZyoBh4wW', '');
        }
        catch (err) {
            test2 = true;
        }
        let test3 = false;
        try {
            index_1.createIntegratedAddress('', 'b23df6e84c1dd619d3601a28e5948d92a0d096aea1621969c591a90e986794a0');
        }
        catch (err) {
            test3 = true;
        }
        return test1 && test2 && test3;
    }), 'Testing createIntegratedAddress', 'createIntegratedAddress works', 'createIntegratedAddress doesn\'t work!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const [keyWallet, error] = index_1.WalletBackend.importWalletFromKeys(daemon, 0, '1f3f6c220dd9f97619dbf44d967f79f3041b9b1c63da2c895f980f1411d5d704', '55e0aa4ca65c0ae016c7364eec313f56fc162901ead0e38a9f846686ac78560f', {
            addressPrefix: 8411,
        });
        const address = keyWallet.getPrimaryAddress();
        return address === 'dg5NZstxyAegrTA1Z771tPZaf13V6YHAjUjAieQfjwCb6P1eYHuMmwRcDcQ1eAs41sQrh98FjBXn257HZzh2CCwE2spKE2gmA';
    }), 'Testing supplied config is applied', 'Supplied config applied correctly', 'Supplied config not applied!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const test1 = !index_1.isValidMnemonicWord('aaaaa');
        const test2 = index_1.isValidMnemonicWord('abbey');
        const test3 = index_1.isValidMnemonic('nugget lazy gang sonic vulture exit veteran poverty affair ringing opus soapy sonic afield dating lectures worry tuxedo ruffled rated locker bested aunt bifocals opus')[0];
        const test4 = !index_1.isValidMnemonic('')[0];
        const test5 = !index_1.isValidMnemonic('nugget lazy gang sonic vulture exit veteran poverty affair ringing opus soapy sonic afield dating lectures worry tuxedo ruffled rated locker bested aunt bifocals soapy')[0];
        const test6 = !index_1.isValidMnemonic('a lazy gang sonic vulture exit veteran poverty affair ringing opus soapy sonic afield dating lectures worry tuxedo ruffled rated locker bested aunt bifocals opus')[0];
        return test1 && test2 && test3 && test4 && test5 && test6;
    }), 'Testing isValidMnemonic', 'isValidMnemonic works', 'isValidMnemonic doesn\'t work!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const daemon2 = new index_1.Daemon('127.0.0.1', 14486);
        const wallet = index_1.WalletBackend.createWallet(daemon2);
        yield wallet.start();
        const daemon3 = new index_1.Daemon(daemonAddress, daemonPort);
        yield wallet.swapNode(daemon3);
        const info = wallet.getDaemonConnectionInfo();
        yield wallet.stop();
        return _.isEqual(info, {
            host: daemonAddress,
            port: daemonPort,
            daemonType: index_1.DaemonType.BlockchainCacheApi,
            daemonTypeDetermined: true,
            ssl: true,
            sslDetermined: true,
        });
    }), 'Testing swapNode', 'swapNode works', 'swapNode doesn\'t work!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const daemon2 = new index_1.Daemon('this is not a valid host', 7777);
        let success = false;
        daemon2.on('disconnect', (err) => {
            success = true;
        });
        yield daemon2.init();
        const daemon3 = new index_1.Daemon(daemonAddress, daemonPort);
        daemon3.on('disconnect', (err) => {
            success = false;
        });
        yield daemon3.init();
        return success;
    }), 'Testing daemon events', 'Daemon events work', 'Daemon events don\'t work!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        /* Load a test file to check compatibility with C++ wallet backend */
        const [testWallet, error] = index_1.WalletBackend.openWalletFromFile(daemon, './tests/test.wallet', 'password');
        const wallet = testWallet;
        const a = wallet.getNumTransactions() === 3;
        let [unlockedBalance, lockedBalance] = wallet.getBalance();
        const c = unlockedBalance === 246 && lockedBalance === 167;
        yield wallet.rewind(1026200);
        const b = wallet.getNumTransactions() === 1;
        [unlockedBalance, lockedBalance] = wallet.getBalance();
        const d = unlockedBalance === 1234 && lockedBalance === 0;
        return a && b && c && d;
    }), 'Testing rewind', 'Rewind succeeded', 'Rewind failed');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const [keyWallet, error] = index_1.WalletBackend.importWalletFromKeys(daemon, 0, '1f3f6c220dd9f97619dbf44d967f79f3041b9b1c63da2c895f980f1411d5d704', '55e0aa4ca65c0ae016c7364eec313f56fc162901ead0e38a9f846686ac78560f');
        const wallet = keyWallet;
        const [address1, error1] = yield wallet.importSubWallet('c93d9e2e71ea018e7b0cec89c260f2d00d3f88ede16b3532f4ae04596ab38001');
        const a = address1 === 'TRuxZPMVRHTq27oJFmwzd85wVr2ddhM2gqXcDAp1NiDKjCMwBT98BEaCRGvRc8uXEeoz5PaR5EgDZd1FTbCeVeYFqjbp6Wx2H';
        const b = wallet.getPrimaryAddress() === 'TRv41arQbNqvP1x4MuTVFxqVydgF2PBatbBKdER2LP6uH56q3s4EbEaCRGvRc8uXEeoz5PaR5EgDZd1FTbCeVeYFqjbj5LyQQ';
        const [address2, error2] = yield wallet.importSubWallet('c93d9e2e71ea018e7b0cec89c260f2d00d3f88ede16b3532f4ae04596ab38001');
        const c = error2.errorCode === index_1.WalletErrorCode.SUBWALLET_ALREADY_EXISTS;
        return a && b && c;
    }), 'Testing subwallets', 'Subwallets work', 'Subwallet tests don\'t work!');
    yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
        const wallet = index_1.WalletBackend.createWallet(daemon);
        let success = true;
        for (let i = 2; i < 10; i++) {
            wallet.addSubWallet();
            if (wallet.getWalletCount() !== i) {
                success = false;
            }
        }
        return success;
    }), 'Testing getWalletCount', 'getWalletCount works', 'getWalletCount doesn\'t work!');
    if (doPerformanceTests) {
        yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
            /* Reinit daemon so it has no leftover state */
            const daemon2 = new index_1.Daemon(daemonAddress, daemonPort);
            const wallet = index_1.WalletBackend.createWallet(daemon2);
            /* Not started sync, all should be zero */
            const [a, b, c] = wallet.getSyncStatus();
            const test1 = a === 0 && b === 0 && c === 0;
            yield wallet.start();
            /* Wait 5 seconds */
            yield delay(1000 * 5);
            wallet.stop();
            /* Started sync, some should be non zero */
            const [d, e, f] = wallet.getSyncStatus();
            const test2 = d !== 0 || e !== 0 || f !== 0;
            return test1 && test2;
        }), 'Testing getSyncStatus (5 second test)', 'getSyncStatus works', 'getSyncStatus doesn\'t work! (Is the blockchain cache down?)');
        yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
            /* Just random public + private keys */
            const derivation = CnUtils_1.CryptoUtils(new index_1.Config()).generateKeyDerivation('f235acd76ee38ec4f7d95123436200f9ed74f9eb291b1454fbc30742481be1ab', '89df8c4d34af41a51cfae0267e8254cadd2298f9256439fa1cfa7e25ee606606');
            const loopIterations = 6000;
            const startTime = new Date().getTime();
            for (let i = 0; i < loopIterations; i++) {
                /* Use i as output index to prevent optimization */
                const derivedOutputKey = CnUtils_1.CryptoUtils(new index_1.Config()).underivePublicKey(derivation, i, '14897efad619205256d9170192e50e2fbd7959633e274d1b6f94b1087d680451');
            }
            const endTime = new Date().getTime();
            const executionTime = endTime - startTime;
            const timePerDerivation = (executionTime / loopIterations).toFixed(3);
            console.log(colors.green(' ✔️  ') + `Time to perform underivePublicKey: ${timePerDerivation} ms`);
            return true;
        }), 'Testing underivePublicKey performance', 'underivePublicKey performance test complete', 'underivePublicKey performance test failed!');
        yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
            const loopIterations = 6000;
            const startTime = new Date().getTime();
            for (let i = 0; i < loopIterations; i++) {
                /* Just random public + private keys */
                const derivation = CnUtils_1.CryptoUtils(new index_1.Config()).generateKeyDerivation('f235acd76ee38ec4f7d95123436200f9ed74f9eb291b1454fbc30742481be1ab', '89df8c4d34af41a51cfae0267e8254cadd2298f9256439fa1cfa7e25ee606606');
            }
            const endTime = new Date().getTime();
            const executionTime = endTime - startTime;
            const timePerDerivation = (executionTime / loopIterations).toFixed(3);
            console.log(colors.green(' ✔️  ') + `Time to perform generateKeyDerivation: ${timePerDerivation} ms`);
            return true;
        }), 'Testing generateKeyDerivation performance', 'generateKeyDerivation performance test complete', 'generateKeyDerivation performance test failed!');
        yield tester.test(() => __awaiter(void 0, void 0, void 0, function* () {
            const [walletTmp, error] = index_1.WalletBackend.importWalletFromSeed(daemon, 0, 'skulls woozy ouch summon gifts huts waffle ourselves obtains hexagon ' +
                'tadpoles hacksaw dormant hence abort listen history atom cadets stylishly ' +
                'snout vegan girth guest history');
            const wallet = walletTmp;
            const startTime = new Date().getTime();
            yield wallet.start();
            /* Wait for 60 seconds */
            yield delay(1000 * 60);
            wallet.stop();
            const endTime = new Date().getTime();
            const [walletBlockCount] = wallet.getSyncStatus();
            if (walletBlockCount === 0) {
                console.log(colors.red(' ❌ ') +
                    'Failed to sync with blockchain cache...');
                return false;
            }
            const executionTime = endTime - startTime;
            const timePerBlock = (executionTime / walletBlockCount).toFixed(2);
            console.log(colors.green(' ✔️  ') + `Time to process one block: ${timePerBlock} ms`);
            return true;
        }), 'Testing wallet syncing performance (60 second test)', 'Wallet syncing performance test complete', 'Wallet syncing performance test failed!');
    }
    /* Print a summary of passed/failed tests */
    tester.summary();
    /* Set exit code based on if we failed any tests */
    tester.setExitCode();
}))();
