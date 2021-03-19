const fs = require('fs').promises;
const parser = require('fast-xml-parser');

const core = require('@actions/core');
const artifact = require('@actions/artifact');

async function init() {
  try {
    let json = '';
    
    const artifactClient = artifact.create();

    // `who-to-greet` input defined in action metadata file
    const sha = core.getInput('sha');
    const repository = core.getInput('repository');
    const accessToken = core.getInput('access-token');
    const repositoryOwner = core.getInput('repo-owner');
    const reportArtifactName = core.getInput('report-artifact-name');

    console.log(`Hello ${sha}!`);
    console.log(`Hello ${repository}!`);
    console.log(`Hello ${accessToken}!`);
    console.log(`Hello ${repositoryOwner}!`);
    console.log(`Hello ${reportArtifactName}!`);
    
    const downloadResponse = await artifactClient.downloadArtifact(reportArtifactName);
    console.log('Download: ', downloadResponse);
    
    let xmlOutput = await fs.readFile(`${downloadResponse.downloadPath}/reports/output.xml`);
    console.log('XML lido com sucesso');

    if(parser.validate(xmlOutput) === true) { //optional (it'll return an object in case it's not valid)
      console.log('XML Valido');
      jsonObj = parser.parse(xmlOutput);
      console.log('JSON convertido com sucesso', jsonObj);
    }
    else {
      core.setFailed('XML Invalido');
    }
  
    // fs.readFile( `${downloadResponse.downloadPath}/output.xml`, function(err, data) {
    //   // var json = JSON.parse(parser.toJson(data, {reversible: true}));
    //   console.log('reading report xml: ' + data);
    //   // console.log('reading report json: ' + json);
    //   const time = (new Date()).toTimeString();
    //   core.setOutput("time", time);
      
    // });
    
    
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

init();