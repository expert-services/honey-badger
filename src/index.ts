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

    // Get the workflow file(s) for runID
    const workflow = await getWorkflow(app, context, runId);

    // Checkout the workflowFilePath from the repo
    const workflowFile = await context.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', context.repo({
      path: workflow.data.path,
    }))
    
    const workflowFileContent = Buffer.from(workflowFile.data.content, 'base64').toString('utf8');
    app.log.info(`workflowFileContent: ${workflowFileContent}`)

    // Execute codeql to create database
    executeCommand('codeql database create codeql_database/javascript --language javascript --source-root .');
    executeCommand('codeql database analyze codeql_database/javascript --format=sarif-latest --output=results.sarif && cat results.sarif');
    
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

// A helper function to exectue commands
function executeCommand(command: string) {
  const { exec } = require('child_process');
  exec(command, (err: any, stdout: any, stderr: any) => {
    if (err) {
      console.log(err);
      return;
    }
    if (stderr) {
      console.log(stderr);
    }
    console.log(stdout);
  });
}
