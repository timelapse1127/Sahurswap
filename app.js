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
    showToast("Please install MetaMask or compatible wallet");
    return;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  sahurToken = new ethers.Contract(sahurTokenAddress, sahurABI, signer);
  dexContract = new ethers.Contract(dexContractAddress, dexABI, signer);
  updatePoolInfo();
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(pageId + 'Page').classList.remove('hidden');
}

async function addLiquidity() {
  const sahurAmount = document.getElementById("sahurAmount").value;
  const monAmount = document.getElementById("monAmount").value;
  if (!sahurAmount || !monAmount) {
    showToast("Please enter both SAHUR and MON amounts");
    return;
  }

  const sahurParsed = ethers.utils.parseEther(sahurAmount);
  const monParsed = ethers.utils.parseEther(monAmount);

  try {
    showToast("⏳ Approving token...");
    const approveTx = await sahurToken.approve(dexContractAddress, sahurParsed);
    await approveTx.wait();

    showToast("⏳ Adding liquidity...");
    const tx = await dexContract.addLiquidity(sahurParsed, { value: monParsed });
    await tx.wait();

    showToast("✅ Liquidity added!");
    document.getElementById("sahurAmount").value = "";
    document.getElementById("monAmount").value = "";
    updatePoolInfo();
  } catch (err) {
    console.error(err);
    showToast("❌ Transaction failed or rejected");
  }
}

async function swapMonForSahur() {
  const amount = document.getElementById("swapMonAmount").value;
  if (!amount || isNaN(amount)) {
    showToast("❌ Enter a valid MON amount");
    return;
  }
  const parsed = ethers.utils.parseEther(amount);

  try {
    showToast("⏳ Waiting for transaction...");
    const tx = await dexContract.swapMONForSAHUR({ value: parsed });
    await tx.wait();

    showToast("✅ Swap successful!");
    document.getElementById("swapMonAmount").value = "";
    updatePoolInfo();
  } catch (err) {
    console.error(err);
    showToast("❌ Transaction failed or rejected");
  }
}

async function swapSahurForMon() {
  const amount = document.getElementById("swapSahurAmount").value;
  if (!amount || isNaN(amount)) {
    showToast("❌ Enter a valid SAHUR amount");
    return;
  }
  const parsed = ethers.utils.parseEther(amount);

  try {
    showToast("⏳ Approving token...");
    const approveTx = await sahurToken.approve(dexContractAddress, parsed);
    await approveTx.wait();

    showToast("⏳ Swapping...");
    const tx = await dexContract.swapSAHURForMON(parsed);
    await tx.wait();

    showToast("✅ Swap successful!");
    document.getElementById("swapSahurAmount").value = "";
    updatePoolInfo();
  } catch (err) {
    console.error(err);
    showToast("❌ Transaction failed or rejected");
  }
}

async function updatePoolInfo() {
  try {
    const [mon, sahur] = await dexContract.getReserves();
    const monFormatted = ethers.utils.formatEther(mon);
    const sahurFormatted = ethers.utils.formatEther(sahur);
    document.getElementById("poolInfo").innerText =
      `Pool: ${monFormatted} MON / ${sahurFormatted} SAHUR`;
  } catch (err) {
    console.error(err);
    document.getElementById("poolInfo").innerText = "Error loading pool info";
  }
}

async function updateEstimate() {
  const input = document.getElementById("swapMonAmount").value;
  const estBox = document.getElementById("swapEstimate");
  if (!input || isNaN(input)) {
    estBox.innerText = "≈ 0 SAHUR";
    return;
  }

  try {
    const monInput = ethers.utils.parseEther(input);
    const [monRes, sahurRes] = await dexContract.getReserves();

    if (monRes.eq(0) || sahurRes.eq(0)) {
      estBox.innerText = "Pool kosong";
      return;
    }

    const estimatedSahur = monInput.mul(sahurRes).div(monRes);
    estBox.innerText = "≈ " + ethers.utils.formatEther(estimatedSahur) + " SAHUR";
  } catch (err) {
    console.error(err);
    estBox.innerText = "≈ 0 SAHUR";
  }
}

connect();
