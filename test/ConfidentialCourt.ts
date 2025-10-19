import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { ConfidentialCourt, ConfidentialCourt__factory } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  judge: HardhatEthersSigner;
  partyA: HardhatEthersSigner;
  partyB: HardhatEthersSigner;
  outsider: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("ConfidentialCourt")) as ConfidentialCourt__factory;
  const contract = (await factory.deploy()) as ConfidentialCourt;
  const address = await contract.getAddress();

  return { contract, address };
}

describe("ConfidentialCourt", function () {
  let signers: Signers;
  let contract: ConfidentialCourt;
  let contractAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = {
      judge: ethSigners[0],
      partyA: ethSigners[1],
      partyB: ethSigners[2],
      outsider: ethSigners[3],
    };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This hardhat test suite cannot run on Sepolia Testnet");
      this.skip();
    }

    ({ contract, address: contractAddress } = await deployFixture());
  });

  async function encryptMessage(author: HardhatEthersSigner, message: string, ephemeralAddress: string) {
    const paddedMessage = ethers.encodeBytes32String(message);
    const messageBigInt = BigInt(paddedMessage);

    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, author.address)
      .add256(messageBigInt)
      .addAddress(ephemeralAddress)
      .encrypt();

    return encryptedInput;
  }

  it("creates trials and indexes participants", async function () {
    const tx = await contract.connect(signers.judge).createTrial(signers.partyA.address, signers.partyB.address);
    const receipt = await tx.wait();
    expect(receipt?.status).to.eq(1);

    const trialsForJudge = await contract.getTrialsForAddress(signers.judge.address);
    expect(trialsForJudge).to.deep.eq([1n]);

    const trialsForPartyA = await contract.getTrialsForAddress(signers.partyA.address);
    expect(trialsForPartyA).to.deep.eq([1n]);

    const trialInfo = await contract.getTrial(1);
    expect(trialInfo.judge).to.eq(signers.judge.address);
    expect(trialInfo.partyA).to.eq(signers.partyA.address);
    expect(trialInfo.partyB).to.eq(signers.partyB.address);
    expect(trialInfo.isActive).to.eq(true);
    expect(trialInfo.messageCount).to.eq(0n);
  });

  it("allows participants to post encrypted messages", async function () {
    await contract.connect(signers.judge).createTrial(signers.partyA.address, signers.partyB.address);

    const ephemeralAddress = ethers.Wallet.createRandom().address;
    const encryptedInput = await encryptMessage(signers.partyA, "Test message", ephemeralAddress);

    await contract
      .connect(signers.partyA)
      .sendMessage(1, encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.inputProof);

    const trialInfo = await contract.getTrial(1);
    expect(trialInfo.messageCount).to.eq(1n);

    const message = await contract.getMessage(1, 0n);
    expect(message.sender).to.eq(signers.partyA.address);

    const decryptedForJudge = await fhevm.userDecryptEuint(
      FhevmType.euint256,
      message.encryptedContent,
      contractAddress,
      signers.judge,
    );

    const decryptedHex = ethers.hexlify(ethers.zeroPadValue(ethers.toBeHex(decryptedForJudge), 32));
    const decodedMessage = ethers.decodeBytes32String(decryptedHex);
    expect(decodedMessage).to.eq("Test message");

    const decryptedAddress = await fhevm.userDecryptEaddress(
      message.encryptedAuthorAddress,
      contractAddress,
      signers.partyB,
    );

    const recoveredAddress = ethers.getAddress(decryptedAddress);
    expect(recoveredAddress).to.eq(ephemeralAddress);
  });

  it("prevents non-participants from sending messages", async function () {
    await contract.connect(signers.judge).createTrial(signers.partyA.address, signers.partyB.address);

    const encryptedInput = await encryptMessage(signers.partyA, "Unauthorized", signers.partyA.address);

    await expect(
      contract
        .connect(signers.outsider)
        .sendMessage(1, encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.inputProof),
    ).to.be.revertedWithCustomError(contract, "SenderNotParticipant");
  });

  it("prevents messaging after trial closure", async function () {
    await contract.connect(signers.judge).createTrial(signers.partyA.address, signers.partyB.address);

    await contract.connect(signers.judge).closeTrial(1);

    const encryptedInput = await encryptMessage(signers.partyA, "Closed", signers.partyA.address);

    await expect(
      contract
        .connect(signers.partyA)
        .sendMessage(1, encryptedInput.handles[0], encryptedInput.handles[1], encryptedInput.inputProof),
    ).to.be.revertedWithCustomError(contract, "TrialAlreadyClosed");
  });

  it("only allows judge to close trial", async function () {
    await contract.connect(signers.judge).createTrial(signers.partyA.address, signers.partyB.address);

    await expect(contract.connect(signers.partyA).closeTrial(1)).to.be.revertedWithCustomError(contract, "NotJudge");

    await contract.connect(signers.judge).closeTrial(1);
    const trialInfo = await contract.getTrial(1);
    expect(trialInfo.isActive).to.eq(false);
  });
});
