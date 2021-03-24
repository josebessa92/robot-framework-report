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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs').promises;
const xml2js = require('xml2js');
const core = require('@actions/core');
const github = require('@actions/github');
const artifact = require('@actions/artifact');
const client_bucket_gcp_1 = __importDefault(require("./client-bucket-gcp"));
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const repository = core.getInput('repository');
            const accessToken = core.getInput('access-token');
            const repositoryOwner = core.getInput('repo-owner');
            const reportArtifactName = core.getInput('report-artifact-name');
            const bucketGcpName = core.getInput('bucket-gcp-name');
            const artifactClient = artifact.create();
            const pr = github.context.payload.pull_request;
            const octokit = github.getOctokit(accessToken);
            const downloadResponse = yield artifactClient.downloadArtifact(reportArtifactName);
            console.log('Download: ', downloadResponse);
            let xmlOutput = yield fs.readFile(`${downloadResponse.downloadPath}/reports/output.xml`, 'utf8');
            // let xmlOutput = await fs.readFile(`./reports/output.xml`, 'utf8');
            console.log('XML lido com sucesso');
            if (bucketGcpName) {
                console.log('Initializing GCP Storage Uploading...', client_bucket_gcp_1.default);
                // const storageGcpResponse = await storage.bucket(bucketGcpName).upload(downloadResponse.downloadPath, { destination: `/${bucketGcpName}-${Date.now()}` });
                const storageGcpResponse = yield client_bucket_gcp_1.default(`/${bucketGcpName}-${Date.now()}`, downloadResponse.downloadPath, false);
                console.log('Storage GCP Response:', storageGcpResponse);
            }
            let bodyComment = '### Summary Results\n';
            bodyComment += ':tada: Passed {{.Passed}} / {{.Total}}\n';
            bodyComment += ':fire: Failed {{.Failed}} / {{.Total}}\n';
            bodyComment += '### Executed Tests\n';
            let totalCenarios = 0;
            let passedCenarios = 0;
            let failedCenarios = 0;
            var parser = new xml2js.Parser();
            parser.parseString(xmlOutput, function (err, result) {
                const mainSuite = result.robot.suite[0].suite[0].suite[0].suite[0];
                for (let index = 0; index < mainSuite.suite.length; index++) {
                    const parentSuite = mainSuite.suite[index];
                    const parentSuiteName = parentSuite.$.name;
                    const parentSuiteTestStatus = parentSuite.status[0].$.status;
                    bodyComment += `##### ${parentSuiteName} ${parentSuiteTestStatus == 'FAIL' ? ':x:' : ':heavy_check_mark:'}\n`;
                    bodyComment += '| Name | Result |\n';
                    bodyComment += '| --- | --- |\n';
                    for (let childSuiteIndex = 0; childSuiteIndex < parentSuite.test.length; childSuiteIndex++) {
                        const childSuite = parentSuite.test[childSuiteIndex];
                        const childSuiteName = childSuite.$.name;
                        const childSuiteTestStatus = childSuite.status[0].$.status;
                        bodyComment += `| ${childSuiteName} | ${childSuiteTestStatus} ${childSuiteTestStatus == 'FAIL' ? ':x:' : ':heavy_check_mark:'} |\n`;
                        childSuiteTestStatus == 'PASS' ? passedCenarios++ : failedCenarios++;
                        totalCenarios++;
                    }
                }
            });
            bodyComment = bodyComment.replace('{{.Passed}}', passedCenarios.toString());
            bodyComment = bodyComment.replace('{{.Total}}', totalCenarios.toString());
            bodyComment = bodyComment.replace('{{.Failed}}', failedCenarios.toString());
            bodyComment = bodyComment.replace('{{.Total}}', totalCenarios.toString());
            const response = yield octokit.issues.createComment({
                owner: repositoryOwner,
                repo: repository,
                issue_number: pr.number,
                body: bodyComment
            });
            core.setOutput('robot-result', bodyComment);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
init();
