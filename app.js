const contractAddress = "0x0AeAA6CfFE2fb212FDa0cCA730C915dD450DBb46";
const abi = [
  "function swapMONForSAHUR() payable",
  "function getReserves() view returns (uint256, uint256)"
];

let provider, signer, contract;

async function connectWallet() {
  if (!window.ethereum) return alert("Install a Web3 wallet (MetaMask, Bitget, OKX)");

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  contract = new ethers.Contract(contractAddress, abi, signer);

  const address = await signer.getAddress();
  document.getElementById("wallet-address").innerText = "Connected: " + address;
}

async function swap() {
  const amount = document.getElementById("swapAmount").value;
  if (!amount) return alert("Enter amount");

  try {
    const tx = await contract.swapMONForSAHUR({ value: ethers.utils.parseEther(amount) });
    await tx.wait();
    alert("Swap successful!");
  } catch (err) {
    console.error(err);
    alert("Swap failed");
  }
}