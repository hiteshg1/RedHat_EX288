# Question 10: Build and Deploy with OpenShift Pipelines and Triggers

## Scenario

You are starting with no application repository and no resources in the OpenShift project for this exercise. Build a repeatable CI/CD workflow for a small web application using Red Hat OpenShift Pipelines.

The finished application must respond with `Hello, Pipelines!` at:

```text
http://pipeline-app-cicd.apps-crc.testing
```

## Administrator preparation

These actions require `kubeadmin` or another cluster administrator. Complete them before the student starts the exercise.

### 1. Verify OpenShift Pipelines

Confirm that Red Hat OpenShift Pipelines is installed and ready:

```bash
oc get csv -n openshift-operators | grep -i pipelines
oc get tektonconfig
oc get pods -n openshift-pipelines
oc get task -n openshift-pipelines
```

The Pipelines CSV must be `Succeeded`, the TektonConfig must be ready, and the following Tasks must exist in the `openshift-pipelines` namespace:

- `git-clone`
- `buildah`
- `openshift-client`

If those Tasks do not exist, stop and repair the Pipelines installation before continuing. Do not substitute unverified third-party task definitions.

### 2. Prepare access to the `cicd` project

Create the project and give the student access:

```bash
oc new-project cicd 2>/dev/null || true
oc adm policy add-role-to-user edit developer -n cicd
```

Create the service account that will run Pipeline tasks and give it the lab permissions needed to build, push, and deploy:

```bash
oc create serviceaccount pipeline -n cicd 2>/dev/null || true
oc policy add-role-to-user system:image-builder -z pipeline -n cicd
oc policy add-role-to-user edit -z pipeline -n cicd
```

Confirm the service account can use the Pipelines security context constraint:

```bash
oc auth can-i use securitycontextconstraints/pipelines-scc \
  --as=system:serviceaccount:cicd:pipeline
```

If the result is `no`, grant it as an administrator:

```bash
oc adm policy add-scc-to-user pipelines-scc -z pipeline -n cicd
```

### 3. Confirm webhook reachability

This CRC cluster is private. A GitLab.com webhook cannot reach a private CRC route unless approved public ingress or a tunnel is available.

For the required automated-trigger practice, the student must at minimum send a GitLab-style HTTP payload from the Fedora host to the EventListener route. A real GitLab webhook is an optional extension only after external reachability is confirmed.

## Student instructions

### 1. Create the GitLab repository

In GitLab, create a new **blank** project with these settings:

- Namespace: `hits.govind`
- Project name: `pipeline-app`
- Visibility: **Public**
- Do not initialize the project with a README, `.gitignore`, or licence.

The repository URL must be:

```text
https://gitlab.com/hits.govind/pipeline-app.git
```

### 2. Create and push the application source

On the Fedora host, create a local Git repository whose initial branch is `main`:

```bash
mkdir -p ~/gitlab/pipeline-app
cd ~/gitlab/pipeline-app
git init -b main
```

Create these files in the repository root.

`Containerfile`:

```dockerfile
FROM registry.access.redhat.com/ubi9/python-311:latest
WORKDIR /opt/app-root/src
COPY --chown=1001:0 index.html ./index.html
EXPOSE 8080
CMD ["python3", "-m", "http.server", "8080"]
```

`index.html`:

```html
Hello, Pipelines!
```

Commit and push the files to the remote repository:

```bash
git add Containerfile index.html
git commit -m "Add pipeline application"
git remote add origin https://gitlab.com/hits.govind/pipeline-app.git
git push -u origin main
```

Verify the branch is available before creating any PipelineRun:

```bash
git ls-remote https://gitlab.com/hits.govind/pipeline-app.git refs/heads/main
```

The command must display a commit hash and `refs/heads/main`.

### 3. Log in to OpenShift and select the project

```bash
oc login -u developer -p developer https://api.crc.testing:6443
oc project cicd
```

### 4. Create the Pipeline

Create a Tekton `Pipeline` named `build-and-deploy`.

The Pipeline must define these parameters:

- Git URL: `https://gitlab.com/hits.govind/pipeline-app.git`
- Git revision: `main`
- Image: `image-registry.openshift-image-registry.svc:5000/cicd/pipeline-app:latest`
- Application route host: `pipeline-app-cicd.apps-crc.testing`

Define one workspace named `shared-data`.

The tasks must run in this order:

1. `fetch-repository` uses the `git-clone` Task to clone the Git repository into `shared-data`.
2. `build-image` uses the `buildah` Task to build the `Containerfile` from `shared-data` and push `pipeline-app:latest` to the integrated registry.
3. `deploy` uses the `openshift-client` Task to create or update the application Deployment, Service, and Route, then waits for rollout.

Use `runAfter` to enforce the order. The clone and build tasks must bind the same `shared-data` workspace. The deploy task consumes the image and does not need that workspace.

### 5. Start and verify a manual PipelineRun

Create a `PipelineRun` for `build-and-deploy`.

- Set `spec.taskRunTemplate.serviceAccountName` to `pipeline`.
- Bind `shared-data` to a `volumeClaimTemplate` requesting `1Gi` with `ReadWriteOnce` access.

Wait for the PipelineRun to succeed. Then verify that the Deployment, Service, and Route exist and that:

```bash
curl --noproxy '*' http://pipeline-app-cicd.apps-crc.testing
```

returns:

```text
Hello, Pipelines!
```

### 6. Add webhook-triggered PipelineRuns

Create the following Tekton Triggers resources in `cicd`:

- A ServiceAccount for the EventListener.
- RBAC that allows that service account to create PipelineRuns.
- A `TriggerBinding` that reads `project.git_http_url` and `checkout_sha` from a GitLab-style push payload.
- A `TriggerTemplate` that creates a new `build-and-deploy` PipelineRun.
- An `EventListener` that connects the binding and template.

Each triggered PipelineRun must use `pipeline` as its task service account and create its own `shared-data` PVC through a `volumeClaimTemplate`.

Expose the EventListener Service with a Route. From the Fedora host, send a GitLab-style HTTP POST to that route and verify a new PipelineRun is created.

## Completion criteria

- The public GitLab repository exists and contains `Containerfile` and `index.html` on `main`.
- `Pipeline/build-and-deploy` exists in `cicd`.
- The Pipeline runs `fetch-repository` → `build-image` → `deploy` in order.
- Each PipelineRun has its own PVC-backed `shared-data` workspace.
- A manual PipelineRun succeeds.
- A GitLab-style trigger payload creates a new PipelineRun.
- The application returns `Hello, Pipelines!` at `http://pipeline-app-cicd.apps-crc.testing`.
