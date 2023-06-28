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
      comment: 'Compliance checks passed.'
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
      comment: 'Failed Compliance Checks'
    }))
  } catch (error: any) {
    app.log(error)
  }
}

