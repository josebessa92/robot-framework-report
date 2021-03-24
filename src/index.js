const fs = require('fs').promises;
const xml2js = require('xml2js');

const core = require('@actions/core');
const github = require('@actions/github');
const artifact = require('@actions/artifact');

const uploadBucketGCP = require('./client-bucket-gcp');

async function init() {
  try {
    const repository = core.getInput('repository');
    const accessToken = core.getInput('access-token');
    const repositoryOwner = core.getInput('repo-owner');
    const reportArtifactName = core.getInput('report-artifact-name');
    const bucketGcpName = core.getInput('bucket-gcp-name');
    
    const artifactClient = artifact.create();

    const pr = github.context.payload.pull_request;
    const octokit = github.getOctokit(accessToken);
     
    const downloadResponse = await artifactClient.downloadArtifact(reportArtifactName);
    console.log('Download: ', downloadResponse);
    
    let xmlOutput = await fs.readFile(`${downloadResponse.downloadPath}/reports/output.xml`, 'utf8');
    // let xmlOutput = await fs.readFile(`./reports/output.xml`, 'utf8');
    console.log('XML lido com sucesso');

    if (bucketGcpName) {
      console.log('Initializing GCP Storage Uploading...', uploadBucketGCP);
      // const storageGcpResponse = await storage.bucket(bucketGcpName).upload(downloadResponse.downloadPath, { destination: `/${bucketGcpName}-${Date.now()}` });
      const storageGcpResponse = await uploadBucketGCP(`/${bucketGcpName}-${Date.now()}`, downloadResponse.downloadPath, false);
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

        bodyComment += `##### ${parentSuiteName} ${parentSuiteTestStatus == 'FAIL' ? ':x:' : ':heavy_check_mark:' }\n`;
        
        bodyComment += '| Name | Result |\n';
        bodyComment += '| --- | --- |\n';

        for (let childSuiteIndex = 0; childSuiteIndex < parentSuite.test.length; childSuiteIndex++) {
          const childSuite = parentSuite.test[childSuiteIndex];
          const childSuiteName = childSuite.$.name;
          const childSuiteTestStatus = childSuite.status[0].$.status;
          
          bodyComment += `| ${ childSuiteName } | ${ childSuiteTestStatus } ${childSuiteTestStatus == 'FAIL' ? ':x:' : ':heavy_check_mark:' } |\n`;
          
          childSuiteTestStatus == 'PASS' ? passedCenarios++ : failedCenarios++;
          totalCenarios++;
        }
      }
    });

    bodyComment = bodyComment.replace('{{.Passed}}', passedCenarios);
    bodyComment = bodyComment.replace('{{.Total}}', totalCenarios);
    bodyComment = bodyComment.replace('{{.Failed}}', failedCenarios);
    bodyComment = bodyComment.replace('{{.Total}}', totalCenarios);

    const response = await octokit.issues.createComment({
      owner: repositoryOwner,
      repo: repository,
      issue_number: pr.number,
      body: bodyComment
    });

    core.setOutput('robot-result', bodyComment);
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

init();