EX288 is a performance-based exam: the objective is to leave the cluster in the required state. Where the GUI makes a task faster and less error-prone, use it. But there are several objectives where the CLI/YAML is dramatically better—or effectively unavoidable.

I'd build your strategy around **GUI for configuration, inspection and simple resource creation; CLI/YAML for builds, automation, Git, Helm, Kustomize, templates and Tekton.**

## My EX288 GUI vs CLI map for you

| Exam objective | GUI | CLI/YAML | Recommendation |
|---|:---:|:---:|---|
| Create/switch projects | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **CLI** |
| Deploy simple application | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **GUI** |
| Deploy multi-container application | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **YAML/CLI** |
| Configure health probes | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **GUI** |
| Git operations | ⭐ | ⭐⭐⭐⭐⭐ | **CLI** |
| Internal registry | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **CLI** |
| PVC/storage | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | **GUI** |
| Mount PVC into Deployment | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | **GUI** |
| Environment variables | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **GUI** |
| ConfigMaps | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **GUI** |
| Secrets | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **GUI** |
| Attach ConfigMap/Secret | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **GUI** |
| Routes | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Either |
| Services | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **GUI** |
| Scaling | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Either |
| Helm | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **CLI** |
| Kustomize | ⭐ | ⭐⭐⭐⭐⭐ | **CLI** |
| Containerfiles | — | ⭐⭐⭐⭐⭐ | **CLI/editor** |
| BuildConfig | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Mostly **CLI/YAML** |
| S2I | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **CLI** |
| ImageStreams | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Mostly **CLI** |
| Build hooks/triggers | ⭐⭐ | ⭐⭐⭐⭐⭐ | **CLI/YAML** |
| Templates | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **CLI/YAML** |
| Tekton/Pipelines | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **GUI + CLI/YAML** |
| Operators | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | **GUI** |
| Troubleshooting | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Both** |

There are some important nuances, though.

---

# 1. Projects — CLI

Don't waste GUI time creating and switching projects.

```bash
oc new-project project1
oc new-project project2

oc project project1
oc project
oc get projects
```

The CLI is considerably faster here.

**Exam choice: CLI.**

---

# 2. Simple application deployment — GUI is excellent

This is an area where the Developer perspective can save you time.

For example, if you're given a Git repository and told to deploy it, **+Add → Import from Git** can:

- identify the builder
- create the application
- create the BuildConfig/resources
- configure the service
- create a route
- configure deployment settings

That's potentially much easier than constructing a long:

```bash
oc new-app ...
```

command.

But you absolutely need to understand what the GUI created.

Immediately inspect it:

```bash
oc get all
oc get bc
oc get is
oc get svc
oc get route
```

### Recommendation

**GUI to create → CLI to verify.**

---

# 3. Multi-container applications — YAML

Here I'd move back to YAML.

If the exam gives you something like:

> Deploy an application containing frontend and sidecar containers in the same pod.

Editing YAML is much clearer because you can see:

```yaml
spec:
  template:
    spec:
      containers:
        - name: frontend
          ...
        - name: sidecar
          ...
```

Trying to construct more complicated pod specifications through GUI forms can actually slow you down.

**Exam choice: YAML.**

---

# 4. Health monitoring/probes — GUI ⭐

This is one of the strongest candidates for GUI use.

If you're told:

> Configure a readiness probe using `/health` on port 8080.

The GUI lets you configure:

- Readiness probe
- Liveness probe
- Startup probe
- HTTP GET
- TCP
- Command
- Initial delay
- Timeout
- Failure threshold
- Period

without worrying about YAML structure.

Then verify:

```bash
oc describe deploy myapp
```

or:

```bash
oc get deploy myapp -o yaml
```

**Exam choice: GUI.**

---

# 5. Git — CLI

Definitely CLI.

You need these instinctively:

```bash
git clone <repo>
git status
git add .
git commit -m "..."
git push
git log --oneline
```

And potentially:

```bash
git branch
git switch
git pull
```

The OpenShift GUI doesn't replace this.

**Exam choice: CLI.**

---

# 6. Internal registry — CLI

Stay at the terminal.

Commands such as:

```bash
oc registry info
```

```bash
oc whoami -t
```

```bash
podman login \
  -u $(oc whoami) \
  -p $(oc whoami -t) \
  $(oc registry info)
```

And inspecting ImageStreams:

```bash
oc get is
oc describe is <name>
```

Registry configuration and authentication are much easier to understand from CLI.

**Exam choice: CLI.**

---

# 7. Persistent storage — GUI ⭐⭐⭐⭐⭐

You've just discovered this one yourself.

For something like:

> Create a 1Gi RWO PVC called `postgres-pvc`.

GUI wins.

Then:

```bash
oc get pvc
```

For:

> Mount `postgres-pvc` at `/var/lib/pgsql/data`

GUI again.

Then verify:

```bash
oc get pvc
oc describe pod <pod>
```

You don't gain many exam points by memorizing:

```bash
oc set volume deploy/postgresql \
  --add \
  --name=postgresql-data \
  -t pvc \
  --claim-name=postgres-pvc \
  --mount-path=/var/lib/pgsql/data
```

Understand what it does, but use the GUI if that's faster for you.

**Exam choice: GUI.**

---

# 8. ConfigMaps — GUI is very good

Suppose:

> Create a ConfigMap containing `APP_MODE=production` and `LOG_LEVEL=debug`.

That's extremely easy in the GUI.

You can then verify:

```bash
oc get cm
oc describe cm <name>
```

or:

```bash
oc get cm <name> -o yaml
```

For simple literal values, CLI is also ridiculously fast:

```bash
oc create configmap app-config \
  --from-literal=APP_MODE=production \
  --from-literal=LOG_LEVEL=debug
```

So I'd say:

**GUI for complicated/manual data.**

**CLI for simple literals/files.**

---

# 9. Secrets — GUI ⭐⭐⭐⭐⭐

Another excellent GUI task.

Create the Secret and add key/value pairs without having to think about encoding.

Remember that:

```yaml
data:
```

values are base64 encoded, whereas:

```yaml
stringData:
```

accepts strings.

The GUI avoids mistakes here.

Then:

```bash
oc get secret
oc describe secret <name>
```

**Exam choice: GUI.**

---

# 10. Inject ConfigMaps and Secrets — GUI

Another place I'd use the console.

If you're asked:

> Make the application consume the database credentials from Secret `db-secret`.

The Deployment UI makes it easy to add environment variables/configuration.

But learn these commands for troubleshooting:

```bash
oc set env deploy/myapp --list
```

and:

```bash
oc describe deploy myapp
```

**Exam choice: GUI create/configure → CLI verify.**

---

# 11. Helm — CLI

You need Helm commands.

```bash
helm create mychart
helm install myapp ./mychart
helm upgrade myapp ./mychart
helm list
helm uninstall myapp
```

And:

```bash
helm template myapp ./mychart
```

You need to understand:

```text
Chart.yaml
values.yaml
templates/
```

The GUI won't save you from understanding Helm templating.

**Exam choice: CLI.**

---

# 12. Kustomize — absolutely CLI/YAML

Don't bother trying to GUI your way through this.

Know:

```text
base/
overlays/
```

and:

```bash
oc apply -k overlays/dev
```

or:

```bash
kubectl kustomize overlays/dev
```

You need to understand `kustomization.yaml`.

**Exam choice: CLI/YAML.**

---

# 13. Container images — CLI

Containerfile/Dockerfile work belongs in the terminal.

```Dockerfile
FROM registry.access.redhat.com/ubi9/ubi

RUN ...

COPY ...

CMD [...]
```

Then:

```bash
podman build -t myimage .
podman images
podman run ...
podman push ...
```

**Exam choice: CLI.**

---

# 14. BuildConfig / OpenShift builds — mixed

The GUI is excellent for **observing** builds.

You can quickly see:

- Successful
- Failed
- Running
- Build logs
- Build history

But creation/manipulation is usually faster with CLI:

```bash
oc get bc
oc describe bc myapp
oc start-build myapp
```

Watch:

```bash
oc get builds
```

Logs:

```bash
oc logs build/myapp-1
```

or:

```bash
oc logs -f build/myapp-1
```

### Recommendation

**CLI to manipulate; GUI to visualize.**

---

# 15. ImageStreams — CLI

I'd make this one a CLI strength.

```bash
oc get is
oc describe is myapp
```

```bash
oc import-image ...
```

```bash
oc tag ...
```

And understand:

```text
ImageStream
    ↓
ImageStreamTag
    ↓
Deployment
```

The GUI helps you see them, but CLI makes relationships easier to interrogate.

**Exam choice: CLI.**

---

# 16. S2I — CLI

This is one of your **must-practice CLI areas**.

You should be comfortable with:

```bash
oc new-app <builder>~<git-repository>
```

and then:

```bash
oc get bc
oc get builds
oc logs build/<build>
oc get is
oc get pods
```

This ties together:

```text
Git
 ↓
BuildConfig
 ↓
S2I Builder
 ↓
Build
 ↓
ImageStream
 ↓
Deployment
```

This is core EX288 knowledge.

**Exam choice: CLI.**

---

# 17. Build hooks and triggers — CLI/YAML

Don't depend on GUI here.

You'll need to understand BuildConfig YAML:

```yaml
spec:
  triggers:
```

and lifecycle hooks/configuration where relevant.

Useful commands:

```bash
oc get bc
oc describe bc <name>
oc start-build <name>
oc logs -f build/<name>
```

**Exam choice: CLI/YAML.**

---

# 18. Templates — CLI/YAML

Another area where you should know the files.

Typical workflow:

```bash
oc process -f template.yaml
```

then:

```bash
oc process -f template.yaml \
  -p APP_NAME=myapp
```

and:

```bash
oc process -f template.yaml \
  -p APP_NAME=myapp | oc apply -f -
```

You need to understand parameters:

```yaml
parameters:
  - name: APP_NAME
    value: myapp
```

**Exam choice: CLI/YAML.**

---

# 19. OpenShift Pipelines/Tekton — USE BOTH

Here's an area where I'd encourage you to exploit the GUI.

The Pipelines UI is genuinely useful for understanding:

```text
Pipeline
   ↓
PipelineRun
   ↓
Tasks
   ↓
Steps
```

You can visually see:

```text
clone → build → deploy
```

and immediately identify which Task failed.

But you still need YAML knowledge because Tekton is CRD-driven:

```yaml
apiVersion: tekton.dev/v1
kind: Task
```

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
```

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
```

and CLI:

```bash
oc get tasks
oc get pipelines
oc get pipelineruns
oc describe pipelinerun <name>
```

If `tkn` is available:

```bash
tkn pipeline list
tkn pipeline start <name>
tkn pipelinerun logs <name> -f
```

### Recommendation

**GUI for visualization/troubleshooting + YAML/CLI for creation/correction.**

---

# 20. Operators — GUI ⭐⭐⭐⭐⭐

This is another place I'd heavily exploit the web console.

OperatorHub makes it much easier to:

- Find installed Operators
- Inspect provided APIs
- Create operands
- View CRDs
- See available configuration fields
- Inspect status

If the exam says something like:

> Create an application using the installed X Operator.

I'd absolutely look at:

**Operators → Installed Operators → Operator → Provided APIs**

and see what resources it exposes.

**Exam choice: GUI.**

---

# 21. Troubleshooting — BOTH, but CLI ultimately wins

This is where I don't want you becoming GUI-dependent.

The GUI gives you an excellent visual starting point:

**Developer → Topology**

and you can quickly spot:

- crash loops
- failed builds
- unhealthy deployments
- broken routes
- pipeline failures

But once you've identified the broken component, go terminal:

```bash
oc get pods
```

```bash
oc describe pod <pod>
```

```bash
oc logs <pod>
```

```bash
oc logs <pod> -c <container>
```

```bash
oc get events --sort-by=.lastTimestamp
```

Build failure:

```bash
oc get builds
oc logs build/<build>
```

Deployment:

```bash
oc describe deploy <deployment>
```

Service:

```bash
oc get svc
oc get endpoints
```

Route:

```bash
oc get route
```

PVC:

```bash
oc get pvc
oc describe pvc <pvc>
```

**Exam choice: GUI identify → CLI diagnose.**

---

# Your EX288 "GUI-first" strategy

I'd actually change the way you're preparing now.

Think of the exam as having **three buckets**.

### 🟢 Exploit the GUI

These are areas where I'd actively encourage you to use the console:

```text
PVC creation
PVC attachment/mount paths
Secrets
ConfigMaps
Environment variables
Health probes
Services
Routes
Scaling
Simple application deployment
Operator applications
Pipeline visualization
Build visualization
Pod/log inspection
Topology
```

These are high-value opportunities to save time and avoid syntax errors.

### 🟡 GUI + CLI

Use whichever gives you the quickest path:

```text
Application deployment
BuildConfigs
ImageStreams
Pipelines
Troubleshooting
ConfigMap/Secret injection
Deployment configuration
Routes
Services
```

A particularly effective pattern is:

```text
GUI
 ↓
Make change
 ↓
CLI
 ↓
Verify state
```

### 🔴 You need CLI/YAML competence

Don't try to escape these:

```text
Git
Containerfiles
Podman
S2I
Helm
Kustomize
Templates
Build hooks
Build triggers
ImageStream tagging/importing
Internal registry
Tekton YAML
Multi-container YAML
Build troubleshooting
Deployment troubleshooting
```

---

## One technique could make this even more powerful

The OpenShift console's **YAML tab** can become part of your exam workflow.

You just demonstrated it with your PVC.

You created this using the GUI:

```yaml
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: crc-csi-hostpath-provisioner
  volumeMode: Filesystem
```

So rather than thinking:

> "GUI or YAML?"

think:

> **"GUI can generate/edit YAML for me."**

For example, configure a readiness probe using the GUI and then look at the Deployment's YAML. You'll see what OpenShift generated.

That reinforces the syntax **without requiring you to construct everything from memory**.

---

# What I'd prioritise in your remaining EX288 preparation

Given that you're already comfortable with `oc`, OpenShift resources, Linux, Git and containers, I wouldn't spend precious study time trying to become a human YAML generator. 

I'd concentrate your command memorisation on the areas where the GUI **cannot rescue you easily**:

```text
git
oc new-app
oc start-build
oc logs
oc describe
oc import-image
oc tag
oc process
oc apply -k
helm
podman
tkn
```

And become extremely comfortable with:

```bash
oc get all
oc get pods
oc get bc
oc get builds
oc get is
oc get svc
oc get route
oc get pvc

oc describe <resource>
oc logs <resource>
oc get <resource> -o yaml
```

Those commands plus the GUI give you a very strong combination.

In fact, based on what we've just seen with the PVC, **I'd modify how we approach your EX288 practice questions from here onward**: rather than forcing every question through the CLI, we can explicitly identify the **fastest exam method** for each task — GUI, CLI, YAML, or a combination — while still making sure you understand the underlying OpenShift resource.