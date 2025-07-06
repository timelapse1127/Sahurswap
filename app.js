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

document.getElementById("menuToggle").onclick = () => {
  const menu = document.getElementById("menu");
  menu.classList.toggle("hidden");
};

document.getElementById("connectWalletBtn").onclick = async () => {
  await connect();
};

async function connect() {
  if (!window.ethereum) {
    showToast("Please install MetaMask");
    return;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  sahurToken = new ethers.Contract(sahurTokenAddress, sahurABI, signer);
  dexContract = new ethers.Contract(dexContractAddress, dexABI, signer);

  const address = await signer.getAddress();
  document.getElementById("connectWalletBtn").innerText = address.slice(0, 6) + "..." + address.slice(-4);
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
    showToast("Enter both SAHUR and MON amounts");
    return;
  }

  const sahurParsed = ethers.utils.parseEther(sahurAmount);
  const monParsed = ethers.utils.parseEther(monAmount);

  try {
    setButtonLoading("liquidityBtn", true);
    await sahurToken.approve(dexContractAddress, sahurParsed);
    const tx = await dexContract.addLiquidity(sahurParsed, { value: monParsed });
    await tx.wait();
    showToast("✅ Liquidity added!");
    updatePoolInfo();
  } catch (err) {
    showToast("❌ Tx failed");
  } finally {
    setButtonLoading("liquidityBtn", false);
  }
}

async function swapMonForSahur() {
  const amount = document.getElementById("swapMonAmount").value;
  if (!amount || isNaN(amount)) {
    showToast("Enter a valid MON amount");
    return;
  }

  try {
    setButtonLoading("swapBtn", true);
    const parsed = ethers.utils.parseEther(amount);
    const tx = await dexContract.swapMONForSAHUR({ value: parsed });
    await tx.wait();
    showToast("✅ Swap successful!");
    updatePoolInfo();
  } catch (err) {
    showToast("❌ Tx failed");
  } finally {
    setButtonLoading("swapBtn", false);
  }
}

async function swapSahurForMon() {
  const amount = document.getElementById("swapSahurAmount").value;
  if (!amount || isNaN(amount)) {
    showToast("Enter a valid SAHUR amount");
    return;
  }

  try {
    setButtonLoading("reverseSwapBtn", true);
    const parsed = ethers.utils.parseEther(amount);
    await sahurToken.approve(dexContractAddress, parsed);
    const tx = await dexContract.swapSAHURForMON(parsed);
    await tx.wait();
    showToast("✅ Swap successful!");
    updatePoolInfo();
  } catch (err) {
    showToast("❌ Tx failed");
  } finally {
    setButtonLoading("reverseSwapBtn", false);
  }
}

async function updatePoolInfo() {
  try {
    const [mon, sahur] = await dexContract.getReserves();
    const monFormatted = ethers.utils.formatEther(mon);
    const sahurFormatted = ethers.utils.formatEther(sahur);
    document.getElementById("poolInfo").innerText = `Pool: ${monFormatted} MON / ${sahurFormatted} SAHUR`;

    const p1 = document.getElementById("priceInfo1");
    const p2 = document.getElementById("priceInfo2");

    const one = ethers.utils.parseEther("1");
    const rate1 = sahur.mul(one).div(mon);
    const rate2 = mon.mul(one).div(sahur);

    p1.innerText = `1 MON ≈ ${ethers.utils.formatEther(rate1)} SAHUR`;
    p2.innerText = `1 SAHUR ≈ ${ethers.utils.formatEther(rate2)} MON`;
  } catch (err) {
    console.error(err);
  }
}

async function updateEstimate() {
  const input = document.getElementById("swapMonAmount").value;
  const estBox = document.getElementById("swapEstimate");
  if (!input || isNaN(input)) {
    estBox.value = "≈ 0 SAHUR";
    return;
  }

  try {
    const monInput = ethers.utils.parseEther(input);
    const [monRes, sahurRes] = await dexContract.getReserves();
    const estimatedSahur = monInput.mul(sahurRes).div(monRes);
    estBox.value = "≈ " + ethers.utils.formatEther(estimatedSahur) + " SAHUR";
  } catch {
    estBox.value = "≈ 0 SAHUR";
  }
}

async function updateReverseEstimate() {
  const input = document.getElementById("swapSahurAmount").value;
  const estBox = document.getElementById("reverseEstimate");
  if (!input || isNaN(input)) {
    estBox.value = "≈ 0 MON";
    return;
  }

  try {
    const sahurInput = ethers.utils.parseEther(input);
    const [monRes, sahurRes] = await dexContract.getReserves();
    const estimatedMon = sahurInput.mul(monRes).div(sahurRes);
    estBox.value = "≈ " + ethers.utils.formatEther(estimatedMon) + " MON";
  } catch {
    estBox.value = "≈ 0 MON";
  }
}

function setButtonLoading(id, isLoading) {
  const btn = document.getElementById(id);
  btn.disabled = isLoading;
  btn.innerText = isLoading ? "Processing..." : btn.dataset.label || btn.innerText;
}

connect();
