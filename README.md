# Buildkite Agentic Pipeline Example: Linear Issue Handler

[![Build status](https://badge.buildkite.com/4745313e817f018c2b948435d6640a7dc176e1aadf09fe1249.svg)](https://buildkite.com/cnunciato/buildkite-agentic-linear-issue-example)
[![Add to Buildkite](https://img.shields.io/badge/Add%20to%20Buildkite-14CC80)](https://buildkite.com/new)

A [Buildkite](https://buildkite.com) pipeline that uses [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) and Buildkite model providers to diagnose and fix [Linear](https://linear.app/) issues.

## Setting up

### Step 1: Start with an existing Linear workspace

Make sure you have access to a Linear [workspace](https://linear.app/docs/workspaces) that allows you to create and manage [webhooks](https://linear.app/docs/api-and-webhooks).

### Step 2: Prepare your agentic pipeline

1. [Create a new GitHub repository](https://github.com/new?template_name=buildkite-agentic-linear-issue-example&template_owner=cnunciato) using this repository as a template.
1. [Create a new Buildkite pipeline](https://buildkite.com/organizations/~/pipelines/new) with your forked/templated repository with a Linux [hosted agents](https://buildkite.com/docs/pipelines/hosted-agents) cluster.
1. [Create a new pipeline trigger](https://buildkite.com/~/buildkite-agentic-linear-issue-example/settings/triggers/new?trigger_type=webhook) for the pipeline, then copy the generated webhook URL to your clipboard.
1. Navigate to the **Settings** > **API** page of your Linear workspace.
1. Add a new Linear webhook, paste the Buidkite webhook URL from your clipboard into the URL field, choose **Issues** only (under Data change events), and save.
1. Create three new [Buildkite secrets](https://buildkite.com/docs/pipelines/security/secrets/buildkite-secrets) with the following names:
   1. `GITHUB_TOKEN`: A GitHub [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with `repo` and `pull_request` read/write scopes.
   1. `LINEAR_API_TOKEN`: A Linear [API key](https://linear.app/docs/api-and-webhooks) with "Read" permissions.
   1. `API_TOKEN_BUILDKITE`: A Buildkite [API access token](https://buildkite.com/docs/apis/managing-api-tokens) with `read_builds`, `read_build_logs`, and `read_pipelines` permissions.

### Step 3: Trigger a fix!

1. Create a new issue in Linear that describes the work to be done. Label the issue with `buildsworth-analysis`. (This is configurable in `.buildkite/pipeline.yml`.)
1. In a few moments, you should see a new comment appear on the issue acknowledging that the agent has picked up the task. Follow the link to the Buildkite dashboard to have a look.
1. Once the agent determines a fix, you should see a new PR submitted on the target GitHub repository explaining what was done. Have a look at that PR, and if it looks good, approve and merge.

That's it! Your issue should be fixed.

## How it works

The pipeline listens for webhooks originating from Linear issue events. When a new issue is detected, the pipeline runs the `handler` script, which adds a step to the running pipeline that uses Claude to diagnose and fix the issue (with the `agent.sh` script), [annotating](https://buildkite.com/docs/apis/rest-api/annotations) the build (with the `parser` script) as it goes. When the work is complete, Claude commits the changes to a new feature branch on the associated GitHub repository, and submits a new PR, and reports back on the Linear issue with a summary.
