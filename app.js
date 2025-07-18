const tokenAddress = "0xc50e66bca472da61d0184121e491609b774e2c37"; // CHC Token
const stakingAddress = "0xa5E6F40Bd1D16d21Aeb5e89AEE50f307fc4eA0b3"; // Staking contract

const stakingABI = [
  {
    "inputs": [{"internalType": "address", "name": "_chcToken", "type": "address"}],
    "stateMutability": "nonpayable", "type": "constructor"
  },
  {
    "inputs": [], "name": "MAX_STAKE", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getStakeInfo",
    "outputs": [{
      "components": [
        {"internalType": "uint256", "name": "amount", "type": "uint256"},
        {"internalType": "uint256", "name": "startTime", "type": "uint256"},
        {"internalType": "enum CHCStaking.Tier", "name": "tier", "type": "uint8"},
        {"internalType": "bool", "name": "withdrawn", "type": "bool"}
      ],
      "internalType": "struct CHCStaking.Stake[]", "name": ""
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "enum CHCStaking.Tier", "name": "tier", "type": "uint8"}
    ],
    "name": "stake",
    "outputs": [], "stateMutability": "nonpayable", "type": "function"
  }
];

const tokenABI = [
  {
    "constant": true,
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  }
];

let web3, provider, selectedAccount;

async function init() {
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

  provider = await web3Modal.connect();
  web3 = new Web3(provider);

  const accounts = await web3.eth.getAccounts();
  selectedAccount = accounts[0];
  document.getElementById("walletAddress").textContent = selectedAccount;

  await loadBalance();
}

async function loadBalance() {
  const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
  const balance = await tokenContract.methods.balanceOf(selectedAccount).call();
  document.getElementById("chcBalance").textContent = web3.utils.fromWei(balance);
}

async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  const tier = parseInt(document.querySelector('input[name="tier"]:checked').value);
  const stakeAmountWei = web3.utils.toWei(amount, 'ether');

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  const token = new web3.eth.Contract(tokenABI, tokenAddress);
  const staking = new web3.eth.Contract(stakingABI, stakingAddress);

  try {
    document.getElementById("status").textContent = "Approving CHC...";
    await token.methods.approve(stakingAddress, stakeAmountWei).send({
      from: selectedAccount,
      gas: 100000 // safe for approve
    });

    document.getElementById("status").textContent = "Staking CHC...";
    document.getElementById("stakeBtn").innerText = "Staking...";

    await staking.methods.stake(stakeAmountWei, tier).send({
      from: selectedAccount,
      gas: 250000 // cap gas to avoid $48
    })
    .on("transactionHash", function(hash) {
      console.log("Tx hash:", hash);
    })
    .on("receipt", function(receipt) {
      console.log("✅ Stake confirmed:", receipt);
      alert("✅ Stake successful!");
      window.location.reload();
    })
    .on("error", function(error) {
      console.error("❌ Staking failed:", error);
      alert("❌ Staking failed: " + (error.message || error));
      document.getElementById("stakeBtn").innerText = "Stake";
      document.getElementById("status").textContent = "";
    });

  } catch (err) {
    console.error("❌ Error in transaction:", err);
    alert("Error: " + err.message);
    document.getElementById("stakeBtn").innerText = "Stake";
    document.getElementById("status").textContent = "";
  }
}

document.getElementById("connectWallet").addEventListener("click", init);
document.getElementById("stakeBtn").addEventListener("click", stakeTokens);
