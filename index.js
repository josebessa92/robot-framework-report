const fs = require('fs');
const parser = require('xml2json');

const core = require('@actions/core');
const github = require('@actions/github');

try {
  // `who-to-greet` input defined in action metadata file
  const sha = core.getInput('sha');
  const repository = core.getInput('repository');
  const reportPath = core.getInput('report-path');
  const accessToken = core.getInput('access-token');
  const repositoryOwner = core.getInput('repo-owner');


  console.log(`Hello ${sha}!`);
  console.log(`Hello ${repository}!`);
  console.log(`Hello ${reportPath}!`);
  console.log(`Hello ${accessToken}!`);
  console.log(`Hello ${repositoryOwner}!`);


  fs.readFile( `${reportPath}/output.xml`, function(err, data) {
    var json = JSON.parse(parser.toJson(data, {reversible: true}));
    console.log('reading report: ' + json);
  });
  
  
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);
  
  
} catch (error) {
  core.setFailed(error.message);
}