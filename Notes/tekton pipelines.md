# EX288 – Red Hat OpenShift Pipelines / Tekton Study Notes

## 1. Core Concepts

Red Hat OpenShift Pipelines is based on **Tekton**.

Pipelines, Tasks, and their executions are represented as OpenShift/Kubernetes resources.

This allows pipeline definitions to be:

- Defined in YAML
- Stored in Git
- Version controlled
- Reused
- Applied using `oc`
- Managed using the `tkn` CLI

This approach is referred to as **Pipelines as Code**.

---

# 2. Tekton Resource Hierarchy

Remember the relationship:

Pipeline
  └── Task
        └── Step
              └── Container

Execution resources:

Task      → TaskRun
Pipeline  → PipelineRun

A `Task` defines what should happen.

A `TaskRun` is an execution/instance of a Task.

A `Pipeline` defines a workflow containing Tasks.

A `PipelineRun` is an execution/instance of a Pipeline.

Important:

If a Pipeline contains 4 Tasks and you run the Pipeline 3 times:

4 Tasks × 3 PipelineRuns = 12 TaskRuns

---

# 3. Tasks

A Tekton `Task` groups one or more steps into a reusable unit.

Tasks are similar to **functions** in programming.

They can:

- Accept input using `params`
- Produce output using `results`
- Share/store files using `workspaces`
- Contain multiple `steps`

Basic structure:

```yaml
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: fetch-url
spec:
  results:
    - name: output

  params:
    - name: URL
      description: The URL to fetch.
      type: string

  steps:
    - name: curl-run
      image: example.com/example/image:latest
      script: |
        curl $(params.URL) | tee $(results.output.path)
```

Key fields:

```text
metadata.name
```

Name used to reference the Task.

```yaml
params:
```

Defines parameters accepted by the Task.

Reference a parameter:

```text
$(params.URL)
```

```yaml
results:
```

Defines values produced by the Task.

Result path:

```text
$(results.output.path)
```

```yaml
steps:
```

Defines containers/actions executed by the Task.

Each step specifies a container image:

```yaml
steps:
  - name: curl-run
    image: example.com/example/image:latest
```

---

# 4. Default OpenShift Pipeline Tasks

OpenShift Pipelines provides predefined Tasks.

Examples include:

- `git-clone`
- `buildah`

These Tasks are located in:

```text
openshift-pipelines
```

namespace/project.

Inspect a predefined Task:

```bash
oc get task/buildah \
  -n openshift-pipelines \
  -o yaml
```

Using Tekton CLI:

```bash
tkn -n openshift-pipelines t describe buildah
```

`t` is shorthand for:

```text
task
```

Example Buildah parameter:

```text
IMAGE
```

This specifies the fully qualified image name that Buildah builds and pushes.

---

# 5. Resolvers

Tasks stored in another namespace, such as:

```text
openshift-pipelines
```

must be referenced using a **resolver**.

A resolver allows Tekton to reference Tasks/Pipelines from remote locations.

Possible locations include:

- Another namespace
- Artifact Hub
- Git repository
- Other supported remote sources

Example referencing the `git-clone` Task from `openshift-pipelines`:

```yaml
taskRef:
  resolver: cluster
  params:
    - name: kind
      value: task
    - name: name
      value: git-clone
    - name: namespace
      value: openshift-pipelines
```

---

# 6. Pipelines

A Pipeline primarily contains a collection of Tasks.

A Pipeline can also define:

- Parameters
- Workspaces
- Task dependencies

Basic structure:

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: my-pipeline
spec:

  params:
    - name: GIT_REPO
      type: string
      default: "example.com/app/repo"

  workspaces:
    - name: app-build

  tasks:
    ...
```

---

# 7. Pipeline Parameters

Define a Pipeline parameter:

```yaml
params:
  - name: GIT_REPO
    type: string
    default: "example.com/app/repo"
```

Reference it:

```text
$(params.GIT_REPO)
```

Pass the Pipeline parameter into a Task:

```yaml
params:
  - name: URL
    value: $(params.GIT_REPO)
```

Think:

```text
Pipeline parameter
       ↓
Task parameter
```

Example:

```text
GIT_REPO
   ↓
URL
```

---

# 8. Referencing Tasks in a Pipeline

## Local Task

If the Task exists in the same project:

```yaml
taskRef:
  name: linter
  kind: Task
```

Example:

```yaml
- name: run-lint
  taskRef:
    name: linter
    kind: Task
```

## Task From Another Namespace

Use a resolver:

```yaml
taskRef:
  resolver: cluster
  params:
    - name: kind
      value: task
    - name: name
      value: git-clone
    - name: namespace
      value: openshift-pipelines
```

---

# 9. Task Dependencies – runAfter

`runAfter` controls Task execution order.

Example:

```yaml
- name: run-lint
  taskRef:
    name: linter
    kind: Task

  runAfter:
    - fetch-repository
```

Meaning:

```text
fetch-repository
       ↓
    run-lint
```

`run-lint` starts only after `fetch-repository` finishes.

Without dependencies, Tasks can potentially execute independently/in parallel.

---

# 10. Workspaces

Workspaces provide **shared storage between Tasks**.

Example Pipeline workspace:

```yaml
workspaces:
  - name: app-build
```

A Task binds its own workspace name to the Pipeline workspace.

Example:

```yaml
workspaces:
  - name: output
    workspace: app-build
```

Here:

```text
output
```

is the workspace name expected by the Task.

```text
app-build
```

is the Pipeline workspace.

Another Task might use:

```yaml
workspaces:
  - name: source
    workspace: app-build
```

Therefore:

```text
Task: git-clone
workspace: output
       ↓
Pipeline workspace: app-build
       ↑
Task: linter
workspace: source
```

Both Tasks access the same underlying storage.

---

# 11. Workspace PVC Template

For this course, workspaces are backed using a **VolumeClaimTemplate**.

Example PVC template:

```yaml
spec:
  accessModes:
    - ReadWriteOnce

  resources:
    requests:
      storage: 1Gi

  storageClassName: nfs-storage

  volumeMode: Filesystem
```

When the PipelineRun starts, OpenShift creates a PVC from the template and attaches it to the workspace.

---

# 12. Complete Pipeline Example

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: my-pipeline

spec:

  params:
    - name: GIT_REPO
      type: string
      default: "example.com/app/repo"

  workspaces:
    - name: app-build

  tasks:

    - name: fetch-repository

      taskRef:
        resolver: cluster
        params:
          - name: kind
            value: task
          - name: name
            value: git-clone
          - name: namespace
            value: openshift-pipelines

      params:
        - name: URL
          value: $(params.GIT_REPO)

      workspaces:
        - name: output
          workspace: app-build


    - name: run-lint

      taskRef:
        name: linter
        kind: Task

      params:
        - name: DIRECTORY
          value: "path/to/code"

      workspaces:
        - name: source
          workspace: app-build

      runAfter:
        - fetch-repository
```

Workflow:

```text
Git Repository
      |
      v
fetch-repository
   (git-clone)
      |
      | app-build workspace
      v
   run-lint
    (linter)
```

---

# 13. Tekton CLI – tkn

General syntax:

```bash
tkn <type> <command>
```

Common resource shortcuts:

```text
t   = task
p   = pipeline
tr  = taskrun
pr  = pipelinerun
```

---

# 14. View Tasks

List Tasks:

```bash
tkn t list
```

Describe Task:

```bash
tkn t describe fetch-url
```

Inspect using `oc`:

```bash
oc get task/fetch-url -o yaml
```

Default OpenShift Task:

```bash
tkn -n openshift-pipelines t describe buildah
```

or:

```bash
oc get task/buildah \
  -n openshift-pipelines \
  -o yaml
```

---

# 15. View Pipelines

List Pipelines:

```bash
tkn p list
```

Describe Pipeline:

```bash
tkn p describe my-pipeline
```

This displays information such as:

- Parameters
- Workspaces
- Tasks
- Task references
- `runAfter`
- Parameter values

You can also use normal OpenShift commands:

```bash
oc get pipeline
```

```bash
oc get pipeline my-pipeline -o yaml
```

---

# 16. TaskRun

A `TaskRun` represents one execution of a Task.

Example:

```yaml
apiVersion: tekton.dev/v1
kind: TaskRun
metadata:
  name: fetch-app

spec:

  taskRef:
    ...

  params:
    - name: url
      value: https://git.example.com/app

    - name: revision
      value: main

    - name: subdirectory
      value: ""
```

Creating the resource starts the Task.

---

# 17. PipelineRun

A `PipelineRun` represents one execution of a Pipeline.

Example:

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: fetch-pipeline

spec:

  pipelineRef:
    name: my-pipeline

  params:
    - name: GIT_REPO
      value: https://example.com/app/repo
```

Creating the resource starts the Pipeline.

The cluster updates the PipelineRun resource with execution status.

---

# 18. Starting Tasks with tkn

Interactive:

```bash
tkn t start fetch-url
```

`tkn` prompts for required parameters:

```text
? Value for param `URL` of type `string`?
```

You can provide parameters using:

```bash
-p
```

General pattern:

```bash
tkn t start <task> -p PARAM=value
```

---

# 19. Starting Pipelines

Interactive:

```bash
tkn p start my-pipeline
```

`tkn` prompts for:

- Pipeline parameters
- Workspace configuration

Example:

```text
? Value for param `GIT_REPO` of type `string`?

Please give specifications for the workspace: app-build
```

---

# 20. Starting Pipeline with Workspace PVC

Provide a workspace using:

```bash
-w
```

Example:

```bash
tkn p start my-pipeline \
  -w name=app-build,volumeClaimTemplateFile=pvc-template.yaml
```

This causes OpenShift to:

1. Create the PipelineRun
2. Create a PVC from `pvc-template.yaml`
3. Bind the PVC to the `app-build` workspace
4. Make the storage available to Tasks using that workspace

Important syntax:

```text
-w name=<workspace>,volumeClaimTemplateFile=<file>
```

---

# 21. Viewing PipelineRuns

List PipelineRuns:

```bash
tkn pr list
```

Example:

```text
NAME            STARTED          DURATION   STATUS
my-pipeline-4   10 minutes ago   6m47s      Succeeded
my-pipeline-3   1 day ago        2m0s       Succeeded
```

You can also use:

```bash
oc get pipelinerun
```

---

# 22. Viewing TaskRuns

List TaskRuns:

```bash
tkn tr list
```

Using OpenShift:

```bash
oc get taskrun
```

Remember:

```text
TaskRun     → tr
PipelineRun → pr
```

---

# 23. Pipeline Logs

View PipelineRun logs:

```bash
tkn pr logs my-pipeline-1
```

Follow/live logs:

```bash
tkn pr logs -f my-pipeline-1
```

If a command expects a single run but you do not provide one, `tkn` prompts you to select an available run.

---

# 24. Private/Secure Container Registries

OpenShift Pipelines uses standard Kubernetes `Secret` resources for registry authentication.

Supported Secret types include:

```text
kubernetes.io/basic-auth
```

Stores:

```text
username
password
```

Also:

```text
kubernetes.io/dockercfg
kubernetes.io/dockerconfigjson
```

These can store registry authentication tokens/configuration.

---

# 25. Tekton Registry Secret

A registry Secret requires a Tekton annotation.

Example:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-secret

  annotations:
    tekton.dev/docker-0: https://registry.example.com

type: kubernetes.io/basic-auth

stringData:
  username: <username>
  password: <password>
```

Important:

```text
tekton.dev/docker-0
```

tells Tekton which registry the credentials belong to.

---

# 26. ServiceAccount for Registry Authentication

Create a ServiceAccount and associate the Secret:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-sa

secrets:
  - name: my-secret
```

Relationship:

```text
Registry credentials
        ↓
      Secret
        ↓
 ServiceAccount
        ↓
PipelineRun / TaskRun
```

---

# 27. Assign ServiceAccount to PipelineRun

Example:

```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun

metadata:
  name: my-pipeline
  namespace: my-namespace

spec:

  serviceAccountName: my-sa

  pipelineRef:
    name: my-pipeline
```

The PipelineRun now uses:

```text
my-sa
```

which has access to:

```text
my-secret
```

for registry authentication.

---

# 28. Default Pipeline ServiceAccount

If a PipelineRun or TaskRun does not explicitly specify a ServiceAccount, OpenShift Pipelines can assign its configured default ServiceAccount.

The setting is:

```text
default-service-account
```

It can be found in the:

```text
config-defaults
```

ConfigMap in:

```text
openshift-pipelines
```

Inspect it:

```bash
oc get cm config-defaults \
  -n openshift-pipelines \
  -o yaml
```

---

# EX288 – Commands to Memorize

## Tasks

```bash
tkn t list
```

```bash
tkn t describe <task>
```

```bash
tkn t start <task>
```

```bash
oc get task
```

```bash
oc get task/<task> -o yaml
```

---

## Pipelines

```bash
tkn p list
```

```bash
tkn p describe <pipeline>
```

```bash
tkn p start <pipeline>
```

```bash
oc get pipeline
```

```bash
oc get pipeline/<pipeline> -o yaml
```

---

## Runs

```bash
tkn tr list
```

```bash
tkn pr list
```

```bash
tkn pr logs <pipelinerun>
```

```bash
tkn pr logs -f <pipelinerun>
```

```bash
oc get taskrun
```

```bash
oc get pipelinerun
```

---

## Start Pipeline with Workspace

```bash
tkn p start <pipeline> \
  -w name=<workspace>,volumeClaimTemplateFile=<pvc-file>
```

Example:

```bash
tkn p start my-pipeline \
  -w name=app-build,volumeClaimTemplateFile=pvc-template.yaml
```

---

## Inspect OpenShift Default Tasks

```bash
oc get task/buildah \
  -n openshift-pipelines \
  -o yaml
```

```bash
tkn -n openshift-pipelines t describe buildah
```

---

# EX288 – Key Relationships to Remember

## Definitions vs Executions

```text
Task -----------------> TaskRun
 definition             execution

Pipeline -------------> PipelineRun
 definition             execution
```

## Pipeline Structure

```text
Pipeline
 |
 +-- params
 |
 +-- workspaces
 |
 +-- tasks
       |
       +-- taskRef
       |
       +-- params
       |
       +-- workspaces
       |
       +-- runAfter
```

## Task Structure

```text
Task
 |
 +-- params
 |
 +-- results
 |
 +-- workspaces
 |
 +-- steps
       |
       +-- image
       |
       +-- script/command
```

## Shared Workspace

```text
Pipeline Workspace
       |
       +------ Task A workspace
       |
       +------ Task B workspace
```

## Registry Authentication

```text
Private Registry
       ↑
     Secret
       ↑
 ServiceAccount
       ↑
PipelineRun / TaskRun
```

---

# EX288 – High-Value Things to Recognize

### Parameter substitution

```text
$(params.NAME)
```

Example:

```text
$(params.GIT_REPO)
```

### Task result

```text
$(results.output.path)
```

### Task dependency

```yaml
runAfter:
  - fetch-repository
```

### Shared workspace

```yaml
workspaces:
  - name: source
    workspace: app-build
```

### Remote/default Task

```yaml
taskRef:
  resolver: cluster
```

### Pipeline execution

```text
Pipeline → PipelineRun
```

### Task execution

```text
Task → TaskRun
```

### Workspace PVC from CLI

```bash
-w name=app-build,volumeClaimTemplateFile=pvc-template.yaml
```

### Follow Pipeline logs

```bash
tkn pr logs -f <pipelinerun>
```

---

# Quick EX288 Troubleshooting Checklist

If a Pipeline does not run correctly:

```bash
oc project
oc get pipeline
oc get task
oc get pipelinerun
oc get taskrun
```

Then:

```bash
tkn pr list
tkn tr list
```

Inspect the Pipeline:

```bash
tkn p describe <pipeline>
```

Inspect a Task:

```bash
tkn t describe <task>
```

Check PipelineRun logs:

```bash
tkn pr logs <pipelinerun>
```

or follow them:

```bash
tkn pr logs -f <pipelinerun>
```

For YAML-level troubleshooting:

```bash
oc get pipeline/<pipeline> -o yaml
oc get task/<task> -o yaml
oc get pipelinerun/<run> -o yaml
oc get taskrun/<run> -o yaml
```

Check:

- Correct project/namespace
- Correct Task name
- Correct `taskRef`
- Correct parameter names
- Correct `$(params.NAME)` substitution
- Correct workspace bindings
- Correct `runAfter`
- Correct resolver for Tasks in `openshift-pipelines`
- PVC/workspace configuration
- ServiceAccount/Secret configuration for private registries
```

The **highest-value mental model** for this section is:

**Pipeline → Tasks → Steps**, while **PipelineRun → TaskRuns → running containers**.

Then remember that **params pass values, workspaces pass files/shared storage, results pass outputs, and `runAfter` controls execution order**. Those relationships make most of the Tekton YAML much easier to read rather than memorize line-by-line. 