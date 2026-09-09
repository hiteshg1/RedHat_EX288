# EX288 — Helm Charts Study Notes

## 1. Core Helm concepts

**Helm** is a package manager for Kubernetes/OpenShift applications.

A **Chart** is the application package containing parameterized Kubernetes/OpenShift manifests.

A **Release** is a deployed instance of a chart.

Think:

```text
Chart
  ↓ helm install
Release
  ↓
OpenShift resources
Deployment / Service / Route / ConfigMap / etc.
```

Unlike an OpenShift Template, Helm charts are widely used across Kubernetes, not OpenShift-specific.

---

## 2. Typical chart structure

Know what these files/directories mean:

```text
mychart/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    └── route.yaml
```

### `Chart.yaml`

Metadata describing the chart:

```yaml
apiVersion: v2
name: myapp
description: My application
version: 1.0.0
appVersion: "1.0"
```

Important distinction:

```text
version:     version of the HELM CHART
appVersion:  version of the APPLICATION
```

### `values.yaml`

Contains configurable/default values:

```yaml
replicaCount: 1

image:
  repository: quay.io/example/myapp
  tag: latest

service:
  port: 8080
```

### `templates/`

Contains the Kubernetes/OpenShift resource manifests with Helm expressions:

```yaml
spec:
  replicas: {{ .Values.replicaCount }}
```

Values from `values.yaml` are referenced with:

```text
{{ .Values.<name> }}
```

For example:

```yaml
image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```

---

# 3. Create a new Helm chart

```bash
helm create mychart
```

This generates a starter chart.

Then:

```bash
ls mychart
```

You'll see things such as:

```text
Chart.yaml
values.yaml
templates/
charts/
```

For EX288, know:

```bash
helm create <chart-name>
```

---

# 4. Validate a chart

One of the commands I'd definitely remember:

```bash
helm lint mychart
```

Think:

> **lint = check my chart for problems**

Especially useful after editing YAML/templates.

Typical exam workflow:

```bash
helm lint ./mychart
```

before attempting deployment.

---

# 5. Render the templates WITHOUT deploying

This is what the section you quoted is demonstrating:

```bash
helm template mychart
```

It processes the templates and prints the resulting Kubernetes YAML.

**It does NOT deploy anything.**

For example:

```bash
helm template ./mychart
```

might output:

```yaml
---
apiVersion: v1
kind: Service
...
---
apiVersion: apps/v1
kind: Deployment
...
```

This is an extremely useful troubleshooting command.

Think:

```text
helm template
      ↓
Render YAML
      ↓
Inspect it
      ↓
Nothing deployed
```

---

# 6. `helm template` can also inspect a remote chart

This is the specific point from your quoted section.

You don't have to download/install a chart to see what manifests it generates.

For example:

```bash
helm template openshift-helm-charts/redhat-quarkus
```

Helm fetches/processes the remote chart and displays the generated resources.

This is useful when you want to:

> **Inspect what a chart will create before deploying it.**

That's a useful EX288 troubleshooting concept.

---

# 7. Add a Helm repository

Helm repositories contain charts.

General syntax:

```bash
helm repo add <name> <URL>
```

Then update your local repository information:

```bash
helm repo update
```

List configured repositories:

```bash
helm repo list
```

Pattern to remember:

```bash
helm repo add myrepo <URL>
helm repo update
helm repo list
```

---

# 8. Search for charts

Search configured repositories:

```bash
helm search repo <name>
```

For example:

```bash
helm search repo quarkus
```

Or:

```bash
helm search repo openshift-helm-charts
```

So:

```text
helm repo add       → add repository
helm repo update    → refresh repository metadata
helm search repo    → find charts
```

---

# 9. Inspect chart information

Useful commands include:

```bash
helm show chart <chart>
```

Shows `Chart.yaml` information.

```bash
helm show values <chart>
```

This one is particularly useful because it tells you:

> **What values can I customize?**

For example:

```bash
helm show values openshift-helm-charts/redhat-quarkus
```

You can also show everything:

```bash
helm show all <chart>
```

For EX288, I'd particularly remember:

```bash
helm show values <chart>
```

---

# 10. Install a chart

Basic syntax:

```bash
helm install <release-name> <chart>
```

Example:

```bash
helm install expense ./expense-chart
```

Here:

```text
expense          = RELEASE name
./expense-chart  = CHART
```

This distinction matters.

You could deploy the same chart twice:

```bash
helm install expense-dev ./expense-chart
helm install expense-test ./expense-chart
```

Same chart, two different releases.

---

# 11. Install a remote chart

If a repository is configured:

```bash
helm install myapp \
  openshift-helm-charts/redhat-quarkus
```

Conceptually:

```text
Repository
   ↓
Chart
   ↓ helm install
Release
   ↓
OpenShift resources
```

---

# 12. Override chart values

This is **very important for EX288**.

Suppose `values.yaml` contains:

```yaml
replicaCount: 1
```

Override it:

```bash
helm install myapp ./mychart \
  --set replicaCount=3
```

Multiple values:

```bash
helm install myapp ./mychart \
  --set replicaCount=3 \
  --set image.tag=1.2
```

Think:

```text
values.yaml
     ↓
default configuration

--set
     ↓
override configuration
```

---

# 13. Use a custom values file

Instead of lots of `--set` arguments:

```bash
helm install myapp ./mychart \
  -f custom-values.yaml
```

This is cleaner when changing many values.

For example:

```yaml
replicaCount: 3

image:
  tag: "2.0"
```

Then:

```bash
helm install myapp ./mychart \
  -f custom-values.yaml
```

Know both:

```bash
--set key=value
```

and:

```bash
-f values-file.yaml
```

---

# 14. List deployed releases

```bash
helm list
```

or:

```bash
helm ls
```

Typical output identifies:

```text
NAME        NAMESPACE
expense     myproject
```

This lists **Helm releases**, not charts.

Compare:

```text
helm search repo    → available charts

helm list           → installed releases
```

---

# 15. Inspect a release

```bash
helm status expense
```

This tells you about the deployed release.

You can then combine Helm and OpenShift troubleshooting:

```bash
helm status expense
oc get pods
oc get deploy
oc get svc
oc get route
```

That's likely how I'd work during EX288.

---

# 16. Upgrade an existing release

Suppose you've modified your chart:

```bash
helm upgrade expense ./expense-chart
```

Or override values:

```bash
helm upgrade expense ./expense-chart \
  --set replicaCount=3
```

Very important distinction:

```text
helm install
     ↓
create NEW release

helm upgrade
     ↓
modify EXISTING release
```

---

# 17. `upgrade --install`

A useful pattern:

```bash
helm upgrade --install expense ./expense-chart
```

Meaning:

> Upgrade `expense` if it exists; otherwise install it.

Recognize this even if you don't make it your primary exam command.

---

# 18. Uninstall a release

```bash
helm uninstall expense
```

This removes the Helm release and the resources managed by that release.

Workflow:

```text
helm install expense ./chart
        ↓
helm list
        ↓
helm upgrade expense ./chart
        ↓
helm uninstall expense
```

---

# 19. Troubleshooting workflow

For EX288, I'd memorize this sequence rather than lots of obscure Helm options.

You've modified a chart:

```bash
helm lint ./mychart
```

Then see what it will generate:

```bash
helm template ./mychart
```

If that looks correct:

```bash
helm install myapp ./mychart
```

Then:

```bash
helm list
helm status myapp
```

Finally use OpenShift:

```bash
oc get pods
oc get deploy
oc get svc
oc get route
```

If something fails:

```bash
oc describe pod <pod>
oc logs <pod>
```

So:

```text
EDIT
 ↓
helm lint
 ↓
helm template
 ↓
helm install / upgrade
 ↓
helm status
 ↓
oc get pods
 ↓
oc logs / oc describe
```

That's a strong exam workflow.

---

# 20. Helm vs OpenShift Templates

Since you just studied Templates, this comparison is worth remembering.

| OpenShift Template | Helm |
|---|---|
| OpenShift-specific | Kubernetes ecosystem |
| `kind: Template` | Chart directory |
| `objects:` | `templates/` |
| `parameters:` | `values.yaml` |
| `${APP_NAME}` | `{{ .Values.appName }}` |
| `oc process` | `helm template` |
| `oc new-app -f` | `helm install` |
| Parameters with `-p` | Values with `--set` / `-f` |

There's a particularly useful mental mapping:

```text
OPENSHIFT TEMPLATE             HELM

${APP_NAME}                    {{ .Values.appName }}

parameters:                    values.yaml

oc process                     helm template

oc new-app                     helm install
```

That should make the two objectives much easier to keep straight.

# EX288 Helm command sheet

For your notes, this is the condensed version I'd actually memorize:

```bash
# ==========================================
# HELM — EX288
# ==========================================

# Create chart
helm create <chart>

# Validate chart
helm lint ./<chart>

# Render YAML WITHOUT deploying
helm template ./<chart>

# Render remote chart WITHOUT deploying
helm template <repo>/<chart>


# ---------- REPOSITORIES ----------

helm repo add <repo> <URL>
helm repo update
helm repo list

helm search repo <name>


# ---------- INSPECT CHART ----------

helm show chart <repo>/<chart>
helm show values <repo>/<chart>
helm show all <repo>/<chart>


# ---------- INSTALL ----------

helm install <release> ./<chart>

helm install <release> <repo>/<chart>

# Override value
helm install <release> ./<chart> \
  --set key=value

# Custom values file
helm install <release> ./<chart> \
  -f custom-values.yaml


# ---------- MANAGE RELEASE ----------

helm list

helm status <release>

helm upgrade <release> ./<chart>

helm upgrade <release> ./<chart> \
  --set key=value

helm upgrade --install <release> ./<chart>

helm uninstall <release>


# ---------- OPENSHIFT VERIFY ----------

oc get deploy
oc get pods
oc get svc
oc get route
```

### The commands I'd absolutely know without notes

If time is limited, prioritize:

```bash
helm create
helm lint
helm template
helm install
helm list
helm status
helm upgrade
helm uninstall
helm show values
```

plus:

```text
--set key=value
-f custom-values.yaml
```

And conceptually, the single most important distinction is:

**`helm template` renders manifests for inspection; `helm install` actually creates a release.**

That is almost identical to the distinction you just learned between **`oc process`** and actually creating resources from an OpenShift Template.