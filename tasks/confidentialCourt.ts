import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { ethers as ethersUtils } from "ethers";

const CONTRACT_NAME = "ConfidentialCourt";

function getPaddedMessage(message: string): string {
  if (!message.length) {
    throw new Error("Message cannot be empty");
  }
  if (message.length > 31) {
    throw new Error("Message must be at most 31 characters to fit into bytes32");
  }
  return ethersUtils.encodeBytes32String(message);
}

task("task:court-address", "Prints the ConfidentialCourt contract address").setAction(
  async function (_taskArguments: TaskArguments, hre) {
    const { deployments } = hre;

    const deployment = await deployments.get(CONTRACT_NAME);
    console.log(`${CONTRACT_NAME} address is ${deployment.address}`);
  },
);

task("task:create-trial", "Creates a new trial session")
  .addParam("partya", "Address of the first party")
  .addParam("partyb", "Address of the second party")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers } = hre;
    const deployment = await deployments.get(CONTRACT_NAME);
    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);
    const signers = await ethers.getSigners();

    const trialId = await contract
      .connect(signers[0])
      .callStatic.createTrial(taskArguments.partya, taskArguments.partyb);

    const tx = await contract
      .connect(signers[0])
      .createTrial(taskArguments.partya, taskArguments.partyb);

    console.log(`Creating trial... tx:${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Transaction status: ${receipt?.status}`);
    console.log(`New trial id: ${trialId.toString()}`);
  });

task("task:list-trials", "Lists trial ids for an address")
  .addOptionalParam("account", "Address to inspect. Defaults to first signer address.")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers } = hre;
    const deployment = await deployments.get(CONTRACT_NAME);
    const contract = await hre.ethers.getContractAt(CONTRACT_NAME, deployment.address);
    const signers = await ethers.getSigners();

    const account = taskArguments.account ?? signers[0].address;
    const trials = await contract.getTrialsForAddress(account);
    console.log(`Trials for ${account}: ${trials.map((id: bigint) => id.toString()).join(", ") || "<none>"}`);
  });

task("task:send-message", "Posts an encrypted message to a trial")
  .addParam("trial", "Trial id")
  .addParam("message", "Message text (max 31 chars)")
  .addParam("ephemeral", "Ephemeral EVM address used for encryption")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const deployment = await deployments.get(CONTRACT_NAME);
    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);
    const signers = await ethers.getSigners();

    const paddedMessage = getPaddedMessage(taskArguments.message);
    const messageBigInt = BigInt(paddedMessage);
    const ephemeralAddress = ethers.getAddress(taskArguments.ephemeral);

    const encryptedInput = await fhevm
      .createEncryptedInput(deployment.address, signers[0].address)
      .add256(messageBigInt)
      .addAddress(ephemeralAddress)
      .encrypt();

    const tx = await contract
      .connect(signers[0])
      .sendMessage(
        BigInt(taskArguments.trial),
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.inputProof,
      );

    console.log(`Posting message... tx:${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Transaction status: ${receipt?.status}`);
  });

task("task:decrypt-message", "Decrypts a message for the first signer")
  .addParam("trial", "Trial id")
  .addParam("index", "Message index")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const deployment = await deployments.get(CONTRACT_NAME);
    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);
    const signers = await ethers.getSigners();

    const message = await contract.getMessage(BigInt(taskArguments.trial), BigInt(taskArguments.index));

    const clearMessage = await fhevm.userDecryptEuint(
      FhevmType.euint256,
      message.encryptedContent,
      deployment.address,
      signers[0],
    );

    const clearAddress = await fhevm.userDecryptEaddress(
      message.encryptedAuthorAddress,
      deployment.address,
      signers[0],
    );

    const messageHex = ethers.zeroPadValue(ethers.toBeHex(clearMessage), 32);
    const decoded = ethers.decodeBytes32String(messageHex);

    console.log(`Message from ${message.sender} at ${message.timestamp}: ${decoded}`);
    console.log(`Ephemeral address: ${clearAddress}`);
  });
