# EX288 Command Reference

## 0. The exam rescue commands

These are arguably the most important commands to remember because they help you recover when you forget syntax.

```bash
# List API resources
oc api-resources

# Search resources
oc api-resources | grep -i build
oc api-resources | grep -i image
oc api-resources | grep -i pipeline

# Command help
oc new-app --help
oc set volumes --help
oc set triggers --help
oc create secret --help

# YAML/API documentation
oc explain <resource>
oc explain <resource>.spec
oc explain <resource>.spec --recursive
oc explain <resource>.spec.<field>

# Get examples from existing resources
oc get <resource> <name> -o yaml

# Validate YAML without changing cluster
oc apply -f resource.yaml --dry-run=server

# Generate YAML without creating resource
oc create <resource> ... --dry-run=client -o yaml

# General investigation
oc get all
oc status
oc describe <resource> <name>
oc get events --sort-by=.lastTimestamp
```

Mental rule:

```text
Forgot an oc command?
    → oc <command> --help

Forgot YAML?
    → oc explain

Forgot resource name?
    → oc api-resources

Something broken?
    → oc describe + oc logs + oc get events
```

---

# 1. Login, projects and context

### Login

```bash
oc login \
  -u <username> \
  -p <password> \
  https://<api-server>:6443
```

Check identity:

```bash
oc whoami
```

Server:

```bash
oc whoami --show-server
```

### Projects

```bash
oc get projects

oc new-project <project>

oc project <project>

oc project

oc delete project <project>
```

Current namespace:

```bash
oc project -q
```

Useful before doing anything destructive:

```bash
oc project
```

---

# 2. Basic application deployment

## Deploy an existing container image

```bash
oc new-app <image> --name=<app>
```

Example:

```bash
oc new-app \
  registry.example.com/myapp:1.0 \
  --name=myapp
```

Using an ImageStream:

```bash
oc new-app \
  --name=<app> \
  -i <imagestream>:<tag>
```

Cross-project ImageStream:

```bash
oc new-app \
  --name=<app> \
  -i <project>/<imagestream>:<tag>
```

Check:

```bash
oc get deploy
oc get pods
oc get svc
```

---

# 3. Expose applications

Create a Route from a Service:

```bash
oc expose svc/<service>
```

Check:

```bash
oc get route
```

Get hostname only:

```bash
oc get route <route> \
  -o jsonpath='{.spec.host}'
```

Test:

```bash
curl http://$(oc get route <route> -o jsonpath='{.spec.host}')
```

Inspect:

```bash
oc describe route <route>
```

---

# 4. Scale applications

```bash
oc scale deploy/<deployment> --replicas=3
```

Verify:

```bash
oc get deploy
oc get pods
```

---

# 5. Environment variables

Set:

```bash
oc set env deploy/<app> KEY=value
```

Multiple:

```bash
oc set env deploy/<app> \
  DB_HOST=mysql \
  DB_PORT=3306
```

List:

```bash
oc set env deploy/<app> --list
```

Remove:

```bash
oc set env deploy/<app> KEY-
```

---

# 6. ConfigMaps

Create from literals:

```bash
oc create configmap <name> \
  --from-literal=KEY=value
```

Multiple:

```bash
oc create configmap app-config \
  --from-literal=APP_MODE=production \
  --from-literal=LOG_LEVEL=info
```

From file:

```bash
oc create configmap <name> \
  --from-file=<file>
```

From directory:

```bash
oc create configmap <name> \
  --from-file=<directory>
```

Inspect:

```bash
oc get cm
oc describe cm <name>
oc get cm <name> -o yaml
```

### Inject ConfigMap as environment variables

```bash
oc set env deploy/<app> \
  --from=configmap/<configmap>
```

Specific key:

```bash
oc set env deploy/<app> \
  --from=configmap/<configmap> \
  --keys=<key>
```

---

# 7. Secrets

Generic secret:

```bash
oc create secret generic <name> \
  --from-literal=username=<username> \
  --from-literal=password=<password>
```

From file:

```bash
oc create secret generic <name> \
  --from-file=<file>
```

Inspect:

```bash
oc get secret
oc describe secret <name>
oc get secret <name> -o yaml
```

Decode:

```bash
echo -n '<base64>' | base64 --decode
```

Directly from OpenShift:

```bash
oc get secret <secret> \
  -o jsonpath='{.data.<key>}' | base64 --decode; echo
```

Encode:

```bash
echo -n '<value>' | base64
```

### Inject secret into application

```bash
oc set env deploy/<app> \
  --from=secret/<secret>
```

---

# 8. Registry pull secrets

Create:

```bash
oc create secret docker-registry registry-credentials \
  --docker-server=<registry> \
  --docker-username=<username> \
  --docker-password=<password> \
  --docker-email=<email>
```

Allow default ServiceAccount to pull:

```bash
oc secrets link default registry-credentials --for=pull
```

Inspect:

```bash
oc describe sa default
```

Remember:

```text
Source secret → Git authentication

Pull secret → Container registry authentication
```

---

# 9. Persistent storage

List storage classes:

```bash
oc get storageclass
```

PVCs:

```bash
oc get pvc
```

Create/mount PVC with `oc set volumes`:

```bash
oc set volumes deploy/<app> \
  --add \
  --name=<volume-name> \
  --type=pvc \
  --claim-name=<pvc-name> \
  --claim-size=1Gi \
  --claim-mode=rwo \
  --mount-path=<container-path>
```

Remember:

```text
--name
    Pod volume name

--claim-name
    PVC name

--mount-path
    Location inside container
```

Inspect:

```bash
oc set volumes deploy/<app>
oc describe deploy/<app>
oc get pvc
```

---

# 10. Health monitoring

## Readiness probe

```bash
oc set probe deploy/<app> \
  --readiness \
  --get-url=http://:8080/health
```

## Liveness probe

```bash
oc set probe deploy/<app> \
  --liveness \
  --get-url=http://:8080/health
```

Startup probe where applicable:

```bash
oc set probe deploy/<app> \
  --startup \
  --get-url=http://:8080/health
```

Inspect:

```bash
oc describe pod <pod>
```

YAML fields worth knowing:

```yaml
livenessProbe:
readinessProbe:
startupProbe:
```

Use:

```bash
oc explain deployment.spec.template.spec.containers.livenessProbe
```

---

# 11. Git essentials

```bash
git clone <repository>

git status

git add <file>
git add .

git commit -m "message"

git push

git pull

git log --oneline

git branch

git switch <branch>
```

Clone particular branch:

```bash
git clone -b <branch> <repository>
```

Check remotes:

```bash
git remote -v
```

---

# 12. Container image building

Login:

```bash
podman login <registry>
```

Build:

```bash
podman build -t <image>:<tag> .
```

Example:

```bash
podman build \
  -t registry.example.com/developer/myapp:1.0 .
```

List:

```bash
podman images
```

Run:

```bash
podman run --rm <image>
```

Inspect:

```bash
podman inspect <image>
```

Push:

```bash
podman push <image>
```

Remote inspection:

```bash
skopeo inspect docker://<registry>/<image>:<tag>
```

Good workflow:

```text
Build
 ↓
podman images
 ↓
Push
 ↓
skopeo inspect
 ↓
OpenShift import/deploy
```

---

# 13. ImageStreams

List:

```bash
oc get is
```

Tags:

```bash
oc get istag
```

Import external image:

```bash
oc import-image <is>:<tag> \
  --from=<registry>/<image>:<tag> \
  --confirm
```

Example:

```bash
oc import-image custom-server:latest \
  --from=registry.example.com/custom-server:1.0 \
  --confirm
```

Inspect:

```bash
oc describe is <is>
```

Specific tag:

```bash
oc describe istag/<is>:<tag>
```

Tag another image:

```bash
oc tag <source-image> <imagestream>:<tag>
```

Example:

```bash
oc tag \
  registry.example.com/ubi9/httpd-24:latest \
  httpd-24:latest
```

---

# 14. S2I

Core concept:

```text
Builder Image + Source Code
           ↓
          S2I
           ↓
Application Image
```

Create:

```bash
oc new-app \
  <builder-image>~<git-repository>
```

With name:

```bash
oc new-app \
  --name=<app> \
  <builder-image>~<git-repository>
```

Private Git:

```bash
oc create secret generic git-secret \
  --from-literal=username=<username> \
  --from-literal=password=<password>
```

Then:

```bash
oc new-app \
  --name=<app> \
  --source-secret=git-secret \
  <builder-image>~<git-repository>
```

Remember:

```text
IMAGE~SOURCE
```

means:

> Build SOURCE using IMAGE.

---

# 15. S2I scripts

Most important:

```text
assemble
    → build/prepare application

run
    → start application
```

Other possible scripts:

```text
save-artifacts
usage
```

Common location:

```bash
/usr/libexec/s2i/
```

Check:

```bash
podman run --rm <builder-image> \
  ls /usr/libexec/s2i/
```

Inspect S2I labels:

```bash
skopeo inspect docker://<image> | grep -i s2i
```

Remember:

> **Not every ImageStream/container image is an S2I builder.**

---

# 16. BuildConfigs

List:

```bash
oc get bc
```

Inspect:

```bash
oc describe bc/<name>
```

YAML:

```bash
oc get bc/<name> -o yaml
```

Build history:

```bash
oc get builds
```

Start build:

```bash
oc start-build <bc>
```

Follow:

```bash
oc start-build <bc> --follow
```

or:

```bash
oc logs -f bc/<bc>
```

Build logs:

```bash
oc logs build/<build-name>
```

---

# 17. Build triggers

Check:

```bash
oc set triggers bc/<name>
```

Typical output:

```text
TYPE       VALUE             AUTO
config                       true
image      httpd-24:latest   true
webhook    <secret>
github     <secret>
```

Important types:

```text
ConfigChange
ImageChange
GitHub
Generic
```

ImageChange means:

```text
ImageStreamTag changes
        ↓
BuildConfig detects change
        ↓
New build
```

Check YAML:

```bash
oc get bc/<name> -o yaml
```

Look for:

```yaml
triggers:
- type: ImageChange
  imageChange: {}
```

---

# 18. Build hooks

This is one area where I'd rely heavily on:

```bash
oc explain bc.spec
oc explain bc.spec --recursive
```

and inspect existing resources/examples.

After configuring a hook, verify using:

```bash
oc describe bc/<name>
oc start-build <name> --follow
oc logs build/<build>
```

The exam skill is not merely creating the hook — **verify that the supplied script actually ran successfully.**

---

# 19. Troubleshooting builds

Start here:

```bash
oc get bc
oc get builds
```

Failed build:

```bash
oc describe build/<build>
```

Logs:

```bash
oc logs build/<build>
```

BuildConfig:

```bash
oc describe bc/<bc>
```

Check source:

```bash
oc get bc/<bc> -o yaml
```

Check ImageStreams:

```bash
oc get is
oc get istag
oc describe is <is>
```

Check secrets:

```bash
oc get secret
```

Think:

```text
Git accessible?
     ↓
Source secret?
     ↓
Builder image exists?
     ↓
ImageStream valid?
     ↓
BuildConfig correct?
     ↓
Build logs?
     ↓
Output image generated?
```

---

# 20. Troubleshooting deployments

Start:

```bash
oc get pods
```

Then:

```bash
oc describe pod <pod>
```

Logs:

```bash
oc logs <pod>
```

Multiple containers:

```bash
oc logs <pod> -c <container>
```

Previous crashed container:

```bash
oc logs <pod> --previous
```

Shell:

```bash
oc rsh <pod>
```

or through service:

```bash
oc rsh svc/<service>
```

Execute:

```bash
oc exec <pod> -- <command>
```

Container:

```bash
oc exec <pod> -c <container> -- <command>
```

Events:

```bash
oc get events --sort-by=.lastTimestamp
```

Deployment:

```bash
oc describe deploy/<deployment>
```

Service:

```bash
oc describe svc/<service>
```

Endpoints:

```bash
oc get endpoints
```

This is very useful when:

> Route exists → Service exists → but application doesn't respond.

Check whether the Service actually has endpoints.

---

# 21. Rollouts

Status:

```bash
oc rollout status deploy/<app>
```

History:

```bash
oc rollout history deploy/<app>
```

Restart:

```bash
oc rollout restart deploy/<app>
```

Undo:

```bash
oc rollout undo deploy/<app>
```

---

# 22. Multi-container Pods

Inspect:

```bash
oc get pod <pod> -o yaml
```

Logs from specific container:

```bash
oc logs <pod> -c <container>
```

Shell:

```bash
oc rsh -c <container> <pod>
```

Execute:

```bash
oc exec <pod> -c <container> -- <command>
```

Remember that containers in the same Pod share:

- Pod network/IP
- localhost connectivity
- optionally shared volumes

but have separate filesystems unless a volume is shared.

---

# 23. Helm

Find installed releases:

```bash
helm list
```

Search:

```bash
helm search repo <name>
```

Add repository:

```bash
helm repo add <name> <URL>
helm repo update
```

Create chart:

```bash
helm create <chart-name>
```

Important structure:

```text
mychart/
├── Chart.yaml
├── values.yaml
└── templates/
```

Validate:

```bash
helm lint <chart>
```

Render without installing:

```bash
helm template <release> <chart>
```

Install:

```bash
helm install <release> <chart>
```

Values:

```bash
helm install <release> <chart> \
  --set key=value
```

or:

```bash
helm install <release> <chart> \
  -f values.yaml
```

Upgrade:

```bash
helm upgrade <release> <chart>
```

Rollback:

```bash
helm rollback <release> <revision>
```

History:

```bash
helm history <release>
```

Remove:

```bash
helm uninstall <release>
```

---

# 24. Kustomize

Typical structure:

```text
base/
├── deployment.yaml
├── service.yaml
└── kustomization.yaml
```

View generated manifests:

```bash
oc kustomize <directory>
```

Apply:

```bash
oc apply -k <directory>
```

Delete:

```bash
oc delete -k <directory>
```

Typical `kustomization.yaml`:

```yaml
resources:
- deployment.yaml
- service.yaml
```

Useful customizations include:

```yaml
namePrefix:
nameSuffix:
namespace:
labels:
images:
replicas:
patches:
```

Always preview:

```bash
oc kustomize .
```

Then:

```bash
oc apply -k .
```

---

# 25. Templates

List templates:

```bash
oc get templates
```

Inspect:

```bash
oc describe template <name>
```

Parameters:

```bash
oc process <template> --parameters
```

Process:

```bash
oc process <template>
```

Supply parameters:

```bash
oc process <template> \
  -p NAME=value \
  -p OTHER=value
```

Create resources:

```bash
oc process <template> \
  -p NAME=value | oc apply -f -
```

From file:

```bash
oc process -f template.yaml \
  -p NAME=value | oc apply -f -
```

Save generated objects:

```bash
oc process -f template.yaml \
  -p NAME=value > objects.yaml
```

---

# 26. Pipelines / Tekton

The key CLI is:

```bash
tkn
```

Know these objects:

```text
Task
TaskRun

Pipeline
PipelineRun
```

Conceptually:

```text
Task
  = reusable collection of steps

TaskRun
  = execution of a Task

Pipeline
  = collection/workflow of Tasks

PipelineRun
  = execution of Pipeline
```

List:

```bash
tkn task list
tkn pipeline list
tkn pipelinerun list
tkn taskrun list
```

Describe:

```bash
tkn task describe <task>
tkn pipeline describe <pipeline>
```

Start pipeline:

```bash
tkn pipeline start <pipeline>
```

Typical options:

```bash
tkn pipeline start <pipeline> \
  -p <parameter>=<value>
```

Watch logs:

```bash
tkn pipelinerun logs <run> -f
```

Latest:

```bash
tkn pipeline logs <pipeline> -L -f
```

Delete:

```bash
tkn pipelinerun delete <run>
```

Also remember these are Kubernetes/OpenShift resources:

```bash
oc get tasks
oc get taskruns
oc get pipelines
oc get pipelineruns
```

And therefore:

```bash
oc explain task
oc explain pipeline
oc explain pipelinerun
```

can be extremely valuable.

---

# 27. Tekton troubleshooting

Start:

```bash
tkn pipelinerun list
```

Then:

```bash
tkn pipelinerun describe <run>
```

Logs:

```bash
tkn pipelinerun logs <run>
```

OpenShift side:

```bash
oc get pods
oc describe pod <pipeline-pod>
oc get events --sort-by=.lastTimestamp
```

Look for:

```text
Bad parameter names
Missing workspace
Missing ServiceAccount
Git authentication
Registry authentication
Task failure
Incorrect task ordering
Failed container step
```

---

# 28. Operators

Discover installed Operators/resources:

```bash
oc get csv
```

CSV = ClusterServiceVersion.

Inspect:

```bash
oc describe csv <name>
```

Look for CRDs:

```bash
oc get crd
```

Search:

```bash
oc get crd | grep -i <operator>
```

Discover resources:

```bash
oc api-resources | grep -i <keyword>
```

Once you've identified the custom resource:

```bash
oc explain <custom-resource>
oc explain <custom-resource>.spec
oc explain <custom-resource>.spec --recursive
```

Then create the Custom Resource:

```bash
oc apply -f application.yaml
```

Verify:

```bash
oc get <custom-resource>
oc describe <custom-resource> <name>
```

This is the critical Operator concept:

```text
Operator installed
       ↓
CRD added to cluster
       ↓
You create Custom Resource (CR)
       ↓
Operator watches CR
       ↓
Operator creates/manages application
```

---

# 29. Internal OpenShift registry

Check registry-related services/routes where permissions allow:

```bash
oc get route -n openshift-image-registry
```

Get exposed registry hostname where configured:

```bash
oc get route default-route \
  -n openshift-image-registry
```

Login pattern:

```bash
podman login <registry> \
  -u $(oc whoami) \
  -p $(oc whoami -t)
```

Images pushed to the integrated registry conventionally follow the namespace/project relationship:

```text
<registry>/<project>/<image>:<tag>
```

Always verify the exact registry configuration/environment rather than assuming its exposure method.

---

# 30. Deployment strategies

For Kubernetes Deployment:

```bash
oc explain deployment.spec.strategy
```

Common:

```yaml
strategy:
  type: RollingUpdate
```

or:

```yaml
strategy:
  type: Recreate
```

For old OpenShift DeploymentConfig exercises:

```bash
oc explain dc.spec.strategy
```

Remember:

```text
Rolling
  → rollingParams

Recreate
  → recreateParams
```

Don't memorize giant DeploymentConfig YAML structures. Use:

```bash
oc explain dc.spec.strategy --recursive
```

and drill down.

---

# 31. JSONPath — extremely useful

Get Pod name:

```bash
oc get pods \
  -o jsonpath='{.items[0].metadata.name}'
```

Route hostname:

```bash
oc get route <route> \
  -o jsonpath='{.spec.host}'
```

Secret:

```bash
oc get secret <secret> \
  -o jsonpath='{.data.password}' | base64 -d; echo
```

Image:

```bash
oc get deploy <app> \
  -o jsonpath='{.spec.template.spec.containers[0].image}'
```

---

# 32. Editing resources quickly

Interactive:

```bash
oc edit deploy/<name>
```

Patch:

```bash
oc patch <resource>/<name> \
  --type=merge \
  -p '<JSON>'
```

Set image:

```bash
oc set image deploy/<app> \
  <container>=<image>
```

Resources:

```bash
oc set resources deploy/<app> \
  --requests=cpu=100m,memory=128Mi \
  --limits=cpu=500m,memory=512Mi
```

---

# 33. YAML generation trick

This can save you enormous amounts of time.

Instead of writing YAML from scratch:

```bash
oc create deployment test \
  --image=nginx \
  --dry-run=client \
  -o yaml > deployment.yaml
```

Secret:

```bash
oc create secret generic app-secret \
  --from-literal=password=secret \
  --dry-run=client \
  -o yaml > secret.yaml
```

ConfigMap:

```bash
oc create configmap app-config \
  --from-literal=MODE=prod \
  --dry-run=client \
  -o yaml > configmap.yaml
```

Then edit:

```bash
vim deployment.yaml
```

Validate:

```bash
oc apply \
  --dry-run=server \
  -f deployment.yaml
```

Apply:

```bash
oc apply -f deployment.yaml
```

---

# 34. My EX288 troubleshooting ladder

When something isn't working, don't randomly change things.

Use this sequence:

```text
1. Am I in the correct project?
        ↓
   oc project

2. What exists?
        ↓
   oc get all

3. Are Pods running?
        ↓
   oc get pods

4. Why isn't the Pod running?
        ↓
   oc describe pod <pod>

5. What does application say?
        ↓
   oc logs <pod>

6. Build problem?
        ↓
   oc get builds
   oc logs build/<build>

7. Image problem?
        ↓
   oc get is
   oc get istag
   oc describe is <is>

8. Service problem?
        ↓
   oc get svc
   oc get endpoints

9. Route problem?
        ↓
   oc get route
   oc describe route <route>

10. Cluster events?
        ↓
    oc get events --sort-by=.lastTimestamp
```

That workflow is far more valuable than memorizing error messages.

# The commands I would memorize cold

You don't need every command above committed to memory. These are the ones I'd want you to be able to type without thinking:

```bash
oc login
oc project
oc new-project

oc get
oc describe
oc logs
oc exec
oc rsh

oc new-app
oc expose

oc create secret
oc create configmap
oc set env
oc set volumes
oc set probe
oc set image

oc get is
oc get istag
oc import-image
oc tag

oc get bc
oc get builds
oc start-build
oc set triggers

oc apply -f
oc apply -k

oc api-resources
oc explain
oc <command> --help

git clone
git add
git commit
git push

podman build
podman images
podman login
podman push

skopeo inspect

helm create
helm install
helm upgrade
helm template
helm lint

tkn task
tkn pipeline
tkn pipelinerun
```

Everything else can largely be **reconstructed from `--help`, `oc explain`, existing YAML and generated YAML**.

Given where you are in your EX288 preparation, I would concentrate much less on memorising every flag now and much more on being able to solve an unfamiliar problem using those discovery commands. That's exactly what you've been doing with `oc explain`, ImageStreams, S2I, triggers and volumes over the last couple of days.