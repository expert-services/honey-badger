import { execSync } from "child_process";
import { Probot } from "probot";
const badger = `
___,,___
_,-='=- =-  -'"--.__,,.._
,-;// /  - -       -   -= - "=.
,'///    -     -   -   =  - ==-=\'.
|/// /  =    '. - =   == - =.=_,,._ '=/|
///    -   -    \  - - = ,ndDMHHMM/\b  \\
,' - / /        / /\ =  - /MM(,,._'YQMML  '|
<_,=^Kkm / / / / ///H|wnWWdMKKK#""-;. '"0\  |
'""QkmmmmmnWMMM\""WHMKKMM\   '--.  \ 
       '""'  '->>>        ''WHMb,.    '-_<@)
-    --              '"QMM'.
                        '>>>
                        `
export = async (app: Probot) => {
  app.on("deployment_protection_rule" as any, async (context: any) => {    
    app.log.debug(`Received Webhook ${JSON.stringify(context)}`)
    const regex = /[^0-9]*([0-9]*).*$/g;
    const matches = regex.exec(context.payload.deployment_callback_url)
    context.payload.deployment_callback_url.match(regex);
    const runId = matches?.[1];

    const workflow = await getWorkflow(app, context, runId);
    const workflowFile = await context.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', context.repo({
      path: workflow.data.path,
    }))
    
    const workflowFileContent = Buffer.from(workflowFile.data.content, 'base64').toString('utf8');
    const workspace = require('path').join(__dirname, runId);
    executeCommand(`mkdir -p ${workspace}/.github/workflows`);
    const workflowPath = require('path').join(workspace, workflow.data.path);
    const fs = require('fs');
    fs.writeFileSync(workflowPath, workflowFileContent);

    // Execute codeql to create database
    const codeqlQueries = require('path').join(__dirname, '..', 'codeql-queries', 'javascript', 'CWE-829', 'UnpinnedActionsTag.ql');
    const codeqlDatabase = require('path').join(workspace, 'codeql_database', 'javascript');
    executeCommand(`codeql --version`);
    executeCommand(`mkdir -p ${codeqlDatabase} && codeql database create ${codeqlDatabase} --language javascript --source-root ${workspace} --verbosity=errors`);
    executeCommand(`codeql database analyze ${codeqlDatabase} ${codeqlQueries} --format=sarif-latest --output=${workspace}/results.sarif --verbosity=errors`);
    
    // executeCommand(`rm -rf ${workspace}`);

    const result = Math.random() * 10;
    if (result < 5) {
      app.log.debug(`approving since result is ${result}`)
      await approveWorkflow(app, context, runId);

    } else {
      app.log.debug(`rejecting since result is ${result}`)
      await rejectWorkflow(app, context, runId)
    }

  })

  app.log.info("Honey Badger's listening!");
  app.log.info(badger);
};

async function approveWorkflow(app: Probot, context: any, run_id: string | undefined) {
  app.log.info(`Approving! ${run_id}`);
  try {
    await context.octokit.request('POST /repos/{owner}/{repo}/actions/runs/{run_id}/deployment_protection_rule', context.repo({
      run_id,
      environment_name: context.payload.environment,
      state: 'approved',
      comment: 'Workflow file looks good'
    }))
  } catch (error: any) {
    app.log(error)
  }
}

async function rejectWorkflow(app: Probot, context: any, run_id: string | undefined) {
  app.log.info(`rejecting! ${run_id}`);
  try {
    await context.octokit.request('POST /repos/{owner}/{repo}/actions/runs/{run_id}/deployment_protection_rule', context.repo({
      run_id,
      environment_name: context.payload.environment,
      state: 'rejected',
      comment: 'Honey Badger don\'t care'
    }))
  } catch (error: any) {
    app.log(error)
  }
}

// An async function that gets workflow for a specific run
async function getWorkflow(app: Probot, context: any, run_id: string | undefined) {
  app.log.info(`Getting workflow! ${run_id}`);
  try {
    const workflow = await context.octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}', context.repo({
      run_id,
    }))
    app.log.info(`workflow: ${workflow.data.path}`)
    return workflow
  } catch (error: any) {
    app.log(error)
  }
}

function executeCommand(command: string) {
  try {
    const result = execSync(command, { encoding: 'utf-8' });
    console.log(result);
  } catch (error: any) {
    console.error(error);
  }
}