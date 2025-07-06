let web3;
let contract;
const contractAddress = "0xc50e66bca472da61d0184121e491609b774e2c37";
const abi = [
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
    "inputs": [],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "stakes",
    "outputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "startTime", "type": "uint256" },
      { "internalType": "uint8", "name": "tier", "type": "uint8" },
      { "internalType": "bool", "name": "claimed", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function connectWallet() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await window.ethereum.enable();
    contract = new web3.eth.Contract(abi, contractAddress);
    document.getElementById("status").innerText = "Wallet connected.";
  } else {
    alert("Please install MetaMask.");
  }
}

async function stakeChill() {
  const accounts = await web3.eth.getAccounts();
  const amount = web3.utils.toWei(document.getElementById("amount").value, "ether");
  await contract.methods.stake(amount, 0).send({ from: accounts[0] });
  document.getElementById("status").innerText = "Staked in Chill (14d)!";
}

async function stakeDeep() {
  const accounts = await web3.eth.getAccounts();
  const amount = web3.utils.toWei(document.getElementById("amount").value, "ether");
  await contract.methods.stake(amount, 1).send({ from: accounts[0] });
  document.getElementById("status").innerText = "Staked in Deep Chill (30d)!";
}

async function claim() {
  const accounts = await web3.eth.getAccounts();
  await contract.methods.claim().send({ from: accounts[0] });
  document.getElementById("status").innerText = "Claimed!";
}
