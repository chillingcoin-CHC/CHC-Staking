import Web3Modal from "https://cdn.jsdelivr.net/npm/web3modal@1.9.12/dist/index.js";
import WalletConnectProvider from "https://cdn.jsdelivr.net/npm/@walletconnect/web3-provider@1.8.0/dist/umd/index.min.js";

const BSC_CHAIN_ID = "0x38";
const CHC_TOKEN = "0xc50e66bca472da61d0184121e491609b774e2c37";
const STAKING_CONTRACT = "0xa5E6F40Bd1D16d21Aeb5e89AEE50f307fc4eA0b3";
const MAX_UINT = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

const STAKING_ABI = [
  {
    "inputs": [{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint8","name":"tier","type":"uint8"}],
    "name":"stake",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  },
  {
    "inputs":[{"internalType":"address","name":"user","type":"address"}],
    "name":"getStakeInfo",
    "outputs":[
      {"internalType":"uint256","name":"amount","type":"uint256"},
      {"internalType":"uint256","name":"startTime","type":"uint256"},
      {"internalType":"uint256","name":"duration","type":"uint256"}
    ],
    "stateMutability":"view",
    "type":"function"
  }
];

const CHC_ABI = [
  {
    "constant": false,
    "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" }],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{ "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  }
];

let web3Modal, provider, web3, selectedAccount, stakingContract, chcToken;

async function init() {
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: { 56: "https://bsc-dataseed.binance.org/" },
        chainId: 56
      }
    }
  };

  web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions
  });

  if (web3Modal.cachedProvider) {
    await connectWallet();
  }

  document.getElementById("connectWallet").addEventListener("click", connectWallet);
  document.getElementById("stakeBtn").addEventListener("click", stakeTokens);
}

async function connectWallet() {
  try {
    provider = await web3Modal.connect();
    web3 = new Web3(provider);

    const chainId = await web3.eth.getChainId();
    if (chainId !== 56) {
      alert("Please switch to BNB Smart Chain");
      return;
    }

    const accounts = await web3.eth.getAccounts();
    selectedAccount = accounts[0];
    document.getElementById("walletAddress").innerText = selectedAccount;

    stakingContract = new web3.eth.Contract(STAKING_ABI, STAKING_CONTRACT);
    chcToken = new web3.eth.Contract(CHC_ABI, CHC_TOKEN);

    updateBalance();
  } catch (err) {
    console.error("Wallet connection error:", err);
    alert("Wallet connection failed.");
  }
}

async function updateBalance() {
  try {
    const balance = await chcToken.methods.balanceOf(selectedAccount).call();
    const formatted = web3.utils.fromWei(balance, "ether");
    document.getElementById("chcBalance").innerText = parseFloat(formatted).toLocaleString() + " CHC";
  } catch (e) {
    console.error("Balance fetch error:", e);
  }
}

async function stakeTokens() {
  const amountInput = document.getElementById("stakeAmount").value;
  const stakeTier = document.querySelector('input[name="tier"]:checked').value;

  if (!amountInput || amountInput <= 0) {
    alert("Enter a valid amount.");
    return;
  }

  const amount = web3.utils.toWei(amountInput, "ether");

  try {
    const allowance = await chcToken.methods.allowance(selectedAccount, STAKING_CONTRACT).call();
    if (web3.utils.toBN(allowance).lt(web3.utils.toBN(amount))) {
      document.getElementById("status").innerText = "Approving CHC token...";
      await chcToken.methods.approve(STAKING_CONTRACT, MAX_UINT).send({ from: selectedAccount });
    }

    document.getElementById("status").innerText = "Staking in progress...";
    await stakingContract.methods.stake(amount, stakeTier).send({ from: selectedAccount });

    document.getElementById("status").innerText = "Stake successful!";
    updateBalance();
  } catch (err) {
    console.error("Stake error:", err);
    document.getElementById("status").innerText = "Staking failed or cancelled.";
  }
}

window.addEventListener("load", init);
