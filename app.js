const sahurTokenAddress = "0x3d0511092fa816a3cA4662573162444B20085002";
const dexContractAddress = "0xD4f83C443CEC9b554c6f91342C04FF844fF92050";

const sahurABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) public returns (bool)",
  "function transfer(address to, uint amount) public returns (bool)"
];

const dexABI = [
  "function addLiquidity(uint256 sahurAmount) public payable",
  "function swapMONForSAHUR() public payable",
  "function swapSAHURForMON(uint256 sahurIn) public",
  "function getReserves() public view returns (uint256, uint256)"
];

let provider, signer, sahurToken, dexContract;

async function connect() {
  if (!window.ethereum) {
    alert("Install MetaMask or compatible wallet.");
    return;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  sahurToken = new ethers.Contract(sahurTokenAddress, sahurABI, signer);
  dexContract = new ethers.Contract(dexContractAddress, dexABI, signer);

  updatePoolInfo();
}

async function addLiquidity() {
  const sahurAmount = document.getElementById("sahurAmount").value;
  const monAmount = document.getElementById("monAmount").value;

  const sahurParsed = ethers.utils.parseEther(sahurAmount);
  const monParsed = ethers.utils.parseEther(monAmount);

  const approveTx = await sahurToken.approve(dexContractAddress, sahurParsed);
  await approveTx.wait();

  const tx = await dexContract.addLiquidity(sahurParsed, { value: monParsed });
  await tx.wait();

  alert("Liquidity added!");
  updatePoolInfo();
}

async function swapMonForSahur() {
  const amount = document.getElementById("swapMonAmount").value;
  const parsed = ethers.utils.parseEther(amount);
  const tx = await dexContract.swapMONForSAHUR({ value: parsed });
  await tx.wait();
  alert("Swap success!");
  updatePoolInfo();
}

async function swapSahurForMon() {
  const amount = document.getElementById("swapSahurAmount").value;
  const parsed = ethers.utils.parseEther(amount);

  const approveTx = await sahurToken.approve(dexContractAddress, parsed);
  await approveTx.wait();

  const tx = await dexContract.swapSAHURForMON(parsed);
  await tx.wait();
  alert("Swap success!");
  updatePoolInfo();
}

async function updatePoolInfo() {
  const [mon, sahur] = await dexContract.getReserves();
  const monFormatted = ethers.utils.formatEther(mon);
  const sahurFormatted = ethers.utils.formatEther(sahur);
  document.getElementById("poolInfo").innerText =
    `Pool: ${monFormatted} MON / ${sahurFormatted} SAHUR`;
}

connect();