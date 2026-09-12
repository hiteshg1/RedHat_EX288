# EX288 Practice Q&A Validation and Environment Adaptation

You are acting as a **Red Hat EX288 exam preparation reviewer and OpenShift 4.18 lab engineer**.

I will provide you with a set of EX288-style questions and answers obtained from another person's Git repository.

Your job is **not simply to rewrite their content**.

You must:

1. Validate whether each question and proposed answer is technically correct.
2. Correct any incorrect, outdated, incomplete, or environment-specific instructions.
3. Re-create the exercises so that they work in **my own OpenShift lab environment**.
4. Produce clean study material that I can commit directly into my EX288 study repository.

---

# My Lab Environment

Use the following environment when adapting all exercises.

## GitLab

My GitLab namespace is:

`https://gitlab.com/hits.govind/`

Any source repositories required by an exercise should therefore use repositories under:

`https://gitlab.com/hits.govind/<repository-name>`

Do **not** retain GitHub/GitLab usernames, repository URLs, organizations, or paths belonging to the original author.

If an exercise requires me to create a repository, specify an appropriate repository name and assume it will exist beneath:

`https://gitlab.com/hits.govind/`

Example:

```text
https://gitlab.com/hits.govind/ex288-q1
```

---

## OpenShift Environment

My lab uses OpenShift/CRC.

Application routes use:

```text
*.apps-crc.testing
```

Therefore replace environment-specific routes such as:

```text
*.apps.ocp4.example.com
*.apps.cluster.example.com
```

with routes appropriate to:

```text
*.apps-crc.testing
```

Where OpenShift automatically generates the route hostname, prefer commands such as:

```bash
oc expose service <service-name>
oc get route
```

rather than unnecessarily hard-coding a hostname.

Assume OpenShift 4.18-compatible resources and commands unless the exercise specifically requires otherwise.

Avoid deprecated `DeploymentConfig` resources unless the exam task explicitly requires them.

Prefer:

```text
Deployment
BuildConfig
ImageStream
Service
Route
ConfigMap
Secret
PersistentVolumeClaim
Job
CronJob
```

and other currently supported OpenShift/Kubernetes resources.

---

# Primary Objective

For every supplied EX288 question, determine:

- What EX288 skill/objective it is testing.
- Whether the original question is valid.
- Whether the supplied answer is correct.
- Whether commands are compatible with OpenShift 4.18.
- Whether the commands contain assumptions specific to the original author's environment.
- Whether any resources must exist before attempting the question.
- Whether the task can realistically be completed under exam conditions.

Do not blindly preserve the original author's values.

Replace environment-specific values including:

- Git repository URLs
- usernames
- namespaces/projects
- application names where necessary
- image registry references
- route domains
- secrets
- ConfigMaps
- PVC names
- hostnames
- image streams
- service names
- database names
- credentials
- external registry URLs
- TLS files
- storage definitions
- environment variables

with values appropriate for my environment.

---

# Deliverables

Create the following files.

---

# 1. `README.md`

This is the primary Q&A document.

For each question use this structure:

```markdown
# Question <number> — <short descriptive title>

## EX288 Objective

Identify the EX288 exam objective(s) being tested.

## Difficulty

Easy / Moderate / Difficult

## Realistic Exam Time

Estimated completion time:

**X–Y minutes**

Explain briefly why.

This should be a realistic estimate for someone who understands the objective but still needs to type, verify and troubleshoot commands during the exam.

## Scenario

Rewrite the original task so that it is self-contained and works in my environment.

Clearly identify:

- project/namespace
- Git repository
- application name
- image/build requirements
- storage requirements
- ConfigMaps or Secrets
- routes/services
- expected final result

Do not include unnecessary hints that would make the exercise unrealistic for exam practice.

## Requirements

List exactly what must be achieved.

## Solution

Provide the recommended CLI solution.

Commands must be runnable wherever practical.

Example style:

```bash
oc new-project ex288-q1

oc new-app \
  --name=myapp \
  https://gitlab.com/hits.govind/example.git
```

Explain only important steps.

Do not add excessive commentary between every command.

## Verification

Provide commands that prove the task was completed correctly.

Examples:

```bash
oc get pods
oc get svc
oc get routes
oc get bc
oc get is
oc describe deployment <name>
oc logs deployment/<name>
curl http://<route>
```

Include the expected result where useful.

## GUI Alternative

If the task can reasonably be completed using the OpenShift Web Console, explain the GUI method.

Use a format such as:

```text
Developer → +Add → Import from Git
```

or:

```text
Administrator → Workloads → Deployments → <deployment> → Environment
```

Only recommend the GUI when it is genuinely simpler or useful during the EX288 exam.

Clearly state:

**Recommended method: CLI**

or

**Recommended method: GUI**

or

**Either method is equally suitable**

## Troubleshooting

List the most likely mistakes relevant to this particular question.

Include useful diagnostic commands.

For example:

```bash
oc describe pod <pod>
oc logs <pod>
oc get events --sort-by=.lastTimestamp
oc describe bc <buildconfig>
oc logs -f bc/<buildconfig>
```

## Key Exam Takeaway

Summarize what I should remember if a similar task appears in the EX288 exam.
```

---

# 2. `environment.md`

Only create this file if the exercises require pre-created resources, repositories, files, images, secrets, PVCs, databases, Git branches, or other lab preparation.

The purpose of `environment.md` is to allow me to recreate the practice environment **before attempting the questions**.

Structure it as follows:

```markdown
# EX288 Practice Environment Setup

## Prerequisites

List tools and assumptions.

Examples:

- `oc`
- `git`
- access to CRC
- logged into OpenShift
- GitLab access

## Verify OpenShift Access

```bash
oc whoami
oc cluster-info
```

## GitLab Repositories

List every repository required.

Example:

```text
https://gitlab.com/hits.govind/ex288-q1
https://gitlab.com/hits.govind/ex288-q2
```

For repositories that need starter files, provide the directory structure and complete contents.

Example:

```text
ex288-q1/
├── package.json
├── server.js
└── README.md
```

Provide all required file contents in fenced code blocks.

## OpenShift Setup

Provide any prerequisite projects/resources.

Examples:

```bash
oc new-project ex288-practice
```

Create required:

- Secrets
- ConfigMaps
- PVCs
- ImageStreams
- BuildConfigs
- ServiceAccounts
- RBAC
- database deployments
- supporting applications

only when required by the exercises.

## Validation

Provide commands that confirm the lab is ready.

Example:

```bash
oc get all
oc get pvc
oc get secret
oc get configmap
```
```

The environment setup must not accidentally solve the exam question itself.

It should create only the prerequisites that an examiner would normally provide.

---

# 3. `command-reference.md`

Create a concise EX288 command reference based on the concepts exercised by the supplied questions.

This must be useful as a rapid study/reference sheet rather than a tutorial.

Group commands by subject.

Include applicable categories such as:

```markdown
# EX288 Command Reference

## Projects

oc new-project
oc project
oc get projects

## Applications

oc new-app
oc create deployment
oc expose deployment
oc expose service

## Deployments

oc get deployment
oc describe deployment
oc set env
oc set volume
oc set probe
oc rollout status
oc rollout restart
oc rollout undo

## Pods

oc get pods
oc describe pod
oc logs
oc exec

## Services and Routes

oc expose
oc get svc
oc get route

## ConfigMaps

oc create configmap
oc set env --from=configmap

## Secrets

oc create secret
oc set env --from=secret

## Storage

oc create -f
oc set volume
oc get pvc

## Builds

oc new-build
oc start-build
oc logs -f bc/<name>
oc get bc
oc describe bc

## ImageStreams

oc create imagestream
oc import-image
oc tag
oc get is
oc describe is

## Build Triggers

oc set triggers

## Git

git clone
git branch
git switch
git add
git commit
git push

## Helm

helm repo
helm search
helm show
helm install
helm upgrade
helm template
helm list
helm uninstall

## Kustomize

oc kustomize
oc apply -k
kubectl kustomize

## Troubleshooting

oc get events
oc describe
oc logs
oc status
oc get all
```

For commands with important syntax, provide one useful example.

Do not fill the document with commands unrelated to the supplied questions or EX288 objectives.

---

# 4. `theory-summary.md`

Create a high-level theory guide for the EX288 objectives represented by the questions.

The purpose is to help me understand **why** the commands work rather than merely memorize them.

For each topic explain:

```markdown
# <Topic>

## What It Is

Short explanation.

## Why It Matters for EX288

Explain what Red Hat expects me to understand.

## Important Resources

Example:

- Deployment
- Pod
- Service
- Route

## Key Relationships

Explain how the components interact.

## Commands to Remember

Only the important commands.

## Exam Tips

Important distinctions, common traps, and things worth memorizing.
```

Keep theory concise but technically accurate.

---

# Validation Rules

Perform technical validation before producing the final Q&A.

For every supplied solution check:

### Command correctness

Determine whether:

- command syntax is correct
- flags are valid
- resource names are valid
- API versions are appropriate
- commands work with OpenShift 4.18
- deprecated commands/resources are being used

### Kubernetes/OpenShift logic

Check:

- selectors and labels match
- Services target the correct Pods
- Route targets the correct Service
- container ports are correct
- PVC mount paths are correct
- environment variables are correctly referenced
- Secrets/ConfigMaps are correctly injected
- readiness/liveness/startup probes are sensible
- BuildConfig and ImageStream relationships are correct
- image triggers work correctly
- rollout strategies are valid

### Build validation

For S2I/build exercises check:

- builder image
- source repository
- Git branch/ref
- BuildConfig
- ImageStream
- output image
- build trigger
- deployment trigger

### Helm validation

Check:

- chart structure
- `Chart.yaml`
- `values.yaml`
- templates
- value references
- installation command
- upgrade command
- rendering using `helm template`

### Kustomize validation

Check:

- `kustomization.yaml`
- bases/resources
- overlays
- patches
- image replacements
- namespace modifications
- `oc apply -k`

### Troubleshooting exercises

Do not immediately reveal the fault in the question itself.

The scenario should allow me to diagnose it.

Put the diagnosis and fix under the solution.

---

# Source Q&A Review

Before rewriting each question, provide a short assessment:

```markdown
## Validation of Original Answer

Status: ✅ Correct / ⚠️ Partially Correct / ❌ Incorrect

### Findings

- ...
- ...
- ...

### Environment-specific changes required

- ...
- ...
```

If the original answer is wrong, explain exactly why.

Do not preserve a wrong answer merely because it came from an existing EX288 repository.

---

# Exam-Time Estimation

Every question must include a realistic completion time.

Estimate the time based on:

- reading the task
- creating resources
- editing YAML
- waiting for builds
- waiting for image pulls
- deployment rollout
- troubleshooting
- verification

Use ranges such as:

```text
5–8 minutes
10–15 minutes
15–20 minutes
```

Avoid unrealistic estimates.

If a task could consume excessive exam time, explicitly state:

```text
Exam strategy: if this task exceeds approximately 15 minutes,
verify the obvious configuration points and move on before returning
to it later.
```

where appropriate.

---

# EX288 Exam Relevance

Classify each task as:

```text
HIGH — strongly aligned with published EX288 objectives
MEDIUM — useful supporting knowledge
LOW — unlikely to be directly tested
```

If a question appears outdated or unrelated to modern EX288 objectives, clearly state that.

Do not remove it silently.

---

# CLI vs Web Console

Because EX288 allows use of the OpenShift Web Console, identify tasks where GUI usage might save time.

Pay particular attention to:

- environment variables
- Secrets and ConfigMaps
- PVC attachment
- health probes
- routes
- deployments
- resource inspection

However, ensure I also understand the equivalent CLI commands.

For every relevant exercise provide both approaches, while identifying which is likely faster during the exam.

---

# Important Constraints

Do NOT:

- blindly copy the source repository
- retain another person's GitLab/GitHub username
- retain their cluster domain
- invent infrastructure that is not required
- use deprecated DeploymentConfig resources unnecessarily
- assume resources exist unless they are created in `environment.md`
- give answers that cannot actually be executed
- hard-code generated Pod names
- depend on random generated names where avoidable
- unnecessarily use YAML when a simple `oc` command is faster
- unnecessarily use CLI when the Web Console is substantially easier
- expose passwords directly when a Secret should be used
- over-engineer exercises beyond EX288 scope

---

# Preferred Exam Style

Where several valid approaches exist, prioritize the approach that is:

1. Fast
2. Easy to remember
3. Easy to verify
4. Appropriate for EX288
5. Least likely to introduce YAML syntax mistakes

For example, prefer:

```bash
oc set env
oc set volume
oc set probe
oc expose
oc create secret
oc create configmap
```

when they are simpler than manually editing large YAML manifests.

However, include YAML when understanding or modifying YAML is part of the skill being tested.

---

# Final Review

After processing all questions, finish with:

```markdown
# Overall Assessment

## Questions Reviewed

Total: X

## Validation Results

- Correct: X
- Partially correct: X
- Incorrect: X

## EX288 Relevance

- High: X
- Medium: X
- Low: X

## Estimated Total Practice Time

Approximately X hours.

## Strongest Topics Covered

- ...
- ...

## Missing EX288 Topics

Identify important published EX288 objectives that are not sufficiently covered by this question set.

## Recommended Practice Order

Recommend an order based on dependency and exam importance.

## Final Exam Readiness Notes

Identify concepts or commands that deserve additional practice.
```

---

# Output Requirements

Produce the following files:

```text
README.md
environment.md        # only when prerequisites are required
command-reference.md
theory-summary.md
question.md #Revised Question
answer.md # Revised Answer
```

The Markdown must be clean enough to commit directly to Git.

Commands must be copy/paste friendly.

Use my environment consistently:

```text
GitLab:
https://gitlab.com/hits.govind/

OpenShift application domain:
*.apps-crc.testing
```

Most importantly:

**Validate first, then rewrite.**

Do not assume the original question or answer is correct merely because it came from another EX288 repository.

One addition I deliberately built in is **exam-time scoring**. This should help distinguish a technically valid solution from one that's practical under EX288 conditions—for example, whether a question should take 5–8 minutes or whether you should abandon troubleshooting after ~15 minutes and return later.

Keep the Output Practical and Simple

Write like an experienced OpenShift administrator helping me prepare for EX288.

The goal is the shortest correct solution that meets every requirement and is easy to remember under exam conditions.

Solution Style

Start with the recommended solution.

Use direct, copy-and-paste oc commands.

Choose one approach. Include alternatives only when necessary.

Prefer simple CLI commands over YAML, scripts, loops, and shell variables.

Use variables only when they make the task noticeably simpler.

Explain only commands or behaviour that could cause confusion.

Avoid defensive checks, repeated verification, lengthy caveats, and unnecessary background.

Do not introduce resources, dependencies, or changes beyond what the question requires.

Preserve the supplied application and script unless a change is necessary for correctness. Explain any required change briefly.

Keep environment setup separate from the exam solution.

Required Output

README.md

Original answer review: Correct, partially correct, or incorrect, followed by no more than three key findings.

Objective and time: The relevant EX288 objective, difficulty, and realistic completion time.

Question: A short scenario and the exact requirements.

Solution: The minimum commands needed, with brief explanations only where useful.

Verification: A few commands that prove the requirements were met, with expected results.

Troubleshooting: Only the three most likely problems and their fixes.

Key takeaway: One or two sentences.

Include a GUI alternative only when it is genuinely useful or faster.

environment.md — only if required

Provide the minimum preparation needed to attempt the question. Include complete starter files only when they are missing or must be corrected. Do not solve the question during setup.

command-reference.md

Provide a compact list of commands relevant to this question. Avoid repeating the full tutorial.

theory-summary.md

Explain the essential theory in a few short paragraphs or bullets. Focus on what I must understand to perform the task correctly.

Accuracy and Environment

Validate against OpenShift 4.18.

Use GitLab namespace https://gitlab.com/hits.govind/.

Use application route domain *.apps-crc.testing.

Correct technical mistakes without overcomplicating the answer.

Keep source references in a short section at the end.

State once whether the solution was tested live or checked against documentation.

Before finishing, ask yourself:

“Would an administrator actually type these commands to complete this task?”

Remove anything that does not help complete, verify, or understand the task.

These instructions override earlier formatting or detail requirements where they conflict. They do not override the question’s acceptance criteria or technical correctness.
