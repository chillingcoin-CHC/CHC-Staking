
let web3;
let contract;
const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
const abi = [ /* Insert ABI here */ ];

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
