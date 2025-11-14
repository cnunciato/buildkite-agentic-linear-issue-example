import { execSync } from "child_process";
import { Pipeline } from "@buildkite/buildkite-sdk";

interface LinearWebhookPayload {
    action?: string;
    data: {
        id: string;
        title?: string;
        description?: string;
        state?: {
            name: string;
        };
        labels?: Array<{
            id: string;
            name: string;
        }>;
    };
}

/**
 * Generates the analyze-request pipeline using the Buildkite SDK
 */
function generateLinearPipeline(issueId: string, agentBuildUrl: string): string {
    const pipeline = new Pipeline();

    const tokenArgs = [`LinearIssueID=${issueId}`, `AgentBuildURL=${agentBuildUrl}`];

    pipeline.addStep({
        id: "agent",
        label: ":linear: Analyzing the issue",
        commands: [...runAgent(tokenArgs)],
        plugins: {
            docker: {
                image: "buildkite-agentic-example-tools:latest",
                "mount-checkout": false,
                "mount-buildkite-agent": true,
                environment: [
                    "BUILDKITE",
                    "BUILDKITE_AGENT_ENDPOINT",
                    "BUILDKITE_AGENT_ACCESS_TOKEN",
                    "BUILDKITE_API_TOKEN",
                    "BUILDKITE_BUILD_URL",
                    "GITHUB_CLI_VERSION",
                    "BUILDKITE_MCP_SERVER_VERSION",
                    "TRIGGER_ON_ISSUE_LABEL",
                    "MODEL_PROVIDER",
                    "GITHUB_TOKEN",
                    "LINEAR_API_TOKEN",
                    "LINEAR_ISSUE_ID",
                    "LINEAR_ISSUE_TITLE",
                    "LINEAR_ISSUE_DESCRIPTION",
                ],
            },
        },
        secrets: {
            GITHUB_TOKEN: "GITHUB_TOKEN",
            BUILDKITE_API_TOKEN: "API_TOKEN_BUILDKITE",
            LINEAR_API_TOKEN: "LINEAR_API_TOKEN",
        },
    });

    return pipeline.toYAML();
}

function runAgent(tokenArgs: string[] = []): string[] {
    const provider = process.env.MODEL_PROVIDER;

    if (provider === "anthropic") {
        return [
            "echo '--- :claude: Run Claude Code'",
            `./scripts/claude.sh prompts/user.md ${tokenArgs.join(" ")}`,
        ];
    }

    return [
        "echo '--- :no_entry_sign: Missing or unsupported MODEL_PROVIDER'",
        `echo "Supported model providers are 'anthropic', 'openai'."`,
        "echo 'Use the MODEL_PROVIDER environment variable to specify one.'",
        "exit 1",
    ];
}

/**
 * Executes a buildkite-agent command
 * TEMPORARILY DISABLED: Not used while webhook service is unavailable
 */
// function buildkiteAgent(...args: string[]): string {
//     const command = `buildkite-agent ${args.join(" ")}`;
//     return execSync(command, { encoding: "utf-8" });
// }

/**
 * Main processing logic
 */
async function main() {
    console.log("--- :linear: Processing Linear webhook");

    // TEMPORARILY DISABLED: Webhook service is currently unavailable
    // if (process.env.BUILDKITE_SOURCE !== "webhook") {
    //     console.log("Not a webhook trigger, exiting");
    //     process.exit(0);
    // }

    // TEMPORARILY DISABLED: Using hard-coded payload instead
    // const webhookPayload = buildkiteAgent("meta-data", "get", "buildkite:webhook").trim();

    // if (!webhookPayload) {
    //     console.error("Error: No webhook payload found");
    //     process.exit(1);
    // }

    // console.log("Received webhook payload:");
    // const payload: LinearWebhookPayload = JSON.parse(webhookPayload);
    // console.log(JSON.stringify(payload, null, 2));

    // HARD-CODED PAYLOAD: Temporarily bypassing webhook while service is being restored
    const payload: LinearWebhookPayload = {
        action: "update",
        data: {
            id: "hardcoded-issue-id",
            title: "Change the description of my website",
            description:
                'Please change the description of my website, nunciato.org, from "Mostly pictures, sometimes words." to "Pretty much only pictures. I\'m tired of writing so much."',
            state: {
                name: "In Progress",
            },
            labels: [
                {
                    id: "buildsworth-analysis-label-id",
                    name: "buildsworth-analysis",
                },
            ],
        },
    };

    console.log("Using hard-coded webhook payload:");
    console.log(JSON.stringify(payload, null, 2));

    const webhookAction = payload.action;

    // TEMPORARILY DISABLED: This check is no longer needed with hard-coded payload
    // if (!webhookAction) {
    //     console.error("Error: Could not determine webhook action");
    //     process.exit(1);
    // }

    console.log(`Webhook action: ${webhookAction}`);

    // TEMPORARILY DISABLED: Not setting webhook metadata
    // buildkiteAgent("meta-data", "set", "webhook:action", webhookAction);
    // buildkiteAgent("meta-data", "set", "webhook:source", "linear");

    switch (webhookAction) {
        case "create":
        case "update":
            console.log(`Processing ${webhookAction} webhook`);

            const linearIssueId = payload.data.id;
            const linearIssueTitle = payload.data.title || "";
            const linearIssueDescription = payload.data.description || "";
            const linearIssueState = payload.data.state?.name || "";

            console.log(`Issue ID: ${linearIssueId}`);
            console.log(`Issue Title: ${linearIssueTitle}`);
            console.log(`Issue State: ${linearIssueState}`);

            // TEMPORARILY DISABLED: We're using hard-coded issue ID now
            // if (!linearIssueId) {
            //     console.error("Error: Could not extract issue ID from webhook payload");
            //     process.exit(1);
            // }

            const linearIssueLabels = payload.data.labels || [];
            const labelNames = linearIssueLabels.map(label => label.name);

            console.log("Issue Labels:");
            console.log(labelNames.join("\n"));

            if (labelNames.includes("buildsworth-analysis")) {
                console.log("Issue has 'buildsworth-analysis' label, uploading pipeline");

                // Set environment variables for the pipeline
                process.env.LINEAR_ISSUE_ID = linearIssueId;
                process.env.LINEAR_ISSUE_TITLE = linearIssueTitle;
                process.env.LINEAR_ISSUE_DESCRIPTION = linearIssueDescription;

                const pipelineYaml = generateLinearPipeline(
                    linearIssueId,
                    process.env.BUILDKITE_BUILD_URL || "",
                );

                // Upload the pipeline
                const uploadProcess = execSync("buildkite-agent pipeline upload", {
                    input: pipelineYaml,
                    encoding: "utf-8",
                });

                console.log(uploadProcess);
            } else {
                console.log(
                    "Issue does not have 'buildsworth-analysis' label, skipping pipeline upload",
                );
            }
            break;

        default:
            console.log(`Ignoring Linear webhook action: ${webhookAction}`);
            break;
    }
}

// Run the main function
main().catch(error => {
    console.error("Error:", error.message);
    process.exit(1);
});
