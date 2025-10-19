import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedCourt = await deploy("ConfidentialCourt", {
    from: deployer,
    log: true,
  });

  console.log(`ConfidentialCourt contract: `, deployedCourt.address);
};
export default func;
func.id = "deploy_confidentialCourt"; // id required to prevent reexecution
func.tags = ["ConfidentialCourt"];
