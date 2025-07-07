let web3;
let account;
let stakingContract;
let tokenContract;

const CHC_ADDRESS = "0xc50e66bca472da61d0184121e491609b774e2c37";
const STAKING_ADDRESS = "0xa5E6F40Bd1D16d21Aeb5e89AEE50f307fc4eA0b3";

// Replace this with your full verified ABI from BscScan
const STAKING_ABI = [ /* ✅ Your verified ABI goes here */ ];

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
];

async function connectWallet() {
  const providerOptions = {
    walletconnect: {
      package: window.WalletConnectProvider.default,
      options: {
        rpc: {
          56: "https://bsc-dataseed.binance.org/"
        }
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

async function loadWalletBalance() {
  const balance = await tokenContract.methods.balanceOf(account).call();
  const formatted = web3.utils.fromWei(balance, "ether");
  document.getElementById("walletBalance").innerText = `💰 Wallet Balance: ${formatted} CHC`;
}

async function stakeTokens() {
  const amountInput = document.getElementById("amount").value;
  const tier = document.getElementById("tierSelect").value;
  const amount = web3.utils.toWei(amountInput, "ether");

  try {
    await tokenContract.methods
      .approve(STAKING_ADDRESS, amount)
      .send({ from: account });

    await stakingContract.methods
      .stake(amount, tier)
      .send({ from: account });

    loadStakedBalance();
    loadWalletBalance();
  } catch (err) {
    alert("Transaction failed: " + err.message);
  }
}

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
      `🧊 You have staked ${amount} CHC in ${tierLabel} (unlocks on ${unlockDate})`;

  } catch (error) {
    console.error("Stake read error:", error);
    document.getElementById("stakeStatus").innerText = "Error reading stake info.";
  }
}

// Button bindings
document.getElementById("connectButton").onclick = connectWallet;
document.getElementById("stakeButton").onclick = stakeTokens;
