import Web3Modal from "https://cdn.jsdelivr.net/npm/web3modal@1.9.12/dist/index.js";
import WalletConnectProvider from "https://cdn.jsdelivr.net/npm/@walletconnect/web3-provider@1.7.8/dist/umd/index.min.js";

const BSC_CHAIN_ID = "0x38"; // 56 in hex
const CHC_TOKEN_ADDRESS = "0xc50e66bca472da61d0184121e491609b774e2c37";
const STAKING_CONTRACT_ADDRESS = "0xa5E6F40Bd1D16d21Aeb5e89AEE50f307fc4eA0b3";
const MAX_UINT = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

const STAKING_ABI = [/* your full staking ABI here */];
const CHC_ABI = [
  {
    "constant": false,
    "inputs": [
      { "name": "_spender", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
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

let web3Modal;
let provider;
let web3;
let selectedAccount;
let stakingContract;
let chcToken;

async function init() {
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: {
          56: "https://bsc-dataseed.binance.org/"
        },
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
  document.getElementById("stakeButton").addEventListener("click", stakeTokens);
}

async function connectWallet() {
  try {
    provider = await web3Modal.connect();
    web3 = new Web3(provider);

    const chainId = await web3.eth.getChainId();
    if (chainId !== 56) {
      alert("Please connect to BNB Smart Chain (Chain ID 56)");
      return;
    }

    const accounts = await web3.eth.getAccounts();
    selectedAccount = accounts[0];
    document.getElementById("walletAddress").innerText = selectedAccount;

    stakingContract = new web3.eth.Contract(STAKING_ABI, STAKING_CONTRACT_ADDRESS);
    chcToken = new web3.eth.Contract(CHC_ABI, CHC_TOKEN_ADDRESS);

    updateBalance();
  } catch (err) {
    console.error("Wallet connection failed", err);
  }
}

async function updateBalance() {
  const balance = await chcToken.methods.balanceOf(selectedAccount).call();
  const formatted = web3.utils.fromWei(balance, "ether");
  document.getElementById("chcBalance").innerText = parseFloat(formatted).toLocaleString() + " CHC";
}

async function stakeTokens() {
  const amountInput = document.getElementById("amount").value;
  const stakeTier = document.querySelector('input[name="tier"]:checked').value;
  const amount = web3.utils.toWei(amountInput, "ether");

  try {
    const allowance = await chcToken.methods.allowance(selectedAccount, STAKING_CONTRACT_ADDRESS).call();
    if (web3.utils.toBN(allowance).lt(web3.utils.toBN(amount))) {
      await chcToken.methods.approve(STAKING_CONTRACT_ADDRESS, MAX_UINT).send({ from: selectedAccount });
    }

    await stakingContract.methods.stake(amount, stakeTier).send({ from: selectedAccount });
    alert("Staked successfully!");
    updateBalance();
  } catch (error) {
    console.error("Staking failed:", error);
    alert("Transaction failed or rejected.");
  }
}

window.addEventListener("load", init);
