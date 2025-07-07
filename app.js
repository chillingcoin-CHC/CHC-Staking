let web3;
let account;
let stakingContract;
let tokenContract;

const CHC_ADDRESS = "0xc50e66bca472da61d0184121e491609b774e2c37";
const STAKING_ADDRESS = "0xa5E6F40Bd1D16d21Aeb5e89AEE50f307fc4eA0b3";

// ✅ Verified ABI
const STAKING_ABI = [
  { "inputs": [{ "internalType": "address", "name": "_chcToken", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [], "name": "MAX_STAKE", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "chcToken", "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "getLockedAmount", "outputs": [{ "internalType": "uint256", "name": "totalLocked", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "getStakeInfo", "outputs": [{ "components": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "startTime", "type": "uint256" }, { "internalType": "enum CHCStaking.Tier", "name": "tier", "type": "uint8" }, { "internalType": "bool", "name": "withdrawn", "type": "bool" }], "internalType": "struct CHCStaking.Stake[]", "name": "", "type": "tuple[]" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "enum CHCStaking.Tier", "name": "tier", "type": "uint8" }], "name": "stake", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" }], "name": "stakes", "outputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "startTime", "type": "uint256" }, { "internalType": "enum CHCStaking.Tier", "name": "tier", "type": "uint8" }, { "internalType": "bool", "name": "withdrawn", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "totalStaked", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }], "name": "unstake", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

const ERC20_ABI = [
  {
    constant: false,
    inputs: [{ name: "_spender", type: "address" }, { name: "_value", type: "uint256" }],
    name: "approve", outputs: [{ name: "", type: "bool" }], type: "function"
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf", outputs: [{ name: "balance", type: "uint256" }], type: "function"
  }
];

async function connectWallet() {
  const providerOptions = {
    walletconnect: {
      package: window.WalletConnectProvider.default,
      options: { rpc: { 56: "https://bsc-dataseed.binance.org/" } }
    }
  };

  const web3Modal = new window.Web3Modal.default({
    network: "binance", cacheProvider: false, providerOptions
  });

  const provider = await web3Modal.connect();
  web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();
  account = accounts[0];

  stakingContract = new web3.eth.Contract(STAKING_ABI, STAKING_ADDRESS);
  tokenContract = new web3.eth.Contract(ERC20_ABI, CHC_ADDRESS);

  loadStakedBalance();
}

async function stakeTokens() {
  const amountInput = document.getElementById("amount").value;
  const tier = document.getElementById("tierSelect").value;
  const amount = web3.utils.toWei(amountInput, "ether");

  await tokenContract.methods.approve(STAKING_ADDRESS, amount).send({ from: account });
  await stakingContract.methods.stake(amount, tier).send({ from: account });

  loadStakedBalance();
}

async function loadStakedBalance() {
  try {
    const stakes = await stakingContract.methods.getStakeInfo(account).call();
    let activeStake = stakes.find(s => !s.withdrawn);

    if (activeStake) {
      const amount = web3.utils.fromWei(activeStake.amount, "ether");
      const tier = activeStake.tier === "0" ? "Chill Stake" : "Deep Chill";
      const unlockTime = new Date((+activeStake.startTime + (activeStake.tier === "0" ? 14 : 30) * 86400) * 1000).toLocaleDateString();

      document.getElementById("stakeStatus").innerText =
        `🧊 You have staked ${amount} CHC in ${tier} (unlocks on ${unlockTime})`;
    } else {
      document.getElementById("stakeStatus").innerText = "You haven’t staked yet.";
    }
  } catch (err) {
    console.error("Stake read error:", err);
    document.getElementById("stakeStatus").innerText = "Error reading stake info.";
  }
}

document.getElementById("connectButton").onclick = connectWallet;
document.getElementById("stakeButton").onclick = stakeTokens;
