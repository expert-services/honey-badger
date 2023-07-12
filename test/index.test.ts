import nock from "nock";
import myProbotApp from "../src";
import { Probot, ProbotOctokit } from "probot";
import payload from "./fixtures/deployment_protection_rule.requested.json";
import run from "./fixtures/deployment_run.5417285903.json";
import workflow from "./fixtures/workflow.codeql-analysis.json";
const deploymentAcceptedBody = { body: "Deployment was accepted!" };
const fs = require("fs");
const path = require("path");

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8"
);

describe("honey-badger", () => {
  let probot: any;

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({
      appId: 123,
      privateKey,
      // disable request throttling and retries for testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    // Load our app into probot
    probot.load(myProbotApp);
  });

  test("accepts a deployment when a deployment protection rule is triggered", async () => {
    const mock = nock("https://api.github.com")
      // Test that we correctly return a test token
      .post("/app/installations/39129914/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          deployments: "write",
        },
      })

      .get("/repos/oodles-noodles/juice-shop/actions/runs/5417285903")
      .reply(200, run)

      .get("/repos/oodles-noodles/juice-shop/contents/.github%2Fworkflows%2Fcodeql-analysis.yml")
      .reply(200, workflow)

      .post("/repos/oodles-noodles/juice-shop/actions/runs/5417285903/deployment_protection_rule")
      .reply(200, deploymentAcceptedBody)

      // Receive a webhook event
      await probot.receive({ name: "deployment_protection_rule", payload });

    expect(mock.pendingMocks()).toStrictEqual([]);
  }, 20000 /* timeout in milliseconds */);

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
