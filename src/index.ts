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

    // Get workflow file
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

    // Execute CodeQL 
    const codeqlQueries = executeCommand(`find /usr/local/bin/codeql -type f -name actions-code-scanning.qls`)?.toString().trim();
    // const codeqlQueries = executeCommand(`find -name javascript-actions.qls`)?.toString().trim();
    const codeqlDatabase = require('path').join(workspace, 'codeql_database', 'javascript');
    executeCommand(`mkdir -p ${codeqlDatabase} && codeql database create ${codeqlDatabase} --language javascript --source-root ${workspace} --verbosity=errors`);
    executeCommand(`codeql database analyze ${codeqlDatabase} ${codeqlQueries} --format=sarif-latest --output=${workspace}/results.sarif --verbosity=errors`);
    
    // If results.sarif contains more than one result, reject
    const results = require('fs').readFileSync(`${workspace}/results.sarif`, 'utf8');
    const sarif = JSON.parse(results);
    const sarifResults = sarif.runs[0].results;
    if (sarifResults.length > 0) {
      app.log.debug(`rejecting since sarifResults.length is ${sarifResults.length}`)
      await rejectWorkflow(app, context, runId)
    } else {
      app.log.debug(`approving since sarifResults.length is ${sarifResults.length}`)
      await approveWorkflow(app, context, runId);
    }

    // Cleanup
    executeCommand(`rm -rf ${workspace}`);
  });

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
    return result.toString();
  } catch (error: any) {
    console.error(error);
  }  
  return
}