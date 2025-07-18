const stakingAddress = "0xa5E6F40Bd1D16d21Aeb5e89AEE50f307fc4eA0b3";
const tokenAddress = "0xc50e66bca472da61d0184121e491609b774e2c37";

const stakingABI = [ /* ABI goes here */ ];
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
  const web3Modal = new window.Web3Modal.default({ cacheProvider: false, providerOptions });
  provider = await web3Modal.connect();
  web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();
  selectedAccount = accounts[0];
  document.getElementById("walletAddress").textContent = selectedAccount;
  loadBalance();
}

async function loadBalance() {
  const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
  const balance = await tokenContract.methods.balanceOf(selectedAccount).call();
  document.getElementById("chcBalance").textContent = web3.utils.fromWei(balance);
}

async function stakeTokens() {
  const amount = document.getElementById("stakeAmount").value;
  const days = document.querySelector('input[name="tier"]:checked').value;
  const stakeAmountWei = web3.utils.toWei(amount, 'ether');

  const token = new web3.eth.Contract(tokenABI, tokenAddress);
  const staking = new web3.eth.Contract(stakingABI, stakingAddress);

  document.getElementById("status").textContent = "Approving CHC...";
  await token.methods.approve(stakingAddress, stakeAmountWei).send({ from: selectedAccount });

  document.getElementById("status").textContent = "Staking...";
  try {
    document.getElementById("stake-button").innerText = "Staking...";
    
    await staking.methods.stake(stakeAmountWei, days).send({ from: selectedAccount })
        .on('transactionHash', function(hash) {
            console.log("Transaction sent:", hash);
        })
        .on('receipt', function(receipt) {
            console.log("Stake successful!", receipt);
            alert("✅ Stake successful!");
            window.location.reload();
        })
        .on('error', function(error) {
            console.error("❌ Staking error:", error);
            alert("❌ Staking failed: " + (error.message || error));
            document.getElementById("stake-button").innerText = "Stake";
        });

} catch (err) {
    console.error("Unexpected staking error:", err);
    alert("Something went wrong: " + (err.message || err));
    document.getElementById("stake-button").innerText = "Stake";
}

  document.getElementById("status").textContent = "Stake successful!";
}

document.getElementById("connectWallet").addEventListener("click", init);
document.getElementById("stakeBtn").addEventListener("click", stakeTokens);
