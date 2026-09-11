# LinkedIn Learning


## Helm commands worth getting back into muscle memory
```bash
# Add repository
helm repo add cert-manager https://charts.jetstack.io

# List repositories
helm repo list

# Refresh repository metadata
helm repo update

# Search repository
helm search repo cert-manager

# Show available versions
helm search repo cert-manager/cert-manager --versions

# Inspect chart defaults
helm show values cert-manager/cert-manager

# Inspect chart information
helm show chart cert-manager/cert-manager

# Render YAML WITHOUT installing
helm template my-cert-manager cert-manager/cert-manager

# Install
helm install my-cert-manager cert-manager/cert-manager

# Install into namespace
helm install my-app repo/chart -n my-project

# Override a value
helm install my-app repo/chart \
  --set replicaCount=3

# Use a values file
helm install my-app repo/chart \
  -f values.yaml

# Releases
helm list

# Release details
helm status my-app

# Upgrade
helm upgrade my-app repo/chart

# Upgrade OR install
helm upgrade --install my-app repo/chart

# History / rollback
helm history my-app
helm rollback my-app 1

# Remove
helm uninstall my-app
```
## Installing Cert Manager via Artifacthub
This is the URL for the cert manager Helm Chart, https://artifacthub.io/packages/helm/cert-manager/cert-manager


```bash
# Add Repo
helm repo add cert-manager https://charts.jetstack.io

# Install Helm Chart
helm install \
  cert-manager oci://quay.io/jetstack/charts/cert-manager \
  --namespace helm-test \
  --create-namespace \
  --version v1.21.1 \
  --set crds.enabled=true
```


