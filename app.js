let web3;
let account;
let stakingContract;
const CHC_ADDRESS = "0xc50e66bca472da61d0184121e491609b774e2c37";
const STAKING_ADDRESS = "0xa5E6F40Bd1D16d21Aeb5e89AEE50f307fc4eA0b3";

const ABI = [
  {
    "inputs":[{"internalType":"address","name":"_chcToken","type":"address"}],
    "stateMutability":"nonpayable",
    "type":"constructor"
  },
  {
    "inputs":[{"internalType":"uint256","name":"amount"},{"internalType":"uint8","name":"tier"}],
    "name":"stake",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  }
];

async function initWeb3() {
  const providerOptions = {
    walletconnect: {
      package: window.WalletConnectProvider.default,
      options: {
        rpc: { 56: "https://bsc-dataseed.binance.org/" },
        chainId: 56
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

  stakingContract = new web3.eth.Contract(ABI, STAKING_ADDRESS);

  document.getElementById("connectButton").innerText = "Connected";
}

async function stakeCHC() {
  const amount = document.getElementById("amount").value;
  const tier = document.getElementById("tierSelect").value;
  const token = new web3.eth.Contract([
    {
      "constant": false,
      "inputs": [
        {"name":"_spender","type":"address"},
        {"name":"_value","type":"uint256"}
      ],
      "name": "approve",
      "outputs": [{"name":"","type":"bool"}],
      "type": "function"
    }
  ], CHC_ADDRESS);

  const amountWei = web3.utils.toWei(amount, 'ether');

  await token.methods.approve(STAKING_ADDRESS, amountWei).send({ from: account });
  await stakingContract.methods.stake(amountWei, tier).send({ from: account });
}

document.getElementById("connectButton").addEventListener("click", initWeb3);
document.getElementById("stakeButton").addEventListener("click", stakeCHC);
