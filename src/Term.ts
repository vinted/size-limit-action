import { exec } from "@actions/exec";
import hasYarn from "has-yarn";

const INSTALL_STEP = "install";
const BUILD_STEP = "build";

class Term {
  async execSizeLimit(
    branch?: string,
    skipStep?: string,
    buildScript?: string,
    filePath?: string,
    runScript?: string
  ): Promise<{ status: number; output: string }> {
    const manager = hasYarn() ? "yarn" : "npm";
    let output = "";

    if (!filePath) {
      if (branch) {
        try {
          await exec(`git fetch origin ${branch} --depth=1`);
        } catch (error) {
          console.log("Fetch failed", error.message);
        }

        await exec(`git checkout -f ${branch}`);
      }

      if (skipStep !== INSTALL_STEP && skipStep !== BUILD_STEP) {
        await exec(`${manager} install`);
      }

      if (skipStep !== BUILD_STEP) {
        const script = buildScript || "build";
        await exec(`${manager} run ${script}`);
      }
    }

    let script = "npx size-limit --json";

    if (runScript) {
      const pathPrefix = hasYarn() ? "cwd" : "prefix";
      const targetPath = filePath || "./";
      script = `${manager} --${pathPrefix} ${targetPath} ${runScript}`;
    }

    const status = await exec(script, [], {
      windowsVerbatimArguments: true,
      ignoreReturnCode: true,
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        }
      }
    });

    return {
      status,
      output
    };
  }
}

export default Term;
