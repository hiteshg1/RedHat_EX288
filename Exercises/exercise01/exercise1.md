# Exercise 1: Binary Build, Internal Registry, and RBAC (EX288 Practice)

## Objective

Build a simple Apache (httpd) application from a local Dockerfile + `index.html`
using an internal OpenShift base image, push it to the internal registry via a
binary build, deploy it, expose it externally, and grant a non-admin
(`developer`) user rights to perform the same workflow in a project they do
not own.

## Scenario

- `kubeadmin` (or `admin`) creates the project and owns it by default.
- `developer` initially has **no role binding** in that project, so build/image
  operations fail with `Forbidden` errors — even though `developer` *can*
  read the shared `openshift` namespace imagestreams (via the built-in
  `system:image-puller` clusterrolebinding).
- We grant `developer` the `edit` role on the project to unblock the workflow.

---

## Part A — Discover the base image (as admin)

```bash
oc login -u kubeadmin -p <password> https://api.crc.testing:6443

# List available imagestreams in the shared 'openshift' namespace
oc get is -n openshift

# Inspect available tags for httpd (never assume a tag exists)
oc describe is httpd -n openshift
```

Confirm the exact tag available (in this exercise: `2.4-ubi9`).

---

## Part B — Create the project (as admin)

```bash
oc new-project apache-demo
```

---

## Part C — Confirm developer's starting permissions (as admin)

Use `oc auth can-i --as=<user>` to check permissions without switching users:

```bash
oc auth can-i create buildconfigs -n apache-demo --as=developer
oc auth can-i create imagestreams -n apache-demo --as=developer
oc auth can-i get imagestreams -n openshift --as=developer
```

Expected result at this point:
- `create buildconfigs` → **no**
- `create imagestreams` → **no**
- `get imagestreams -n openshift` → **yes** (shared image-puller access)

---

## Part D — Grant developer access to the project (as admin)

```bash
oc policy add-role-to-user edit developer -n apache-demo
```

Verify the binding was created:

```bash
oc get rolebindings -n apache-demo
oc describe rolebinding edit -n apache-demo
```

Re-run the permission check to confirm it changed:

```bash
oc auth can-i create buildconfigs -n apache-demo --as=developer
```

Expected result: **yes**

---

## Part E — Switch to developer and build the app

```bash
oc login -u developer -p developer https://api.crc.testing:6443
oc project apache-demo
```

### 1. Prepare local build context

```bash
mkdir -p ~/apache-demo && cd ~/apache-demo
echo "Hello World" > index.html

cat <<EOF > Dockerfile
FROM image-registry.openshift-image-registry.svc:5000/openshift/httpd:2.4-ubi9
COPY index.html /var/www/html/index.html
EXPOSE 8080
EOF
```

### 2. Create the binary BuildConfig

```bash
oc new-build --name=apache-demo --strategy=docker --binary
```

This creates:
- a **BuildConfig** (the build recipe — strategy, base image, output target)
- an **ImageStream** (a tag tracker; empty until a build actually runs)

### 3. Run the build (uploads source, builds, pushes to internal registry)

```bash
oc start-build apache-demo --from-dir=. --follow
```

### 4. Deploy the resulting image

```bash
oc new-app apache-demo:latest
```

### 5. Verify pod and service

```bash
oc get pods
oc get svc
```

### 6. Expose the service externally via a route

```bash
oc expose svc/apache-demo
oc get route apache-demo -o jsonpath='{.spec.host}'
```

### 7. Test

```bash
curl http://$(oc get route apache-demo -o jsonpath='{.spec.host}')
```

Expected output:
```
Hello World
```

---

## Part F — Cleanup (reset for next attempt)

```bash
oc login -u kubeadmin -p <password> https://api.crc.testing:6443
oc delete project apache-demo

# Confirm full deletion before recreating
oc get project apache-demo
```

---

## Key Concepts Recap

| Concept | Command to discover/verify |
|---|---|
| Internal registry hostname | `oc registry info --internal` |
| Available base images | `oc get is -n openshift` |
| Available tags for an image | `oc describe is <name> -n openshift` |
| Check any user's permissions | `oc auth can-i <verb> <resource> -n <ns> --as=<user>` |
| Grant project-level access | `oc policy add-role-to-user <role> <user> -n <ns>` |
| View who has access to a project | `oc get rolebindings -n <ns>` |
| Build workflow order | `new-build` (define) → `start-build` (run + push) → `new-app` (deploy) |

## Notes / Gotchas

- Shared `openshift` namespace imagestreams are readable by **all authenticated
  users** by default (via `system:image-puller`), but that does **not** grant
  any rights inside other users' project namespaces.
- Project ownership in OpenShift is per-user unless explicitly shared via
  `oc policy add-role-to-user` (or a RoleBinding/GroupBinding).
- Never assume an image tag exists — always verify with `oc describe is`
  before writing a Dockerfile `FROM` line.
