let web3;
let account;
let stakingContract;
let tokenContract;

const CHC_ADDRESS = "0xc50e66bca472da61d0184121e491609b774e2c37"; // CHC token
const STAKING_ADDRESS = "0xa5E6F40Bd1D16d21Aeb5e89AEE50f307fc4eA0b3"; // Staking contract

const STAKING_ABI = [/* paste your latest ABI here */];
const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function"
  }
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
    network: "binance",
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
  loadStakedStatus();
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

  await tokenContract.methods.approve(STAKING_ADDRESS, amount).send({ from: account });
  await stakingContract.methods.stake(amount, tier).send({ from: account });

  loadWalletBalance();
  loadStakedStatus();
}

async function loadStakedStatus() {
  try {
    const stakes = await stakingContract.methods.getStakeInfo(account).call();

    if (stakes.length === 0) {
      document.getElementById("stakeStatus").innerText = "You haven’t staked yet.";
      return;
    }

    const latest = stakes[stakes.length - 1];
    const amount = web3.utils.fromWei(latest.amount, "ether");
    const tier = latest.tier === "0" ? "Chill Stake" : "Deep Chill";
    const start = new Date(latest.startTime * 1000).toLocaleDateString();
    const lockDays = latest.tier === "0" ? 14 : 30;
    const unlock = new Date((latest.startTime + lockDays * 86400) * 1000).toLocaleDateString();

    if (parseFloat(amount) > 0 && !latest.withdrawn) {
      document.getElementById("stakeStatus").innerText =
        `🧊 You have staked ${amount} CHC in ${tier} on ${start} (unlocks on ${unlock})`;
    } else {
      document.getElementById("stakeStatus").innerText = "You haven’t staked yet.";
    }
  } catch (err) {
    console.error("Stake status error:", err);
    document.getElementById("stakeStatus").innerText = "Error reading stake info.";
  }
}

// Assign buttons
document.getElementById("connectButton").onclick = connectWallet;
document.getElementById("stakeButton").onclick = stakeTokens;
