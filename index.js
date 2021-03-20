const fs = require('fs').promises;
const xml2js = require('xml2js');

const core = require('@actions/core');
const github = require('@actions/github');
const artifact = require('@actions/artifact');

async function init() {
  try {
    const commitSha = core.getInput('commit-sha');
    const repository = core.getInput('repository');
    const accessToken = core.getInput('access-token');
    const repositoryOwner = core.getInput('repo-owner');
    const reportArtifactName = core.getInput('report-artifact-name');
    
    const artifactClient = artifact.create();
    const octokit = github.getOctokit(accessToken);
    
    const downloadResponse = await artifactClient.downloadArtifact(reportArtifactName);
    console.log('Download: ', downloadResponse);
    
    let xmlOutput = await fs.readFile(`${downloadResponse.downloadPath}/reports/output.xml`, 'utf8');
    // let xmlOutput = await fs.readFile(`./reports/output.xml`, 'utf8');
    console.log('XML lido com sucesso');

    let bodyComment = `
      ### Summary Results
      :tada: Passed {{.Passed}} / {{.Total}}
      :fire: Failed {{.Failed}} / {{.Total}}

      ### Executed Tests

    `;

    var parser = new xml2js.Parser();
    parser.parseString(xmlOutput, function (err, result) {
      const mainSuite = result.robot.suite[0].suite[0].suite[0].suite[0];

      for (let index = 0; index < mainSuite.suite.length; index++) {
        const parentSuite = mainSuite.suite[index];
        const parentSuiteName = parentSuite.$.name;
        const parentSuiteTestStatus = parentSuite.status[0].$.status;

        bodyComment += `
          ###### ${parentSuiteName} - ${parentSuiteTestStatus == 'FAIL' ? ':x:' : ':heavy_check_mark:' }
        `;
        
        bodyComment += `
          | Name | Result |
          | --- | --- |
        `;
        for (let childSuiteIndex = 0; childSuiteIndex < parentSuite.test.length; childSuiteIndex++) {
          const childSuite = parentSuite.test[childSuiteIndex];
          const childSuiteName = childSuite.$.name;
          const childSuiteTestStatus = childSuite.status[0].$.status;

          bodyComment += `
            | ${ childSuiteName } | ${ childSuiteTestStatus } |
          `;
        }
      }
    });

    let result = await octokit.repos.createCommitComment({
      owner: repositoryOwner,
      repo: repository,
      commit_sha: commitSha,
      body: bodyComment
    });

    core.setOutput('robot-result', bodyComment);
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

init();