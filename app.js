let web3;
let account;
let stakingContract;
let tokenContract;

const CHC_ADDRESS = "0xc50e66bca472da61d0184121e491609b774e2c37";
const STAKING_ADDRESS = "0xa5E6F40Bd1D16d21Aeb5e89AEE50f307fc4eA0b3";

// ABI for CHC Staking Contract
const STAKING_ABI = [
  { "inputs":[{ "internalType":"address", "name":"_chcToken", "type":"address" }], "stateMutability":"nonpayable", "type":"constructor" },
  { "inputs":[], "name":"MAX_STAKE", "outputs":[{ "internalType":"uint256", "name":"", "type":"uint256" }], "stateMutability":"view", "type":"function" },
  { "inputs":[], "name":"chcToken", "outputs":[{ "internalType":"contract IERC20", "name":"", "type":"address" }], "stateMutability":"view", "type":"function" },
  { "inputs":[{ "internalType":"address", "name":"user", "type":"address" }], "name":"getLockedAmount", "outputs":[{ "internalType":"uint256", "name":"totalLocked", "type":"uint256" }], "stateMutability":"view", "type":"function" },
  { "inputs":[{ "internalType":"address", "name":"user", "type":"address" }], "name":"getStakeInfo", "outputs":[{ "components":[{ "internalType":"uint256", "name":"amount", "type":"uint256" },{ "internalType":"uint256", "name":"startTime", "type":"uint256" },{ "internalType":"enum CHCStaking.Tier", "name":"tier", "type":"uint8" },{ "internalType":"bool", "name":"withdrawn", "type":"bool" }], "internalType":"struct CHCStaking.Stake[]", "name":"", "type":"tuple[]" }], "stateMutability":"view", "type":"function" },
  { "inputs":[{ "internalType":"uint256", "name":"amount", "type":"uint256" },{ "internalType":"enum CHCStaking.Tier", "name":"tier", "type":"uint8" }], "name":"stake", "outputs":[], "stateMutability":"nonpayable", "type":"function" },
  { "inputs":[{ "internalType":"address", "name":"", "type":"address" },{ "internalType":"uint256", "name":"", "type":"uint256" }], "name":"stakes", "outputs":[{ "internalType":"uint256", "name":"amount", "type":"uint256" },{ "internalType":"uint256", "name":"startTime", "type":"uint256" },{ "internalType":"enum CHCStaking.Tier", "name":"tier", "type":"uint8" },{ "internalType":"bool", "name":"withdrawn", "type":"bool" }], "stateMutability":"view", "type":"function" },
  { "inputs":[{ "internalType":"address", "name":"", "type":"address" }], "name":"totalStaked", "outputs":[{ "internalType":"uint256", "name":"", "type":"uint256" }], "stateMutability":"view", "type":"function" },
  { "inputs":[{ "internalType":"uint256", "name":"index", "type":"uint256" }], "name":"unstake", "outputs":[], "stateMutability":"nonpayable", "type":"function" }
];

// Basic ERC20 ABI (approve + balanceOf)
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "success", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "remaining", type: "uint256" }],
    type: "function",
  },
];

// Connect Wallet Button
async function connectWallet() {
  const providerOptions = {
    walletconnect: {
      package: window.WalletConnectProvider.default,
      options: {
        rpc: { 56: "https://bsc-dataseed.binance.org/" }
      }
    }
  };

  const web3Modal = new window.Web3Modal.default({
    cacheProvider: false,
    providerOptions
  });

  const provider = await web3Modal.connect();
  web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();
  account = accounts[0];

  stakingContract = new web3.eth.Contract(STAKING_ABI, STAKING_ADDRESS);
  tokenContract = new web3.eth.Contract(ERC20_ABI, CHC_ADDRESS);

  loadWalletBalance();
  loadStakedBalance();
}

// Show Wallet Balance
async function loadWalletBalance() {
  const balance = await tokenContract.methods.balanceOf(account).call();
  const formatted = web3.utils.fromWei(balance, "ether");
  document.getElementById("walletBalance").innerText = `💰 Wallet Balance: ${formatted} CHC`;
}

// Stake CHC
async function stakeTokens() {
  const amountInput = document.getElementById("amount").value.trim();
  const tier = document.getElementById("tierSelect").value;

  if (!amountInput || isNaN(amountInput) || Number(amountInput) <= 0) {
    alert("Enter a valid CHC amount to stake.");
    return;
  }

  const amount = web3.utils.toWei(amountInput, "ether");

  try {
    const allowance = await tokenContract.methods.allowance(account, STAKING_ADDRESS).call();
    if (BigInt(allowance) < BigInt(amount)) {
      const maxApproval = web3.utils.toWei("1000000000000", "ether"); // Approve 1 trillion CHC
      await tokenContract.methods.approve(STAKING_ADDRESS, maxApproval).send({ from: account });
      console.log("✅ Approved max allowance.");
    } else {
      console.log("✅ Already approved.");
    }

    await stakingContract.methods.stake(amount, tier).send({ from: account });
    alert("✅ Stake successful!");
    loadStakedBalance();
    loadWalletBalance();
  } catch (err) {
    console.error("❌ Stake error:", err);
    alert("❌ Transaction failed: " + (err.message || err));
  }
}

// Show Stake Status
async function loadStakedBalance() {
  try {
    const stakes = await stakingContract.methods.getStakeInfo(account).call();
    if (!stakes || stakes.length === 0) {
      document.getElementById("stakeStatus").innerText = "You haven’t staked yet.";
      return;
    }

    const active = stakes.find((s) => s.withdrawn === false);
    if (!active) {
      document.getElementById("stakeStatus").innerText = "You haven’t staked yet.";
      return;
    }

    const amount = web3.utils.fromWei(active.amount, "ether");
    const tierValue = Number(active.tier);
    const tierLabel = tierValue === 0 ? "Chill Stake" : "Deep Chill";
    const durationDays = tierValue === 0 ? 14 : 30;
    const unlockTimestamp = parseInt(active.startTime) + durationDays * 86400;
    const unlockDate = new Date(unlockTimestamp * 1000).toLocaleDateString();

    document.getElementById("stakeStatus").innerText =
      `🧊 You staked ${amount} CHC in ${tierLabel} — unlocks on ${unlockDate}`;
  } catch (error) {
    console.error("Stake info error:", error);
    document.getElementById("stakeStatus").innerText = "Error reading stake info.";
  }
}

// Attach buttons
document.getElementById("connectButton").onclick = connectWallet;
document.getElementById("stakeButton").onclick = stakeTokens;
