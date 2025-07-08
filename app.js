import Web3Modal from "https://cdn.jsdelivr.net/npm/web3modal@1.9.12/dist/index.js";
import WalletConnectProvider from "https://cdn.jsdelivr.net/npm/@walletconnect/web3-provider@1.7.8/dist/umd/index.min.js";

const CHC_ADDRESS = "0xc50e66bca472da61d0184121e491609b774e2c37";
const STAKING_ADDRESS = "0xa5E6F40Bd1D16d21Aeb5e89AEE50f307fc4eA0b3";

const CHC_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  }
];

const STAKING_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint8", "name": "tier", "type": "uint8" }
    ],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getStakeInfo",
    "outputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "startTimestamp", "type": "uint256" },
      { "internalType": "uint8", "name": "tier", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

let web3;
let account;
let chcToken;
let stakingContract;

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

const web3Modal = new Web3Modal({
  cacheProvider: false,
  providerOptions
});

document.getElementById("connectWallet").addEventListener("click", async () => {
  const provider = await web3Modal.connect();
  web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();
  account = accounts[0];
  chcToken = new web3.eth.Contract(CHC_ABI, CHC_ADDRESS);
  stakingContract = new web3.eth.Contract(STAKING_ABI, STAKING_ADDRESS);

  document.getElementById("walletAddress").innerText = `Connected: ${account}`;

  const balance = await chcToken.methods.balanceOf(account).call();
  document.getElementById("chcBalance").innerText = `Balance: ${web3.utils.fromWei(balance)} CHC`;
});

document.getElementById("approve").addEventListener("click", async () => {
  const amount = document.getElementById("amount").value;
  if (!amount || isNaN(amount)) return alert("Enter a valid amount");

  const amountInWei = web3.utils.toWei(amount);
  try {
    await chcToken.methods.approve(STAKING_ADDRESS, amountInWei).send({ from: account });
    alert("Approved successfully!");
  } catch (err) {
    console.error("Approve error:", err);
    alert("Approve failed. Check console for details.");
  }
});

document.getElementById("stake").addEventListener("click", async () => {
  const amount = document.getElementById("amount").value;
  const tier = document.querySelector('input[name="tier"]:checked')?.value;

  if (!amount || isNaN(amount)) return alert("Enter a valid amount");
  if (tier !== "0" && tier !== "1") return alert("Select a staking tier");

  const amountInWei = web3.utils.toWei(amount);
  const allowance = await chcToken.methods.allowance(account, STAKING_ADDRESS).call();

  if (BigInt(allowance) < BigInt(amountInWei)) {
    return alert("You must approve the amount before staking.");
  }

  try {
    await stakingContract.methods.stake(amountInWei, parseInt(tier)).send({
      from: account,
      gas: 300000 // optional manual gas to prevent "estimate failed"
    });
    alert("Staked successfully!");
  } catch (err) {
    console.error("Stake error:", err);
    alert("Stake failed. Check console for error.");
  }
});
