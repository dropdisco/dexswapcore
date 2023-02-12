const DexSwapFeeReceiver = artifacts.require("DexSwapFeeReceiver");
const DexSwapFeeSetter = artifacts.require("DexSwapFeeSetter");
const DexSwapDeployer = artifacts.require("DexSwapDeployer");
const DexSwapFactory = artifacts.require("DexSwapFactory");
const ERC20 = artifacts.require("ERC20");
const WETH = artifacts.require("WETH");

const argValue = (arg, defaultValue) => process.argv.includes(arg) ? process.argv[process.argv.indexOf(arg) + 1] : defaultValue
const network = () => argValue('--network', 'local')


module.exports = async (deployer) => {

    const BN = web3.utils.toBN;
    const bnWithDecimals = (number, decimals) => BN(number).mul(BN(10).pow(BN(decimals)));
    const senderAccount = (await web3.eth.getAccounts())[0];
    const DEZU = '0xAc12F7948eFdfA205Df7daD3D1Ee04E564009ECB';

    if (network() === "mantleTestnet") {


        console.log();
        console.log(":: Deploying WETH"); 
        await deployer.deploy(WETH)
        const WETHInstance = await WETH.deployed();

        console.log();
        console.log(":: WETH DEPOSIT CALL");
        await WETHInstance.deposit({ from: senderAccount, value: 1 });
        console.log();

        console.log();
        console.log(":: Init DexSwap Deployer");
        await deployer.deploy(DexSwapDeployer, DEZU, senderAccount, WETHInstance.address, [WETHInstance.address], [DEZU], [25]);
        const dexSwapDeployer = await DexSwapDeployer.deployed();

        console.log();
        console.log(":: Start Sending 1 WEI ...");
        await dexSwapDeployer.send(1, {from: senderAccount}); 

        console.log();
        console.log(":: Sent deployment reimbursement");
        await dexSwapDeployer.deploy({from: senderAccount})
        console.log("Deployed DexSwap");


        console.log();
        console.log(":: Deploying Factory");
        await deployer.deploy(DexSwapFactory, senderAccount);
        const DexSwapFactoryInstance = await DexSwapFactory.deployed();
        
        
        console.log();
        console.log(":: Start Deploying DexSwap LP");
        await deployer.deploy(ERC20, bnWithDecimals(100000000, 18));
        const DexSwapLP = await ERC20.deployed();
        

        console.log(":: Start Deploying FeeReceiver");
        await deployer.deploy(DexSwapFeeReceiver, senderAccount, DexSwapFactoryInstance.address, WETHInstance.address, DEZU, senderAccount);
        const DexSwapFeeReceiverInstance =  await DexSwapFeeReceiver.deployed();
        console.log();


        console.log(":: Start Deploying FeeSetter");
        await deployer.deploy(DexSwapFeeSetter, senderAccount, DexSwapFactoryInstance.address);
        const DexSwapFeeSetterInstance = await DexSwapFeeSetter.deployed();


        console.log();
        console.log(":: Setting Correct FeeSetter in Factory");
        await DexSwapFactoryInstance.setFeeToSetter(DexSwapFeeSetterInstance.address);


        console.log();
        console.log(":: Transfer Ownership FeeReceiver");
        await DexSwapFeeReceiverInstance.transferOwnership(senderAccount);


        console.log();
        console.log(":: Transfer Ownership FeeSetter");
        await DexSwapFeeSetterInstance.transferOwnership(senderAccount);

        console.log();
        console.log(":: Updating Protocol FeeReceiver");
        await DexSwapFeeReceiverInstance.changeReceivers(DEZU, senderAccount, {from: senderAccount});

        
        console.log();
        console.log("====================================================================");
        console.log(`Deployer Address:`,     dexSwapDeployer.address);
        console.log("====================================================================");

        console.log("====================================================================");
        console.log(`Factory Address:`,      DexSwapFactoryInstance.address);
        console.log("====================================================================");

        console.log("====================================================================");
        console.log(`DexSwap LP Address:`,   DexSwapLP.address);
        console.log("====================================================================");

        console.log("====================================================================");
        console.log(`Fee Setter Address:`,   DexSwapFeeSetterInstance.address);
        console.log("====================================================================");

        console.log("====================================================================");
        console.log(`Fee Receiver Address:`, DexSwapFeeReceiverInstance.address);
        console.log("====================================================================");
        
        console.log("=============================================================================");
        console.log(`Code Hash:`, await DexSwapFactoryInstance.INIT_CODE_PAIR_HASH());
        console.log("=============================================================================");
        console.log("DONE");

    } else if (network() === "mantleMainnet") {
    }
};
