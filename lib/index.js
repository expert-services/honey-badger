"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var badger = "\n___,,___\n_,-='=- =-  -'\"--.__,,.._\n,-;// /  - -       -   -= - \"=.\n,'///    -     -   -   =  - ==-='.\n|/// /  =    '. - =   == - =.=_,,._ '=/|\n///    -   -      - - = ,ndDMHHMM/\b  \\\n,' - / /        / / =  - /MM(,,._'YQMML  '|\n<_,=^Kkm / / / / ///H|wnWWdMKKK#\"\"-;. '\"0  |\n'\"\"QkmmmmmnWMMM\"\"WHMKKMM   '--.   \n       '\"\"'  '->>>        ''WHMb,.    '-_<@)\n-    --              '\"QMM'.\n                        '>>>\n                        ";
function approveWorkflow(app, context, run_id) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    app.log.info("Approving! ".concat(run_id));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, context.octokit.request('POST /repos/{owner}/{repo}/actions/runs/{run_id}/deployment_protection_rule', context.repo({
                            run_id: run_id,
                            environment_name: context.payload.environment,
                            state: 'approved',
                            comment: 'Workflow file looks good'
                        }))];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    app.log(error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function rejectWorkflow(app, context, run_id) {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    app.log.info("rejecting! ".concat(run_id));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, context.octokit.request('POST /repos/{owner}/{repo}/actions/runs/{run_id}/deployment_protection_rule', context.repo({
                            run_id: run_id,
                            environment_name: context.payload.environment,
                            state: 'rejected',
                            comment: 'Honey Badger don\'t care'
                        }))];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    app.log(error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// An async function that gets workflow for a specific run
function getWorkflow(app, context, run_id) {
    return __awaiter(this, void 0, void 0, function () {
        var workflow, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    app.log.info("Getting workflow! ".concat(run_id));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, context.octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}', context.repo({
                            run_id: run_id,
                        }))];
                case 2:
                    workflow = _a.sent();
                    app.log.info("workflow: ".concat(workflow.data.path));
                    return [2 /*return*/, workflow];
                case 3:
                    error_3 = _a.sent();
                    app.log(error_3);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// A helper function to exectue commands
function executeCommand(command) {
    return __awaiter(this, void 0, void 0, function () {
        var exec;
        return __generator(this, function (_a) {
            exec = require('child_process').exec;
            exec(command, function (err, stdout, stderr) {
                if (err) {
                    console.log(err);
                    return;
                }
                if (stderr) {
                    console.log(stderr);
                }
                console.log(stdout);
            });
            return [2 /*return*/];
        });
    });
}
module.exports = function (app) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        app.on("deployment_protection_rule", function (context) { return __awaiter(void 0, void 0, void 0, function () {
            var regex, matches, runId, workflow, workflowFile, workflowFileContent, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app.log.debug("Received Webhook ".concat(JSON.stringify(context)));
                        regex = /[^0-9]*([0-9]*).*$/g;
                        matches = regex.exec(context.payload.deployment_callback_url);
                        context.payload.deployment_callback_url.match(regex);
                        runId = matches === null || matches === void 0 ? void 0 : matches[1];
                        return [4 /*yield*/, getWorkflow(app, context, runId)];
                    case 1:
                        workflow = _a.sent();
                        return [4 /*yield*/, context.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', context.repo({
                                path: workflow.data.path,
                            }))];
                    case 2:
                        workflowFile = _a.sent();
                        workflowFileContent = Buffer.from(workflowFile.data.content, 'base64').toString('utf8');
                        app.log.info("workflowFileContent: ".concat(workflowFileContent));
                        // Execute codeql to create database
                        executeCommand('codeql database create --language javascript --source-root .');
                        executeCommand('codeql database analyze --format=sarif-latest --output=results.sarif');
                        executeCommand('cat results.sarif');
                        result = Math.random() * 10;
                        if (!(result < 5)) return [3 /*break*/, 4];
                        app.log.debug("approving since result is ".concat(result));
                        return [4 /*yield*/, approveWorkflow(app, context, runId)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        app.log.debug("rejecting since result is ".concat(result));
                        return [4 /*yield*/, rejectWorkflow(app, context, runId)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        }); });
        app.log.info("Honey Badger's listening!");
        app.log.info(badger);
        return [2 /*return*/];
    });
}); };
//# sourceMappingURL=index.js.map